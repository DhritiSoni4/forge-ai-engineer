import pytest
from toposort import topo_sort, CycleError

def test_chain():
    assert topo_sort({"c": ["b"], "b": ["a"], "a": []}) == ["a", "b", "c"]

def test_cycle_is_an_error():
    with pytest.raises(CycleError):
        topo_sort({"a": ["b"], "b": ["a"]})
