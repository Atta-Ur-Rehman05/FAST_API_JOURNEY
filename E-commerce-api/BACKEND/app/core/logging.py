# this file contain the shared logging utilities for the application
# this mean that this file will be used by all the other modules in the application

import json
import logging
from datetime import UTC, datetime

class JsonFormatter(logging.Formatter):  # this is the base class for all the settings mean we can say it is the parent class of all the settings
    def format(self, record: logging.LogRecord) -> str:  # this is the format method
        payload = {"timestamp": datetime.now(UTC).isoformat(), "level": record.levelname, "logger": record.name, "message": record.getMessage()}
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)

def configure_logging() -> None:    # this is the configure_logging method
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    if not any(isinstance(getattr(item, "formatter", None), JsonFormatter) for item in root.handlers):
        root.handlers.clear()
        root.addHandler(handler)
    root.setLevel(logging.INFO)
