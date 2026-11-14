# Fix topological sort

`topo_sort(graph)` takes a dict mapping each node to the list of nodes it **depends on**, and returns
a list in which every node appears after all of its dependencies. Nodes that only appear as
dependencies must also be included. Output must be deterministic: among nodes that are ready at the same
time, pick the alphabetically smallest first. If the graph has a cycle (including a self-dependency),
raise `CycleError` (a `ValueError` subclass, already defined). Do not mutate the input.
