def allocate(total_cents, weights):
    if total_cents < 0 or not weights or any(w < 0 for w in weights) or sum(weights) == 0:
        raise ValueError("invalid allocation input")
    total_w = sum(weights)
    floors = [total_cents * w // total_w for w in weights]
    rems = [total_cents * w % total_w for w in weights]
    leftover = total_cents - sum(floors)
    order = sorted(range(len(weights)), key=lambda i: (-rems[i], i))
    for i in order[:leftover]:
        floors[i] += 1
    return floors
