"""
Agent Memory - Shared memory context for agent interactions.

Stores intermediate results and context between pipeline steps.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class MemoryEntry:
    key: str
    value: Any
    timestamp: datetime
    step: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "key": self.key,
            "value": self.value,
            "timestamp": self.timestamp.isoformat(),
            "step": self.step,
            "metadata": self.metadata
        }


class AgentMemory:
    def __init__(self):
        self._memory: Dict[str, MemoryEntry] = {}
        self._history: List[MemoryEntry] = []
    
    def store(
        self, 
        key: str, 
        value: Any, 
        step: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Store a value in memory."""
        entry = MemoryEntry(
            key=key,
            value=value,
            timestamp=datetime.now(),
            step=step,
            metadata=metadata or {}
        )
        self._memory[key] = entry
        self._history.append(entry)
    
    def retrieve(self, key: str) -> Optional[Any]:
        """Retrieve a value from memory."""
        entry = self._memory.get(key)
        return entry.value if entry else None
    
    def get_entry(self, key: str) -> Optional[MemoryEntry]:
        """Get the full memory entry."""
        return self._memory.get(key)
    
    def has(self, key: str) -> bool:
        """Check if a key exists in memory."""
        return key in self._memory
    
    def delete(self, key: str) -> bool:
        """Delete a key from memory."""
        if key in self._memory:
            del self._memory[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all memory."""
        self._memory.clear()
        self._history.clear()
    
    def get_all_keys(self) -> List[str]:
        """Get all keys in memory."""
        return list(self._memory.keys())
    
    def get_by_step(self, step: str) -> List[MemoryEntry]:
        """Get all entries for a specific step."""
        return [e for e in self._history if e.step == step]
    
    def get_recent(self, limit: int = 10) -> List[MemoryEntry]:
        """Get the most recent memory entries."""
        return self._history[-limit:]
    
    def search(self, pattern: str) -> List[MemoryEntry]:
        """Search memory entries by key pattern."""
        return [
            e for e in self._history 
            if pattern.lower() in e.key.lower()
        ]
    
    def to_dict(self) -> Dict[str, Any]:
        """Export memory as dictionary."""
        return {
            key: entry.to_dict() 
            for key, entry in self._memory.items()
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Export memory as JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
    
    def load_from_dict(self, data: Dict[str, Any]) -> None:
        """Load memory from dictionary."""
        for key, value in data.items():
            if isinstance(value, dict) and "value" in value:
                entry = MemoryEntry(
                    key=key,
                    value=value.get("value"),
                    timestamp=datetime.fromisoformat(value.get("timestamp", datetime.now().isoformat())),
                    step=value.get("step"),
                    metadata=value.get("metadata", {})
                )
            else:
                entry = MemoryEntry(
                    key=key,
                    value=value,
                    timestamp=datetime.now()
                )
            self._memory[key] = entry
    
    def get_context_summary(self) -> Dict[str, Any]:
        """Get a summary of current memory state."""
        return {
            "total_entries": len(self._memory),
            "history_length": len(self._history),
            "keys": list(self._memory.keys()),
            "steps": list(set(e.step for e in self._history if e.step))
        }
