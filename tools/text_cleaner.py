"""
Text Cleaner - Clean and normalize text values.

Provides text cleaning utilities.
"""

import re
from typing import Optional, List


class TextCleaner:
    """Clean and normalize text values."""
    
    @staticmethod
    def clean(text: str) -> str:
        """
        Basic text cleaning.
        
        Args:
            text: Input text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        text = text.strip()
        text = re.sub(r'\s+', ' ', text)
        text = text.lower()
        
        return text
    
    @staticmethod
    def clean_column_name(name: str) -> str:
        """
        Convert column name to snake_case.
        
        Args:
            name: Raw column name
            
        Returns:
            Clean snake_case name
        """
        if not name:
            return "unnamed_column"
        
        name = re.sub(r'[^\w\s-]', '', name)
        name = re.sub(r'[-\s]+', '_', name)
        name = name.strip('_').lower()
        
        if not name:
            return "unnamed_column"
        
        return name
    
    @staticmethod
    def normalize_category(value: str, valid_values: List[str]) -> str:
        """
        Normalize a categorical value to valid value.
        
        Args:
            value: Input value
            valid_values: List of valid values
            
        Returns:
            Normalized value or first valid value if no match
        """
        if not value:
            return valid_values[0] if valid_values else ""
        
        value_lower = value.lower().strip()
        
        for valid in valid_values:
            valid_lower = valid.lower()
            if value_lower == valid_lower:
                return valid
            
            if value_lower in valid_lower or valid_lower in value_lower:
                return valid
        
        return valid_values[0] if valid_values else value
    
    @staticmethod
    def remove_special_chars(text: str) -> str:
        """
        Remove special characters from text.
        
        Args:
            text: Input text
            
        Returns:
            Text with only alphanumeric and space
        """
        return re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    @staticmethod
    def truncate(text: str, max_length: int, suffix: str = "...") -> str:
        """
        Truncate text to maximum length.
        
        Args:
            text: Input text
            max_length: Maximum length
            suffix: Suffix to add if truncated
            
        Returns:
            Truncated text
        """
        if len(text) <= max_length:
            return text
        
        return text[:max_length - len(suffix)] + suffix
    
    @staticmethod
    def sanitize_for_csv(value: str) -> str:
        """
        Sanitize value for CSV output.
        
        Args:
            value: Input value
            
        Returns:
            CSV-safe value
        """
        if not value:
            return ""
        
        value = str(value)
        
        if ',' in value or '"' in value or '\n' in value:
            value = value.replace('"', '""')
            return f'"{value}"'
        
        return value
    
    @staticmethod
    def parse_boolean(value: str) -> Optional[bool]:
        """
        Parse boolean from string.
        
        Args:
            value: String value
            
        Returns:
            True, False, or None if not parseable
        """
        if not value:
            return None
        
        value_lower = value.lower().strip()
        
        if value_lower in ('true', 'yes', '1', 'y', 't'):
            return True
        elif value_lower in ('false', 'no', '0', 'n', 'f'):
            return False
        
        return None
