import pytest
from money import allocate

def test_remainder_to_earliest_on_tie():
    assert allocate(100, [1, 1, 1]) == [34, 33, 33]

def test_largest_remainder():
    assert allocate(10, [1, 2, 4]) == [1, 3, 6]

def test_zero_weight_gets_nothing():
    assert allocate(5, [0, 1, 1]) == [0, 3, 2]

def test_zero_total():
    assert allocate(0, [1, 2]) == [0, 0]

@pytest.mark.parametrize("total,w", [(-1, [1]), (5, []), (5, [0, 0]), (5, [1, -1])])
def test_invalid(total, w):
    with pytest.raises(ValueError):
        allocate(total, w)
