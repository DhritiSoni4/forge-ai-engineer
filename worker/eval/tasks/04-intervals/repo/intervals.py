def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]


def merge(intervals):
    out = []
    for start, end in intervals:
        if out and start <= out[-1][1]:
            out[-1] = (out[-1][0], end)
        else:
            out.append((start, end))
    return out
