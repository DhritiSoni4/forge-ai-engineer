# Implement a token-bucket rate limiter

Implement `TokenBucket(rate, capacity, clock=time.monotonic)` in `ratelimit.py`. It starts full.
Tokens refill continuously at `rate` per second (fractional amounts count) up to `capacity`.
`allow(n=1)` returns True and consumes `n` tokens if available, otherwise returns False and
consumes nothing. `allow` with `n > capacity` is always False. `rate <= 0`, `capacity < 1`, or `n < 1`
raise `ValueError`. Time must come only from the injected `clock`.
