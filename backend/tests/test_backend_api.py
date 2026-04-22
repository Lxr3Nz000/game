"""Backend tests for Startup Master - Global Expansion."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://office-empire-tycoon.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_health_returns_ok(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"

    def test_root(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "message" in r.json()


# ---------- Event generation ----------
class TestEvents:
    def _validate(self, data, event_type, lang):
        assert isinstance(data.get("id"), str) and len(data["id"]) > 0
        assert isinstance(data.get("title"), str) and len(data["title"]) > 0
        assert isinstance(data.get("message"), str) and len(data["message"]) > 0
        assert data.get("event_type") == event_type
        assert data.get("lang") == lang
        assert len(data["title"]) <= 60
        assert len(data["message"]) <= 220

    def test_generate_viral_trend_italian(self, client):
        r = client.post(
            f"{API}/events/generate",
            json={"event_type": "viral_trend", "lang": "it"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        self._validate(r.json(), "viral_trend", "it")

    def test_generate_viral_trend_english(self, client):
        r = client.post(
            f"{API}/events/generate",
            json={"event_type": "viral_trend", "lang": "en"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        self._validate(r.json(), "viral_trend", "en")

    def test_generate_market_crash(self, client):
        r = client.post(
            f"{API}/events/generate",
            json={"event_type": "market_crash", "lang": "en"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        self._validate(r.json(), "market_crash", "en")

    def test_generate_unknown_event_type_fallbacks(self, client):
        # Server falls back to viral_trend prompt internally but echoes type
        r = client.post(
            f"{API}/events/generate",
            json={"event_type": "totally_unknown_xyz", "lang": "en"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["event_type"] == "totally_unknown_xyz"
        assert len(data["title"]) > 0
        assert len(data["message"]) > 0
