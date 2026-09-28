from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChildCreate(BaseModel):
    name: str
    date_of_birth: date
    # age / age_group are ignored if sent by the client - the server always
    # (re)computes them from date_of_birth so a client can't set a mismatched
    # or out-of-range value.
    age: int | None = None
    age_group: str | None = None
    profile_image: str | None = None


class ChildResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    name: str
    date_of_birth: date
    age: int
    age_group: str
    profile_image: str | None
    created_at: datetime
    updated_at: datetime