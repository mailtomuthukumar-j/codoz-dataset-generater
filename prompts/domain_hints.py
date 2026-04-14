"""
Domain Hints - Per-Domain Column and Constraint Overrides

This module provides domain-specific knowledge for dataset generation.
Each domain has predefined column schemas and correlation rules.
"""

from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class ColumnDefinition:
    name: str
    dtype: str
    range: List[Any]
    is_target: bool = False
    correlation_rules: List[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "dtype": self.dtype,
            "range": self.range,
            "is_target": self.is_target,
            "correlation_rules": self.correlation_rules or []
        }


@dataclass
class DomainConstraints:
    correlation_rules: List[str]
    label_distribution: Dict[str, float]
    demographic_columns: List[str]
    behavioral_columns: List[str]
    measurement_columns: List[str]


DOMAIN_HINTS: Dict[str, Dict[str, Any]] = {
    "medical": {
        "columns": [
            ColumnDefinition("age", "int", [18, 90]),
            ColumnDefinition("gender", "categorical", ["male", "female", "other"]),
            ColumnDefinition("blood_pressure_systolic", "int", [80, 200]),
            ColumnDefinition("blood_pressure_diastolic", "int", [50, 130]),
            ColumnDefinition("heart_rate", "int", [50, 150]),
            ColumnDefinition("temperature", "float", [35.5, 40.0]),
            ColumnDefinition("weight", "float", [40.0, 150.0]),
            ColumnDefinition("height", "float", [140.0, 200.0]),
            ColumnDefinition("bmi", "float", [15.0, 50.0]),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "systolic > 140 AND diastolic > 90 → hypertension_risk = high",
                "bmi > 30 → hypertension_risk = high in 70%+",
                "age > 60 AND blood_pressure_systolic > 130 → cardiovascular_risk = elevated"
            ],
            label_distribution={"normal": 0.50, "elevated": 0.30, "high": 0.20},
            demographic_columns=["age", "gender", "weight", "height", "bmi"],
            behavioral_columns=["heart_rate", "blood_pressure_systolic", "blood_pressure_diastolic"],
            measurement_columns=["temperature", "heart_rate"]
        )
    },
    
    "diabetes": {
        "columns": [
            ColumnDefinition("age", "int", [22, 80]),
            ColumnDefinition("gender", "categorical", ["male", "female", "other"]),
            ColumnDefinition("glucose", "float", [70.0, 300.0]),
            ColumnDefinition("insulin", "float", [2.0, 250.0]),
            ColumnDefinition("bmi", "float", [15.0, 50.0]),
            ColumnDefinition("hba1c", "float", [4.0, 14.0]),
            ColumnDefinition("blood_pressure", "int", [60, 140]),
            ColumnDefinition("skin_thickness", "float", [10.0, 60.0]),
            ColumnDefinition("pregnancies", "int", [0, 15]),
            ColumnDefinition("diet_type", "categorical", ["balanced", "high_sugar", "low_carb", "vegetarian"]),
            ColumnDefinition("activity_level", "ordinal", ["sedentary", "light", "moderate", "active"]),
            ColumnDefinition("family_history", "boolean", [True, False]),
            ColumnDefinition("outcome", "categorical", ["diabetic", "pre-diabetic", "healthy"], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "glucose > 180 → hba1c > 7.5",
                "bmi > 35 → activity_level IN [sedentary, light] in 70%+",
                "outcome = diabetic → glucose > 140 AND hba1c > 6.5 in 85%+",
                "outcome = healthy → glucose < 110 AND bmi < 30 in 70%+",
                "gender != female → pregnancies = 0 always",
                "age < 30 → family_history = false in 75%+"
            ],
            label_distribution={"healthy": 0.50, "pre-diabetic": 0.30, "diabetic": 0.20},
            demographic_columns=["age", "gender", "pregnancies", "family_history"],
            behavioral_columns=["diet_type", "activity_level"],
            measurement_columns=["glucose", "insulin", "bmi", "hba1c", "blood_pressure", "skin_thickness"]
        )
    },
    
    "financial": {
        "columns": [
            ColumnDefinition("age", "int", [18, 70]),
            ColumnDefinition("income", "int", [20000, 500000]),
            ColumnDefinition("credit_score", "int", [300, 850]),
            ColumnDefinition("loan_amount", "int", [1000, 1000000]),
            ColumnDefinition("loan_term", "int", [12, 360]),
            ColumnDefinition("debt_ratio", "float", [0.0, 1.0]),
            ColumnDefinition("employment_status", "categorical", ["employed", "self-employed", "unemployed", "retired"]),
            ColumnDefinition("employment_years", "int", [0, 40]),
            ColumnDefinition("has_collateral", "boolean", [True, False]),
            ColumnDefinition("num_credit_lines", "int", [0, 10]),
            ColumnDefinition("default_risk", "categorical", ["low", "medium", "high"], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "debt_ratio > 0.4 → default_risk = high in 75%+",
                "credit_score < 580 → default_risk = high in 80%+",
                "income < 30000 AND loan_amount > 100000 → default_risk = high in 70%+",
                "unemployed → credit_score < 650 in 65%+",
                "employment_years < 1 → debt_ratio > 0.3 in 60%+"
            ],
            label_distribution={"low": 0.65, "medium": 0.25, "high": 0.10},
            demographic_columns=["age", "employment_status", "employment_years"],
            behavioral_columns=["income", "loan_amount", "debt_ratio", "num_credit_lines"],
            measurement_columns=["credit_score", "loan_term"]
        )
    },
    
    "education": {
        "columns": [
            ColumnDefinition("age", "int", [17, 30]),
            ColumnDefinition("study_hours", "float", [0.0, 15.0]),
            ColumnDefinition("attendance", "int", [0, 100]),
            ColumnDefinition("sleep_hours", "float", [4.0, 10.0]),
            ColumnDefinition("internet_usage", "float", [0.0, 10.0]),
            ColumnDefinition("assignment_score", "int", [0, 100]),
            ColumnDefinition("midterm_score", "int", [0, 100]),
            ColumnDefinition("final_score", "int", [0, 100]),
            ColumnDefinition("participation", "ordinal", ["low", "medium", "high"]),
            ColumnDefinition("study_group", "boolean", [True, False]),
            ColumnDefinition("gpa", "float", [0.0, 4.0], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "study_hours < 3 → gpa < 2.5 in 70%+",
                "attendance > 85 → gpa > 3.0 in 75%+",
                "sleep_hours < 6 → midterm_score < 70 in 65%+",
                "internet_usage > 8 → study_hours < 3 in 70%+",
                "final_score = (midterm_score + assignment_score * 2) / 3 ± 10%"
            ],
            label_distribution={
                "0.0-2.0": 0.20,
                "2.0-3.0": 0.35,
                "3.0-3.5": 0.30,
                "3.5-4.0": 0.15
            },
            demographic_columns=["age"],
            behavioral_columns=["study_hours", "sleep_hours", "internet_usage", "study_group", "participation"],
            measurement_columns=["attendance", "assignment_score", "midterm_score", "final_score"]
        )
    },
    
    "retail": {
        "columns": [
            ColumnDefinition("age", "int", [18, 70]),
            ColumnDefinition("gender", "categorical", ["male", "female", "other"]),
            ColumnDefinition("income_bracket", "ordinal", ["low", "middle", "upper-middle", "high"]),
            ColumnDefinition("purchase_frequency", "int", [1, 50]),
            ColumnDefinition("average_order_value", "float", [10.0, 1000.0]),
            ColumnDefinition("total_lifetime_value", "float", [100.0, 50000.0]),
            ColumnDefinition("product_categories", "categorical", ["electronics", "clothing", "food", "home", "beauty"]),
            ColumnDefinition("preferred_channel", "categorical", ["online", "in-store", "both"]),
            ColumnDefinition("promotion_sensitivity", "ordinal", ["low", "medium", "high"]),
            ColumnDefinition("churn_risk", "categorical", ["low", "medium", "high"], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "purchase_frequency < 5 AND last_purchase_days > 90 → churn_risk = high in 80%+",
                "promotion_sensitivity = high → purchase_frequency > 20 in 70%+",
                "income_bracket = high AND average_order_value > 500 → churn_risk = low in 75%+",
                "preferred_channel = online AND promotion_sensitivity = low → churn_risk = medium in 65%+"
            ],
            label_distribution={"low": 0.60, "medium": 0.25, "high": 0.15},
            demographic_columns=["age", "gender", "income_bracket"],
            behavioral_columns=["purchase_frequency", "product_categories", "preferred_channel", "promotion_sensitivity"],
            measurement_columns=["average_order_value", "total_lifetime_value"]
        )
    },
    
    "environmental": {
        "columns": [
            ColumnDefinition("temperature", "float", [-20.0, 50.0]),
            ColumnDefinition("humidity", "int", [0, 100]),
            ColumnDefinition("air_quality_index", "int", [0, 500]),
            ColumnDefinition("pm25", "float", [0.0, 300.0]),
            ColumnDefinition("pm10", "float", [0.0, 200.0]),
            ColumnDefinition("no2", "float", [0.0, 100.0]),
            ColumnDefinition("o3", "float", [0.0, 150.0]),
            ColumnDefinition("traffic_density", "ordinal", ["low", "medium", "high", "very_high"]),
            ColumnDefinition("industrial_proximity", "boolean", [True, False]),
            ColumnDefinition("wind_speed", "float", [0.0, 50.0]),
            ColumnDefinition("health_risk", "categorical", ["low", "moderate", "high", "very_high"], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "pm25 > 100 → air_quality_index > 150 AND health_risk = high in 80%+",
                "industrial_proximity = true → pm25 > 50 in 85%+",
                "traffic_density = very_high → no2 > 40 in 75%+",
                "temperature > 35 AND humidity > 80 → ozone_level = high in 70%+",
                "wind_speed < 5 → air_quality_index > 100 in 65%+"
            ],
            label_distribution={"low": 0.40, "moderate": 0.35, "high": 0.20, "very_high": 0.05},
            demographic_columns=[],
            behavioral_columns=["traffic_density", "industrial_proximity"],
            measurement_columns=["temperature", "humidity", "pm25", "pm10", "no2", "o3", "wind_speed"]
        )
    },
    
    "social": {
        "columns": [
            ColumnDefinition("age", "int", [13, 80]),
            ColumnDefinition("followers", "int", [0, 1000000]),
            ColumnDefinition("following", "int", [0, 5000]),
            ColumnDefinition("posts_per_week", "float", [0.0, 50.0]),
            ColumnDefinition("engagement_rate", "float", [0.0, 100.0]),
            ColumnDefinition("account_age_years", "float", [0.0, 20.0]),
            ColumnDefinition("verified", "boolean", [True, False]),
            ColumnDefinition("content_type", "categorical", ["text", "image", "video", "mixed"]),
            ColumnDefinition("posting_time", "categorical", ["morning", "afternoon", "evening", "night"]),
            ColumnDefinition("influence_score", "int", [0, 100], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[
                "followers > 100000 AND engagement_rate > 5 → influence_score > 70 in 80%+",
                "verified = true → followers > 10000 in 85%+",
                "posts_per_week > 20 → engagement_rate < 3 in 70%+",
                "account_age_years < 1 → followers < 1000 in 80%+",
                "engagement_rate > 10 → influence_score > 50 in 75%+"
            ],
            label_distribution={
                "0-25": 0.25,
                "26-50": 0.35,
                "51-75": 0.25,
                "76-100": 0.15
            },
            demographic_columns=["age"],
            behavioral_columns=["posts_per_week", "content_type", "posting_time", "account_age_years"],
            measurement_columns=["followers", "following", "engagement_rate", "influence_score"]
        )
    },
    
    "other": {
        "columns": [
            ColumnDefinition("id", "int", [1, 10000]),
            ColumnDefinition("value_1", "float", [0.0, 1000.0]),
            ColumnDefinition("value_2", "float", [0.0, 1000.0]),
            ColumnDefinition("category", "categorical", ["A", "B", "C", "D"]),
            ColumnDefinition("flag", "boolean", [True, False]),
            ColumnDefinition("score", "int", [0, 100], is_target=True),
        ],
        "constraints": DomainConstraints(
            correlation_rules=[],
            label_distribution={"A": 0.30, "B": 0.30, "C": 0.25, "D": 0.15},
            demographic_columns=["id"],
            behavioral_columns=["category"],
            measurement_columns=["value_1", "value_2", "score"]
        )
    }
}


def get_domain_hints(domain: str) -> Dict[str, Any]:
    """Get hints for a specific domain."""
    return DOMAIN_HINTS.get(domain.lower(), DOMAIN_HINTS["other"])


def get_columns_for_domain(domain: str) -> List[ColumnDefinition]:
    """Get column definitions for a domain."""
    hints = get_domain_hints(domain)
    return hints.get("columns", [])


def get_constraints_for_domain(domain: str) -> DomainConstraints:
    """Get constraints for a domain."""
    hints = get_domain_hints(domain)
    return hints.get("constraints", DomainConstraints(
        correlation_rules=[],
        label_distribution={},
        demographic_columns=[],
        behavioral_columns=[],
        measurement_columns=[]
    ))


def get_all_domains() -> List[str]:
    """Get list of all supported domains."""
    return list(DOMAIN_HINTS.keys())


def infer_domain_from_topic(topic: str) -> str:
    """Infer domain from a topic string."""
    topic_lower = topic.lower()
    
    if any(word in topic_lower for word in ["diabetes", "health", "medical", "patient", "disease", "heart", "blood", "clinical"]):
        return "medical"
    elif any(word in topic_lower for word in ["loan", "credit", "fraud", "financial", "bank", "transaction", "payment", "default"]):
        return "financial"
    elif any(word in topic_lower for word in ["student", "education", "school", "exam", "grade", "gpa", "academic", "learning"]):
        return "education"
    elif any(word in topic_lower for word in ["retail", "customer", "shopping", "sales", "purchase", "store"]):
        return "retail"
    elif any(word in topic_lower for word in ["pollution", "climate", "environmental", "air", "weather", "emission"]):
        return "environmental"
    elif any(word in topic_lower for word in ["social", "twitter", "instagram", "facebook", "influencer", "engagement"]):
        return "social"
    
    return "other"
