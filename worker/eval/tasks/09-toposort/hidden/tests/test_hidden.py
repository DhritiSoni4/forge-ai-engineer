import pytest
from toposort import topo_sort, CycleError

def test_long_cycle():
    with pytest.raises(CycleError):
        topo_sort({"a": ["b"], "b": ["c"], "c": ["a"], "d": []})

def test_self_cycle():
    with pytest.raises(CycleError):
        topo_sort({"a": ["a"]})

def test_implicit_nodes_included():
    assert topo_sort({"app": ["lib"]}) == ["lib", "app"]

def test_alphabetical_tiebreak():
    g = {"d": ["b", "c"], "c": [], "b": [], "a": []}
    assert topo_sort(g) == ["a", "b", "c", "d"]

def test_valid_order_diamond_and_no_mutation():
    g = {"top": ["l", "r"], "l": ["base"], "r": ["base"]}
    before = {k: list(v) for k, v in g.items()}
    out = topo_sort(g)
    assert out == ["base", "l", "r", "top"]
    assert g == before
