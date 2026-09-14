import pytest

from helper.company import genworkflow


class _Response:
    def __init__(self, status_code: int, body: dict):
        self.status_code = status_code
        self._body = body
        self.text = str(body)

    def json(self) -> dict:
        return self._body


def test_post_workflow_returns_id(monkeypatch):
    monkeypatch.setattr(genworkflow.requests, "post", lambda *a, **k: _Response(201, {"id": "wf_1"}))
    assert genworkflow.post_workflow({"name": "x"}) == "wf_1"


def test_post_workflow_raises_on_error_status(monkeypatch):
    monkeypatch.setattr(genworkflow.requests, "post", lambda *a, **k: _Response(400, {"message": "bad"}))
    with pytest.raises(RuntimeError):
        genworkflow.post_workflow({"name": "x"})


def test_post_workflow_raises_when_id_missing(monkeypatch):
    monkeypatch.setattr(genworkflow.requests, "post", lambda *a, **k: _Response(200, {}))
    with pytest.raises(RuntimeError):
        genworkflow.post_workflow({"name": "x"})
