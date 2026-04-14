"""
Classifier Tool - Classification utilities for data enrichment.

Provides classification helpers for agent use.
"""

from typing import Dict, Any, List, Optional, Tuple
import random


class ClassifierTool:
    """Tool for classification operations."""
    
    @staticmethod
    def classify_by_threshold(
        value: float,
        low_threshold: float,
        high_threshold: float
    ) -> str:
        """
        Classify a numeric value into low/medium/high.
        
        Args:
            value: Value to classify
            low_threshold: Upper bound for 'low'
            high_threshold: Lower bound for 'high'
            
        Returns:
            Classification: 'low', 'medium', or 'high'
        """
        if value <= low_threshold:
            return "low"
        elif value >= high_threshold:
            return "high"
        else:
            return "medium"
    
    @staticmethod
    def classify_bmi(bmi: float) -> str:
        """Classify BMI category."""
        if bmi < 18.5:
            return "underweight"
        elif bmi < 25:
            return "normal"
        elif bmi < 30:
            return "overweight"
        else:
            return "obese"
    
    @staticmethod
    def classify_glucose_level(glucose: float) -> str:
        """Classify glucose level according to medical guidelines."""
        if glucose < 100:
            return "normal"
        elif glucose < 126:
            return "pre-diabetic"
        else:
            return "diabetic"
    
    @staticmethod
    def classify_hba1c(hba1c: float) -> str:
        """Classify HbA1c level according to medical guidelines."""
        if hba1c < 5.7:
            return "normal"
        elif hba1c < 6.5:
            return "pre-diabetic"
        else:
            return "diabetic"
    
    @staticmethod
    def classify_credit_score(score: int) -> str:
        """Classify credit score risk."""
        if score < 580:
            return "poor"
        elif score < 670:
            return "fair"
        elif score < 740:
            return "good"
        elif score < 800:
            return "very_good"
        else:
            return "excellent"
    
    @staticmethod
    def classify_blood_pressure(systolic: int, diastolic: int) -> str:
        """Classify blood pressure category."""
        if systolic < 120 and diastolic < 80:
            return "normal"
        elif systolic < 130 and diastolic < 80:
            return "elevated"
        elif systolic < 140 or diastolic < 90:
            return "high_stage_1"
        else:
            return "high_stage_2"
    
    @staticmethod
    def classify_gpa(gpa: float) -> str:
        """Classify GPA performance level."""
        if gpa < 2.0:
            return "failing"
        elif gpa < 2.5:
            return "below_average"
        elif gpa < 3.0:
            return "average"
        elif gpa < 3.5:
            return "good"
        else:
            return "excellent"
    
    @staticmethod
    def classify_air_quality(aqi: int) -> str:
        """Classify Air Quality Index."""
        if aqi <= 50:
            return "good"
        elif aqi <= 100:
            return "moderate"
        elif aqi <= 150:
            return "unhealthy_sensitive"
        elif aqi <= 200:
            return "unhealthy"
        elif aqi <= 300:
            return "very_unhealthy"
        else:
            return "hazardous"
    
    @staticmethod
    def ensemble_classify(
        classifiers: List[callable],
        value: Any,
        weights: Optional[List[float]] = None
    ) -> Tuple[str, Dict[str, float]]:
        """
        Combine multiple classifiers using weighted voting.
        
        Args:
            classifiers: List of classifier functions
            value: Value to classify
            weights: Optional weights for each classifier
            
        Returns:
            Tuple of (final_class, confidence_scores)
        """
        if not classifiers:
            return "unknown", {}
        
        if weights is None:
            weights = [1.0] * len(classifiers)
        
        votes: Dict[str, float] = {}
        total_weight = sum(weights)
        
        for classifier, weight in zip(classifiers, weights):
            result = classifier(value)
            votes[result] = votes.get(result, 0) + weight
        
        for cls in votes:
            votes[cls] /= total_weight
        
        final = max(votes, key=votes.get)
        return final, votes
