"""In-memory stand-in for the parts of supabase-py the backend uses."""
from dataclasses import dataclass
from datetime import datetime, timezone
from itertools import count
from typing import Any, Callable


@dataclass
class FakeResponse:
    data: Any


class _NotFilter:
    def __init__(self, query: "FakeQuery"):
        self._query = query

    def is_(self, column: str, value: str) -> "FakeQuery":
        assert value == "null", "fake only supports not_.is_(column, 'null')"
        return self._query._where(lambda row: row.get(column) is not None)


class FakeQuery:
    def __init__(self, db: "FakeSupabase", table: str):
        self._db = db
        self._table = table
        self._op = "select"
        self._payload: dict | None = None
        self._filters: list[Callable[[dict], bool]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None

    def select(self, *_columns: str) -> "FakeQuery":
        self._op = "select"
        return self

    def insert(self, payload: dict) -> "FakeQuery":
        self._op, self._payload = "insert", payload
        return self

    def update(self, payload: dict) -> "FakeQuery":
        self._op, self._payload = "update", payload
        return self

    def delete(self) -> "FakeQuery":
        self._op = "delete"
        return self

    def eq(self, column: str, value: Any) -> "FakeQuery":
        return self._where(lambda row: row.get(column) == value)

    @property
    def not_(self) -> _NotFilter:
        return _NotFilter(self)

    def order(self, column: str, desc: bool = False) -> "FakeQuery":
        self._order = (column, desc)
        return self

    def limit(self, size: int) -> "FakeQuery":
        self._limit = size
        return self

    def _where(self, predicate: Callable[[dict], bool]) -> "FakeQuery":
        self._filters.append(predicate)
        return self

    def execute(self) -> FakeResponse:
        if self._op == "insert":
            return FakeResponse([self._db.insert_row(self._table, self._payload)])
        rows = self._db.tables.get(self._table, [])
        matched_ids = {id(row) for row in rows if all(f(row) for f in self._filters)}
        matched = [row for row in rows if id(row) in matched_ids]
        if self._op == "update":
            self._db.tables[self._table] = [
                {**row, **self._payload} if id(row) in matched_ids else row for row in rows
            ]
            return FakeResponse([{**row, **self._payload} for row in matched])
        if self._op == "delete":
            self._db.tables[self._table] = [row for row in rows if id(row) not in matched_ids]
            return FakeResponse([dict(row) for row in matched])
        if self._order:
            column, desc = self._order
            matched = sorted(matched, key=lambda row: row.get(column), reverse=desc)
        if self._limit is not None:
            matched = matched[: self._limit]
        return FakeResponse([dict(row) for row in matched])


class _FakeRpc:
    def __init__(self, result: Any):
        self._result = result

    def execute(self) -> FakeResponse:
        return FakeResponse(self._result)


class FakeSupabase:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.tables: dict[str, list[dict]] = {}
        self.rpc_calls: list[tuple[str, dict]] = []
        self.quota_used: dict[str, int] = {}
        self._ids = count(1)

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self, name)

    def insert_row(self, table: str, payload: dict) -> dict:
        row = {"id": next(self._ids), "created_at": datetime.now(timezone.utc).isoformat(), **payload}
        self.tables = {**self.tables, table: [*self.tables.get(table, []), row]}
        return dict(row)

    def rpc(self, name: str, params: dict) -> _FakeRpc:
        self.rpc_calls.append((name, params))
        if name == "consume_quota":
            used = self.quota_used.get(params["p_action"], 0)
            allowed = params["p_limit"] > 0 and used < params["p_limit"]
            if allowed:
                self.quota_used = {**self.quota_used, params["p_action"]: used + 1}
            return _FakeRpc([{"allowed": allowed}])
        if name == "reset_demo":
            return _FakeRpc([{"ok": True}])
        return _FakeRpc([])
