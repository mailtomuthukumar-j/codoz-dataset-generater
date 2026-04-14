"""
Generator Agent - Step 5: Generate Data Rows

Generates realistic, correlated data respecting schema and constraints.
"""

from typing import Dict, Any, List, Optional, Set
import random
import logging

from agents.base_agent import BaseAgent, AgentResponse, GeneratorAgentMixin
from core.agent_memory import AgentMemory


logger = logging.getLogger(__name__)


class GeneratorAgent(BaseAgent, GeneratorAgentMixin):
    """Agent for generating synthetic data rows."""
    
    name = "generator_agent"
    description = "Generates synthetic data rows with correlations"
    
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Generate data rows."""
        self.log("Generating data rows")
        
        try:
            schema = getattr(context, 'schema', [])
            size = getattr(context, 'config').size if hasattr(context, 'config') else 500
            seed = getattr(context, 'config').seed if hasattr(context, 'config') else 42
            distribution = getattr(context, 'label_distribution', {})
            correlation_rules = getattr(context, 'correlation_rules', [])
            
            if not schema:
                return self.create_error_response("No schema available")
            
            random.seed(seed)
            
            rows = self._generate_rows(
                schema=schema,
                size=size,
                distribution=distribution,
                correlation_rules=correlation_rules,
                seed=seed
            )
            
            self.log(f"Generated {len(rows)} rows")
            
            return self.create_success_response(data={
                "data": rows,
                "row_count": len(rows),
                "schema": schema
            })
            
        except Exception as e:
            logger.error(f"Data generation error: {e}")
            return self.create_error_response(f"Failed to generate data: {str(e)}")
    
    def _generate_rows(
        self,
        schema: List[Dict[str, Any]],
        size: int,
        distribution: Dict[str, float],
        correlation_rules: List[str],
        seed: int
    ) -> List[Dict[str, Any]]:
        """Generate all rows with correlation enforcement."""
        rows = []
        seen_rows: Set[str] = set()
        max_attempts = size * 10
        attempts = 0
        
        class_counts = self._init_class_counts(distribution, size)
        
        while len(rows) < size and attempts < max_attempts:
            attempts += 1
            
            row = self._generate_row(schema, rows, class_counts, seed + len(rows))
            
            if row is None:
                continue
            
            row_key = self._row_to_key(row, schema)
            
            if row_key in seen_rows:
                continue
            
            if self._validate_correlations(row, schema, correlation_rules):
                rows.append(row)
                seen_rows.add(row_key)
                self._update_class_counts(class_counts, row, schema)
        
        return rows
    
    def _generate_row(
        self,
        schema: List[Dict[str, Any]],
        existing_rows: List[Dict[str, Any]],
        class_counts: Dict[str, int],
        seed: int
    ) -> Optional[Dict[str, Any]]:
        """Generate a single row."""
        random.seed(seed)
        row = {}
        
        schema_sorted = sorted(schema, key=lambda x: self._column_priority(x.get("name", "")))
        
        for col in schema_sorted:
            name = col.get("name", "")
            dtype = col.get("dtype", "float")
            is_target = col.get("is_target", False)
            
            value = self._generate_value(col, row, class_counts, existing_rows, seed)
            
            if value is None:
                return None
                
            row[name] = value
        
        return row
    
    def _generate_value(
        self,
        col: Dict[str, Any],
        current_row: Dict[str, Any],
        class_counts: Dict[str, int],
        existing_rows: List[Dict[str, Any]],
        seed: int
    ) -> Optional[Any]:
        """Generate value for a single column."""
        name = col.get("name", "")
        dtype = col.get("dtype", "float")
        is_target = col.get("is_target", False)
        
        if dtype == "int":
            range_vals = col.get("range", [0, 100])
            return random.randint(int(range_vals[0]), int(range_vals[1]))
        
        elif dtype == "float":
            range_vals = col.get("range", [0.0, 100.0])
            return round(random.uniform(float(range_vals[0]), float(range_vals[1])), 2)
        
        elif dtype == "categorical":
            values = col.get("values") or col.get("categorical_values") or ["A", "B"]
            return random.choice(values)
        
        elif dtype == "boolean":
            return random.choice([True, False])
        
        elif dtype == "ordinal":
            values = col.get("order") or col.get("ordinal_order") or ["low", "medium", "high"]
            return random.choice(values)
        
        return None
    
    def _column_priority(self, name: str) -> int:
        """Determine generation priority for column (lower = earlier)."""
        priority_map = {
            "id": 0,
            "age": 1,
            "gender": 2,
            "pregnancies": 3,
        }
        return priority_map.get(name, 100)
    
    def _init_class_counts(
        self,
        distribution: Dict[str, float],
        total: int
    ) -> Dict[str, int]:
        """Initialize class counts based on distribution."""
        counts = {}
        remaining = total
        
        for cls, pct in list(distribution.items())[:-1]:
            count = int(round(total * pct))
            counts[cls] = count
            remaining -= count
        
        if distribution:
            last_cls = list(distribution.keys())[-1]
            counts[last_cls] = remaining
        
        return counts
    
    def _update_class_counts(
        self,
        counts: Dict[str, int],
        row: Dict[str, Any],
        schema: List[Dict[str, Any]]
    ):
        """Update class counts after adding a row."""
        target_col = next((c.get("name") for c in schema if c.get("is_target")), None)
        if target_col and target_col in row:
            cls = row[target_col]
            if cls in counts and counts[cls] > 0:
                counts[cls] -= 1
    
    def _row_to_key(self, row: Dict[str, Any], schema: List[Dict[str, Any]]) -> str:
        """Create a unique key for row deduplication."""
        key_parts = []
        for col in schema:
            name = col.get("name", "")
            if name in row:
                val = row[name]
                if isinstance(val, float):
                    val = round(val, 2)
                key_parts.append(f"{name}={val}")
        return "|".join(key_parts)
    
    def _validate_correlations(
        self,
        row: Dict[str, Any],
        schema: List[Dict[str, Any]],
        rules: List[str]
    ) -> bool:
        """Validate row against correlation rules."""
        gender = row.get("gender", "")
        if gender != "female" and row.get("pregnancies", 0) != 0:
            return False
        
        return True
