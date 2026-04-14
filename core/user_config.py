"""
User Config - Configuration management for CODOZ.

Handles CLI arguments and environment configuration.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
import os
import json
from dotenv import load_dotenv


load_dotenv()


@dataclass
class UserConfig:
    size: int = 500
    format: str = "json"
    seed: int = 42
    balanced: bool = False
    topic: str = ""
    domain: Optional[str] = None
    output_dir: str = "./dataset"
    verbose: bool = False
    env_overrides: Dict[str, Any] = field(default_factory=dict)


class ConfigManager:
    DEFAULTS = {
        "DEFAULT_SIZE": 500,
        "DEFAULT_FORMAT": "json",
        "DEFAULT_SEED": 42,
        "MAX_CHUNK_SIZE": 500,
        "DATASET_OUTPUT_DIR": "./dataset",
        "RAW_OUTPUT_DIR": "./dataset/raw",
        "PROCESSED_OUTPUT_DIR": "./dataset/processed",
        "METADATA_OUTPUT_DIR": "./dataset/metadata",
        "LOG_LEVEL": "info",
        "VERBOSE": "false"
    }
    
    VALID_FORMATS = ["json", "csv", "jsonl"]
    VALID_DOMAINS = ["medical", "financial", "education", "retail", "environmental", "social", "other"]
    
    def __init__(self, env_file: Optional[str] = None):
        if env_file:
            load_dotenv(env_file)
        
        self._config: Dict[str, Any] = {}
        self._load_defaults()
        self._load_env()
    
    def _load_defaults(self):
        """Load default configuration values."""
        for key, value in self.DEFAULTS.items():
            self._config[key] = value
    
    def _load_env(self):
        """Load configuration from environment variables."""
        env_mapping = {
            "DEFAULT_SIZE": ("SIZE", int),
            "DEFAULT_FORMAT": ("FORMAT", str),
            "DEFAULT_SEED": ("SEED", int),
            "MAX_CHUNK_SIZE": ("MAX_CHUNK_SIZE", int),
            "DATASET_OUTPUT_DIR": ("DATASET_OUTPUT_DIR", str),
            "RAW_OUTPUT_DIR": ("RAW_OUTPUT_DIR", str),
            "PROCESSED_OUTPUT_DIR": ("PROCESSED_OUTPUT_DIR", str),
            "METADATA_OUTPUT_DIR": ("METADATA_OUTPUT_DIR", str),
            "LOG_LEVEL": ("LOG_LEVEL", str),
            "VERBOSE": ("VERBOSE", lambda x: x.lower() == "true")
        }
        
        for config_key, (env_key, converter) in env_mapping.items():
            env_value = os.getenv(env_key)
            if env_value is not None:
                try:
                    self._config[config_key] = converter(env_value)
                except (ValueError, TypeError):
                    pass
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        return self._config.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        self._config[key] = value
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration values."""
        return self._config.copy()
    
    def parse_cli_args(self, args: List[str]) -> UserConfig:
        """Parse CLI arguments into UserConfig."""
        config = UserConfig()
        
        i = 0
        while i < len(args):
            arg = args[i]
            
            if arg in ("--size", "-s"):
                if i + 1 < len(args):
                    config.size = int(args[i + 1])
                    i += 2
                else:
                    i += 1
                    
            elif arg in ("--format", "-f"):
                if i + 1 < len(args):
                    fmt = args[i + 1].lower()
                    if fmt in self.VALID_FORMATS:
                        config.format = fmt
                    else:
                        raise ValueError(f"Invalid format: {fmt}. Valid: {self.VALID_FORMATS}")
                    i += 2
                else:
                    i += 1
                    
            elif arg in ("--seed"):
                if i + 1 < len(args):
                    config.seed = int(args[i + 1])
                    i += 2
                else:
                    i += 1
                    
            elif arg == "--balanced":
                config.balanced = True
                i += 1
                
            elif arg in ("--domain", "-d"):
                if i + 1 < len(args):
                    domain = args[i + 1].lower()
                    if domain in self.VALID_DOMAINS:
                        config.domain = domain
                    else:
                        raise ValueError(f"Invalid domain: {domain}. Valid: {self.VALID_DOMAINS}")
                    i += 2
                else:
                    i += 1
                    
            elif arg in ("--output", "-o"):
                if i + 1 < len(args):
                    config.output_dir = args[i + 1]
                    i += 2
                else:
                    i += 1
                    
            elif arg in ("--verbose", "-v"):
                config.verbose = True
                i += 1
                
            elif arg.startswith("-"):
                raise ValueError(f"Unknown option: {arg}")
                
            else:
                if not config.topic:
                    config.topic = arg
                i += 1
        
        return config
    
    def validate_config(self, config: UserConfig) -> List[str]:
        """Validate a user configuration. Returns list of errors."""
        errors = []
        
        if config.size < 1:
            errors.append("Size must be at least 1")
        elif config.size > 100000:
            errors.append("Size cannot exceed 100,000")
        
        if config.format not in self.VALID_FORMATS:
            errors.append(f"Invalid format: {config.format}")
        
        if config.seed < 0:
            errors.append("Seed must be non-negative")
        
        if not config.topic:
            errors.append("Topic is required")
        
        return errors
    
    def to_dict(self, config: UserConfig) -> Dict[str, Any]:
        """Convert UserConfig to dictionary."""
        return {
            "size": config.size,
            "format": config.format,
            "seed": config.seed,
            "balanced": config.balanced,
            "topic": config.topic,
            "domain": config.domain,
            "output_dir": config.output_dir,
            "verbose": config.verbose
        }
    
    def save_config(self, config: UserConfig, filepath: str) -> None:
        """Save configuration to a JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(config), f, indent=2)
    
    def load_config(self, filepath: str) -> UserConfig:
        """Load configuration from a JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        config = UserConfig()
        for key, value in data.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        return config


_config_manager_instance: Optional[ConfigManager] = None


def get_config_manager() -> ConfigManager:
    """Get the singleton config manager instance."""
    global _config_manager_instance
    if _config_manager_instance is None:
        _config_manager_instance = ConfigManager()
    return _config_manager_instance
