from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseModel):
    env: str = "local"
    debug: bool = False
    title: str = "math-fr backend"
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:1263"


class LogConfig(BaseModel):
    level: str = "INFO"
    path: str = "app/logs"
    filename: str = "math-fr.log"
    rotate_mb: int = 20
    keep: int = 5
    line: str = "%(asctime)s %(levelname)-7s %(name)s %(message)s"


class DbConfig(BaseModel):
    host: str = "localhost"
    port: int = 1586
    name: str = "mathfr"
    user: str = "mathfr"
    pool_size: int = 5
    pool_recycle: int = 1800


class CookieConfig(BaseModel):
    name: str = "mathfr_session"
    secure: bool = False
    samesite: str = "lax"
    max_age: int = 1209600


class PrivacyConfig(BaseModel):
    visit_retention_days: int = 30
    consent_suffix: str = "_consent"


class LimitConfig(BaseModel):
    max_width: int = Field(default=4096, gt=0)
    max_height: int = Field(default=4096, gt=0)
    max_iters: int = Field(default=100_000, gt=0)
    max_work: int = Field(default=6_000_000_000, gt=0)
    max_points: int = Field(default=2_000_000, gt=0)
    max_grid: int = Field(default=401, gt=0)
    max_particles: int = Field(default=20_000, gt=0)


class SocketConfig(BaseModel):
    origins: str = "http://localhost:1263"
    # capacity is allocated for as long as a connection is open, whether or not
    # it is computing, so both of these are cost settings as much as they are
    # protections. a deep render takes a few seconds; sixty four at once on one
    # vCPU would each take a minute.
    max_connections: int = 8
    idle_seconds: int = 30
    levels: tuple[int, ...] = (8, 4, 2, 1)


class RateConfig(BaseModel):
    enabled: bool = True
    per_minute: int = 120


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_CONFIG__",
        env_nested_delimiter="__",
        extra="ignore",
    )

    app: AppConfig = AppConfig()
    log: LogConfig = LogConfig()
    db: DbConfig = DbConfig()
    cookie: CookieConfig = CookieConfig()
    privacy: PrivacyConfig = PrivacyConfig()
    limit: LimitConfig = LimitConfig()
    socket: SocketConfig = SocketConfig()
    rate: RateConfig = RateConfig()

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.app.cors_origins.split(",") if o.strip()]

    @property
    def socket_origins(self) -> list[str]:
        return [o.strip() for o in self.socket.origins.split(",") if o.strip()]


settings = Settings()
