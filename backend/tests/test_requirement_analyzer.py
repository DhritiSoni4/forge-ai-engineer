from app.services.requirement_analyzer import RequirementAnalyzer


def test_detect_fastapi():
    analyzer = RequirementAnalyzer()

    metadata = analyzer.analyze("Build a FastAPI weather API")

    assert "FastAPI" in metadata.frameworks