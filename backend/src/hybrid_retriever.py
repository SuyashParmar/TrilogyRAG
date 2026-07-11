import os
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
PERSIST_DIRECTORY = "./chroma_db"

def get_hybrid_retriever(k=4):
    """
    Returns a hybrid retriever that combines Vector Search (ChromaDB)
    and Keyword Search (BM25) using Reciprocal Rank Fusion (EnsembleRetriever).
    """
    if not os.path.exists(PERSIST_DIRECTORY):
        raise RuntimeError(f"Chroma DB not found at {PERSIST_DIRECTORY}. Please run ingestion.py first.")
        
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    vectorstore = Chroma(
        persist_directory=PERSIST_DIRECTORY, 
        embedding_function=embeddings
    )
    
    # 1. Vector Retriever
    vector_retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    
    # 2. BM25 Keyword Retriever
    collection = vectorstore.get()
    docs_contents = collection["documents"]
    metadatas = collection["metadatas"]
    
    documents = [
        Document(page_content=content, metadata=meta) 
        for content, meta in zip(docs_contents, metadatas)
    ]
    
    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = k
    
    # Return a custom hybrid retriever function
    def retrieve(query: str):
        vec_docs = vector_retriever.invoke(query)
        kw_docs = bm25_retriever.invoke(query)
        
        # Reciprocal Rank Fusion (RRF)
        fused_scores = {}
        # We assign weights: Semantic=0.6, Keyword=0.4
        for rank, doc in enumerate(vec_docs):
            doc_str = doc.page_content
            fused_scores[doc_str] = fused_scores.get(doc_str, 0) + (0.6 / (rank + 60))
            
        for rank, doc in enumerate(kw_docs):
            doc_str = doc.page_content
            fused_scores[doc_str] = fused_scores.get(doc_str, 0) + (0.4 / (rank + 60))
            
        # Re-map scored strings back to Document objects
        content_to_doc = {doc.page_content: doc for doc in vec_docs + kw_docs}
        
        # Sort by fused score
        sorted_docs = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        return [content_to_doc[content] for content, score in sorted_docs[:k]]
        
    return retrieve
