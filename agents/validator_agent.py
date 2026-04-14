"""
Validator Agent - Step 9: Quality Gate

Validates dataset quality before output.
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse


logger = logging.getLogger(__name__)


class ValidatorAgent(BaseAgent):
    """Agent for validating dataset quality."""
    
    name = "validator_agent"
    description = "Validates dataset quality through quality gate"
    
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Run quality gate validation."""
        self.log("Running quality gate validation")
        
        errors = []
        warnings = []
        
        schema = getattr(context, 'schema', [])
        data = getattr(context, 'generated_data', [])
        domain = getattr(context, 'domain', '')
        target_col = getattr(context, 'target_col', '')
        
        schema_errors = self._validate_schema(schema)
        errors.extend(schema_errors)
        
        data_errors = self._validate_data(data, schema, target_col)
        errors.extend(data_errors)
        
        data_warnings = self._check_data_quality(data, schema)
        warnings.extend(data_warnings)
        
        valid = len(errors) == 0
        
        if valid:
            self.log("Validation passed")
        else:
            self.log(f"Validation failed: {len(errors)} errors")
        
        return self.create_response(
            success=True,
            data={
                "valid": valid,
                "errors": errors,
                "warnings": warnings,
                "checks_passed": 8 - len(errors) if errors else 8
            },
            error=None if valid else "; ".join(errors),
            warnings=warnings
        )
    
    def _validate_schema(self, schema: List[Dict[str, Any]]) -> List[str]:
        """Validate schema structure."""
        errors = []
        
        if len(schema) < 8:
            errors.append(f"Schema too small: {len(schema)} columns (minimum 8)")
        
        if len(schema) > 20:
            errors.append(f"Schema too large: {len(schema)} columns (maximum 20)")
        
        target_cols = [col for col in schema if col.get("is_target")]
        if not target_cols:
            errors.append("No target column defined")
        elif len(target_cols) > 1:
            errors.append(f"Multiple target columns: {[c['name'] for c in target_cols]}")
        
        for col in schema:
            name = col.get("name", "")
            dtype = col.get("dtype", "")
            
            if not name:
                errors.append("Column missing name")
            
            if dtype not in ("int", "float", "categorical", "boolean", "ordinal"):
                errors.append(f"Invalid dtype '{dtype}' for column '{name}'")
        
        return errors
    
    def _validate_data(
        self,
        data: List[Dict[str, Any]],
        schema: List[Dict[str, Any]],
        target_col: str
    ) -> List[str]:
        """Validate data rows."""
        errors = []
        
        if not data:
            errors.append("No data generated")
            return errors
        
        col_names = {col["name"] for col in schema}
        
        for i, row in enumerate(data[:10]):
            for name in col_names:
                if name not in row:
                    errors.append(f"Row {i}: missing column '{name}'")
        
        return errors
    
    def _check_data_quality(
        self,
        data: List[Dict[str, Any]],
        schema: List[Dict[str, Any]]
    ) -> List[str]:
        """Check data quality metrics."""
        warnings = []
        
        if not data:
            return warnings
        
        if len(data) < 100:
            warnings.append(f"Small dataset: only {len(data)} rows")
        
        target_col = next((c["name"] for c in schema if c.get("is_target")), None)
        if target_col:
            target_values = [row.get(target_col) for row in data]
            unique_values = set(target_values)
            
            if len(unique_values) == 1:
                warnings.append(f"Only one unique target value: {unique_values}")
        
        return warnings
    
    def validate_output_format(
        self,
        content: str,
        format_type: str
    ) -> tuple[bool, Optional[str]]:
        """Validate output format is correct."""
        import json
        
        if format_type == "json":
            try:
                json.loads(content)
                return True, None
            except json.JSONDecodeError as e:
                return False, f"Invalid JSON: {e}"
        
        elif format_type == "jsonl":
            lines = content.strip().split("\n")
            for i, line in enumerate(lines):
                if line.strip():
                    try:
                        json.loads(line)
                    except json.JSONDecodeError as e:
                        return False, f"Invalid JSONL at line {i+1}: {e}"
            return True, None
        
        elif format_type == "csv":
            lines = content.strip().split("\n")
            if len(lines) < 2:
                return False, "CSV must have header and at least one data row"
            return True, None
        
        return False, f"Unknown format: {format_type}"
