"""
Base Agent - Abstract base class for all CODOZ agents.

Provides common functionality for agent implementations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
import logging

from core.agent_memory import AgentMemory


logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    warnings: list = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "warnings": self.warnings
        }


class BaseAgent(ABC):
    """Abstract base class for all pipeline agents."""
    
    name: str = "base_agent"
    description: str = "Base agent"
    version: str = "1.0.0"
    
    def __init__(self):
        self.logger = logging.getLogger(self.name)
    
    @abstractmethod
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """
        Process the input and return a response.
        
        Args:
            context: Pipeline context or configuration
            memory: Shared agent memory
            
        Returns:
            AgentResponse with results or error
        """
        pass
    
    def validate_input(self, context: Any) -> Optional[str]:
        """
        Validate input before processing.
        
        Returns:
            Error message if validation fails, None otherwise
        """
        return None
    
    def log(self, message: str, level: str = "info"):
        """Log a message with the agent's logger."""
        log_level = getattr(logging, level.upper(), logging.INFO)
        self.logger.log(log_level, f"[{self.name}] {message}")
    
    def create_response(
        self,
        success: bool = True,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        warnings: Optional[list] = None
    ) -> AgentResponse:
        """Create a standardized agent response."""
        return AgentResponse(
            success=success,
            data=data,
            error=error,
            warnings=warnings or []
        )
    
    def create_error_response(self, error: str) -> AgentResponse:
        """Create an error response."""
        return self.create_response(
            success=False,
            error=error
        )
    
    def create_success_response(
        self,
        data: Dict[str, Any],
        warnings: Optional[list] = None
    ) -> AgentResponse:
        """Create a success response."""
        return self.create_response(
            success=True,
            data=data,
            warnings=warnings
        )


class GeneratorAgentMixin:
    """Mixin providing data generation utilities."""
    
    def generate_random_seed(self, seed: Optional[int] = None) -> int:
        """Generate or use provided seed for reproducibility."""
        import random
        if seed is not None:
            random.seed(seed)
            return seed
        return random.randint(0, 2**31 - 1)
    
    def random_choice(self, choices: list, seed: Optional[int] = None) -> Any:
        """Select a random choice from a list."""
        import random
        if seed is not None:
            random.seed(seed)
        return random.choice(choices)
    
    def random_int(self, min_val: int, max_val: int, seed: Optional[int] = None) -> int:
        """Generate a random integer in range."""
        import random
        if seed is not None:
            random.seed(seed)
        return random.randint(min_val, max_val)
    
    def random_float(
        self, 
        min_val: float, 
        max_val: float, 
        decimals: int = 2,
        seed: Optional[int] = None
    ) -> float:
        """Generate a random float in range."""
        import random
        if seed is not None:
            random.seed(seed)
        value = random.uniform(min_val, max_val)
        return round(value, decimals)
    
    def weighted_choice(
        self, 
        items: list, 
        weights: list,
        seed: Optional[int] = None
    ) -> Any:
        """Select a weighted random choice."""
        import random
        if seed is not None:
            random.seed(seed)
        return random.choices(items, weights=weights, k=1)[0]
