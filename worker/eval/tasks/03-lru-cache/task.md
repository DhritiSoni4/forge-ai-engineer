# Implement an LRU cache

Implement `LRUCache` in `lru.py` (currently a stub). `LRUCache(capacity)` raises `ValueError`
if `capacity < 1`. `get(key, default=None)` returns the value and marks the key most recently
used. `put(key, value)` inserts or updates (also marking it most recently used) and evicts the
least recently used key when size exceeds capacity. `len(cache)` is the size. `key in cache` must
NOT change recency. All operations are O(1).
