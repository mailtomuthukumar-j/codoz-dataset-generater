"""
CODOZ Orchestrator - Main Pipeline Controller

Coordinates all agents and manages the dataset generation pipeline.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import logging

from core.agent_memory import AgentMemory
from core.event_bus import EventBus, Event, EventType
from core.job_queue import JobQueue, Job, JobStatus


logger = logging.getLogger(__name__)


class PipelineStep(Enum):
    INTENT_PARSING = 1
    SCHEMA_GENERATION = 2
    CORRELATION_PLANNING = 3
    CLASS_BALANCE = 4
    DATA_GENERATION = 5
    DATA_CLEANING = 6
    VALIDATION = 7
    FORMATTING = 8
    PACKAGING = 9


@dataclass
class PipelineConfig:
    size: int = 500
    format: str = "json"
    seed: int = 42
    balanced: bool = False
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    task_type: Optional[str] = None
    target_col: Optional[str] = None
    custom_constraints: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineContext:
    config: PipelineConfig
    domain: str = ""
    subdomain: str = ""
    task_type: str = ""
    target_col: str = ""
    schema: List[Dict[str, Any]] = field(default_factory=list)
    correlation_rules: List[str] = field(default_factory=list)
    label_distribution: Dict[str, float] = field(default_factory=dict)
    generated_data: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class Orchestrator:
    AGENT_ROUTING = {
        PipelineStep.INTENT_PARSING: "intent_analyzer_agent",
        PipelineStep.SCHEMA_GENERATION: "schema_agent",
        PipelineStep.CORRELATION_PLANNING: "planner_agent",
        PipelineStep.CLASS_BALANCE: "planner_agent",
        PipelineStep.DATA_GENERATION: "generator_agent",
        PipelineStep.DATA_CLEANING: "cleaner_agent",
        PipelineStep.VALIDATION: "validator_agent",
        PipelineStep.FORMATTING: "formatter_agent",
        PipelineStep.PACKAGING: "packager_agent",
    }
    
    def __init__(
        self,
        agents: Dict[str, Any],
        memory: Optional[AgentMemory] = None,
        event_bus: Optional[EventBus] = None,
        job_queue: Optional[JobQueue] = None
    ):
        self.agents = agents
        self.memory = memory or AgentMemory()
        self.event_bus = event_bus or EventBus()
        self.job_queue = job_queue or JobQueue()
        
    def run_pipeline(self, config: PipelineConfig) -> Dict[str, Any]:
        """Execute the full dataset generation pipeline."""
        context = PipelineContext(config=config)
        
        self.event_bus.publish(Event(
            event_type=EventType.PIPELINE_START,
            data={"config": self._config_to_dict(config)}
        ))
        
        try:
            context = self._step_intent_parsing(context)
            context = self._step_schema_generation(context)
            context = self._step_correlation_planning(context)
            context = self._step_class_balance(context)
            context = self._step_data_generation(context)
            context = self._step_data_cleaning(context)
            context = self._step_validation(context)
            context = self._step_formatting(context)
            context = self._step_packaging(context)
            
            self.event_bus.publish(Event(
                event_type=EventType.PIPELINE_COMPLETE,
                data={"metadata": context.metadata}
            ))
            
            return {
                "success": True,
                "data": context.generated_data,
                "metadata": context.metadata,
                "warnings": context.warnings
            }
            
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            context.errors.append(str(e))
            self.event_bus.publish(Event(
                event_type=EventType.PIPELINE_ERROR,
                data={"error": str(e)}
            ))
            return {
                "success": False,
                "error": str(e),
                "context": context
            }
    
    def _route_to_agent(self, step: PipelineStep, context: PipelineContext) -> Any:
        """Route a pipeline step to the appropriate agent."""
        agent_name = self.AGENT_ROUTING.get(step)
        if not agent_name:
            raise ValueError(f"No agent routing for step: {step}")
        
        agent = self.agents.get(agent_name)
        if not agent:
            raise ValueError(f"Agent not found: {agent_name}")
        
        return agent
    
    def _step_intent_parsing(self, context: PipelineContext) -> PipelineContext:
        """Step 1: Parse user intent."""
        agent = self._route_to_agent(PipelineStep.INTENT_PARSING, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "INTENT_PARSING"}
        ))
        
        result = agent.process(context.config, self.memory)
        
        context.domain = result.get("domain", "other")
        context.subdomain = result.get("subdomain", "")
        context.task_type = result.get("task_type", "classification")
        context.target_col = result.get("target_col", "outcome")
        
        self.memory.store("intent", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "INTENT_PARSING", "result": result}
        ))
        
        return context
    
    def _step_schema_generation(self, context: PipelineContext) -> PipelineContext:
        """Step 2: Generate dynamic schema."""
        agent = self._route_to_agent(PipelineStep.SCHEMA_GENERATION, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "SCHEMA_GENERATION"}
        ))
        
        result = agent.process(context, self.memory)
        context.schema = result.get("schema", [])
        
        self.memory.store("schema", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "SCHEMA_GENERATION", "columns": len(context.schema)}
        ))
        
        return context
    
    def _step_correlation_planning(self, context: PipelineContext) -> PipelineContext:
        """Step 3: Define correlation rules."""
        agent = self._route_to_agent(PipelineStep.CORRELATION_PLANNING, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "CORRELATION_PLANNING"}
        ))
        
        result = agent.process_correlations(context, self.memory)
        context.correlation_rules = result.get("rules", [])
        
        self.memory.store("correlations", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "CORRELATION_PLANNING", "rules": len(context.correlation_rules)}
        ))
        
        return context
    
    def _step_class_balance(self, context: PipelineContext) -> PipelineContext:
        """Step 4: Set class distribution."""
        agent = self._route_to_agent(PipelineStep.CLASS_BALANCE, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "CLASS_BALANCE"}
        ))
        
        result = agent.process_class_balance(context, self.memory)
        context.label_distribution = result.get("distribution", {})
        
        self.memory.store("class_balance", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "CLASS_BALANCE", "distribution": context.label_distribution}
        ))
        
        return context
    
    def _step_data_generation(self, context: PipelineContext) -> PipelineContext:
        """Step 5: Generate data rows."""
        agent = self._route_to_agent(PipelineStep.DATA_GENERATION, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "DATA_GENERATION"}
        ))
        
        result = agent.process(context, self.memory)
        context.generated_data = result.get("data", [])
        
        self.memory.store("raw_data", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "DATA_GENERATION", "rows": len(context.generated_data)}
        ))
        
        return context
    
    def _step_data_cleaning(self, context: PipelineContext) -> PipelineContext:
        """Step 5b: Clean and post-validate data."""
        agent = self._route_to_agent(PipelineStep.DATA_CLEANING, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "DATA_CLEANING"}
        ))
        
        result = agent.process(context.generated_data, context, self.memory)
        context.generated_data = result.get("cleaned_data", context.generated_data)
        context.warnings.extend(result.get("warnings", []))
        
        self.memory.store("cleaned_data", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "DATA_CLEANING", "warnings": len(context.warnings)}
        ))
        
        return context
    
    def _step_validation(self, context: PipelineContext) -> PipelineContext:
        """Step 9: Quality gate validation."""
        agent = self._route_to_agent(PipelineStep.VALIDATION, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "VALIDATION"}
        ))
        
        result = agent.process(context, self.memory)
        
        if not result.get("valid", False):
            errors = result.get("errors", ["Validation failed"])
            context.errors.extend(errors)
            raise ValueError(f"Validation failed: {errors}")
        
        self.memory.store("validation", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "VALIDATION", "valid": True}
        ))
        
        return context
    
    def _step_formatting(self, context: PipelineContext) -> PipelineContext:
        """Step 6: Format output."""
        agent = self._route_to_agent(PipelineStep.FORMATTING, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "FORMATTING"}
        ))
        
        result = agent.process(context, self.memory)
        
        self.memory.store("formatted_data", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "FORMATTING", "format": context.config.format}
        ))
        
        return context
    
    def _step_packaging(self, context: PipelineContext) -> PipelineContext:
        """Steps 7 & 8: Chunk and package output with metadata."""
        agent = self._route_to_agent(PipelineStep.PACKAGING, context)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_START,
            data={"step": "PACKAGING"}
        ))
        
        result = agent.process(context, self.memory)
        context.metadata = result.get("metadata", {})
        
        self.memory.store("metadata", result)
        
        self.event_bus.publish(Event(
            event_type=EventType.STEP_COMPLETE,
            data={"step": "PACKAGING", "metadata": context.metadata}
        ))
        
        return context
    
    def _config_to_dict(self, config: PipelineConfig) -> Dict[str, Any]:
        """Convert config to dict for logging."""
        return {
            "size": config.size,
            "format": config.format,
            "seed": config.seed,
            "balanced": config.balanced,
            "domain": config.domain,
            "subdomain": config.subdomain
        }
