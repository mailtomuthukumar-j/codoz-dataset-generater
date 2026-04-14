"""
JSONL Writer - Format data as JSON Lines (one JSON object per line).
"""

import json
from typing import Dict, Any, List


class JsonlWriter:
    """Writes data as JSON Lines (one JSON object per line)."""
    
    def write(self, data: List[Dict[str, Any]], include_header: bool = False) -> str:
        """
        Write data as JSON Lines.
        
        Args:
            data: List of data rows
            include_header: Ignored for JSONL (kept for interface consistency)
            
        Returns:
            JSONL string (one JSON object per line)
        """
        if not data:
            return ""
        
        lines = []
        for row in data:
            json_line = json.dumps(row, ensure_ascii=False)
            lines.append(json_line)
        
        return '\n'.join(lines)
    
    def write_compact(self, data: List[Dict[str, Any]]) -> str:
        """
        Write data as compact JSONL (no extra whitespace in objects).
        
        Args:
            data: List of data rows
            
        Returns:
            Compact JSONL string
        """
        if not data:
            return ""
        
        lines = []
        for row in data:
            json_line = json.dumps(row, separators=(',', ':'), ensure_ascii=False)
            lines.append(json_line)
        
        return '\n'.join(lines)
    
    def validate(self, content: str) -> bool:
        """
        Validate JSONL content.
        
        Args:
            content: JSONL string to validate
            
        Returns:
            True if valid JSONL
        """
        try:
            lines = content.strip().split('\n')
            if not lines:
                return False
            
            for line in lines:
                if line.strip():
                    json.loads(line)
            
            return True
        except json.JSONDecodeError:
            return False
    
    def get_row_count(self, content: str) -> int:
        """
        Get number of rows in JSONL content.
        
        Args:
            content: JSONL string
            
        Returns:
            Number of rows
        """
        lines = content.strip().split('\n')
        return sum(1 for line in lines if line.strip())
    
    def read(self, content: str) -> List[Dict[str, Any]]:
        """
        Read JSONL content into list of dictionaries.
        
        Args:
            content: JSONL string
            
        Returns:
            List of data rows
        """
        if not content.strip():
            return []
        
        rows = []
        for line in content.strip().split('\n'):
            if line.strip():
                rows.append(json.loads(line))
        
        return rows
