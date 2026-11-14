import type { TaskRun } from "./runner.js";

export type Prices = { inputPerMTok: number; outputPerMTok: number };

export type ModeSummary = {
  mode: string;
  n: number;
  resolved: number;
  rate: number;
  /** 95% Wilson score interval; honest about how little a small n tells you. */
  ci: [number, number];
  overfit: number;
  meanSteps: number;
  meanTokens: number;
  p50Seconds: number;
  p95Seconds: number;
  meanCostUsd: number | undefined;
};

/** Wilson score interval for a binomial proportion. */
export function wilson(successes: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 0];
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

export function percentile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summarize(runs: TaskRun[], prices?: Prices): ModeSummary[] {
  const modes = [...new Set(runs.map((r) => r.mode))];
  return modes.map((mode) => {
    const rs = runs.filter((r) => r.mode === mode);
    const resolved = rs.filter((r) => r.resolved).length;
    const seconds = rs.map((r) => r.durationMs / 1000);
    const costs = prices
      ? rs.map((r) => (r.inputTokens * prices.inputPerMTok + r.outputTokens * prices.outputPerMTok) / 1e6)
      : undefined;
    return {
      mode,
      n: rs.length,
      resolved,
      rate: rs.length ? resolved / rs.length : 0,
      ci: wilson(resolved, rs.length),
      overfit: rs.filter((r) => r.overfit).length,
      meanSteps: mean(rs.map((r) => r.steps)),
      meanTokens: mean(rs.map((r) => r.inputTokens + r.outputTokens)),
      p50Seconds: percentile(seconds, 0.5),
      p95Seconds: percentile(seconds, 0.95),
      meanCostUsd: costs ? mean(costs) : undefined,
    };
  });
}

export function toMarkdown(runs: TaskRun[], meta: { model: string; date: string }, prices?: Prices): string {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  const rows = summarize(runs, prices).map((s) =>
    `| ${s.mode} | ${s.resolved}/${s.n} (${pct(s.rate)}) | ${pct(s.ci[0])}–${pct(s.ci[1])} | ${s.overfit} | ` +
    `${s.meanSteps.toFixed(1)} | ${Math.round(s.meanTokens).toLocaleString("en-US")} | ` +
    `${s.p50Seconds.toFixed(0)}s / ${s.p95Seconds.toFixed(0)}s | ` +
    `${s.meanCostUsd === undefined ? "n/a" : `$${s.meanCostUsd.toFixed(3)}`} |`,
  );
  const ids = [...new Set(runs.map((r) => r.taskId))];
  const modes = [...new Set(runs.map((r) => r.mode))];
  const grid = ids.map((id) =>
    `| ${id} | ${modes.map((m) => {
      const r = runs.find((x) => x.taskId === id && x.mode === m);
      return r ? (r.resolved ? "pass" : r.overfit ? "overfit" : "fail") : "-";
    }).join(" | ")} |`,
  );
  return [
    `Model: \`${meta.model}\` · Date: ${meta.date} · Tasks: ${ids.length} · Resolved = hidden tests pass`,
    "",
    "| Mode | Resolved | 95% CI | Overfit | Mean steps | Mean tokens | Time p50 / p95 | Mean cost |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    `| Task | ${modes.join(" | ")} |`,
    `| --- | ${modes.map(() => "---").join(" | ")} |`,
    ...grid,
    "",
  ].join("\n");
}
