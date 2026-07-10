from sentence_transformers import CrossEncoder
from langchain_core.documents import Document

RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

class CrossEncoderReRanker:
    def __init__(self, top_n=3):
        self.model = CrossEncoder(RERANKER_MODEL_NAME)
        self.top_n = top_n

    def compress_documents(self, documents: list[Document], query: str) -> list[Document]:
        """
        Re-ranks a list of documents against a query using a Cross-Encoder.
        """
        if not documents:
            return []

        # Create pairs of (query, document text)
        pairs = [[query, doc.page_content] for doc in documents]
        
        # Predict scores for each pair
        scores = self.model.predict(pairs)
        
        # Combine docs and their scores
        doc_score_pairs = list(zip(documents, scores))
        
        # Sort by score in descending order
        doc_score_pairs.sort(key=lambda x: x[1], reverse=True)
        
        # Keep only the top_n documents
        top_docs = [doc for doc, score in doc_score_pairs[:self.top_n]]
        
        # Optionally inject the cross-encoder score into metadata for debugging/evaluation
        for i, (doc, score) in enumerate(doc_score_pairs[:self.top_n]):
            doc.metadata["rerank_score"] = float(score)
            
        return top_docs
