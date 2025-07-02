# leftover/run_leftover_agent.py

import sys
import os
from datetime import datetime

# Add parent directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    import openai
    import config
    from leftover_agent import app
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure all required packages are installed:")
    print("pip install openai langgraph langgraph-checkpoint-sqlite pydantic python-dotenv")
    print("For audio recording: pip install sounddevice scipy numpy")
    print("For version issues, try: pip install --upgrade langgraph langgraph-checkpoint-sqlite")
    sys.exit(1)

# Imports for audio recording
try:
    import sounddevice as sd
    import numpy as np
    from scipy.io.wavfile import write as write_wav
    CAPTURE_ENABLED = True
    print("✅ Audio recording enabled (20-second max)")
except ImportError as e:
    print(f"\n⚠️  Warning: Audio recording disabled - {e}")
    print("To enable audio recording, install: pip install sounddevice scipy numpy")
    CAPTURE_ENABLED = False

# Configure the OpenAI library
try:
    openai.api_key = config.OPENAI_API_KEY
    if not config.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not found in config")
    print("✅ OpenAI API key configured")
except Exception as e:
    print(f"❌ Error configuring OpenAI: {e}")
    print("Please check your config.py file and ensure OPENAI_API_KEY is set")
    sys.exit(1)

def record_live_audio() -> str | None:
    """Records audio for up to 20 seconds."""
    if not CAPTURE_ENABLED: 
        print("❌ Audio capture is disabled. Please install required libraries.")
        return None
        
    try:
        samplerate = 44100
        duration = 20  # Maximum 20 seconds
        path = "temp_ingredients.wav"
        
        print(f"\n🎙️  Recording for up to {duration} seconds...")
        print("💡 Start speaking your ingredients now!")
        print("⏹️  Press Ctrl+C anytime to stop early")
        
        try:
            # Record audio
            print("🎙️  Recording... speak clearly!")
            recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1)
            
            # Wait for recording to finish, but allow early termination
            try:
                sd.wait()  # Wait until recording is finished
            except KeyboardInterrupt:
                print("\n🛑 Recording stopped early by user")
                sd.stop()  # Stop the recording
                
        except KeyboardInterrupt:
            print("\n🛑 Recording cancelled")
            return None
        
        # Check if we got meaningful audio
        if recording is not None and len(recording) > 0:
            volume = np.sqrt(np.mean(recording**2))
            print(f"📊 Recording volume: {volume:.6f}")
            
            if volume < 0.0001:
                print("❌ Very low volume detected - try speaking louder")
                return None
            
            # Save the recording
            audio_int16 = (recording * 32767).astype(np.int16)
            write_wav(path, samplerate, audio_int16.flatten())
            
            # Calculate actual duration (in case stopped early)
            actual_duration = len(recording) / samplerate
            print(f"✅ Recording saved: {actual_duration:.1f} seconds")
            return path
        else:
            print("❌ No audio recorded - check your microphone")
            return None
            
    except ImportError:
        print("❌ NumPy is required for audio recording")
        print("Install with: pip install numpy")
        return None
    except Exception as e:
        print(f"❌ Error recording audio: {e}")
        print("💡 Try speaking louder or check your microphone settings")
        return None

def run_agent_flow(user_id: str, conv_id: str, input_type: str, input_data: str):
    """Runs the full agent flow for a user action."""
    if app is None:
        print("❌ Workflow not properly initialized. Cannot run agent.")
        return
    
    config_dict = {"configurable": {"thread_id": conv_id}}
    state = {
        "user_id": user_id, 
        "input_type": input_type, 
        "input_data": input_data
    }
    
    print("\n🤖 Assistant is working...")
    print(f"Debug: Config = {config_dict}")
    print(f"Debug: State = {state}")
    
    try:
        # Stream events and wait for the process to finish or pause for input
        for i, event in enumerate(app.stream(state, config=config_dict)):
            print(f"Debug: Event {i}: {type(event)}")
            # You can process events here if needed
            pass
        print("🤖 Assistant finished the flow.")
        
    except KeyboardInterrupt:
        print("\n🛑 Process interrupted by user")
    except Exception as e:
        print(f"❌ Error running agent flow: {e}")
        print("🔍 Error details:")
        import traceback
        traceback.print_exc()
        print("\n💡 Try running the diagnostic script: python test_checkpointer.py")

def ensure_data_directories():
    """Ensure all required data directories exist."""
    directories = [
        "data",
        "data/leftover_data"
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"📁 Created directory: {directory}")

def main():
    """Main function to run the leftover tracker."""
    print("🧑‍🍳 Welcome to the WellNoosh Leftover Tracker! 🧑‍🍳")
    
    # Ensure required directories exist
    ensure_data_directories()
    
    # Check if app is properly initialized
    if app is None:
        print("❌ Application failed to initialize. Please check your setup.")
        return
    
    user_id = "user_1"
    conv_id = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    print(f"Starting new conversation: {conv_id}")

    temp_file_to_clean = None
    
    try:
        # Main interaction loop
        print("\n--- How would you like to track your leftovers? ---")
        print("1. Type my ingredients")
        print("2. Scan with webcam (Coming Soon)")
        print("3. Speak my ingredients" + (" (DISABLED)" if not CAPTURE_ENABLED else ""))
        print("4. Use my already saved ingredients")
        
        while True:
            try:
                choice = input("Enter your choice (1-4): ").strip()
                if choice in ['1', '2', '3', '4']:
                    if choice == '2':
                        print("\n📷 Camera scanning feature is coming soon!")
                        print("Please choose another option:\n")
                        continue  # Go back to menu
                    break
                else:
                    print("Invalid choice. Please enter 1, 2, 3, or 4.")
            except (EOFError, KeyboardInterrupt):
                print("\nGoodbye!")
                return

        input_type, input_data = "text", ""

        if choice == '1':
            input_type = "text"
            try:
                input_data = input("Enter your ingredients: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nOperation cancelled.")
                return
                
        elif choice == '3':
            if CAPTURE_ENABLED:
                input_type = "audio"
                print("\n📼 Starting 20-second audio recording...")
                temp_file_to_clean = record_live_audio()
                
                if temp_file_to_clean and os.path.exists(temp_file_to_clean):
                    input_data = temp_file_to_clean
                    print(f"✅ Audio file ready: {temp_file_to_clean}")
                    
                    # Quick validation of the audio file
                    try:
                        file_size = os.path.getsize(temp_file_to_clean)
                        print(f"📊 Audio file size: {file_size} bytes")
                        if file_size < 1000:  # Less than 1KB seems too small
                            print("⚠️  Audio file seems very small, but proceeding...")
                    except Exception as e:
                        print(f"⚠️  Couldn't check audio file: {e}")
                        
                else:
                    print("❌ Audio recording failed or was cancelled.")
                    print("🔄 Using saved inventory instead...")
                    input_type = "confirmation"
                    input_data = ""
            else:
                print("❌ Audio recording is disabled. Please install required libraries.")
                print("Install with: pip install sounddevice scipy numpy")
                print("Using saved inventory instead.")
                input_type = "confirmation"
                input_data = ""
                
        elif choice == '4':
            print("✅ Using your saved inventory.")
            input_type = "confirmation"
            input_data = ""

        # Validate that we have valid input data for file-based inputs
        if input_type == "audio" and input_data and not os.path.exists(input_data):
            print(f"❌ Error: audio file not found at {input_data}. Using saved inventory instead.")
            input_type = "confirmation"
            input_data = ""

        # Debug: Show what we're about to process
        print(f"\n🔍 Debug Info:")
        print(f"   Input Type: {input_type}")
        print(f"   Input Data: {input_data if input_type != 'audio' else f'Audio file: {input_data}'}")
        
        # Run the full agent flow
        run_agent_flow(user_id, conv_id, input_type, input_data or "")

    except KeyboardInterrupt:
        print("\n🛑 Process interrupted. Goodbye!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        # Clean up temporary files
        if temp_file_to_clean and os.path.exists(temp_file_to_clean):
            try:
                os.remove(temp_file_to_clean)
                print(f"🧹 Cleaned up temp file: {temp_file_to_clean}")
            except Exception as e:
                print(f"⚠️  Warning: Could not clean up temp file: {e}")

if __name__ == "__main__":
    # Check if user database exists, create a simple one if it doesn't
    db_path = "data/user_database.json"
    if not os.path.exists(db_path):
        print("📝 Creating default user database...")
        ensure_data_directories()
        default_user_data = {
            "user_1": {
                "name": "Default User",
                "dietary_preferences": [],
                "allergies": [],
                "cooking_skill": "beginner"
            }
        }
        try:
            with open(db_path, 'w') as f:
                import json
                json.dump(default_user_data, f, indent=4)
            print("✅ Default user database created")
        except Exception as e:
            print(f"❌ Error creating user database: {e}")
    
    main()