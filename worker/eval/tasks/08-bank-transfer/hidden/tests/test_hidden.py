import pytest
from bank import Bank, InsufficientFunds

def fresh():
    return Bank({"a": 50, "b": 5})

def test_insufficient_funds_no_change():
    b = fresh()
    with pytest.raises(InsufficientFunds):
        b.transfer("a", "b", 51)
    assert b.balances == {"a": 50, "b": 5} and b.log == []

@pytest.mark.parametrize("amt", [0, -5, 1.5, "7", True])
def test_bad_amount(amt):
    b = fresh()
    with pytest.raises(ValueError):
        b.transfer("a", "b", amt)
    assert b.balances == {"a": 50, "b": 5}

def test_unknown_source():
    b = fresh()
    with pytest.raises(KeyError):
        b.transfer("zzz", "b", 1)
    assert b.log == []

def test_same_account():
    b = fresh()
    with pytest.raises(ValueError):
        b.transfer("a", "a", 1)
    assert b.balances["a"] == 50

def test_log_only_on_success():
    b = fresh()
    b.transfer("a", "b", 10)
    assert b.log == [("a", "b", 10)]
