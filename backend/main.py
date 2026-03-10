import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from controllers.login_controller import router as login_router
from controllers.registration_controller import router as registration_router
from controllers.otp_controller import router as otp_router
from controllers.forgotPassword_controller import router as forgot_router
from controllers.roles_controller import router as roles_router
from controllers.userRoles_controller import router as userRoles_router
from controllers.user_controller import router as user_router
from controllers.activity_controller import router as activity_router
from controllers.notification_controller import router as notification_router
from controllers.projectMember_controller import router as ProjectMember_router
from controllers.project_controller import router as Project_router
from controllers.task_controller import router as task_router
from controllers.taskComment_controller import router as taskComment_router
from controllers.taskAttachement_controller import router as taskAttachement_router

from database.connection import Base, engine
import models

# Absolute path to uploads folder (same directory as main.py)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000", "http://localhost:5174", "http://localhost:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
    expose_headers    = ["*"],
)

Base.metadata.create_all(bind=engine)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(login_router)
app.include_router(registration_router)
app.include_router(otp_router)
app.include_router(forgot_router)
app.include_router(roles_router)
app.include_router(userRoles_router)
app.include_router(user_router)
app.include_router(notification_router)
app.include_router(activity_router)
app.include_router(Project_router)
app.include_router(ProjectMember_router)
app.include_router(task_router)
app.include_router(taskComment_router)
app.include_router(taskAttachement_router)