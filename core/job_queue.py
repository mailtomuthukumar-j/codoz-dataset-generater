"""
Job Queue - Manages dataset generation jobs.

Provides job tracking and queue management for batch processing.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import uuid


class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class Job:
    id: str
    status: JobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    config: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    progress: int = 0
    logs: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "config": self.config,
            "progress": self.progress,
            "error": self.error,
            "logs": self.logs
        }


class JobQueue:
    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._pending: List[str] = []
        self._running: List[str] = []
        self._completed: List[str] = []
        self._failed: List[str] = []
    
    def create_job(self, config: Dict[str, Any]) -> str:
        """Create a new job and return its ID."""
        job_id = str(uuid.uuid4())[:8]
        
        job = Job(
            id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.now(),
            config=config
        )
        
        self._jobs[job_id] = job
        self._pending.append(job_id)
        
        return job_id
    
    def get_job(self, job_id: str) -> Optional[Job]:
        """Get job by ID."""
        return self._jobs.get(job_id)
    
    def get_pending_jobs(self) -> List[Job]:
        """Get all pending jobs."""
        return [self._jobs[jid] for jid in self._pending]
    
    def get_running_jobs(self) -> List[Job]:
        """Get all running jobs."""
        return [self._jobs[jid] for jid in self._running]
    
    def get_completed_jobs(self) -> List[Job]:
        """Get all completed jobs."""
        return [self._jobs[jid] for jid in self._completed]
    
    def get_failed_jobs(self) -> List[Job]:
        """Get all failed jobs."""
        return [self._jobs[jid] for jid in self._failed]
    
    def start_job(self, job_id: str) -> bool:
        """Mark a job as started."""
        job = self._jobs.get(job_id)
        if not job or job.status != JobStatus.PENDING:
            return False
        
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now()
        
        self._pending.remove(job_id)
        self._running.append(job_id)
        
        return True
    
    def complete_job(self, job_id: str, result: Dict[str, Any]) -> bool:
        """Mark a job as completed."""
        job = self._jobs.get(job_id)
        if not job or job.status != JobStatus.RUNNING:
            return False
        
        job.status = JobStatus.COMPLETED
        job.completed_at = datetime.now()
        job.result = result
        job.progress = 100
        
        self._running.remove(job_id)
        self._completed.append(job_id)
        
        return True
    
    def fail_job(self, job_id: str, error: str) -> bool:
        """Mark a job as failed."""
        job = self._jobs.get(job_id)
        if not job or job.status != JobStatus.RUNNING:
            return False
        
        job.status = JobStatus.FAILED
        job.completed_at = datetime.now()
        job.error = error
        
        self._running.remove(job_id)
        self._failed.append(job_id)
        
        return True
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending job."""
        job = self._jobs.get(job_id)
        if not job or job.status != JobStatus.PENDING:
            return False
        
        job.status = JobStatus.CANCELLED
        job.completed_at = datetime.now()
        
        self._pending.remove(job_id)
        
        return True
    
    def update_progress(self, job_id: str, progress: int) -> bool:
        """Update job progress percentage."""
        job = self._jobs.get(job_id)
        if not job:
            return False
        
        job.progress = max(0, min(100, progress))
        return True
    
    def add_log(self, job_id: str, message: str) -> bool:
        """Add a log entry to a job."""
        job = self._jobs.get(job_id)
        if not job:
            return False
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        job.logs.append(f"[{timestamp}] {message}")
        return True
    
    def get_next_pending(self) -> Optional[str]:
        """Get the next pending job ID."""
        return self._pending[0] if self._pending else None
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Get queue statistics."""
        return {
            "pending": len(self._pending),
            "running": len(self._running),
            "completed": len(self._completed),
            "failed": len(self._failed),
            "total": len(self._jobs)
        }
    
    def clear_completed(self) -> int:
        """Clear completed and failed jobs from memory."""
        cleared = 0
        
        for job_id in list(self._completed):
            del self._jobs[job_id]
            cleared += 1
        
        for job_id in list(self._failed):
            del self._jobs[job_id]
            cleared += 1
        
        self._completed.clear()
        self._failed.clear()
        
        return cleared
