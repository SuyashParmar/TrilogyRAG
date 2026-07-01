import os
import sys
import json
import asyncio
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# Add the parent directory to sys.path so we can import src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api import rag_chain

def load_golden_dataset(filepath="eval/golden_dataset.json"):
    with open(filepath, "r") as f:
        return json.load(f)

async def run_evaluation():
    if not rag_chain:
        print("Error: RAG chain failed to initialize. Cannot run evaluation.")
        sys.exit(1)
        
    dataset = load_golden_dataset()
    questions = []
    ground_truths = []
    answers = []
    contexts = []
    
    print(f"Running evaluation on {len(dataset)} examples...")
    
    for item in dataset:
        q = item["question"]
        print(f"Evaluating: {q}")
        
        # Invoke our RAG pipeline
        response = rag_chain.invoke({"input": q})
        
        questions.append(q)
        ground_truths.append(item["ground_truth"])
        answers.append(response["answer"])
        
        # Extract the text content from the retrieved documents
        retrieved_texts = [doc.page_content for doc in response["context"]]
        contexts.append(retrieved_texts)
        
    # Prepare the huggingface dataset format expected by Ragas
    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    hf_dataset = Dataset.from_dict(data)
    
    # Ragas uses the default LLM (OpenAI) unless configured otherwise.
    # For a production pipeline with a custom LLM (like Grok), you'd inject ChatXAI into ragas here.
    # However, for simplicity and standard evaluation metrics, Ragas defaults work beautifully if OPENAI_API_KEY is set.
    # If using Grok for evaluation as well, we would configure Ragas to use it.
    
    # We will use the standard metrics
    metrics = [
        faithfulness,
        answer_relevancy,
    ]
    
    print("\nCalculating metrics using Ragas...")
    # NOTE: Evaluation requires an LLM to judge the responses. 
    # Ensure your environment has the necessary API keys (like OPENAI_API_KEY) for Ragas judging models,
    # OR configure ragas to use the ChatXAI model.
    result = evaluate(hf_dataset, metrics)
    print("\n--- Evaluation Results ---")
    print(result)
    
    # CI/CD Gate
    faithfulness_score = result["faithfulness"]
    if faithfulness_score < 0.85:
        print(f"\n[FAIL] Faithfulness ({faithfulness_score:.2f}) is below the threshold of 0.85.")
        sys.exit(1)
    else:
        print(f"\n[PASS] Pipeline meets production quality standards.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(run_evaluation())
