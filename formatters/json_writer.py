"""
JSON Writer - Format data as JSON array.
"""

import json
from typing import Dict, Any, List


class JsonWriter:
    """Writes data as a JSON array."""
    
    def write(self, data: List[Dict[str, Any]], include_header: bool = True) -> str:
        """
        Write data as JSON array.
        
        Args:
            data: List of data rows
            include_header: Ignored for JSON (kept for interface consistency)
            
        Returns:
            JSON string
        """
        if not data:
            return "[]"
        
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    def write_compact(self, data: List[Dict[str, Any]]) -> str:
        """
        Write data as compact JSON (no indentation).
        
        Args:
            data: List of data rows
            
        Returns:
            Compact JSON string
        """
        if not data:
            return "[]"
        
        return json.dumps(data, separators=(',', ':'), ensure_ascii=False)
    
    def validate(self, content: str) -> bool:
        """
        Validate JSON content.
        
        Args:
            content: JSON string to validate
            
        Returns:
            True if valid JSON array
        """
        try:
            parsed = json.loads(content)
            return isinstance(parsed, list)
        except json.JSONDecodeError:
            return False
