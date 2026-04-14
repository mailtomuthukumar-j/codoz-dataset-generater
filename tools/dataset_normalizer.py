"""
Dataset Normalizer - Normalize and standardize data values.

Provides normalization utilities for numeric data.
"""

from typing import Dict, Any, List, Optional, Tuple
import math


class DatasetNormalizer:
    """Normalize dataset values."""
    
    @staticmethod
    def min_max_normalize(
        value: float,
        min_val: float,
        max_val: float
    ) -> float:
        """
        Normalize value to [0, 1] range using min-max scaling.
        
        Args:
            value: Value to normalize
            min_val: Minimum value in dataset
            max_val: Maximum value in dataset
            
        Returns:
            Normalized value in [0, 1]
        """
        if max_val == min_val:
            return 0.5
        return (value - min_val) / (max_val - min_val)
    
    @staticmethod
    def z_score_normalize(
        value: float,
        mean: float,
        std: float
    ) -> float:
        """
        Normalize value using z-score (standardization).
        
        Args:
            value: Value to normalize
            mean: Mean of dataset
            std: Standard deviation
            
        Returns:
            Z-score normalized value
        """
        if std == 0:
            return 0.0
        return (value - mean) / std
    
    @staticmethod
    def normalize_row(
        row: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Normalize all numeric columns in a row.
        
        Args:
            row: Data row
            schema: Column schema with ranges
            
        Returns:
            Normalized row
        """
        normalized = {}
        
        for col_name, value in row.items():
            col_schema = schema.get(col_name, {})
            dtype = col_schema.get("dtype", "float")
            
            if dtype in ("int", "float") and isinstance(value, (int, float)):
                range_vals = col_schema.get("range", [])
                if len(range_vals) == 2:
                    min_val, max_val = range_vals
                    normalized[col_name] = DatasetNormalizer.min_max_normalize(
                        value, min_val, max_val
                    )
                else:
                    normalized[col_name] = value
            else:
                normalized[col_name] = value
        
        return normalized
    
    @staticmethod
    def calculate_statistics(values: List[float]) -> Dict[str, float]:
        """
        Calculate basic statistics for a numeric column.
        
        Args:
            values: List of numeric values
            
        Returns:
            Dictionary with min, max, mean, median, std
        """
        if not values:
            return {"min": 0, "max": 0, "mean": 0, "median": 0, "std": 0}
        
        sorted_vals = sorted(values)
        n = len(values)
        
        stats = {
            "min": sorted_vals[0],
            "max": sorted_vals[-1],
            "count": n
        }
        
        mean = sum(values) / n
        stats["mean"] = mean
        
        mid = n // 2
        if n % 2 == 0:
            stats["median"] = (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
        else:
            stats["median"] = sorted_vals[mid]
        
        variance = sum((x - mean) ** 2 for x in values) / n
        stats["std"] = math.sqrt(variance)
        
        return stats
    
    @staticmethod
    def detect_outliers(
        values: List[float],
        method: str = "iqr"
    ) -> List[int]:
        """
        Detect outlier indices using IQR or z-score method.
        
        Args:
            values: List of numeric values
            method: 'iqr' or 'zscore'
            
        Returns:
            List of outlier indices
        """
        outliers = []
        
        if method == "iqr":
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            
            q1 = sorted_vals[n // 4]
            q3 = sorted_vals[3 * n // 4]
            iqr = q3 - q1
            
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            
            for i, val in enumerate(values):
                if val < lower or val > upper:
                    outliers.append(i)
        
        elif method == "zscore":
            if len(values) < 3:
                return outliers
            
            mean = sum(values) / len(values)
            std = math.sqrt(sum((x - mean) ** 2 for x in values) / len(values))
            
            if std == 0:
                return outliers
            
            for i, val in enumerate(values):
                z_score = abs((val - mean) / std)
                if z_score > 3:
                    outliers.append(i)
        
        return outliers
    
    @staticmethod
    def round_to_decimals(value: float, decimals: int = 2) -> float:
        """
        Round value to specified decimal places.
        
        Args:
            value: Value to round
            decimals: Number of decimal places
            
        Returns:
            Rounded value
        """
        return round(value, decimals)
