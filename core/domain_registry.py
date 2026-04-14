"""
Domain Registry - Central Knowledge Base for Column Schemas and Constraints

Provides domain-specific column definitions and correlation rules.
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
import json
import logging

from prompts.domain_hints import (
    DOMAIN_HINTS,
    get_domain_hints,
    get_columns_for_domain,
    get_constraints_for_domain,
    infer_domain_from_topic,
    ColumnDefinition,
    DomainConstraints
)


logger = logging.getLogger(__name__)


@dataclass
class ColumnSchema:
    name: str
    dtype: str
    range_min: Any
    range_max: Any
    categorical_values: Optional[List[str]] = None
    ordinal_order: Optional[List[str]] = None
    is_target: bool = False
    nullable: bool = False
    description: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "name": self.name,
            "dtype": self.dtype,
            "is_target": self.is_target,
            "nullable": self.nullable
        }
        
        if self.dtype in ("int", "float"):
            result["range"] = [self.range_min, self.range_max]
        elif self.categorical_values:
            result["values"] = self.categorical_values
        elif self.ordinal_order:
            result["order"] = self.ordinal_order
        
        if self.description:
            result["description"] = self.description
            
        return result
    
    @classmethod
    def from_column_def(cls, col_def: ColumnDefinition) -> "ColumnSchema":
        """Create ColumnSchema from ColumnDefinition."""
        range_min = col_def.range[0] if col_def.range else None
        range_max = col_def.range[-1] if col_def.range else None
        
        return cls(
            name=col_def.name,
            dtype=col_def.dtype,
            range_min=range_min,
            range_max=range_max,
            categorical_values=col_def.range if col_def.dtype == "categorical" else None,
            ordinal_order=col_def.range if col_def.dtype == "ordinal" else None,
            is_target=col_def.is_target
        )


@dataclass
class CorrelationRule:
    condition: str
    consequence: str
    threshold: float = 0.70
    description: Optional[str] = None
    
    def evaluate(self, row: Dict[str, Any]) -> bool:
        """Evaluate if the correlation rule applies to a row."""
        return self._evaluate_condition(row)
    
    def _evaluate_condition(self, row: Dict[str, Any]) -> bool:
        """Parse and evaluate the condition part of the rule."""
        try:
            condition = self.condition
            
            condition = condition.replace("AND", "and").replace("OR", "or")
            
            for col, value in row.items():
                if isinstance(value, str):
                    condition = condition.replace(col, f'"{value}"')
                else:
                    condition = condition.replace(col, str(value))
            
            return eval(condition)
        except Exception as e:
            logger.warning(f"Failed to evaluate condition '{self.condition}': {e}")
            return False


@dataclass 
class LabelDistribution:
    classes: Dict[str, float]
    balanced: bool = False
    
    def get_counts(self, total: int) -> Dict[str, int]:
        """Convert percentage distribution to counts."""
        counts = {}
        for cls, pct in self.classes.items():
            counts[cls] = int(round(total * pct))
        
        remaining = total - sum(counts.values())
        if remaining != 0:
            main_class = max(self.classes, key=self.classes.get)
            counts[main_class] += remaining
            
        return counts


class DomainRegistry:
    """Central registry for domain knowledge."""
    
    def __init__(self):
        self._domains: Dict[str, Dict[str, Any]] = {}
        self._custom_schemas: Dict[str, List[ColumnSchema]] = {}
        self._custom_constraints: Dict[str, List[CorrelationRule]] = {}
        
        self._load_default_domains()
    
    def _load_default_domains(self):
        """Load default domain hints."""
        for domain_name, hints in DOMAIN_HINTS.items():
            self._domains[domain_name] = hints
    
    def get_schema(self, domain: str) -> List[ColumnSchema]:
        """Get column schema for a domain."""
        if domain in self._custom_schemas:
            return self._custom_schemas[domain]
        
        col_defs = get_columns_for_domain(domain)
        return [ColumnSchema.from_column_def(cd) for cd in col_defs]
    
    def get_constraints(self, domain: str) -> DomainConstraints:
        """Get constraints for a domain."""
        return get_constraints_for_domain(domain)
    
    def get_correlation_rules(self, domain: str) -> List[CorrelationRule]:
        """Get correlation rules for a domain."""
        if domain in self._custom_constraints:
            return self._custom_constraints[domain]
        
        constraints = get_constraints_for_domain(domain)
        rules = []
        
        for rule_str in constraints.correlation_rules:
            if "→" in rule_str:
                condition, consequence = rule_str.split("→")
                rule = CorrelationRule(
                    condition=condition.strip(),
                    consequence=consequence.strip()
                )
                rules.append(rule)
        
        return rules
    
    def get_label_distribution(
        self, 
        domain: str, 
        task_type: str,
        balanced: bool = False
    ) -> LabelDistribution:
        """Get label distribution for a domain."""
        constraints = get_constraints_for_domain(domain)
        
        if balanced:
            classes = {k: 1.0/len(v) for k, v in constraints.label_distribution.items()}
            return LabelDistribution(classes=classes, balanced=True)
        
        return LabelDistribution(
            classes=constraints.label_distribution,
            balanced=False
        )
    
    def infer_domain(self, topic: str) -> str:
        """Infer domain from topic string."""
        return infer_domain_from_topic(topic)
    
    def register_schema(self, domain: str, schema: List[ColumnSchema]):
        """Register a custom schema for a domain."""
        self._custom_schemas[domain] = schema
    
    def register_constraints(self, domain: str, constraints: List[CorrelationRule]):
        """Register custom correlation constraints."""
        self._custom_constraints[domain] = constraints
    
    def validate_schema(self, schema: List[Dict[str, Any]]) -> List[str]:
        """Validate a schema definition. Returns list of errors."""
        errors = []
        
        if len(schema) < 8:
            errors.append(f"Schema has {len(schema)} columns, expected 8-20")
        if len(schema) > 20:
            errors.append(f"Schema has {len(schema)} columns, expected 8-20")
        
        target_cols = [col for col in schema if col.get("is_target", False)]
        if len(target_cols) == 0:
            errors.append("Schema has no target column")
        elif len(target_cols) > 1:
            errors.append(f"Schema has {len(target_cols)} target columns, expected 1")
        
        for col in schema:
            name = col.get("name", "")
            dtype = col.get("dtype", "")
            
            if not name:
                errors.append("Column missing name")
            
            if dtype not in ("int", "float", "categorical", "boolean", "ordinal"):
                errors.append(f"Invalid dtype '{dtype}' for column '{name}'")
        
        return errors
    
    def export_schema_json(self, schema: List[ColumnSchema], filepath: str):
        """Export schema to JSON file."""
        schema_dict = [col.to_dict() for col in schema]
        with open(filepath, 'w') as f:
            json.dump(schema_dict, f, indent=2)
    
    def import_schema_json(self, filepath: str) -> List[ColumnSchema]:
        """Import schema from JSON file."""
        with open(filepath, 'r') as f:
            schema_dict = json.load(f)
        
        schemas = []
        for col in schema_dict:
            range_vals = col.pop("range", None)
            values = col.pop("values", None)
            order = col.pop("order", None)
            
            if range_vals:
                col["range_min"] = range_vals[0]
                col["range_max"] = range_vals[1]
            if values:
                col["categorical_values"] = values
            if order:
                col["ordinal_order"] = order
            
            schemas.append(ColumnSchema(**col))
        
        return schemas


_domain_registry_instance: Optional[DomainRegistry] = None


def get_domain_registry() -> DomainRegistry:
    """Get the singleton domain registry instance."""
    global _domain_registry_instance
    if _domain_registry_instance is None:
        _domain_registry_instance = DomainRegistry()
    return _domain_registry_instance
