import warnings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./qingtou.db"
    JWT_SECRET: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = [
        "http://localhost:9527",
        "http://localhost:9528",
        "http://127.0.0.1:9527",
        "http://127.0.0.1:9528",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

if settings.JWT_SECRET == "change-me-in-production":
    warnings.warn(
        "JWT_SECRET 使用默认值，生产环境请务必通过环境变量修改！",
        RuntimeWarning,
    )
