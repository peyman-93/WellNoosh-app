import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

MODEL_PREFERENCE = [
    {"provider": "openai", "model_name": "gpt-4o-mini"},
    {"provider": "openai", "model_name": "gpt-4o"},
    # {"provider": "google", "model_name": "gemini-1.5-flash-latest"} # Temporarily disabled - requires a different library to call.
]

MAX_TOKENS = 2048