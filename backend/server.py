from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------- Models ----------
class EventRequest(BaseModel):
    event_type: str   # e.g. market_crash, viral_trend, critical_bug, ai_hype, investor
    lang: str = "en"  # en or it
    context: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    title: str
    message: str
    event_type: str
    lang: str


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Startup Master API online"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


PROMPT_TEMPLATES = {
    "market_crash": "Generate a SHORT breaking-news style headline and ONE-sentence message about a tech stock market crash. Dramatic, tycoon-game vibe.",
    "viral_trend": "Generate a SHORT headline + ONE sentence about a new viral AI / tech trend boosting demand for apps. Hype vibe.",
    "critical_bug": "Generate a SHORT headline + ONE sentence about a critical bug discovered in production software. Panic mood.",
    "investor": "Generate a SHORT headline + ONE sentence about a surprise investor offering funding to a startup. Optimistic.",
    "tax_audit": "Generate a SHORT headline + ONE sentence about a sudden tax audit hitting the company. Grim.",
    "dev_burnout": "Generate a SHORT headline + ONE sentence about developers getting burnout after too many crunch hours.",
    "hype_spike": "Generate a SHORT headline + ONE sentence about market hype spiking for indie apps right now.",
}


@api_router.post("/events/generate", response_model=EventResponse)
async def generate_event(req: EventRequest):
    lang_instruction = "Reply in Italian." if req.lang == "it" else "Reply in English."
    base = PROMPT_TEMPLATES.get(req.event_type, PROMPT_TEMPLATES["viral_trend"])
    user_prompt = (
        f"{base} {lang_instruction} "
        f"Format EXACTLY as two lines: first line is the TITLE (max 5 words, ALL CAPS allowed), "
        f"second line is the MESSAGE (max 18 words, one sentence). No emojis, no quotes, no markdown."
    )

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY missing")

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"event-{uuid.uuid4()}",
            system_message="You are a sharp tech-news generator for a startup tycoon game. Keep outputs short, punchy, thematic.",
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=user_prompt))
        text = (response or "").strip()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        if len(lines) >= 2:
            title, message = lines[0], " ".join(lines[1:])
        else:
            title = req.event_type.replace("_", " ").upper()
            message = text or "Something happened in the market."

        # clamp
        title = title[:60]
        message = message[:220]

        event = EventResponse(
            id=str(uuid.uuid4()),
            title=title,
            message=message,
            event_type=req.event_type,
            lang=req.lang,
        )

        # log to mongo (fire & forget)
        try:
            await db.events.insert_one(
                {
                    **event.model_dump(),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception as e:
            logger.warning(f"mongo log failed: {e}")

        return event
    except Exception as e:
        logger.error(f"LLM event generation failed: {e}")
        # graceful fallback so game never breaks
        fallback_map = {
            "en": {
                "market_crash": ("MARKET CRASH", "Tech stocks are plunging and buyers are fleeing the app store."),
                "viral_trend": ("AI TREND SURGING", "A new AI fad is driving massive demand for indie apps."),
                "critical_bug": ("CRITICAL BUG", "A nasty bug just hit production and users are screaming."),
                "investor": ("INVESTOR KNOCKS", "An angel investor is offering a cash boost to hot startups."),
                "tax_audit": ("TAX AUDIT", "The taxman just dropped in and he is not smiling."),
                "dev_burnout": ("DEV BURNOUT", "Your team is exhausted after weeks of nonstop crunch."),
                "hype_spike": ("HYPE SPIKE", "Market hype is spiking and app sales are exploding."),
            },
            "it": {
                "market_crash": ("CROLLO DEL MERCATO", "Le azioni tech precipitano e gli utenti fuggono dallo store."),
                "viral_trend": ("TREND AI IN ASCESA", "Una nuova moda AI fa esplodere la domanda di app indie."),
                "critical_bug": ("BUG CRITICO", "Un bug grave è arrivato in produzione, gli utenti protestano."),
                "investor": ("INVESTITORE IN VISTA", "Un angel investor offre capitale alle startup più hot."),
                "tax_audit": ("CONTROLLO FISCALE", "Il fisco è alla porta e non sembra di buon umore."),
                "dev_burnout": ("BURNOUT DEI DEV", "Il team è esausto dopo settimane di crunch senza sosta."),
                "hype_spike": ("PICCO DI HYPE", "L'hype schizza in alto e le vendite delle app esplodono."),
            },
        }
        lang_fallbacks = fallback_map.get(req.lang, fallback_map["en"])
        title, message = lang_fallbacks.get(req.event_type, ("EVENT", "Something happened."))
        return EventResponse(
            id=str(uuid.uuid4()),
            title=title,
            message=message,
            event_type=req.event_type,
            lang=req.lang,
        )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
