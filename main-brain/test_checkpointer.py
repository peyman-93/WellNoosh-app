#!/usr/bin/env python3
"""
Test script to debug checkpointer issues
Run this to test if your LangGraph checkpointer setup is working
"""

import os
import sys

# Add parent directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

def test_imports():
    """Test if all required imports work"""
    print("Testing imports...")
    
    try:
        import openai
        print("✅ openai imported successfully")
    except ImportError as e:
        print(f"❌ openai import failed: {e}")
        return False
    
    try:
        from langgraph.graph import StateGraph, END
        print("✅ langgraph.graph imported successfully")
    except ImportError as e:
        print(f"❌ langgraph.graph import failed: {e}")
        return False
    
    try:
        from langgraph.checkpoint.memory import MemorySaver
        print("✅ MemorySaver imported successfully")
    except ImportError as e:
        print(f"❌ MemorySaver import failed: {e}")
        return False
    
    try:
        from langgraph.checkpoint.sqlite import SqliteSaver
        print("✅ SqliteSaver imported successfully")
    except ImportError as e:
        print(f"❌ SqliteSaver import failed: {e}")
        print("This might be okay - we can fall back to MemorySaver")
        return True
    
    return True

def test_checkpointer_creation():
    """Test creating different types of checkpointers"""
    print("\nTesting checkpointer creation...")
    
    # Test MemorySaver
    try:
        from langgraph.checkpoint.memory import MemorySaver
        memory_saver = MemorySaver()
        print("✅ MemorySaver created successfully")
    except Exception as e:
        print(f"❌ MemorySaver creation failed: {e}")
        return False
    
    # Test SqliteSaver
    try:
        from langgraph.checkpoint.sqlite import SqliteSaver
        import sqlite3
        
        # Method 1: Direct connection
        try:
            conn = sqlite3.connect(":memory:", check_same_thread=False)
            sqlite_saver = SqliteSaver(conn)
            print("✅ SqliteSaver created successfully (direct connection)")
        except Exception as e1:
            print(f"⚠️  SqliteSaver direct connection failed: {e1}")
            
            # Method 2: from_conn_string
            try:
                sqlite_saver = SqliteSaver.from_conn_string(":memory:")
                print("✅ SqliteSaver created successfully (from_conn_string)")
            except Exception as e2:
                print(f"⚠️  SqliteSaver from_conn_string failed: {e2}")
                print("This is okay - we'll use MemorySaver instead")
                
    except ImportError:
        print("⚠️  SqliteSaver not available - using MemorySaver")
    
    return True

def test_simple_workflow():
    """Test creating and compiling a simple workflow"""
    print("\nTesting simple workflow compilation...")
    
    try:
        from langgraph.graph import StateGraph, END
        from langgraph.checkpoint.memory import MemorySaver
        
        # Create a simple workflow
        workflow = StateGraph(dict)
        
        def simple_node(state):
            return {"test": "value"}
        
        workflow.add_node("test_node", simple_node)
        workflow.set_entry_point("test_node")
        workflow.add_edge("test_node", END)
        
        # Try with MemorySaver first
        memory = MemorySaver()
        app = workflow.compile(checkpointer=memory)
        print("✅ Simple workflow compiled with MemorySaver")
        
        # Test running it
        result = app.invoke({"input": "test"}, config={"configurable": {"thread_id": "test"}})
        print(f"✅ Simple workflow executed: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Simple workflow test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sqlite_workflow():
    """Test workflow with SQLite checkpointer if available"""
    print("\nTesting SQLite workflow compilation...")
    
    try:
        from langgraph.graph import StateGraph, END
        from langgraph.checkpoint.sqlite import SqliteSaver
        import sqlite3
        
        # Create a simple workflow
        workflow = StateGraph(dict)
        
        def simple_node(state):
            return {"test": "value"}
        
        workflow.add_node("test_node", simple_node)
        workflow.set_entry_point("test_node")
        workflow.add_edge("test_node", END)
        
        # Try with SqliteSaver
        try:
            conn = sqlite3.connect(":memory:", check_same_thread=False)
            memory = SqliteSaver(conn)
            app = workflow.compile(checkpointer=memory)
            print("✅ SQLite workflow compiled successfully")
            
            # Test running it
            result = app.invoke({"input": "test"}, config={"configurable": {"thread_id": "test"}})
            print(f"✅ SQLite workflow executed: {result}")
            return True
            
        except Exception as e:
            print(f"⚠️  SQLite workflow failed: {e}")
            return False
        
    except ImportError:
        print("⚠️  SqliteSaver not available")
        return False

def main():
    """Run all tests"""
    print("🔍 LangGraph Checkpointer Diagnostic Tool")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed. Please install required packages:")
        print("pip install langgraph langgraph-checkpoint-sqlite")
        return
    
    # Test checkpointer creation
    if not test_checkpointer_creation():
        print("\n❌ Checkpointer creation tests failed")
        return
    
    # Test simple workflow
    if not test_simple_workflow():
        print("\n❌ Simple workflow test failed")
        return
    
    # Test SQLite workflow
    test_sqlite_workflow()
    
    print("\n" + "=" * 50)
    print("🎉 Diagnostic complete!")
    print("\nRecommendations:")
    print("- If SQLite tests failed, use MemorySaver for now")
    print("- If everything passed, your setup should work")
    print("- Try upgrading packages if you see version issues:")
    print("  pip install --upgrade langgraph langgraph-checkpoint-sqlite")

if __name__ == "__main__":
    main()