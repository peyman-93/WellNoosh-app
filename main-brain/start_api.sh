#!/bin/bash

# Activate virtual environment if it exists
if [ -d "brainenv" ]; then
    source brainenv/bin/activate
    echo "✅ Activated virtual environment"
else
    echo "⚠️ No virtual environment found. Creating one..."
    python3 -m venv brainenv
    source brainenv/bin/activate
    pip install -r requirements.txt
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with the following variables:"
    echo "  SUPABASE_HOST=your_supabase_host"
    echo "  SUPABASE_PORT=5432"
    echo "  SUPABASE_DB=postgres"
    echo "  SUPABASE_USER=postgres"
    echo "  SUPABASE_PASSWORD=your_password"
    echo "  OPENAI_API_KEY=your_openai_key (or GOOGLE_API_KEY=your_google_key)"
    exit 1
fi

# Start the API server
echo "🚀 Starting Recommendation API server..."
cd src
python recommendation_api.py