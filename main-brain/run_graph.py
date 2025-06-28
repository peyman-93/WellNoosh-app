# run_graph.py
from graph import app # Import the compiled graph object
import openai
import config

# Configure the OpenAI library with your key
openai.api_key = config.OPENAI_API_KEY

def main():
    print("🚀 Starting WellNoosh Recipe Generation Graph...")
    
    # Define the initial state to kick off the graph
    # We only need to provide the user_id and an empty list for rejected meals.
    initial_state = {
        "user_id": "user_1", # You can change this to any user in your database
        "rejected_meals": []
    }
    
    # The .stream() method runs the graph and shows the output of each step as it happens.
    for event in app.stream(initial_state):
        # The key of the dictionary is the name of the node that just finished running.
        node_name = list(event.keys())[0]
        node_output = event[node_name]
        print(f"Finished step: <{node_name}>")
        print("-" * 30)
    
    print("\n✅ Graph run complete!")

if __name__ == "__main__":
    main()