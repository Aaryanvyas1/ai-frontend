# Ask Aaryan, resume chatbot frontend

Static site (HTML, CSS, JS). No build step.

## Files

- `index.html`, `styles.css`, `app.js`, `markdown.js`: the page
- `config.js`: API address (localhost uses `http://127.0.0.1:8000/chat`, deployed uses `/api/chat`)
- `vercel.json`: forwards `/api/*` to your backend

## Connect your backend

Your FastAPI app must be online at a public URL (Render, Railway, Fly.io and so on).
Open `vercel.json` and replace `https://YOUR-BACKEND-URL` with that URL, with no trailing slash.
A call to `/api/chat` then reaches `POST /chat` on your backend.

## Run locally

```bash
# terminal 1, in the backend folder
uvicorn main:app --reload

# terminal 2, in this folder
python -m http.server 5500
```

Open http://localhost:5500. Locally the browser calls the backend directly, so add CORS to `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Deploy to Vercel

1. Push the project to GitHub.
2. On vercel.com choose Add New, then Project, and import the repo.
3. Set Root Directory to `frontend`. Framework preset: Other. Leave build and output empty.
4. Deploy, then send the link.

Or from this folder: `npx vercel --prod`.
