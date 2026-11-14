import io, json
from cli import main

def run(argv):
    out = io.StringIO()
    code = main(argv, out)
    return code, out.getvalue()

def test_json_sorted_desc_then_name():
    code, text = run(["--json"])
    assert code == 0 and text.endswith("\n")
    assert [r["name"] for r in json.loads(text)] == ["ada", "cy", "dee", "bob"]

def test_json_with_filter():
    _, text = run(["--json", "--min-score", "80"])
    assert json.loads(text) == [{"name": "ada", "score": 91}]

def test_no_results_text():
    assert run(["--min-score", "100"]) == (1, "No results.\n")

def test_no_results_json():
    assert run(["--json", "--min-score", "100"]) == (0, "[]\n")
