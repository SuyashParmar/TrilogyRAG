import os
from dotenv import load_dotenv
from langchain_community.document_loaders import WikipediaLoader, PyMuPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

# We use SentenceTransformers for local embeddings (free, fast, and private)
# all-MiniLM-L6-v2 is a great balance of performance and speed
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
PERSIST_DIRECTORY = "./chroma_db"

def ingest_documents():
    print("1. Loading documents from Wikipedia...")
    topics = [
        "Retrieval-augmented generation",
        "Large language model",
        "Vector database",
        "Prompt engineering",
        "Transformer (machine learning model)"
    ]
    
    docs = []
    for topic in topics:
        print(f"   Fetching '{topic}'...")
        # load_max_docs=2 will get the main page and maybe one related page per topic
        loader = WikipediaLoader(query=topic, load_max_docs=3)
        docs.extend(loader.load())
    
    print(f"-> Loaded {len(docs)} documents.")

    print("\n2. Chunking documents...")
    # Semantic chunking using RecursiveCharacterTextSplitter
    # 800 tokens (roughly 3000 characters) with 100 token overlap (400 characters)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=400,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(docs)
    print(f"-> Split into {len(chunks)} chunks.")

    print("\n3. Generating embeddings and storing in ChromaDB...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    
    # Initialize ChromaDB and persist the vectors to disk
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=PERSIST_DIRECTORY
    )
    
    print(f"-> Successfully stored vectors in {PERSIST_DIRECTORY}.")
    return vectorstore

def ingest_file(file_path: str):
    """
    Dynamically ingests a single file into the existing ChromaDB.
    Supports PDF and TXT files.
    """
    print(f"Ingesting file: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        loader = PyMuPDFLoader(file_path)
    elif ext in [".txt", ".md", ".csv"]:
        loader = TextLoader(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    docs = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=400,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(docs)
    
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    vectorstore = Chroma(
        embedding_function=embeddings,
        persist_directory=PERSIST_DIRECTORY
    )
    
    # Add new chunks to the existing database
    vectorstore.add_documents(chunks)
    print(f"-> Added {len(chunks)} chunks from {file_path} to DB.")

if __name__ == "__main__":
    ingest_documents()
