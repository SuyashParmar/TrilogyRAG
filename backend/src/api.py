import os
import yaml
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.hybrid_retriever import get_hybrid_retriever
from src.reranker import CrossEncoderReRanker
from src.ingestion import ingest_file

load_dotenv()

app = FastAPI(title="RAG System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    mode: str = "general"

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]

# Load API key and initialize LLM
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY is not set correctly in .env!")

llm = ChatGroq(
    groq_api_key=groq_api_key,
    model="llama-3.3-70b-versatile",
    temperature=0.1
)

# Phase 2: Load prompts from YAML config
try:
    with open("config/prompts.yaml", "r") as f:
        prompts_config = yaml.safe_load(f)
except Exception as e:
    print(f"Failed to load prompts.yaml: {e}")
    prompts_config = {"general": "You are a helpful assistant. Use the context to answer."}

prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_msg}"),
    ("human", "{input}"),
])

try:
    # Phase 2: Use Hybrid Retriever (Vector + BM25)
    base_retriever = get_hybrid_retriever(k=10)
    
    # Phase 2: Add Cross-Encoder Re-ranker (selects top 3)
    compressor = CrossEncoderReRanker(top_n=3)
    
    def retrieve_and_compress(query: str):
        docs = base_retriever(query)
        return compressor.compress_documents(docs, query)
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
        
    rag_chain = (
        RunnablePassthrough.assign(
            context=lambda x: retrieve_and_compress(x["input"])
        )
        | RunnablePassthrough.assign(
            answer=(
                lambda x: (
                    prompt | llm | StrOutputParser()
                ).invoke({
                    "context": format_docs(x["context"]), 
                    "input": x["input"],
                    "system_msg": x["system_msg"]
                })
            )
        )
    )
except Exception as e:
    print(f"Failed to initialize RAG chain: {e}")
    rag_chain = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "RAG API is running."}

@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
        
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        ingest_file(file_path)
        return {"status": "success", "message": f"Successfully ingested {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
def query_rag(request: QueryRequest):
    if not rag_chain:
        raise HTTPException(status_code=500, detail="RAG chain not initialized. Did you run ingestion?")
    
    system_msg = prompts_config.get(request.mode.lower(), prompts_config.get("general", ""))
    
    response = rag_chain.invoke({
        "input": request.query,
        "system_msg": system_msg
    })
    
    # Extract sources from metadata
    source_docs = response.get("context", [])
    sources = []
    for doc in source_docs:
        sources.append({
            "title": doc.metadata.get("title") or doc.metadata.get("source", "Unknown"),
            "source": doc.metadata.get("source", "Unknown"),
            "content_preview": doc.page_content[:200] + "..."
        })
        
    return QueryResponse(
        answer=response["answer"],
        sources=sources
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
