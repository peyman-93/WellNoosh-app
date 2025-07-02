import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print("⚠️  Warning: OPENAI_API_KEY not found in environment variables.")
    print("Please create a .env file with your OpenAI API key:")
    print("OPENAI_API_KEY=your_api_key_here")

# Model preferences for different providers
MODEL_PREFERENCE = [
    {"provider": "openai", "model_name": "gpt-4o-mini"},
    {"provider": "openai", "model_name": "gpt-4o"},
    # {"provider": "google", "model_name": "gemini-1.5-flash-latest"} # Temporarily disabled - requires a different library to call.
]

# Default model settings
DEFAULT_MODEL = "gpt-4o-mini"
MAX_TOKENS = 2048

# Image generation settings
IMAGE_MODEL = "dall-e-3"
IMAGE_SIZE = "1024x1024"

# Audio settings
AUDIO_MODEL = "whisper-1"

# Database settings
USER_DATABASE_PATH = "data/user_database.json"
INVENTORY_DATABASE_PATH = "data/leftover_data/user_inventory.json"
MEMORY_DATABASE_PATH = "data/leftover_data/leftover_memory.db"

# Application settings
MAX_RECIPE_RECOMMENDATIONS = 3
DEFAULT_SERVING_SIZE = 2