// Frontend settings. Edit this file only.
//
// On Vercel the page calls /api/chat, and vercel.json forwards /api/* to your
// backend. That avoids CORS problems because the browser only talks to Vercel.
// On localhost the page calls the FastAPI server directly.
window.APP_CONFIG = {
  API_URL:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/chat"
      : "/api/chat",
  TIMEOUT_MS: 60000
};
