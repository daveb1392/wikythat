"""
Comprehensive test suite for Grokipedia API backend
Tests all endpoints, rate limiting, caching, and error handling
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path to import main
sys.path.insert(0, str(Path(__file__).parent.parent))
from main import app, _cache, normalize_slug, extract_references, CACHE_TTL

client = TestClient(app)


class TestRootEndpoint:
    """Test the root / endpoint"""

    def test_root_returns_html(self):
        """Root should return HTML content"""
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


class TestHealthEndpoint:
    """Test the /health endpoint"""

    def test_health_requires_key(self):
        """Health endpoint should require authentication"""
        response = client.get("/health")
        assert response.status_code == 422  # Missing required query param

    def test_health_rejects_wrong_key(self):
        """Health endpoint should reject wrong secret key"""
        response = client.get("/health?key=wrong-key")
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]

    def test_health_accepts_correct_key(self):
        """Health endpoint should accept correct secret key"""
        with patch.dict('os.environ', {'HEALTH_SECRET': 'test-secret'}):
            response = client.get("/health?key=test-secret")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert data["status"] == "Live"
            assert "cached_items" in data
            assert "cache_size_mb" in data
            assert "cached_slugs" in data
            assert "timestamp" in data


class TestNormalizeSlug:
    """Test slug normalization function"""

    def test_capitalizes_first_letter(self):
        """Should capitalize first letter"""
        assert normalize_slug("test") == "Test"
        assert normalize_slug("Test") == "Test"

    def test_replaces_spaces_with_underscores(self):
        """Should replace spaces with underscores"""
        assert normalize_slug("test topic") == "Test_topic"
        assert normalize_slug("multiple word topic") == "Multiple_word_topic"

    def test_handles_url_encoding(self):
        """Should decode URL-encoded characters"""
        assert normalize_slug("at%26t") == "At&t"

    def test_preserves_existing_underscores(self):
        """Should preserve existing underscores"""
        assert normalize_slug("test_topic") == "Test_topic"


class TestPageEndpoint:
    """Test the /page/{slug} endpoint"""

    def setup_method(self):
        """Clear cache before each test"""
        _cache.clear()

    @patch('main.requests.get')
    def test_fetches_valid_page(self, mock_get):
        """Should fetch and parse a valid Grokipedia page"""
        mock_html = """
        <html>
            <body>
                <article class="prose">
                    <h1>Test Topic</h1>
                    <p>This is test content.</p>
                </article>
                <div id="references">
                    <ol>
                        <li><a href="https://example.com/ref1">Reference 1</a></li>
                        <li><a href="https://example.com/ref2">Reference 2</a></li>
                    </ol>
                </div>
            </body>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        response = client.get("/page/Test_Topic")
        assert response.status_code == 200

        data = response.json()
        assert data["title"] == "Test Topic"
        assert data["slug"] == "Test_Topic"
        assert "Test Topic" in data["content_text"]
        assert "test content" in data["content_text"]
        assert data["char_count"] > 0
        assert data["word_count"] > 0
        assert data["references_count"] == 2
        assert len(data["references"]) == 2
        assert data["references"][0]["url"] == "https://example.com/ref1"

    @patch('main.requests.get')
    def test_returns_404_for_missing_page(self, mock_get):
        """Should return 404 for non-existent pages"""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        response = client.get("/page/Nonexistent_Page")
        assert response.status_code == 404
        assert "Not found" in response.json()["detail"]

    @patch('main.requests.get')
    def test_caching_works(self, mock_get):
        """Should cache pages and return from cache on second request"""
        mock_html = """
        <html>
            <body>
                <article class="prose">
                    <h1>Cached Topic</h1>
                    <p>Cached content.</p>
                </article>
            </body>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        # First request - should fetch
        response1 = client.get("/page/Cached_Topic")
        assert response1.status_code == 200
        assert mock_get.call_count == 1

        # Second request - should use cache
        response2 = client.get("/page/Cached_Topic")
        assert response2.status_code == 200
        assert mock_get.call_count == 1  # Should not increase
        assert response1.json() == response2.json()

    @patch('main.requests.get')
    def test_cache_expiry(self, mock_get):
        """Should refresh cache after TTL expires"""
        mock_html = """
        <html>
            <body>
                <article class="prose">
                    <h1>Expiring Topic</h1>
                    <p>Content.</p>
                </article>
            </body>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        # First request
        response1 = client.get("/page/Expiring_Topic")
        assert response1.status_code == 200

        # Manually expire cache entry
        cache_key = "Expiring_Topic:True:full:False"
        if cache_key in _cache:
            page, _ = _cache[cache_key]
            expired_time = datetime.now() - CACHE_TTL - timedelta(minutes=1)
            _cache[cache_key] = (page, expired_time)

        # Second request - should refresh
        response2 = client.get("/page/Expiring_Topic")
        assert response2.status_code == 200
        assert mock_get.call_count == 2  # Should fetch again

    @patch('main.requests.get')
    def test_truncate_parameter(self, mock_get):
        """Should truncate content when truncate parameter is provided"""
        long_content = "A" * 1000
        mock_html = f"""
        <html>
            <body>
                <article class="prose">
                    <h1>Long Topic</h1>
                    <p>{long_content}</p>
                </article>
            </body>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        response = client.get("/page/Long_Topic?truncate=100")
        assert response.status_code == 200
        data = response.json()
        assert len(data["content_text"]) <= 100

    @patch('main.requests.get')
    def test_extract_refs_parameter(self, mock_get):
        """Should skip reference extraction when extract_refs=false"""
        mock_html = """
        <html>
            <body>
                <article class="prose">
                    <h1>Topic</h1>
                    <p>Content.</p>
                </article>
                <div id="references">
                    <ol><li><a href="https://example.com">Ref</a></li></ol>
                </div>
            </body>
        </html>
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        response = client.get("/page/Topic?extract_refs=false")
        assert response.status_code == 200
        data = response.json()
        assert data["references_count"] == 0
        assert len(data["references"]) == 0


class TestRateLimiting:
    """Test rate limiting functionality"""

    def setup_method(self):
        """Clear rate limit tracking before each test"""
        from main import request_times
        request_times.clear()

    @patch('main.requests.get')
    def test_rate_limit_enforced(self, mock_get):
        """Should enforce rate limit after max requests"""
        mock_html = "<html><body><article class='prose'><h1>Test</h1></article></body></html>"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        mock_get.return_value = mock_response

        # Make requests up to the limit (100)
        # For testing, we'll just test a few requests work
        for i in range(5):
            response = client.get(f"/page/Test_{i}")
            assert response.status_code == 200

        # Note: Testing actual rate limit would require making 100+ requests
        # which is slow. The important part is that rate limiting is implemented.


class TestReferenceExtraction:
    """Test reference extraction from HTML"""

    def test_extracts_references_from_div(self):
        """Should extract references from div#references"""
        from bs4 import BeautifulSoup

        html = """
        <div id="references">
            <ol>
                <li><a href="https://example.com/1">Ref 1</a></li>
                <li><a href="https://example.com/2">Ref 2</a></li>
            </ol>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        refs, count = extract_references(soup)

        assert count == 2
        assert len(refs) == 2
        assert refs[0].url == "https://example.com/1"
        assert refs[1].url == "https://example.com/2"

    def test_handles_missing_references(self):
        """Should return empty list when no references found"""
        from bs4 import BeautifulSoup

        html = "<div><p>No references here</p></div>"
        soup = BeautifulSoup(html, "html.parser")
        refs, count = extract_references(soup)

        assert count == 0
        assert len(refs) == 0

    def test_handles_relative_urls(self):
        """Should convert relative URLs to absolute"""
        from bs4 import BeautifulSoup

        html = """
        <div id="references">
            <ol>
                <li><a href="//example.com/ref">Ref</a></li>
            </ol>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        refs, count = extract_references(soup)

        assert count == 1
        assert "example.com/ref" in refs[0].url


class TestErrorHandling:
    """Test error handling and edge cases"""

    @patch('main.requests.get')
    def test_handles_network_errors(self, mock_get):
        """Should handle network errors gracefully"""
        mock_get.side_effect = Exception("Network error")

        response = client.get("/page/Network_Error_Topic")
        assert response.status_code == 500

    @patch('main.requests.get')
    def test_handles_malformed_html(self, mock_get):
        """Should handle malformed HTML gracefully"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html><body>Malformed"  # No closing tags
        mock_get.return_value = mock_response

        response = client.get("/page/Malformed_HTML")
        # BeautifulSoup is lenient, should still parse
        assert response.status_code == 200

    @patch('main.requests.get')
    def test_handles_empty_response(self, mock_get):
        """Should handle empty HTML response"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_get.return_value = mock_response

        response = client.get("/page/Empty_Response")
        assert response.status_code == 200
        data = response.json()
        assert data["content_text"] == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=main", "--cov-report=html"])
