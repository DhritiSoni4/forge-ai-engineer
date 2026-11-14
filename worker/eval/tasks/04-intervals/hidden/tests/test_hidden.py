from intervals import overlaps, merge

def test_overlap_true():
    assert overlaps((1, 5), (3, 8))
    assert overlaps((1, 10), (2, 3))

def test_merge_unsorted():
    assert merge([(5, 8), (1, 3), (2, 4)]) == [(1, 4), (5, 8)]

def test_merge_nested():
    assert merge([(1, 10), (2, 3), (4, 5)]) == [(1, 10)]

def test_merge_touching():
    assert merge([(1, 2), (2, 3)]) == [(1, 3)]

def test_no_mutation_and_empty():
    data = [(3, 4), (1, 2)]
    merge(data)
    assert data == [(3, 4), (1, 2)]
    assert merge([]) == []
