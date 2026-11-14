import heapq


class CycleError(ValueError):
    pass


def topo_sort(graph):
    nodes = set(graph)
    for deps in graph.values():
        nodes.update(deps)
    remaining = {n: set(graph.get(n, [])) for n in nodes}
    dependents = {n: [] for n in nodes}
    for n, deps in remaining.items():
        for d in deps:
            dependents[d].append(n)
    ready = [n for n, deps in remaining.items() if not deps]
    heapq.heapify(ready)
    order = []
    while ready:
        n = heapq.heappop(ready)
        order.append(n)
        for m in dependents[n]:
            remaining[m].discard(n)
            if not remaining[m] and m not in order and m not in ready:
                heapq.heappush(ready, m)
    if len(order) != len(nodes):
        raise CycleError("graph has a cycle")
    return order
