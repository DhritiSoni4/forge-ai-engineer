import pytest
from lru import LRUCache

def test_get_refreshes():
    c = LRUCache(2)
    c.put("a", 1); c.put("b", 2)
    c.get("a")
    c.put("c", 3)
    assert "a" in c and "b" not in c

def test_put_existing_refreshes_and_updates():
    c = LRUCache(2)
    c.put("a", 1); c.put("b", 2)
    c.put("a", 10)
    c.put("c", 3)
    assert c.get("a") == 10 and "b" not in c

def test_contains_does_not_refresh():
    c = LRUCache(2)
    c.put("a", 1); c.put("b", 2)
    assert "a" in c
    c.put("c", 3)
    assert "a" not in c

def test_len_and_default():
    c = LRUCache(3)
    c.put(1, 1); c.put(2, 2)
    assert len(c) == 2
    assert c.get(9, "x") == "x"

def test_bad_capacity():
    with pytest.raises(ValueError):
        LRUCache(0)
