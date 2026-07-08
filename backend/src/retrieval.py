import os
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
PERSIST_DIRECTORY = "./chroma_db"

def get_retriever():
    """Returns a basic vector similarity retriever."""
    if not os.path.exists(PERSIST_DIRECTORY):
        raise RuntimeError(f"Chroma DB not found at {PERSIST_DIRECTORY}. Please run ingestion.py first.")
        
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    vectorstore = Chroma(
        persist_directory=PERSIST_DIRECTORY, 
        embedding_function=embeddings
    )
    
    # Retrieve top 4 most similar chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    return retriever
