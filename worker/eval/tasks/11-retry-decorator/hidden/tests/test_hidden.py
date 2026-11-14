import pytest
from retry import retry

def test_backoff_delays_and_no_sleep_after_last():
    slept = []

    @retry(times=4, delay=1, backoff=2, sleep=slept.append)
    def always():
        raise ValueError("x")

    with pytest.raises(ValueError):
        always()
    assert slept == [1, 2, 4]

def test_only_listed_exceptions_retried():
    calls = []

    @retry(times=5, exceptions=(KeyError,))
    def boom():
        calls.append(1)
        raise TypeError("t")

    with pytest.raises(TypeError):
        boom()
    assert len(calls) == 1

def test_returns_value_and_wraps():
    @retry(times=2)
    def named(a, b=1):
        "doc"
        return a + b

    assert named(1, b=2) == 3
    assert named.__name__ == "named" and named.__doc__ == "doc"

def test_no_sleep_when_delay_zero():
    slept = []

    @retry(times=3, sleep=slept.append)
    def f():
        raise RuntimeError

    with pytest.raises(RuntimeError):
        f()
    assert slept == []

def test_times_validation():
    with pytest.raises(ValueError):
        retry(times=0)
