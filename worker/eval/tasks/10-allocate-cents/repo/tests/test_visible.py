from money import allocate

def test_even_split_sums():
    assert sum(allocate(100, [1, 1, 1])) == 100

def test_proportional():
    assert allocate(100, [1, 3]) == [25, 75]
