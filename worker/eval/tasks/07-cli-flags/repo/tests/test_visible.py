import io
from cli import main

def test_default_lists_everyone():
    out = io.StringIO()
    assert main([], out) == 0
    assert out.getvalue().splitlines() == ["ada: 91", "bob: 45", "cy: 78", "dee: 78"]

def test_min_score():
    out = io.StringIO()
    assert main(["--min-score", "78"], out) == 0
    assert out.getvalue().splitlines() == ["ada: 91", "cy: 78", "dee: 78"]
