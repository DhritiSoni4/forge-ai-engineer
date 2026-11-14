import pytest
from pagination import paginate, total_pages

def test_last_partial_page():
    assert paginate(list(range(10)), 4, 3) == [9]

def test_past_end():
    assert paginate(list(range(10)), 5, 3) == []

@pytest.mark.parametrize("page,per", [(0, 3), (-1, 3), (1, 0)])
def test_invalid(page, per):
    with pytest.raises(ValueError):
        paginate([1], page, per)

def test_total_pages_rounds_up():
    assert total_pages(10, 3) == 4
    assert total_pages(0, 3) == 0
