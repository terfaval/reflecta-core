# Reflecta Core Frontend

This Next.js project communicates with a separate FastAPI backend. Configure the backend host with the `NEXT_PUBLIC_API_HOST` environment variable.

Example `.env.local`:

```env
NEXT_PUBLIC_API_HOST=https://reflecta-backend.vercel.app
```

All API requests are sent to this base URL.