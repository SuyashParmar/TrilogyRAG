<div align="center">
  <h1 align="center">🧠 TrilogyRAG: Domain Expert AI</h1>
  <h3>A Production-Grade Retrieval-Augmented Generation (RAG) Architecture</h3>

  <p>
    <img src="https://img.shields.io/badge/Llama%203.3-70B-blue?style=for-the-badge&logo=meta" alt="Llama 3" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/ChromaDB-FF4F00?style=for-the-badge" alt="ChromaDB" />
    <img src="https://img.shields.io/badge/Groq-Cloud-green?style=for-the-badge" alt="Groq" />
  </p>
</div>

---

## 🚀 Overview

TrilogyRAG (Domain Expert AI) is a full-stack, enterprise-ready RAG application that allows users to upload documents (PDF, TXT, MD, CSV) and interact with them in real-time. It goes far beyond standard LangChain tutorials by implementing a **Two-Stage Retrieval Pipeline**, strict hallucination guardrails, dynamic persona adaptation, and automated ML-Ops evaluations.

It is powered by Meta's **Llama-3.3-70B** running on **Groq** for blazing-fast inference, a **FastAPI** backend, and a premium glassmorphic **Next.js** frontend.

## 🏗️ Architecture & Core Features

### 1. Two-Stage Retrieval Pipeline
Standard vector search suffers from precision issues. This project solves that using a state-of-the-art two-stage pipeline:
* **Stage 1: Hybrid Search (High Recall).** Combines Semantic Vector Search (ChromaDB) with Exact Keyword Search (BM25) using a custom **Reciprocal Rank Fusion (RRF)** algorithm.
* **Stage 2: Cross-Encoder Re-Ranking (High Precision).** Passes the top 10 hybrid results through a HuggingFace Cross-Encoder (`ms-marco-MiniLM-L-6-v2`) to intensely scrutinize and compress the results down to the absolute most relevant 3 chunks.

### 2. Dynamic Persona Engine & Hallucination Guardrails
The system dynamically loads prompts from a `config/prompts.yaml` file based on the user's selected mode (Legal, Medical, General). Strict guardrails force the LLM to provide inline citations (e.g., `[Source: Document.pdf]`) and explicitly refuse to answer if the context does not contain the necessary information, virtually eliminating hallucination.

### 3. On-the-Fly Document Ingestion
Users can upload documents through the UI. The FastAPI backend instantly parses the files using `PyMuPDF`, splits them into semantic chunks with a predefined overlap, embeds them locally using `all-MiniLM-L6-v2`, and appends them to the persistent vector database.

### 4. ML-Ops & CI/CD
Includes an offline evaluation pipeline powered by the `ragas` framework. A custom GitHub Actions workflow (`.github/workflows/rag_eval.yml`) runs on every Pull Request, mathematically evaluating the *Faithfulness* and *Answer Relevancy* of the pipeline against a Golden Dataset.

---

## 🛠️ Tech Stack

- **LLM Engine:** Meta Llama-3.3-70B (via Groq API)
- **Backend:** Python, FastAPI, LangChain, PyMuPDF, SentenceTransformers
- **Vector Store:** ChromaDB (Local Persistence)
- **Frontend:** React, Next.js, Tailwind CSS (Glassmorphism UI)
- **Evaluation:** Ragas, GitHub Actions

---

## 💻 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/SuyashParmar/TrilogyRAG.git
cd TrilogyRAG
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory and add your Groq API key:
```env
GROQ_API_KEY=gsk_your_api_key_here
```

Start the FastAPI Server:
```bash
uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to start chatting with your data!

---

## 🧠 Why I Built This

I built this project to demonstrate a deep understanding of production-grade AI engineering. While building basic chatbots is trivial, solving the real-world Enterprise AI challenges—such as improving retrieval precision via Cross-Encoders, preventing hallucination through strict prompting, and setting up automated programmatic evaluations—requires a much deeper technical architecture.
