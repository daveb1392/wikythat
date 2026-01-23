# Grokipedia API Backend

Python FastAPI server for scraping Grokipedia content with BeautifulSoup.

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env

# Run server
python main.py
# or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - API documentation (HTML)
- `GET /page/{slug}` - Fetch Grokipedia page content
  - Query params: `extract_refs` (bool), `truncate` (int), `citations` (bool)
- `GET /health?key=<secret>` - Health check with cache stats
- `GET /docs` - Interactive API docs (Swagger UI)
- `GET /redoc` - API documentation (ReDoc)

## Environment Variables

- `ANALYTICS_KEY` - API analytics key (optional)
- `HEALTH_SECRET` - Secret key for health endpoint
- `VERCEL` - Set to any value when deploying to Vercel

## Features

- 2-day content caching (1000 pages max)
- Rate limiting: 100 requests per minute per IP
- Reference extraction from Grokipedia pages
- Automatic slug normalization
- Cache size tracking and management

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=main --cov-report=html

# Run specific test file
pytest tests/test_api.py

# Run specific test
pytest tests/test_api.py::TestPageEndpoint::test_fetches_valid_page

# Run tests in watch mode (requires pytest-watch)
ptw
```

Coverage reports are generated in `htmlcov/index.html`.
