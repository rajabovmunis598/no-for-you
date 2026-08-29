# Deployment notes

The web interface uses only the water image as its visual background. No background
video is downloaded or played, so an idle browser does not decode video on the
visitor's GPU.

AI quiz generation is already server-to-server: the browser calls `/api/games/quick/`,
and Django calls Gemini using `GEMINI_API_KEY`. Keep that key only in the server
environment; never put it in JavaScript or a `NEXT_PUBLIC_*` variable.

Before deployment, set these environment values on the server:

```env
DEBUG=false
ALLOWED_HOSTS=your-domain.example,www.your-domain.example
GEMINI_API_KEY=your-real-key
```

Run Django behind a production application server (for example Gunicorn/Uvicorn) and
serve `/static/` and `/media/` through Nginx or your hosting platform. The server will
handle API work and the Gemini request; browsers only render the normal interface and
download images/PDFs when the user opens them.

## Docker

Copy `.env.example` to `.env`, fill in the real values, then run:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

The frontend is available on port `3000`; it reaches Django through the internal
`backend` service. SQLite, uploaded media, static files, and Redis data use Docker
volumes. For production traffic, put Nginx or a managed reverse proxy in front of
port 3000 and enable HTTPS.

PDF pages are intentionally rendered in the browser by the PDF reader. If you also
want PDF rendering moved off user devices, that is a separate feature: the backend
must rasterize each page and send images/PDF streams, which increases server CPU/GPU,
storage, and bandwidth.
