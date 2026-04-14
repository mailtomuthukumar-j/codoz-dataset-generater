"""
Intent Analyzer Agent - Step 1: Parse User Intent

Extracts domain, subdomain, task type, target column, and other parameters.
"""

from typing import Dict, Any, Optional
import re
import logging

from agents.base_agent import BaseAgent, AgentResponse, GeneratorAgentMixin
from core.agent_memory import AgentMemory
from prompts.domain_hints import infer_domain_from_topic


logger = logging.getLogger(__name__)


class IntentAnalyzerAgent(BaseAgent, GeneratorAgentMixin):
    """Agent for parsing and analyzing user intent."""
    
    name = "intent_analyzer_agent"
    description = "Parses user requests to extract domain, task type, and parameters"
    
    TASK_KEYWORDS = {
        "classification": ["classify", "classification", "predict", "diagnosis", "detect", "fraud", "churn", "risk"],
        "regression": ["price", "amount", "score", "value", "cost", "regression", "estimate"],
        "clustering": ["cluster", "segment", "group", "similarity"],
        "anomaly_detection": ["anomaly", "outlier", "unusual", "fraud"],
        "ranking": ["rank", "order", "priority"]
    }
    
    TARGET_PATTERNS = {
        "medical": {
            "default": "outcome",
            "patterns": [
                (r"diabetes", "outcome"),
                (r"heart|cardiac", "diagnosis"),
                (r"cancer|tumor", "malignant"),
                (r"patient|medical", "diagnosis"),
            ]
        },
        "financial": {
            "default": "default_risk",
            "patterns": [
                (r"loan|credit", "default_risk"),
                (r"fraud", "fraud_flag"),
                (r"churn|customer", "churn_risk"),
                (r"transaction|payment", "transaction_type"),
            ]
        },
        "education": {
            "default": "gpa",
            "patterns": [
                (r"student|grade|gpa", "gpa"),
                (r"performance", "performance"),
                (r"exam|test|score", "final_score"),
            ]
        },
        "retail": {
            "default": "purchase_flag",
            "patterns": [
                (r"customer|churn", "churn_risk"),
                (r"sales|revenue", "revenue"),
                (r"purchase|order", "purchase_amount"),
            ]
        },
        "environmental": {
            "default": "health_risk",
            "patterns": [
                (r"pollution|air", "health_risk"),
                (r"climate|weather", "temperature"),
                (r"emission", "emission_level"),
            ]
        },
        "social": {
            "default": "influence_score",
            "patterns": [
                (r"social|influencer|engagement", "influence_score"),
                (r"twitter|facebook|instagram", "engagement_rate"),
            ]
        }
    }
    
    def process(self, config: Any, memory: AgentMemory) -> AgentResponse:
        """Process user intent and extract parameters."""
        self.log("Analyzing user intent")
        
        try:
            topic = getattr(config, 'topic', '') or ''
            size = getattr(config, 'size', 500)
            format_type = getattr(config, 'format', 'json')
            seed = getattr(config, 'seed', 42)
            balanced = getattr(config, 'balanced', False)
            domain_override = getattr(config, 'domain', None)
            
            domain = domain_override or self._infer_domain(topic)
            subdomain = self._extract_subdomain(topic)
            task_type = self._infer_task_type(topic)
            target_col = self._infer_target_column(topic, domain)
            
            result = {
                "domain": domain,
                "subdomain": subdomain,
                "task_type": task_type,
                "target_col": target_col,
                "size": size,
                "format": format_type,
                "seed": seed,
                "balanced": balanced,
                "topic": topic
            }
            
            self.log(f"Intent parsed: domain={domain}, task={task_type}, target={target_col}")
            
            return self.create_success_response(data=result)
            
        except Exception as e:
            logger.error(f"Intent parsing error: {e}")
            return self.create_error_response(f"Failed to parse intent: {str(e)}")
    
    def _infer_domain(self, topic: str) -> str:
        """Infer domain from topic string."""
        if not topic:
            return "other"
        return infer_domain_from_topic(topic)
    
    def _extract_subdomain(self, topic: str) -> str:
        """Extract subdomain from topic."""
        if not topic:
            return "general"
        
        words = re.findall(r'\b\w+\b', topic.lower())
        
        stopwords = {'dataset', 'data', 'generate', 'prediction', 'prediction', 'detection', 'analysis', 'for', 'the'}
        filtered = [w for w in words if w not in stopwords]
        
        if filtered:
            return '_'.join(filtered[:2])
        return topic.replace(' ', '_')[:30]
    
    def _infer_task_type(self, topic: str) -> str:
        """Infer task type from topic keywords."""
        topic_lower = topic.lower()
        
        for task, keywords in self.TASK_KEYWORDS.items():
            if any(kw in topic_lower for kw in keywords):
                return task
        
        if any(word in topic_lower for word in ["predict", "detect", "classify", "risk"]):
            return "classification"
        
        return "classification"
    
    def _infer_target_column(self, topic: str, domain: str) -> str:
        """Infer target column from topic and domain."""
        topic_lower = topic.lower()
        
        domain_targets = self.TARGET_PATTERNS.get(domain, {"default": "target", "patterns": []})
        
        for pattern, target in domain_targets.get("patterns", []):
            if re.search(pattern, topic_lower):
                return target
        
        return domain_targets.get("default", "target")
