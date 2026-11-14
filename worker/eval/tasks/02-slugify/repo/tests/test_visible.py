from slugify import slugify

def test_basic():
    assert slugify("Hello World") == "hello-world"

def test_collapses_runs_and_strips_edges():
    assert slugify("  Hello,   World!!  ") == "hello-world"
