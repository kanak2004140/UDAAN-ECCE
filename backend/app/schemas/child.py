from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChildCreate(BaseModel):
    name: str
    date_of_birth: date
    age: int
    age_group: str
    profile_image: str | None = None


class ChildResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    date_of_birth: date
    age: int
    age_group: str
    profile_image: str | None
    created_at: datetime
    updated_at: datetime