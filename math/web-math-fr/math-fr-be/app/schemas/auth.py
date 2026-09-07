from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Credentials(BaseModel):
    email: EmailStr
    secret: str = Field(min_length=10, max_length=128)
    name: str | None = Field(default=None, max_length=120)


class Account(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    name: str | None
