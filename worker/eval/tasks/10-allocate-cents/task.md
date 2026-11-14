# Fix money allocation

`allocate(total_cents, weights)` splits an integer amount of cents proportionally to `weights`. The parts
must be non-negative ints that **sum exactly to `total_cents`**. Use the largest-remainder method: give each
part the floor of its exact share, then hand out the leftover cents one at a time to the parts with the
largest fractional remainders (ties go to the earlier index). Raise `ValueError` if `total_cents` is
negative, `weights` is empty, any weight is negative, or all weights are zero.
