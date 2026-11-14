def parse_line(line):
    line = line.rstrip("\n").rstrip("\r")
    fields, buf, i, in_q = [], [], 0, False
    while i < len(line):
        ch = line[i]
        if in_q:
            if ch == '"':
                if i + 1 < len(line) and line[i + 1] == '"':
                    buf.append('"'); i += 1
                else:
                    in_q = False
            else:
                buf.append(ch)
        elif ch == '"' and not buf:
            in_q = True
        elif ch == ",":
            fields.append("".join(buf)); buf = []
        else:
            buf.append(ch)
        i += 1
    if in_q:
        raise ValueError("unterminated quote")
    fields.append("".join(buf))
    return fields
