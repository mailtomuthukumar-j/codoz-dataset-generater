"""
Schema Agent - Step 2: Dynamic Schema Generation

Generates column schemas based on domain knowledge.
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse
from core.agent_memory import AgentMemory
from core.domain_registry import get_domain_registry, ColumnSchema


logger = logging.getLogger(__name__)


class SchemaAgent(BaseAgent):
    """Agent for generating dynamic schemas based on domain."""
    
    name = "schema_agent"
    description = "Generates column schemas with domain-specific features"
    
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Generate schema based on domain from context."""
        self.log("Generating dynamic schema")
        
        try:
            domain = getattr(context, 'domain', 'other')
            subdomain = getattr(context, 'subdomain', '')
            task_type = getattr(context, 'task_type', 'classification')
            target_col = getattr(context, 'target_col', 'outcome')
            
            registry = get_domain_registry()
            
            schema = self._build_schema(
                domain=domain,
                subdomain=subdomain,
                task_type=task_type,
                target_col=target_col,
                registry=registry
            )
            
            schema_dict = [col.to_dict() for col in schema]
            
            self.log(f"Generated schema with {len(schema)} columns")
            
            return self.create_success_response(data={
                "schema": schema_dict,
                "domain": domain,
                "target_col": target_col,
                "column_count": len(schema)
            })
            
        except Exception as e:
            logger.error(f"Schema generation error: {e}")
            return self.create_error_response(f"Failed to generate schema: {str(e)}")
    
    def _build_schema(
        self,
        domain: str,
        subdomain: str,
        task_type: str,
        target_col: str,
        registry: Any
    ) -> List[ColumnSchema]:
        """Build complete schema for the domain."""
        schema = registry.get_schema(domain)
        
        if not schema:
            schema = self._create_generic_schema(target_col)
        
        schema = self._ensure_target_column(schema, target_col, task_type)
        
        schema = self._add_derived_columns(schema, domain)
        
        return schema
    
    def _create_generic_schema(self, target_col: str) -> List[ColumnSchema]:
        """Create a generic fallback schema."""
        return [
            ColumnSchema(name="id", dtype="int", range_min=1, range_max=10000),
            ColumnSchema(name="feature_1", dtype="float", range_min=0.0, range_max=100.0),
            ColumnSchema(name="feature_2", dtype="float", range_min=0.0, range_max=100.0),
            ColumnSchema(name="feature_3", dtype="categorical", range_min=0, range_max=0,
                       categorical_values=["A", "B", "C", "D"]),
            ColumnSchema(name="category", dtype="categorical", range_min=0, range_max=0,
                       categorical_values=["low", "medium", "high"]),
            ColumnSchema(name=target_col, dtype="categorical", range_min=0, range_max=0,
                        categorical_values=["negative", "positive"], is_target=True),
        ]
    
    def _ensure_target_column(
        self,
        schema: List[ColumnSchema],
        target_col: str,
        task_type: str
    ) -> List[ColumnSchema]:
        """Ensure schema has exactly one target column."""
        target_exists = any(col.name == target_col for col in schema)
        
        if not target_exists:
            target_schema = self._create_target_column(target_col, task_type)
            schema.append(target_schema)
        
        for col in schema:
            col.is_target = (col.name == target_col)
        
        return schema
    
    def _create_target_column(self, name: str, task_type: str) -> ColumnSchema:
        """Create appropriate target column based on task type."""
        if task_type == "regression":
            return ColumnSchema(
                name=name,
                dtype="float",
                range_min=0.0,
                range_max=100.0,
                is_target=True
            )
        elif task_type == "classification":
            return ColumnSchema(
                name=name,
                dtype="categorical",
                range_min=0,
                range_max=0,
                categorical_values=["negative", "positive"],
                is_target=True
            )
        else:
            return ColumnSchema(
                name=name,
                dtype="int",
                range_min=0,
                range_max=10,
                is_target=True
            )
    
    def _add_derived_columns(
        self,
        schema: List[ColumnSchema],
        domain: str
    ) -> List[ColumnSchema]:
        """Add domain-specific derived columns."""
        col_names = {col.name for col in schema}
        
        if domain == "diabetes" or "diabetes" in str(schema).lower():
            if "bmi" not in col_names and "weight" in col_names and "height" in col_names:
                schema.append(ColumnSchema(
                    name="bmi",
                    dtype="float",
                    range_min=15.0,
                    range_max=50.0
                ))
        
        if "id" not in col_names:
            schema.insert(0, ColumnSchema(
                name="id",
                dtype="int",
                range_min=1,
                range_max=100000
            ))
        
        return schema
    
    def validate_schema(self, schema: List[Dict[str, Any]]) -> List[str]:
        """Validate schema structure."""
        errors = []
        
        if len(schema) < 4:
            errors.append(f"Schema too small: {len(schema)} columns (minimum 4)")
        
        if len(schema) > 30:
            errors.append(f"Schema too large: {len(schema)} columns (maximum 30)")
        
        target_cols = [col for col in schema if col.get("is_target")]
        if not target_cols:
            errors.append("No target column defined")
        elif len(target_cols) > 1:
            errors.append(f"Multiple target columns: {[c['name'] for c in target_cols]}")
        
        return errors
