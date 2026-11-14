# Fix slugify

`slugify(text)` must: lowercase; strip accents (`Café` -> `cafe`); replace every run of
non-alphanumeric ASCII characters with a single `-`; and have no leading or trailing `-`.
Empty or symbol-only input returns `""`.
