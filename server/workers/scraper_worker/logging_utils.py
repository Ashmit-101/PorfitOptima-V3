from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(level: str, scope: str, message: str, **fields: Any) -> None:
    entry: Dict[str, Any] = {
        "ts": _now_iso(),
        "level": level,
        "scope": scope,
        "msg": message,
    }
    if fields:
        entry.update(fields)
    json.dump(entry, sys.stdout)
    sys.stdout.write("\n")
    sys.stdout.flush()


def info(scope: str, message: str, **fields: Any) -> None:
    log("info", scope, message, **fields)


def warn(scope: str, message: str, **fields: Any) -> None:
    log("warn", scope, message, **fields)


def error(scope: str, message: str, **fields: Any) -> None:
    log("error", scope, message, **fields)
