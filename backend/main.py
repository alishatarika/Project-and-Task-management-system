from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.login_controller import router as login_router
from controllers.registration_controller import router as registration_router
from controllers.otp_controller import router as otp_router
from controllers.forgotPassword_controller import router as forgot_router
from database.connection import Base, engine

import models

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(login_router)
app.include_router(registration_router)
app.include_router(otp_router)
app.include_router(forgot_router)