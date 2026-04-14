"""
Cleaner Agent - Step 5b: Post-Generation Data Cleaning

Validates and cleans generated data.
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse


logger = logging.getLogger(__name__)


class CleanerAgent(BaseAgent):
    """Agent for cleaning and validating generated data."""
    
    name = "cleaner_agent"
    description = "Cleans and validates generated data rows"
    
    def process(
        self,
        data: List[Dict[str, Any]],
        context: Any,
        memory: AgentMemory
    ) -> AgentResponse:
        """Clean and validate generated data."""
        self.log(f"Cleaning {len(data)} rows")
        
        warnings = []
        cleaned = []
        rejected = 0
        
        schema = getattr(context, 'schema', [])
        target_col = getattr(context, 'target_col', 'outcome')
        
        for row in data:
            is_valid, row_warnings = self._validate_row(row, schema, target_col)
            
            if is_valid:
                cleaned_row = self._clean_row(row, schema)
                cleaned.append(cleaned_row)
            else:
                rejected += 1
                warnings.extend(row_warnings)
        
        if rejected > 0:
            warnings.append(f"Rejected {rejected} invalid rows")
        
        self.log(f"Cleaned: {len(cleaned)} valid, {rejected} rejected")
        
        return self.create_success_response(data={
            "cleaned_data": cleaned,
            "original_count": len(data),
            "cleaned_count": len(cleaned),
            "rejected_count": rejected
        }, warnings=warnings)
    
    def _validate_row(
        self,
        row: Dict[str, Any],
        schema: List[Dict[str, Any]],
        target_col: str
    ) -> tuple[bool, List[str]]:
        """Validate a single row."""
        warnings = []
        
        if not row:
            return False, ["Empty row"]
        
        for col in schema:
            name = col.get("name", "")
            dtype = col.get("dtype", "float")
            value = row.get(name)
            
            if value is None:
                return False, [f"Missing value for {name}"]
            
            if not self._validate_dtype(value, dtype):
                return False, [f"Invalid dtype for {name}: expected {dtype}"]
            
            if dtype in ("int", "float"):
                range_vals = col.get("range", [])
                if range_vals:
                    min_val = range_vals[0]
                    max_val = range_vals[-1]
                    if isinstance(value, (int, float)):
                        if value < min_val or value > max_val:
                            return False, [f"Value out of range for {name}: {value} not in [{min_val}, {max_val}]"]
            
            if dtype == "categorical":
                values = col.get("values") or col.get("categorical_values") or []
                if values and value not in values:
                    return False, [f"Invalid categorical value for {name}: {value}"]
        
        if target_col not in row:
            return False, [f"Missing target column: {target_col}"]
        
        return True, warnings
    
    def _validate_dtype(self, value: Any, dtype: str) -> bool:
        """Validate value matches expected dtype."""
        if dtype == "int":
            return isinstance(value, int) and not isinstance(value, bool)
        elif dtype == "float":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        elif dtype == "boolean":
            return isinstance(value, bool)
        elif dtype == "categorical":
            return isinstance(value, str)
        elif dtype == "ordinal":
            return isinstance(value, str)
        return True
    
    def _clean_row(
        self,
        row: Dict[str, Any],
        schema: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Clean and normalize a row."""
        cleaned = {}
        
        for col in schema:
            name = col.get("name", "")
            dtype = col.get("dtype", "float")
            value = row.get(name)
            
            if dtype == "float" and isinstance(value, float):
                value = round(value, 2)
            
            cleaned[name] = value
        
        return cleaned
    
    def remove_duplicates(
        self,
        data: List[Dict[str, Any]],
        schema: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, Any]], int]:
        """Remove duplicate rows."""
        seen = set()
        unique = []
        duplicates = 0
        
        for row in data:
            row_key = self._row_key(row, schema)
            if row_key not in seen:
                seen.add(row_key)
                unique.append(row)
            else:
                duplicates += 1
        
        return unique, duplicates
    
    def _row_key(self, row: Dict[str, Any], schema: List[Dict[str, Any]]) -> str:
        """Generate unique key for row."""
        parts = []
        for col in schema:
            name = col.get("name", "")
            if name in row:
                val = row[name]
                if isinstance(val, float):
                    val = round(val, 2)
                parts.append(str(val))
        return "|".join(parts)
