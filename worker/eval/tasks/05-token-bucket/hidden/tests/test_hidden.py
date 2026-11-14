import pytest
from ratelimit import TokenBucket

def make(rate=1, cap=2):
    t = [0.0]
    return TokenBucket(rate, cap, clock=lambda: t[0]), t

def test_refill():
    b, t = make()
    b.allow(); b.allow()
    t[0] = 1.0
    assert b.allow()
    assert not b.allow()

def test_fractional_refill():
    b, t = make(rate=2, cap=2)
    b.allow(2)
    t[0] = 0.25
    assert not b.allow()
    t[0] = 0.5
    assert b.allow()

def test_caps_at_capacity():
    b, t = make()
    t[0] = 100.0
    assert b.allow(2)
    assert not b.allow()

def test_failed_allow_consumes_nothing():
    b, t = make(cap=3)
    assert not b.allow(4)
    assert b.allow(3)

def test_validation():
    with pytest.raises(ValueError):
        TokenBucket(0, 1)
    with pytest.raises(ValueError):
        TokenBucket(1, 0)
    b, _ = make()
    with pytest.raises(ValueError):
        b.allow(0)
