from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.security import create_token, decode_token, hash_password, verify_password


class TestHashPassword:
    def test_returns_bcrypt_hash(self):
        result = hash_password("123456")
        assert result.startswith("$2b$") or result.startswith("$2a$")

    def test_different_passwords_produce_different_hashes(self):
        h1 = hash_password("123456")
        h2 = hash_password("654321")
        assert h1 != h2

    def test_same_password_produces_different_hash_each_time(self):
        h1 = hash_password("123456")
        h2 = hash_password("123456")
        assert h1 != h2


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("123456")
        assert verify_password("123456", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("123456")
        assert verify_password("wrong", hashed) is False


class TestCreateToken:
    def test_returns_valid_jwt_string(self):
        token = create_token("user-id-001")
        assert isinstance(token, str)
        parts = token.split(".")
        assert len(parts) == 3

    def test_token_contains_sub_and_exp(self):
        token = create_token("user-id-001")
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        assert payload["sub"] == "user-id-001"
        assert "exp" in payload

    def test_token_expires_in_24_hours_by_default(self):
        token = create_token("user-id-001")
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        expected = datetime.now(timezone.utc) + timedelta(hours=24)
        diff = abs((exp - expected).total_seconds())
        assert diff < 10


class TestDecodeToken:
    def test_returns_payload_with_sub(self):
        token = create_token("user-id-001")
        payload = decode_token(token)
        assert payload["sub"] == "user-id-001"

    def test_expired_token_raises_exception(self):
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {"sub": "user-id-001", "exp": expire}
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
        with pytest.raises(AppException):
            decode_token(token)

    def test_invalid_token_raises_exception(self):
        with pytest.raises(AppException):
            decode_token("invalid.token.here")
