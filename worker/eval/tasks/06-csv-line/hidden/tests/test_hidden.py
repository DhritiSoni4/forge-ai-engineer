import pytest
from csvline import parse_line

def test_escaped_quote():
    assert parse_line('"say ""hi""",x') == ['say "hi"', "x"]

def test_empty_fields():
    assert parse_line(",,") == ["", "", ""]
    assert parse_line("") == [""]

def test_whitespace_preserved():
    assert parse_line(" a , b ") == [" a ", " b "]

def test_trailing_newline():
    assert parse_line("a,b\n") == ["a", "b"]

def test_unterminated():
    with pytest.raises(ValueError):
        parse_line('a,"b')

def test_quoted_empty():
    assert parse_line('"",x') == ["", "x"]
