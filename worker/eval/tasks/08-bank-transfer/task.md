# Make transfers atomic

`Bank.transfer(src, dst, amount)` moves money between accounts but is broken. Required behaviour:
- `amount` must be a positive int, else `ValueError`.
- Unknown `src` or `dst` raises `KeyError`, and **no balance changes** (today money can vanish).
- Insufficient funds raises `InsufficientFunds` (already defined) and no balance changes.
- `src == dst` raises `ValueError`.
- On success append exactly one `(src, dst, amount)` tuple to `bank.log`; on any failure the log is unchanged.
