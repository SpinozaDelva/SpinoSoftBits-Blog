# config.py - Environment Configuration
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database (Supabase Postgres async connection string)
    DATABASE_URL: str = ""

    # Authentication
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # CORS — comma-separated list of allowed origins.
    # Override in Railway with your real frontend origin(s). No spaces needed;
    # they're trimmed below. Note the CORRECT domain: spinosoftbits.com
    CORS_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "https://blog.spinosoftbits.com,"
        "https://spinosoftbits.com,"
        "https://www.spinosoftbits.com"
    )

    # Email (Resend — matches the main SpinoSoftBits site).
    # While the domain is verifying, FROM_EMAIL can stay onboarding@resend.dev;
    # switch to hello@spinosoftbits.com once verified in Resend.
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "onboarding@resend.dev"
    FROM_NAME: str = "SpinoSoftBits Blog"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse the comma-separated CORS_ORIGINS string into a clean list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"  # ignore leftover env vars (e.g. an old SENDGRID_API_KEY)


settings = Settings()