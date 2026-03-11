from sqlalchemy.orm import Session
from models.Tasks import Task
from datetime import datetime, timezone
from models.Project import Project
from models.Users import Users
from models.ProjectMembers import ProjectMember
from fastapi import HTTPException
from services.notification_services import create_notification


def _is_project_member_or_owner(db: Session, project_id: int, user_id: int) -> bool:
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at == None).first()
    if project and project.owner_id == user_id:
        return True
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
        ProjectMember.deleted_at == None
    ).first()
    return member is not None


def create_task(db: Session, data, current_user: Users):
    project = db.query(Project).filter(
        Project.id == data.project_id,
        Project.deleted_at == None
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not _is_project_member_or_owner(db, data.project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only project members or owner can create tasks")

    creator = db.query(Users).filter(
        Users.id == data.created_by,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found or inactive")

    assignee = None
    if data.assigned_to:
        assignee = db.query(Users).filter(
            Users.id == data.assigned_to,
            Users.is_verified == True,
            Users.status == True,
            Users.deleted_at == None
        ).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assigned user not found or inactive")

    task = Task(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        created_by=data.created_by,
        assigned_to=data.assigned_to,
        task_status=data.task_status,
        priority=data.priority,
        due_date=data.due_date
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    if assignee and assignee.id != current_user.id:
        create_notification(db, user_id=assignee.id, send_by=current_user.id, message=f'You have been assigned a new task: "{task.title}" in project "{project.name}" by {current_user.username}.')

    return task


def get_tasks(db: Session):
    return db.query(Task).filter(Task.deleted_at == None).all()


def get_task(db: Session, task_id: int):
    return db.query(Task).filter(
        Task.id == task_id,
        Task.deleted_at == None
    ).first()


def update_task(db: Session, task_id: int, data, current_user: Users):
    task = get_task(db, task_id)

    if not task:
        return None

    if not _is_project_member_or_owner(db, task.project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only project members or owner can edit tasks")

    update_data = data.dict(exclude_unset=True)

    old_assigned_to = task.assigned_to
    old_status = task.task_status
    old_priority = task.priority

    if "assigned_to" in update_data and update_data["assigned_to"] is not None:
        assignee = db.query(Users).filter(
            Users.id == update_data["assigned_to"],
            Users.is_verified == True,
            Users.status == True,
            Users.deleted_at == None
        ).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assigned user not found or inactive")

    for key, value in update_data.items():
        setattr(task, key, value)

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)

    project = db.query(Project).filter(Project.id == task.project_id).first()
    project_name = project.name if project else "a project"

    new_assigned_to = update_data.get("assigned_to", old_assigned_to)

    if "assigned_to" in update_data and new_assigned_to is not None and new_assigned_to != old_assigned_to and new_assigned_to != current_user.id:
        create_notification(db, user_id=new_assigned_to, send_by=current_user.id, message=f'You have been assigned to task: "{task.title}" in project "{project_name}" by {current_user.username}.')

    if "assigned_to" in update_data and old_assigned_to is not None and new_assigned_to != old_assigned_to and old_assigned_to != current_user.id:
        create_notification(db, user_id=old_assigned_to, send_by=current_user.id, message=f'You have been unassigned from task: "{task.title}" in project "{project_name}" by {current_user.username}.')

    if "task_status" in update_data and update_data["task_status"] != old_status and task.assigned_to and task.assigned_to != current_user.id:
        create_notification(db, user_id=task.assigned_to, send_by=current_user.id, message=f'Status of task: "{task.title}" has been updated to "{task.task_status}" by {current_user.username}.')

    if "priority" in update_data and update_data["priority"] != old_priority and task.assigned_to and task.assigned_to != current_user.id:
        create_notification(db, user_id=task.assigned_to, send_by=current_user.id, message=f'Priority of task: "{task.title}" has been changed to "{task.priority}" by {current_user.username}.')

    return task


def delete_task(db: Session, task_id: int, current_user: Users):
    task = get_task(db, task_id)

    if not task:
        return None

    if not _is_project_member_or_owner(db, task.project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only project members or owner can delete tasks")

    assigned_to = task.assigned_to
    project = db.query(Project).filter(Project.id == task.project_id).first()
    project_name = project.name if project else "a project"

    task.deleted_at = datetime.now(timezone.utc)
    db.commit()

    if assigned_to and assigned_to != current_user.id:
        create_notification(db, user_id=assigned_to, send_by=current_user.id, message=f'Task: "{task.title}" in project "{project_name}" has been deleted by {current_user.username}.')

    return task