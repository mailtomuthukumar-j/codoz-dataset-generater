"""
Vector Store - Simple vector storage for embeddings (placeholder).

Provides basic vector storage interface.
"""

from typing import Dict, List, Any, Optional
import numpy as np


class VectorStore:
    """Simple in-memory vector store."""
    
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.vectors: List[np.ndarray] = []
        self.metadata: List[Dict[str, Any]] = []
        self.id_counter = 0
    
    def add(
        self,
        vector: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Add a vector with metadata.
        
        Args:
            vector: Embedding vector
            metadata: Associated metadata
            
        Returns:
            Vector ID
        """
        if len(vector) != self.dimension:
            raise ValueError(f"Vector dimension {len(vector)} != expected {self.dimension}")
        
        self.vectors.append(vector)
        self.metadata.append(metadata or {})
        self.id_counter += 1
        
        return self.id_counter - 1
    
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: Query embedding
            top_k: Number of results
            
        Returns:
            List of {id, score, metadata} dicts
        """
        if len(query_vector) != self.dimension:
            raise ValueError(f"Query vector dimension {len(query_vector)} != expected {self.dimension}")
        
        if not self.vectors:
            return []
        
        similarities = []
        for i, vec in enumerate(self.vectors):
            sim = self._cosine_similarity(query_vector, vec)
            similarities.append((i, sim))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for idx, score in similarities[:top_k]:
            results.append({
                "id": idx,
                "score": float(score),
                "metadata": self.metadata[idx]
            })
        
        return results
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)
    
    def get(self, vector_id: int) -> Optional[Dict[str, Any]]:
        """
        Get vector and metadata by ID.
        
        Args:
            vector_id: Vector ID
            
        Returns:
            {vector, metadata} or None
        """
        if 0 <= vector_id < len(self.vectors):
            return {
                "vector": self.vectors[vector_id],
                "metadata": self.metadata[vector_id]
            }
        return None
    
    def delete(self, vector_id: int) -> bool:
        """
        Delete vector by ID.
        
        Args:
            vector_id: Vector ID
            
        Returns:
            True if deleted
        """
        if 0 <= vector_id < len(self.vectors):
            del self.vectors[vector_id]
            del self.metadata[vector_id]
            return True
        return False
    
    def count(self) -> int:
        """Get number of vectors."""
        return len(self.vectors)
    
    def clear(self) -> None:
        """Clear all vectors."""
        self.vectors.clear()
        self.metadata.clear()
