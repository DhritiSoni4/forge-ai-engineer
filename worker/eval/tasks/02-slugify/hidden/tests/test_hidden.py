from slugify import slugify

def test_accents():
    assert slugify("Café au lait") == "cafe-au-lait"

def test_empty_and_symbols():
    assert slugify("") == ""
    assert slugify("---") == ""
    assert slugify("!!!") == ""

def test_digits_kept():
    assert slugify("Top 10 (2024)") == "top-10-2024"
