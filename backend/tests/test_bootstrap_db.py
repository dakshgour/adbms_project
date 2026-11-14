from bootstrap_db import _run_statement


class RecordingCursor:
    def __init__(self):
        self.statements = []

    def execute(self, statement):
        self.statements.append(statement)


def test_commented_use_statement_targets_requested_database():
    cursor = RecordingCursor()
    statement = "-- SQL file header\n/* schema notes */\nUSE ecommerce_db"

    _run_statement(cursor, statement, "ecommerce_test_db")

    assert cursor.statements == ["USE `ecommerce_test_db`"]
