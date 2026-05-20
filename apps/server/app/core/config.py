import warnings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@127.0.0.1:5432/qingtou_v6"
    JWT_SECRET: str = "replace-with-your-secure-jwt-secret-here"
    CORS_ORIGINS: list[str] = [
        "http://localhost:9527",
        "http://localhost:9528",
        "http://localhost:9529",
        "http://127.0.0.1:9527",
        "http://127.0.0.1:9528",
        "http://127.0.0.1:9529",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

if settings.JWT_SECRET == "replace-with-your-secure-jwt-secret-here":
    warnings.warn(
        "JWT_SECRET 使用默认值，生产环境请务必通过环境变量修改！",
        RuntimeWarning,
    )

if "user:password@" in settings.DATABASE_URL:
    warnings.warn(
        "DATABASE_URL 使用默认占位符，请通过 .env 文件配置真实数据库连接！",
        RuntimeWarning,
    )
