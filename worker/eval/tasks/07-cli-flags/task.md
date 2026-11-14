# Add `--json` and `--min-score` to the report CLI

`cli.main(argv, out)` prints a text report of the rows in `data.py` (via `report.format_report`) and
returns an exit code. Add:
- `--min-score N` (int): keep only rows with `score >= N`.
- `--json`: instead of text, write a JSON array of the (filtered) rows, sorted by score descending
  (ties by name ascending), to `out`, followed by a newline.
If no rows remain, text mode prints `No results.` and the exit code is 1; JSON mode prints `[]` and
exits 0. Otherwise the exit code is 0. Keep the existing default behaviour unchanged.
