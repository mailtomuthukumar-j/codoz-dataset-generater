"""
Planner Agent - Steps 3, 4, 7: Correlation Rules, Class Balance, Chunking Strategy

Defines constraints and distribution strategies.
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse
from core.agent_memory import AgentMemory
from core.domain_registry import get_domain_registry, CorrelationRule


logger = logging.getLogger(__name__)


class PlannerAgent(BaseAgent):
    """Agent for planning correlations, distributions, and output strategy."""
    
    name = "planner_agent"
    description = "Plans correlations, class balance, and chunking strategy"
    
    DEFAULT_BALANCE = {
        "binary": {"negative": 0.65, "positive": 0.35},
        "multiclass_3": {"A": 0.50, "B": 0.30, "C": 0.20},
        "multiclass_4": {"A": 0.40, "B": 0.30, "C": 0.20, "D": 0.10},
        "regression": {"type": "normal", "mean": 50, "std": 15}
    }
    
    def process_correlations(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Step 3: Generate correlation rules."""
        self.log("Planning correlation rules")
        
        try:
            domain = getattr(context, 'domain', 'other')
            schema = getattr(context, 'schema', [])
            
            registry = get_domain_registry()
            rules = registry.get_correlation_rules(domain)
            
            custom_rules = self._build_custom_rules(schema, domain)
            rules.extend(custom_rules)
            
            rule_strings = [self._rule_to_string(r) for r in rules]
            
            return self.create_success_response(data={
                "rules": rule_strings,
                "rule_count": len(rule_strings),
                "domain": domain
            })
            
        except Exception as e:
            logger.error(f"Correlation planning error: {e}")
            return self.create_error_response(f"Failed to plan correlations: {str(e)}")
    
    def process_class_balance(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Step 4: Define class distribution."""
        self.log("Planning class balance")
        
        try:
            balanced = getattr(context, 'balanced', False)
            task_type = getattr(context, 'task_type', 'classification')
            target_col = getattr(context, 'target_col', 'outcome')
            size = getattr(context, 'config').size if hasattr(context, 'config') else 500
            
            if task_type != "classification":
                return self.create_success_response(data={
                    "distribution": {},
                    "type": "regression",
                    "balanced": False
                })
            
            if balanced:
                distribution = self._create_balanced_distribution(context)
            else:
                distribution = self._get_default_distribution(context)
            
            counts = self._distribution_to_counts(distribution, size)
            
            return self.create_success_response(data={
                "distribution": distribution,
                "counts": counts,
                "balanced": balanced,
                "total_rows": size
            })
            
        except Exception as e:
            logger.error(f"Class balance planning error: {e}")
            return self.create_error_response(f"Failed to plan class balance: {str(e)}")
    
    def process_chunking(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Step 7: Determine chunking strategy."""
        self.log("Planning chunking strategy")
        
        try:
            size = getattr(context, 'config').size if hasattr(context, 'config') else 500
            
            if size <= 500:
                strategy = "single"
                chunks = 1
            elif size <= 5000:
                strategy = "chunked"
                chunks = (size + 499) // 500
            else:
                strategy = "chunked_indexed"
                chunks = (size + 499) // 500
            
            return self.create_success_response(data={
                "strategy": strategy,
                "total_chunks": chunks,
                "chunk_size": 500,
                "total_rows": size,
                "index_needed": strategy == "chunked_indexed"
            })
            
        except Exception as e:
            logger.error(f"Chunking planning error: {e}")
            return self.create_error_response(f"Failed to plan chunking: {str(e)}")
    
    def _build_custom_rules(
        self,
        schema: List[Dict[str, Any]],
        domain: str
    ) -> List[CorrelationRule]:
        """Build custom rules based on schema columns."""
        rules = []
        col_names = {col.get("name", ""): col for col in schema}
        
        if "gender" in col_names and "pregnancies" in col_names:
            rules.append(CorrelationRule(
                condition='gender != "female"',
                consequence="pregnancies = 0",
                threshold=1.0,
                description="Only females can have pregnancy count > 0"
            ))
        
        if "age" in col_names and "family_history" in col_names:
            rules.append(CorrelationRule(
                condition="age < 30",
                consequence='family_history = false',
                threshold=0.75,
                description="Young people less likely to have family history"
            ))
        
        return rules
    
    def _rule_to_string(self, rule: CorrelationRule) -> str:
        """Convert rule to string format."""
        return f"{rule.condition} → {rule.consequence} ({rule.threshold*100}% confidence)"
    
    def _create_balanced_distribution(self, context: Any) -> Dict[str, float]:
        """Create balanced class distribution."""
        schema = getattr(context, 'schema', [])
        
        target_col = getattr(context, 'target_col', 'outcome')
        
        target_def = next((c for c in schema if c.get("name") == target_col), None)
        
        if target_def and target_def.get("categorical_values"):
            values = target_def["categorical_values"]
            count = len(values)
            equal = 1.0 / count
            return {v: equal for v in values}
        
        return {"class_a": 0.50, "class_b": 0.50}
    
    def _get_default_distribution(self, context: Any) -> Dict[str, float]:
        """Get realistic default class distribution."""
        schema = getattr(context, 'schema', [])
        
        target_col = getattr(context, 'target_col', 'outcome')
        
        target_def = next((c for c in schema if c.get("name") == target_col), None)
        
        if target_def and target_def.get("categorical_values"):
            values = target_def["categorical_values"]
            count = len(values)
            
            if count == 2:
                return self.DEFAULT_BALANCE["binary"]
            elif count == 3:
                return self.DEFAULT_BALANCE["multiclass_3"]
            elif count >= 4:
                return self.DEFAULT_BALANCE["multiclass_4"]
        
        return self.DEFAULT_BALANCE["binary"]
    
    def _distribution_to_counts(
        self,
        distribution: Dict[str, float],
        total: int
    ) -> Dict[str, int]:
        """Convert percentage distribution to row counts."""
        counts = {}
        remaining = total
        
        sorted_items = sorted(distribution.items(), key=lambda x: x[1])
        
        for i, (cls, pct) in enumerate(sorted_items):
            if i == len(sorted_items) - 1:
                counts[cls] = remaining
            else:
                count = int(round(total * pct))
                counts[cls] = count
                remaining -= count
        
        return counts
