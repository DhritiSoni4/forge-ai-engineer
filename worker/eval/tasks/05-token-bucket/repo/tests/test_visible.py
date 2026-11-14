from ratelimit import TokenBucket

def test_burst_then_block():
    t = [0.0]
    b = TokenBucket(rate=1, capacity=2, clock=lambda: t[0])
    assert b.allow() and b.allow()
    assert not b.allow()
