import time

class TokenBucket:
    def __init__(self, rate, capacity, clock=time.monotonic):
        if rate <= 0 or capacity < 1:
            raise ValueError("rate must be > 0 and capacity >= 1")
        self.rate = rate
        self.capacity = capacity
        self._clock = clock
        self._tokens = float(capacity)
        self._last = clock()

    def allow(self, n=1):
        if n < 1:
            raise ValueError("n must be >= 1")
        now = self._clock()
        self._tokens = min(self.capacity, self._tokens + (now - self._last) * self.rate)
        self._last = now
        if n > self.capacity or self._tokens < n:
            return False
        self._tokens -= n
        return True
