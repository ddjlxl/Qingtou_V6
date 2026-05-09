import pytest

from app.core.exceptions import BusinessRuleViolationError
from app.core.validators.fleet_validator import (
    validate_vehicle_not_disabled,
    validate_driver_not_disabled,
    validate_plate_no_unique,
    validate_phone_unique,
    validate_driver_not_bound_to_other_vehicle,
    validate_cert_type_matches_owner,
    validate_vehicle_has_no_history,
    validate_driver_has_no_history,
)

VEHICLE_CERT_TYPES = frozenset({
    "vehicle_license",
    "road_transport",
    "compulsory_insurance",
    "commercial_insurance",
    "annual_inspection",
})

DRIVER_CERT_TYPES = frozenset({
    "driving_license",
    "qualification",
})


class TestValidateVehicleNotDisabled:
    def test_passes_when_not_disabled(self):
        validate_vehicle_not_disabled(False)

    def test_raises_when_disabled(self):
        with pytest.raises(BusinessRuleViolationError, match="已停用的车辆不可操作"):
            validate_vehicle_not_disabled(True)


class TestValidateDriverNotDisabled:
    def test_passes_when_not_disabled(self):
        validate_driver_not_disabled(False)

    def test_raises_when_disabled(self):
        with pytest.raises(BusinessRuleViolationError, match="已停用的司机不可操作"):
            validate_driver_not_disabled(True)


class TestValidatePlateNoUnique:
    def test_passes_when_not_exists(self):
        validate_plate_no_unique(False)

    def test_raises_when_exists(self):
        with pytest.raises(BusinessRuleViolationError, match="车牌号已存在"):
            validate_plate_no_unique(True)


class TestValidatePhoneUnique:
    def test_passes_when_not_exists(self):
        validate_phone_unique(False)

    def test_raises_when_exists(self):
        with pytest.raises(BusinessRuleViolationError, match="手机号已存在"):
            validate_phone_unique(True)


class TestValidateDriverNotBoundToOtherVehicle:
    def test_passes_when_not_bound(self):
        validate_driver_not_bound_to_other_vehicle(None, "vehicle-1")

    def test_passes_when_bound_to_same_vehicle(self):
        validate_driver_not_bound_to_other_vehicle("vehicle-1", "vehicle-1")

    def test_raises_when_bound_to_different_vehicle(self):
        with pytest.raises(BusinessRuleViolationError, match="该司机已绑定其他车辆"):
            validate_driver_not_bound_to_other_vehicle("vehicle-2", "vehicle-1")


class TestValidateCertTypeMatchesOwner:
    def test_passes_for_vehicle_cert_with_vehicle_owner(self):
        validate_cert_type_matches_owner(
            "vehicle_license", "vehicle", VEHICLE_CERT_TYPES, DRIVER_CERT_TYPES
        )

    def test_passes_for_driver_cert_with_driver_owner(self):
        validate_cert_type_matches_owner(
            "driving_license", "driver", VEHICLE_CERT_TYPES, DRIVER_CERT_TYPES
        )

    def test_raises_for_vehicle_cert_with_driver_owner(self):
        with pytest.raises(BusinessRuleViolationError, match="证照类型与所属对象不匹配"):
            validate_cert_type_matches_owner(
                "vehicle_license", "driver", VEHICLE_CERT_TYPES, DRIVER_CERT_TYPES
            )

    def test_raises_for_driver_cert_with_vehicle_owner(self):
        with pytest.raises(BusinessRuleViolationError, match="证照类型与所属对象不匹配"):
            validate_cert_type_matches_owner(
                "driving_license", "vehicle", VEHICLE_CERT_TYPES, DRIVER_CERT_TYPES
            )


class TestValidateVehicleHasNoHistory:
    def test_passes_when_no_history(self):
        validate_vehicle_has_no_history(False)

    def test_raises_when_has_history(self):
        with pytest.raises(BusinessRuleViolationError, match="该车辆存在历史记录"):
            validate_vehicle_has_no_history(True)


class TestValidateDriverHasNoHistory:
    def test_passes_when_no_history(self):
        validate_driver_has_no_history(False)

    def test_raises_when_has_history(self):
        with pytest.raises(BusinessRuleViolationError, match="该司机存在历史记录"):
            validate_driver_has_no_history(True)
