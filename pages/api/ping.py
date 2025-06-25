from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def ping() -> dict[str, bool]:
    """Liveness check for Render keep-alive."""
    return {"ok": True}