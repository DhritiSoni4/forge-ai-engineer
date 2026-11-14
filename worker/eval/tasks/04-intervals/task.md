# Fix interval helpers

Intervals are half-open `(start, end)` tuples with `start <= end`. `overlaps(a, b)` is True only when
they share at least one point: **touching intervals such as (1, 2) and (2, 3) do NOT overlap**.
`merge(intervals)` returns a sorted list of merged intervals, combining intervals that overlap
**or touch**. It must accept unsorted input (including nested intervals) and must not mutate its input.
