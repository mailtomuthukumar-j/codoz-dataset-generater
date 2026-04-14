"""
Packager Agent - Steps 7, 8: Chunking and Metadata Output

Packages data into chunks with metadata.
"""

from typing import Dict, Any, List, Optional
import logging

from agents.base_agent import BaseAgent, AgentResponse
from core.agent_memory import AgentMemory
from core.output_manager import OutputManager, OutputConfig


logger = logging.getLogger(__name__)


class PackagerAgent(BaseAgent):
    """Agent for packaging data and generating metadata."""
    
    name = "packager_agent"
    description = "Packages data into chunks with metadata"
    
    def process(self, context: Any, memory: AgentMemory) -> AgentResponse:
        """Package data into chunks with metadata."""
        self.log("Packaging dataset")
        
        try:
            schema = getattr(context, 'schema', [])
            data = getattr(context, 'generated_data', [])
            format_type = getattr(context, 'config').format if hasattr(context, 'config') else 'json'
            seed = getattr(context, 'config').seed if hasattr(context, 'config') else 42
            domain = getattr(context, 'domain', 'other')
            subdomain = getattr(context, 'subdomain', 'dataset')
            task_type = getattr(context, 'task_type', 'classification')
            target_col = getattr(context, 'target_col', 'outcome')
            
            output_config = OutputConfig(
                output_dir="./dataset",
                processed_dir="./dataset/processed",
                metadata_dir="./dataset/metadata",
                format=format_type
            )
            
            output_manager = OutputManager(output_config)
            
            dataset_name = f"{subdomain}_dataset"
            
            metadata = self._generate_metadata(
                schema=schema,
                data=data,
                domain=domain,
                subdomain=subdomain,
                task_type=task_type,
                target_col=target_col,
                seed=seed,
                format_type=format_type
            )
            
            label_distribution = self._calculate_label_distribution(data, target_col)
            metadata["label_distribution"] = label_distribution
            
            result = output_manager.generate_dataset(
                data=data,
                metadata=metadata,
                format_type=format_type,
                dataset_name=dataset_name
            )
            
            self.log(f"Dataset packaged: {len(data)} rows, {result['strategy']['total_chunks']} chunks")
            
            return self.create_success_response(data={
                "metadata": metadata,
                "output_files": result,
                "dataset_name": dataset_name
            })
            
        except Exception as e:
            logger.error(f"Packaging error: {e}")
            return self.create_error_response(f"Failed to package dataset: {str(e)}")
    
    def _generate_metadata(
        self,
        schema: List[Dict[str, Any]],
        data: List[Dict[str, Any]],
        domain: str,
        subdomain: str,
        task_type: str,
        target_col: str,
        seed: int,
        format_type: str
    ) -> Dict[str, Any]:
        """Generate metadata dictionary."""
        return {
            "dataset_name": f"{subdomain}_dataset",
            "generated_by": "CODOZ",
            "version": "1.0.0",
            "seed": seed,
            "domain": domain,
            "subdomain": subdomain,
            "task_type": task_type,
            "target_column": target_col,
            "total_rows": len(data),
            "total_columns": len(schema),
            "format": format_type,
            "schema": schema,
            "generated_at": self._get_timestamp()
        }
    
    def _calculate_label_distribution(
        self,
        data: List[Dict[str, Any]],
        target_col: str
    ) -> Dict[str, int]:
        """Calculate label distribution from data."""
        distribution = {}
        
        for row in data:
            label = row.get(target_col)
            if label is not None:
                label_str = str(label)
                distribution[label_str] = distribution.get(label_str, 0) + 1
        
        return distribution
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
