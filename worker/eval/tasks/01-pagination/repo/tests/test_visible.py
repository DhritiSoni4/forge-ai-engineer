from pagination import paginate, total_pages

def test_first_page():
    assert paginate(list(range(10)), 1, 3) == [0, 1, 2]

def test_total_pages_exact():
    assert total_pages(9, 3) == 3
