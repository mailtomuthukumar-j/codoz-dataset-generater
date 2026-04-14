"""
Event Bus - Publish/Subscribe event system for pipeline events.

Enables loose coupling between pipeline components.
"""

from typing import Dict, List, Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import logging


logger = logging.getLogger(__name__)


class EventType(Enum):
    PIPELINE_START = "pipeline_start"
    PIPELINE_COMPLETE = "pipeline_complete"
    PIPELINE_ERROR = "pipeline_error"
    STEP_START = "step_start"
    STEP_COMPLETE = "step_complete"
    JOB_CREATED = "job_created"
    JOB_STARTED = "job_started"
    JOB_COMPLETED = "job_completed"
    JOB_FAILED = "job_failed"
    DATA_GENERATED = "data_generated"
    VALIDATION_PASSED = "validation_passed"
    VALIDATION_FAILED = "validation_failed"
    OUTPUT_WRITTEN = "output_written"


@dataclass
class Event:
    event_type: EventType
    timestamp: datetime
    source: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "data": self.data
        }


EventHandler = Callable[[Event], None]


class EventBus:
    def __init__(self):
        self._handlers: Dict[EventType, List[EventHandler]] = {}
        self._global_handlers: List[EventHandler] = []
        self._event_history: List[Event] = []
        self._max_history: int = 1000
    
    def subscribe(
        self, 
        event_type: EventType, 
        handler: EventHandler
    ) -> None:
        """Subscribe a handler to a specific event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.debug(f"Subscribed handler to {event_type.value}")
    
    def subscribe_all(self, handler: EventHandler) -> None:
        """Subscribe a handler to all events."""
        self._global_handlers.append(handler)
        logger.debug("Subscribed handler to all events")
    
    def unsubscribe(
        self, 
        event_type: EventType, 
        handler: EventHandler
    ) -> None:
        """Unsubscribe a handler from a specific event type."""
        if event_type in self._handlers:
            try:
                self._handlers[event_type].remove(handler)
            except ValueError:
                pass
    
    def unsubscribe_all(self, handler: EventHandler) -> None:
        """Unsubscribe a handler from all events."""
        try:
            self._global_handlers.remove(handler)
        except ValueError:
            pass
        for handlers in self._handlers.values():
            try:
                handlers.remove(handler)
            except ValueError:
                pass
    
    def publish(self, event: Event) -> None:
        """Publish an event to all subscribers."""
        if event.source is None:
            event.source = "EventBus"
        
        self._event_history.append(event)
        if len(self._event_history) > self._max_history:
            self._event_history.pop(0)
        
        logger.debug(f"Publishing event: {event.event_type.value}")
        
        if event.event_type in self._handlers:
            for handler in self._handlers[event.event_type]:
                try:
                    handler(event)
                except Exception as e:
                    logger.error(f"Handler error for {event.event_type.value}: {e}")
        
        for handler in self._global_handlers:
            try:
                handler(event)
            except Exception as e:
                logger.error(f"Global handler error: {e}")
    
    def get_history(
        self, 
        event_type: Optional[EventType] = None,
        limit: int = 100
    ) -> List[Event]:
        """Get event history, optionally filtered by type."""
        history = self._event_history
        
        if event_type:
            history = [e for e in history if e.event_type == event_type]
        
        return history[-limit:]
    
    def clear_history(self) -> None:
        """Clear event history."""
        self._event_history.clear()
    
    def get_event_stats(self) -> Dict[str, int]:
        """Get event statistics."""
        stats = {et.value: 0 for et in EventType}
        for event in self._event_history:
            stats[event.event_type.value] += 1
        return stats


class LoggingEventHandler:
    """Event handler that logs all events."""
    
    def __init__(self, min_level: str = "INFO"):
        self.min_level = getattr(logging, min_level.upper(), logging.INFO)
    
    def handle(self, event: Event) -> None:
        """Handle an event by logging it."""
        level = self._get_log_level(event.event_type)
        if level >= self.min_level:
            logger.log(level, f"[{event.event_type.value}] {event.source}: {event.data}")
    
    def _get_log_level(self, event_type: EventType) -> int:
        """Get appropriate log level for event type."""
        if event_type in (EventType.PIPELINE_ERROR, EventType.VALIDATION_FAILED, EventType.JOB_FAILED):
            return logging.ERROR
        elif event_type in (EventType.PIPELINE_COMPLETE, EventType.JOB_COMPLETED, EventType.VALIDATION_PASSED):
            return logging.INFO
        else:
            return logging.DEBUG


def create_logging_subscriber(event_bus: EventBus) -> LoggingEventHandler:
    """Create and subscribe a logging event handler."""
    handler = LoggingEventHandler()
    event_bus.subscribe_all(handler.handle)
    return handler
