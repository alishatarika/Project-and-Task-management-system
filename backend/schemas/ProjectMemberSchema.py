from pydantic import BaseModel
from typing import Optional

class ProjectMemberCreate(BaseModel):
    project_id: int
    user_id: int
    
class ProjectMemberUpdate(BaseModel):
    project_id: Optional[int]=None
    user_id: Optional[int]=None
    