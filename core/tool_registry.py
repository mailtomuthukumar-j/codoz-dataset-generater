"""
Tool Registry - Central registry for agent tools.

Manages tool registration and execution for agents.
"""

from typing import Dict, Any, List, Callable, Optional, Type
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    function: Callable
    category: str = "general"
    enabled: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "category": self.category,
            "enabled": self.enabled
        }


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._categories: Dict[str, List[str]] = {}
    
    def register(
        self,
        name: str,
        description: str,
        function: Callable,
        parameters: Optional[Dict[str, Any]] = None,
        category: str = "general"
    ) -> None:
        """Register a tool with the registry."""
        tool_def = ToolDefinition(
            name=name,
            description=description,
            parameters=parameters or {},
            function=function,
            category=category
        )
        
        self._tools[name] = tool_def
        
        if category not in self._categories:
            self._categories[category] = []
        self._categories[category].append(name)
        
        logger.info(f"Registered tool: {name} (category: {category})")
    
    def get(self, name: str) -> Optional[ToolDefinition]:
        """Get a tool by name."""
        return self._tools.get(name)
    
    def get_function(self, name: str) -> Optional[Callable]:
        """Get a tool's function by name."""
        tool = self._tools.get(name)
        return tool.function if tool else None
    
    def list_tools(self, category: Optional[str] = None) -> List[ToolDefinition]:
        """List all tools, optionally filtered by category."""
        if category:
            tool_names = self._categories.get(category, [])
            return [self._tools[name] for name in tool_names if name in self._tools]
        return list(self._tools.values())
    
    def list_categories(self) -> List[str]:
        """List all tool categories."""
        return list(self._categories.keys())
    
    def enable(self, name: str) -> bool:
        """Enable a tool."""
        tool = self._tools.get(name)
        if tool:
            tool.enabled = True
            return True
        return False
    
    def disable(self, name: str) -> bool:
        """Disable a tool."""
        tool = self._tools.get(name)
        if tool:
            tool.enabled = False
            return True
        return False
    
    def execute(self, name: str, **kwargs) -> Any:
        """Execute a tool by name."""
        tool = self._tools.get(name)
        
        if not tool:
            raise ValueError(f"Tool not found: {name}")
        
        if not tool.enabled:
            raise ValueError(f"Tool disabled: {name}")
        
        try:
            return tool.function(**kwargs)
        except Exception as e:
            logger.error(f"Tool execution error ({name}): {e}")
            raise
    
    def unregister(self, name: str) -> bool:
        """Unregister a tool."""
        if name in self._tools:
            tool = self._tools[name]
            del self._tools[name]
            
            if tool.category in self._categories:
                try:
                    self._categories[tool.category].remove(name)
                except ValueError:
                    pass
            
            return True
        return False
    
    def get_tools_by_capability(self, capability: str) -> List[ToolDefinition]:
        """Get tools that match a capability keyword."""
        matching = []
        capability_lower = capability.lower()
        
        for tool in self._tools.values():
            if capability_lower in tool.name.lower():
                matching.append(tool)
            elif capability_lower in tool.description.lower():
                matching.append(tool)
        
        return matching
    
    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Get schemas for all enabled tools (for LLM tool use)."""
        return [
            tool.to_dict() for tool in self._tools.values() 
            if tool.enabled
        ]


_tool_registry_instance: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """Get the singleton tool registry instance."""
    global _tool_registry_instance
    if _tool_registry_instance is None:
        _tool_registry_instance = ToolRegistry()
        _register_default_tools(_tool_registry_instance)
    return _tool_registry_instance


def _register_default_tools(registry: ToolRegistry) -> None:
    """Register default built-in tools."""
    pass
