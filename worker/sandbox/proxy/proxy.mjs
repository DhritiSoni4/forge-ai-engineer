// Egress proxy for sandboxes that opted into a network allowlist.
// The sandbox sits on an --internal Docker network whose only neighbor is this
// proxy, so the allowlist cannot be bypassed by ignoring HTTP(S)_PROXY.
import dns from "node:dns/promises";
import http from "node:http";
import net from "node:net";
import { pathToFileURL } from "node:url";

const ALLOWED_PORTS = new Set([80, 443]);

/** Exact host or "*.example.com" (matches subdomains, not the apex). */
export function hostAllowed(host, patterns) {
  const h = host.toLowerCase().replace(/\.$/, "");
  return patterns.some((raw) => {
    const p = raw.toLowerCase();
    if (p.startsWith("*.")) return h.endsWith(p.slice(1)) && h.length > p.length - 1;
    return h === p;
  });
}

/** True for loopback, private, link-local, CGNAT, multicast, reserved, metadata. */
export function isPrivateAddress(ip) {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateV4(ip);
  if (family === 6) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateV4(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      /^f[cd]/.test(lower) || // fc00::/7 unique local
      /^fe[89ab]/.test(lower) || // fe80::/10 link local
      lower.startsWith("64:ff9b:") || // NAT64
      lower.startsWith("ff") // multicast
    );
  }
  return true; // not an IP: refuse
}

function isPrivateV4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/** Resolve once, validate every address, and return the one to connect to. */
export async function resolvePublic(host, lookup = (h) => dns.lookup(h, { all: true })) {
  const addresses = await lookup(host);
  if (addresses.length === 0) throw new Error("no DNS result");
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) throw new Error("resolves to a non-public address");
  }
  return addresses[0].address;
}

export function createProxy(allowedHosts) {
  const deny = (res, status, reason) => {
    res.writeHead(status, { "content-type": "text/plain" });
    res.end(`forge egress proxy: ${reason}\n`);
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url);
      const port = Number(url.port || 80);
      if (url.protocol !== "http:" || !ALLOWED_PORTS.has(port)) return deny(res, 403, "port or scheme not allowed");
      if (!hostAllowed(url.hostname, allowedHosts)) return deny(res, 403, `host not allowlisted: ${url.hostname}`);
      const ip = await resolvePublic(url.hostname);
      const headers = { ...req.headers, host: url.host };
      delete headers["proxy-connection"];
      const upstream = http.request(
        { host: ip, port, method: req.method, path: url.pathname + url.search, headers },
        (up) => {
          res.writeHead(up.statusCode ?? 502, up.headers);
          up.pipe(res);
        },
      );
      upstream.on("error", () => deny(res, 502, "upstream error"));
      req.pipe(upstream);
    } catch (error) {
      deny(res, 403, error instanceof Error ? error.message : "denied");
    }
  });

  server.on("connect", async (req, socket, head) => {
    const refuse = (line) => socket.end(`HTTP/1.1 ${line}\r\n\r\n`);
    try {
      const [host, portText] = req.url.split(":");
      const port = Number(portText || 443);
      if (!host || !ALLOWED_PORTS.has(port)) return refuse("403 Forbidden");
      if (!hostAllowed(host, allowedHosts)) return refuse("403 Forbidden");
      const ip = await resolvePublic(host);
      const upstream = net.connect(port, ip, () => {
        socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
      });
      upstream.on("error", () => socket.destroy());
      socket.on("error", () => upstream.destroy());
    } catch {
      refuse("403 Forbidden");
    }
  });

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const allowed = (process.env.ALLOWED_HOSTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  createProxy(allowed).listen(Number(process.env.PORT ?? 3128), "0.0.0.0", () => {
    console.log(`egress proxy listening; allowing ${allowed.length} host pattern(s)`);
  });
}
