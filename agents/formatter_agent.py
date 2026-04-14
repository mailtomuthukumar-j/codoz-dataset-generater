"""
Formatter Agent - Step 6: Format Output

Formats data according to specified format (JSON, CSV, JSONL).
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse
from core.agent_memory import AgentMemory
from formatters.json_writer import JsonWriter
from formatters.csv_writer import CsvWriter
from formatters.jsonl_writer import JsonlWriter


logger = logging.getLogger(__name__)


class FormatterAgent(BaseAgent):
    """Agent for formatting data output."""
    
    name = "formatter_agent"
    description = "Formats data to JSON, CSV, or JSONL"
    
    FORMATTERS = {
        "json": JsonWriter,
        "csv": CsvWriter,
        "jsonl": JsonlWriter
    }
    
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Format data according to specified format."""
        self.log("Formatting data output")
        
        try:
            data = getattr(context, 'generated_data', [])
            format_type = getattr(context, 'config').format if hasattr(context, 'config') else 'json'
            
            if not data:
                return self.create_error_response("No data to format")
            
            formatter_class = self.FORMATTERS.get(format_type, JsonWriter)
            formatter = formatter_class()
            
            content = formatter.write(data, include_header=True)
            
            validation_result = self._validate_format(content, format_type)
            if not validation_result[0]:
                return self.create_error_response(f"Format validation failed: {validation_result[1]}")
            
            self.log(f"Data formatted as {format_type}: {len(content)} chars")
            
            return self.create_success_response(data={
                "content": content,
                "format": format_type,
                "size_bytes": len(content.encode('utf-8')),
                "row_count": len(data)
            })
            
        except Exception as e:
            logger.error(f"Formatting error: {e}")
            return self.create_error_response(f"Failed to format data: {str(e)}")
    
    def _validate_format(self, content: str, format_type: str) -> tuple[bool, Optional[str]]:
        """Validate formatted content."""
        import json
        
        if not content.strip():
            return False, "Empty content"
        
        if format_type == "json":
            try:
                parsed = json.loads(content)
                if not isinstance(parsed, list):
                    return False, "JSON must be an array"
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
                return False, "CSV must have header and data"
            return True, None
        
        return True, None
