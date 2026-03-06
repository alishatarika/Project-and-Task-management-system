from pydantic import BaseModel
from typing import Optional

class TaskAttachmentCreate(BaseModel):
    task_id: int
    uploaded_by: int
    file_name: str
    file_path: str
    
class TaskAttachmentUpdate(BaseModel):
    task_id: Optional[int]=None
    uploaded_by:Optional[int]=None
    file_name: Optional[str]=None
    file_path: Optional[str]=None