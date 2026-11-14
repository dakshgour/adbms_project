"""Apply the MySQL course schema when the target database is empty."""
import logging
import os
import re
import ssl
from pathlib import Path

import pymysql

logger = logging.getLogger(__name__)

SQL_FILES = [
    "02_schema_reference.sql",
    "03_indexes.sql",
    "04_views.sql",
    "05_triggers.sql",
    "06_stored_procedures.sql",
    "07_sample_data.sql",
]


def _sql_dir() -> Path:
    override = os.getenv("SQL_DIR")
    if override:
        return Path(override)
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent / "database" / "mysql",
        Path("/database/mysql"),
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError("Could not find database/mysql SQL scripts.")


def _connect(database=None):
    connect_args = {}
    if os.getenv("MYSQL_SSL", "false").lower() in ("1", "true", "yes"):
        ssl_context = ssl.create_default_context(cafile=os.getenv("MYSQL_SSL_CA") or None)
        ssl_context.check_hostname = True
        connect_args["ssl"] = ssl_context
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3312")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", "password"),
        database=database,
        autocommit=True,
        charset="utf8mb4",
        connect_timeout=20,
        **connect_args,
    )


def _split_sql(script: str):
    delimiter = ";"
    buffer = []
    for line in script.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("DELIMITER "):
            delimiter = stripped.split(None, 1)[1]
            continue
        buffer.append(line)
        joined = "\n".join(buffer).rstrip()
        if joined.endswith(delimiter):
            statement = joined[: -len(delimiter)].strip()
            buffer = []
            if statement:
                yield statement
    tail = "\n".join(buffer).strip()
    if tail:
        yield tail


def _run_statement(cursor, statement: str, database: str):
    # SQL files commonly put a comment banner before their USE statement. Strip
    # leading MySQL comments before matching it, otherwise the script can switch
    # back to its hard-coded database and initialize the wrong schema.
    uncommented = re.sub(
        r"^(?:\s*(?:--[ \t][^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|/\*.*?\*/))*\s*",
        "",
        statement,
        flags=re.DOTALL,
    )
    if re.fullmatch(r"USE\s+`?[A-Za-z0-9_]+`?", uncommented, flags=re.IGNORECASE):
        if not re.fullmatch(r"[A-Za-z0-9_]+", database):
            raise ValueError("MYSQL_DATABASE must contain only letters, numbers, and underscores.")
        cursor.execute(f"USE `{database}`")
        return
    cursor.execute(statement)
    while True:
        try:
            cursor.fetchall()
        except Exception:
            pass
        if not cursor.nextset():
            break


def ensure_schema():
    database = os.getenv("MYSQL_DATABASE", "ecommerce_db")
    if not re.fullmatch(r"[A-Za-z0-9_]+", database):
        raise ValueError("MYSQL_DATABASE must contain only letters, numbers, and underscores.")
    logger.info("Checking MySQL schema for database '%s'", database)
    conn = _connect()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT GET_LOCK('adbms_schema_init', 120)")
            cursor.fetchone()
            cursor.execute(
                "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA "
                "WHERE SCHEMA_NAME = %s",
                (database,),
            )
            if not cursor.fetchone():
                cursor.execute(
                    f"CREATE DATABASE `{database}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            cursor.execute(f"USE `{database}`")
            cursor.execute("SHOW TABLES LIKE 'users'")
            if cursor.fetchone():
                logger.info("MySQL schema already present. Skipping SQL scripts.")
                cursor.execute("SELECT RELEASE_LOCK('adbms_schema_init')")
                return

            sql_dir = _sql_dir()
            for name in SQL_FILES:
                path = sql_dir / name
                logger.info("Applying %s", path)
                script = path.read_text(encoding="utf-8")
                for statement in _split_sql(script):
                    _run_statement(cursor, statement, database)
            cursor.execute("SELECT RELEASE_LOCK('adbms_schema_init')")
            logger.info("MySQL schema and sample data applied.")
    finally:
        conn.close()
