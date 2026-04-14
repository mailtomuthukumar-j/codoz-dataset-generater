"""
Output Manager - Chunking and File Write Logic

Handles writing dataset chunks to files with proper formatting.
"""

import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import logging

from formatters.json_writer import JsonWriter
from formatters.csv_writer import CsvWriter
from formatters.jsonl_writer import JsonlWriter


logger = logging.getLogger(__name__)


@dataclass
class ChunkInfo:
    chunk_id: int
    filename: str
    row_count: int
    start_row: int
    end_row: int


@dataclass
class OutputConfig:
    output_dir: str = "./dataset"
    raw_dir: str = "./dataset/raw"
    processed_dir: str = "./dataset/processed"
    metadata_dir: str = "./dataset/metadata"
    max_chunk_size: int = 500
    format: str = "json"


class OutputManager:
    FORMATTERS = {
        "json": JsonWriter,
        "csv": CsvWriter,
        "jsonl": JsonlWriter
    }
    
    def __init__(self, config: Optional[OutputConfig] = None):
        self.config = config or OutputConfig()
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create output directories if they don't exist."""
        for dir_path in [
            self.config.output_dir,
            self.config.raw_dir,
            self.config.processed_dir,
            self.config.metadata_dir
        ]:
            os.makedirs(dir_path, exist_ok=True)
    
    def get_formatter(self, format_type: Optional[str] = None):
        """Get formatter instance for the output format."""
        fmt = format_type or self.config.format
        formatter_class = self.FORMATTERS.get(fmt)
        
        if not formatter_class:
            logger.warning(f"Unknown format '{fmt}', defaulting to json")
            formatter_class = JsonWriter
        
        return formatter_class()
    
    def chunk_data(
        self, 
        data: List[Dict[str, Any]], 
        chunk_size: Optional[int] = None
    ) -> List[List[Dict[str, Any]]]:
        """Split data into chunks."""
        size = chunk_size or self.config.max_chunk_size
        chunks = []
        
        for i in range(0, len(data), size):
            chunks.append(data[i:i + size])
        
        return chunks
    
    def write_data_chunks(
        self,
        data: List[Dict[str, Any]],
        base_filename: str = "data",
        format_type: Optional[str] = None,
        include_header: bool = True
    ) -> List[ChunkInfo]:
        """Write data to chunked files."""
        chunks = self.chunk_data(data)
        chunk_infos = []
        formatter = self.get_formatter(format_type)
        
        for i, chunk in enumerate(chunks, 1):
            chunk_num = str(i).zfill(3)
            filename = f"{base_filename}_{chunk_num}.{format_type or self.config.format}"
            filepath = os.path.join(self.config.processed_dir, filename)
            
            content = formatter.write(chunk, include_header=(include_header and i == 1))
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            chunk_infos.append(ChunkInfo(
                chunk_id=i,
                filename=filename,
                row_count=len(chunk),
                start_row=(i-1) * self.config.max_chunk_size + 1,
                end_row=(i-1) * self.config.max_chunk_size + len(chunk)
            ))
            
            logger.info(f"Wrote chunk {i}: {filename} ({len(chunk)} rows)")
        
        return chunk_infos
    
    def write_single_file(
        self,
        data: List[Dict[str, Any]],
        filename: str = "data",
        format_type: Optional[str] = None,
        include_header: bool = True
    ) -> str:
        """Write data to a single file."""
        formatter = self.get_formatter(format_type)
        ext = format_type or self.config.format
        filepath = os.path.join(self.config.processed_dir, f"{filename}.{ext}")
        
        content = formatter.write(data, include_header=include_header)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Wrote single file: {filepath} ({len(data)} rows)")
        
        return filepath
    
    def write_index(self, chunks: List[ChunkInfo], index_name: str = "index.json") -> str:
        """Write index file for chunked datasets."""
        index_data = {
            "total_chunks": len(chunks),
            "total_rows": sum(c.row_count for c in chunks),
            "chunks": [
                {
                    "chunk_id": c.chunk_id,
                    "filename": c.filename,
                    "row_count": c.row_count,
                    "start_row": c.start_row,
                    "end_row": c.end_row
                }
                for c in chunks
            ]
        }
        
        filepath = os.path.join(self.config.processed_dir, index_name)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2)
        
        logger.info(f"Wrote index file: {filepath}")
        
        return filepath
    
    def write_metadata(
        self,
        metadata: Dict[str, Any],
        filename: str = "metadata.json"
    ) -> str:
        """Write metadata JSON file."""
        filepath = os.path.join(self.config.metadata_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Wrote metadata: {filepath}")
        
        return filepath
    
    def get_output_strategy(self, total_rows: int) -> Dict[str, Any]:
        """Determine output strategy based on row count."""
        if total_rows <= 500:
            return {
                "strategy": "single",
                "chunks": 1,
                "chunk_size": total_rows,
                "index_needed": False
            }
        elif total_rows <= 5000:
            return {
                "strategy": "chunked",
                "chunks": (total_rows + 499) // 500,
                "chunk_size": 500,
                "index_needed": False
            }
        else:
            return {
                "strategy": "chunked_indexed",
                "chunks": (total_rows + 499) // 500,
                "chunk_size": 500,
                "index_needed": True
            }
    
    def generate_dataset(
        self,
        data: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        format_type: str = "json",
        dataset_name: str = "dataset"
    ) -> Dict[str, Any]:
        """Generate complete dataset output with chunks and metadata."""
        strategy = self.get_output_strategy(len(data))
        
        if strategy["strategy"] == "single":
            filepath = self.write_single_file(
                data, 
                filename=dataset_name,
                format_type=format_type,
                include_header=True
            )
            chunks_info = [ChunkInfo(
                chunk_id=1,
                filename=f"{dataset_name}.{format_type}",
                row_count=len(data),
                start_row=1,
                end_row=len(data)
            )]
        else:
            chunks_info = self.write_data_chunks(
                data,
                base_filename=dataset_name,
                format_type=format_type,
                include_header=True
            )
            
            if strategy["index_needed"]:
                self.write_index(chunks_info)
        
        metadata["total_chunks"] = len(chunks_info)
        metadata["format"] = format_type
        
        self.write_metadata(metadata)
        
        return {
            "output_dir": self.config.processed_dir,
            "strategy": strategy,
            "chunks": chunks_info,
            "metadata_file": f"{self.config.metadata_dir}/metadata.json"
        }
