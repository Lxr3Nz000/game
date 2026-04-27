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

# Commentato perché la libreria non è presente sul server
# from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ.get("MONGO_URL", "")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "startup_master")]

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
    # Fallback predefiniti pronti all'uso
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

    try:
        # Forziamo l'uso del fallback poiché la libreria LlmChat non è disponibile
        raise Exception("Uso modalità offline (fallback)")

    except Exception as e:
        logger.info(f"Using fallback events: {e}")
        lang_fallbacks = fallback_map.get(req.lang, fallback_map["en"])
        title, message = lang_fallbacks.get(req.event_type, ("EVENT", "Something happened."))
        
        event = EventResponse(
            id=str(uuid.uuid4()),
            title=title,
            message=message,
            event_type=req.event_type,
            lang=req.lang,
        )

        # Log su MongoDB (se configurato)
        try:
            if mongo_url:
                await db.events.insert_one({
                    **event.model_dump(),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
        except Exception as mongo_err:
            logger.warning(f"mongo log failed: {mongo_err}")

        return event


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
