# Fix the CSV line parser

`parse_line(line)` must parse one CSV record (RFC 4180 style, comma separated): fields may be
wrapped in double quotes; commas inside quotes are part of the field; `""` inside a quoted field is
a literal quote; empty fields are `""`; surrounding whitespace is preserved. A trailing newline on
`line` is ignored. An unterminated quote raises `ValueError`.
