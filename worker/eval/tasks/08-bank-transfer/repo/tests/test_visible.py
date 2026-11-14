import pytest
from bank import Bank, InsufficientFunds

def test_transfer():
    b = Bank({"a": 100, "b": 0})
    b.transfer("a", "b", 30)
    assert b.balances == {"a": 70, "b": 30}

def test_unknown_destination_keeps_money():
    b = Bank({"a": 100})
    with pytest.raises(KeyError):
        b.transfer("a", "nobody", 10)
    assert b.balances == {"a": 100}
