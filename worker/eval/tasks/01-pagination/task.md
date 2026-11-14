# Fix pagination

`pagination.py` has two bugs. `paginate(items, page, per_page)` must return the items on a
**1-indexed** page, return `[]` for pages past the end, and raise `ValueError` if `page < 1`
or `per_page < 1`. `total_pages(n_items, per_page)` must return the number of pages needed
(0 for no items), rounding up. Do not change the function signatures.
