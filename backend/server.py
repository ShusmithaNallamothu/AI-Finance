from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, cast
import uuid
from datetime import datetime, timezone
import bcrypt
from jose import jwt, JWTError
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'bloom_db')
db = client[db_name]

# Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-key')
JWT_ALGORITHM = "HS256"
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Password hashing helpers
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.quiz_responses.create_index("user_id", unique=True)
    await db.chat_messages.create_index("user_id")
    logger.info("Bloom Financial Mentor API started")
    yield
    # Shutdown
    client.close()
    logger.info("Bloom Financial Mentor API shut down")

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# CORS must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class QuizData(BaseModel):
    monthly_income: float
    monthly_surplus: float
    emergency_fund: str
    primary_goal: str
    risk_comfort: int

class ChatMessage(BaseModel):
    message: str

class CompoundRequest(BaseModel):
    monthly_amount: float
    years: int = 10
    rate: float = 7.0

# ─── Helpers ──────────────────────────────────────────────

def create_token(user_id: str, email: str, name: str):
    return jwt.encode({"user_id": user_id, "email": email, "name": name}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Auth Routes ──────────────────────────────────────────

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "quiz_completed": False
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email, data.name)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email, "quiz_completed": False}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"], user["name"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "quiz_completed": user.get("quiz_completed", False)}}

# ─── Profile & Quiz ──────────────────────────────────────

@api_router.get("/user/profile")
async def get_profile(user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    quiz = await db.quiz_responses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user": user_doc, "quiz": quiz}

@api_router.post("/quiz/save")
async def save_quiz(data: QuizData, user=Depends(get_current_user)):
    quiz_doc = {
        "user_id": user["user_id"],
        "monthly_income": data.monthly_income,
        "monthly_surplus": data.monthly_surplus,
        "emergency_fund": data.emergency_fund,
        "primary_goal": data.primary_goal,
        "risk_comfort": data.risk_comfort,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.quiz_responses.update_one(
        {"user_id": user["user_id"]}, {"$set": quiz_doc}, upsert=True
    )
    await db.users.update_one(
        {"id": user["user_id"]}, {"$set": {"quiz_completed": True}}
    )
    return {"status": "saved", "quiz": quiz_doc}

@api_router.post("/quiz/reset")
async def reset_quiz(user=Depends(get_current_user)):
    await db.quiz_responses.delete_one({"user_id": user["user_id"]})
    await db.chat_messages.delete_many({"user_id": user["user_id"]})
    await db.users.update_one(
        {"id": user["user_id"]}, {"$set": {"quiz_completed": False}}
    )
    return {"status": "reset"}

# ─── Chat Routes ──────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Bloom Financial Mentor API", "status": "ok"}

MENTOR_SYSTEM_PROMPT = """Role: You are "Bloom," a supportive, calm AI financial mentor for first-time investors. Your mission is to replace complex dashboards with simple, conversational learning.

Strict Logic Flow:
1. Analysis: Summarize the user's situation or the data they provided. Identify their current life stage and goals.
2. Education: Explain one relevant financial concept (e.g., compounding, inflation, diversification) using an ELI5 analogy (15-year-old level).
3. Guidance: Help the user think through their next move. If they lack an emergency fund, suggest building that 3-6 month safety net first.

Core Guardrails:
- No Direct Advice: Discuss options and comparisons, but never recommend specific stocks, ETFs, or products.
- Financial Safety: Prioritize emergency savings before any investing.
- AI Transparency: You must state: "I am an AI educational assistant, not a licensed financial advisor."
- No Jargon: If you must use a financial term, explain it instantly with an everyday example.
- Constructive Tone: If a user mentions a financial mistake, be encouraging and constructive, not judgmental.

Formatting & Style:
- Scannability: Use bold headers for the three modes (**Analysis**, **Education**, **Guidance**).
- Visual Flows: Use arrow notation for processes (e.g., Monthly Salary -> Basic Needs -> Emergency Fund -> Investing).
- Bite-Sized Content: Keep paragraphs to a maximum of 2 sentences. Use bullet points for comparisons.
- Analogy First: Always provide the real-life analogy BEFORE the formal financial term.
- Guided Closure: End every response with exactly two "Quick Reply" style questions to help the user move forward (e.g., "1. How do I calculate my 3-month safety net? 2. What is a High-Yield Savings account?")."""

@api_router.post("/chat/send")
async def send_chat(data: ChatMessage, user=Depends(get_current_user)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    quiz = await db.quiz_responses.find_one({"user_id": user["user_id"]}, {"_id": 0})
    prev_messages_raw = await db["chat_messages"].find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    prev_messages: List[Any] = list(prev_messages_raw) if prev_messages_raw else []

    quiz_context = ""
    if quiz:
        ef_map = {"yes": "Yes", "no": "No", "working_on_it": "Working on it"}
        quiz_context = f"""

User Financial Profile:
- Name: {user.get('name', 'User')}
- Monthly Take-Home Pay: ${quiz['monthly_income']:,.0f}
- Monthly Surplus (Extra Cash): ${quiz['monthly_surplus']:,.0f}
- Emergency Fund (3-6 months): {ef_map.get(quiz['emergency_fund'], quiz['emergency_fund'])}
- Primary Financial Goal: {quiz['primary_goal']}
- Risk Comfort (1=very nervous, 5=very comfortable): {quiz['risk_comfort']}/5"""

    system_msg = MENTOR_SYSTEM_PROMPT + quiz_context

    history_text = ""
    if prev_messages:
        recent_msgs: List[Any] = list(prev_messages)[-10:]
        for msg in recent_msgs:
            role_label = "User" if msg["role"] == "user" else "Bloom"
            history_text += f"{role_label}: {msg['content']}\n"

    full_message = data.message
    if history_text:
        full_message = f"Previous conversation:\n{history_text}\nNew message from user: {data.message}"

    try:
        client_ai = AsyncOpenAI(api_key=OPENAI_API_KEY)
        completion = await client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": full_message}
            ]
        )
        response = completion.choices[0].message.content
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"OpenAI API error: {e}")
        if "quota" in error_str or "rate" in error_str or "billing" in error_str:
            raise HTTPException(status_code=429, detail="OpenAI API quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()
    user_msg_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "role": "user",
        "content": data.message,
        "created_at": now
    }
    assistant_msg_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "role": "assistant",
        "content": response,
        "created_at": now
    }
    await db["chat_messages"].insert_many([user_msg_doc, assistant_msg_doc])
    return {"response": response, "message_id": assistant_msg_doc["id"]}

@api_router.get("/chat/history")
async def get_chat_history(user=Depends(get_current_user)):
    messages = await db["chat_messages"].find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return {"messages": messages}

@api_router.delete("/chat/clear")
async def clear_chat(user=Depends(get_current_user)):
    await db["chat_messages"].delete_many({"user_id": user["user_id"]})
    return {"status": "cleared"}

# ─── Compounding Calculation ─────────────────────────────

@api_router.post("/calculate/compound")
async def calculate_compound(data: CompoundRequest):
    rate: float = float(data.rate)
    monthly_rate: float = rate / 100.0 / 12.0
    results: List[dict] = []
    balance: float = 0.0
    monthly_acc: float = float(data.monthly_amount)
    years: int = int(data.years)
    for month in range(years * 12 + 1):
        if month > 0:
            balance = float(balance + monthly_acc) * float(1.0 + monthly_rate)
        if month % 12 == 0:
            # Use int(x * 100) / 100.0 to stay within float type (avoids round() overload ambiguity)
            bal_cents: int = int(float(balance) * 100.0)
            contrib_cents: int = int(float(monthly_acc * month) * 100.0)
            results.append({
                "month": month,
                "year": month // 12,
                "balance": float(bal_cents) / 100.0,
                "contributed": float(contrib_cents) / 100.0
            })
    return {
        "data": results,
        "final_balance": results[-1]["balance"],
        "total_contributed": results[-1]["contributed"]
    }

# ─── Setup ────────────────────────────────────────────────

app.include_router(api_router)
