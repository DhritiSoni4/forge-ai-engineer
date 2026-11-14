from intervals import overlaps, merge

def test_touching_does_not_overlap():
    assert not overlaps((1, 2), (2, 3))

def test_merge_simple():
    assert merge([(1, 3), (2, 5)]) == [(1, 5)]
