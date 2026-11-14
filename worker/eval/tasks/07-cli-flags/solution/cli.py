import argparse
import json
from data import ROWS
from report import format_report


def main(argv, out):
    parser = argparse.ArgumentParser(prog="report")
    parser.add_argument("--min-score", type=int, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    rows = [r for r in ROWS if args.min_score is None or r["score"] >= args.min_score]
    if args.json:
        rows = sorted(rows, key=lambda r: (-r["score"], r["name"]))
        out.write(json.dumps(rows) + "\n")
        return 0
    if not rows:
        out.write("No results.\n")
        return 1
    out.write(format_report(rows) + "\n")
    return 0
