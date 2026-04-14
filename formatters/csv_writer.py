"""
CSV Writer - Format data as CSV with header row.
"""

import csv
import io
from typing import Dict, Any, List, Optional


class CsvWriter:
    """Writes data as CSV with header row."""
    
    def write(self, data: List[Dict[str, Any]], include_header: bool = True) -> str:
        """
        Write data as CSV.
        
        Args:
            data: List of data rows
            include_header: Whether to include header row (default True)
            
        Returns:
            CSV string
        """
        if not data:
            return ""
        
        output = io.StringIO()
        fieldnames = list(data[0].keys())
        
        writer = csv.DictWriter(
            output,
            fieldnames=fieldnames,
            quoting=csv.QUOTE_MINIMAL,
            extrasaction='ignore'
        )
        
        if include_header:
            writer.writeheader()
        
        for row in data:
            writer.writerow(row)
        
        return output.getvalue()
    
    def write_with_custom_headers(
        self,
        data: List[Dict[str, Any]],
        headers: List[str],
        include_header: bool = True
    ) -> str:
        """
        Write data with custom column order.
        
        Args:
            data: List of data rows
            headers: Custom header order
            include_header: Whether to include header row
            
        Returns:
            CSV string
        """
        if not data:
            return ""
        
        output = io.StringIO()
        
        writer = csv.DictWriter(
            output,
            fieldnames=headers,
            quoting=csv.QUOTE_MINIMAL,
            extrasaction='ignore'
        )
        
        if include_header:
            writer.writeheader()
        
        for row in data:
            writer.writerow(row)
        
        return output.getvalue()
    
    def validate(self, content: str) -> bool:
        """
        Validate CSV content.
        
        Args:
            content: CSV string to validate
            
        Returns:
            True if valid CSV with header and data
        """
        try:
            lines = content.strip().split('\n')
            if len(lines) < 2:
                return False
            
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
            return len(rows) > 0
        except Exception:
            return False
    
    def get_row_count(self, content: str) -> int:
        """
        Get number of data rows in CSV (excluding header).
        
        Args:
            content: CSV string
            
        Returns:
            Number of data rows
        """
        lines = content.strip().split('\n')
        return max(0, len(lines) - 1)
