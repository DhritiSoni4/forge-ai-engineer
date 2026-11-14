def format_report(rows):
    lines = [f"{r['name']}: {r['score']}" for r in sorted(rows, key=lambda r: r["name"])]
    return "\n".join(lines)
