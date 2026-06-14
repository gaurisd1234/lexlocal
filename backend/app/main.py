from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analyze import router as analyze_router
from app.routes.compare import router as compare_router

app = FastAPI(
    title="LexLocal API",
    description="AI Rural Legal Assistant — आपल्या हक्कांची भाषा",
    version="1.0.0"
)

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(analyze_router, prefix="/api")
app.include_router(compare_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "LexLocal backend running"}