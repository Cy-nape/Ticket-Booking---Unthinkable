from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from contextlib import asynccontextmanager

from app import models, schemas, auth
from app.routers import venues, events, seats, bookings, waitlist, users
from app.database import engine, get_db
from app.config import settings
from app.scheduler import start_scheduler, stop_scheduler

# Usually handled by Alembic, but we'll include it for completeness if running without migrations initially
# models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(title="Ticket Booking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(venues.router)
app.include_router(events.router)
app.include_router(seats.router)
app.include_router(bookings.router)
app.include_router(waitlist.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Ticket Booking API"}

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    # Ensure role is valid
    if user.role not in [e.value for e in models.RoleEnum]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    db_user = models.User(email=user.email, password_hash=hashed_password, role=models.RoleEnum(user.role))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.id, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/admin/dashboard", response_model=dict)
def admin_only_route(current_user: models.User = Depends(auth.require_role(["ADMIN"]))):
    return {"message": f"Welcome Admin {current_user.email}"}

@app.get("/organiser/dashboard", response_model=dict)
def organiser_only_route(current_user: models.User = Depends(auth.require_role(["ORGANISER", "ADMIN"]))):
    return {"message": f"Welcome Organiser {current_user.email}"}
