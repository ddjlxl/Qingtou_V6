from app.core.exceptions import BusinessRuleViolationError


def validate_vehicle_not_disabled(is_disabled: bool) -> None:
    if is_disabled:
        raise BusinessRuleViolationError("已停用的车辆不可操作")


def validate_driver_not_disabled(is_disabled: bool) -> None:
    if is_disabled:
        raise BusinessRuleViolationError("已停用的司机不可操作")


def validate_plate_no_unique(exists: bool) -> None:
    if exists:
        raise BusinessRuleViolationError("车牌号已存在")


def validate_phone_unique(exists: bool) -> None:
    if exists:
        raise BusinessRuleViolationError("手机号已存在")


def validate_driver_not_bound_to_other_vehicle(
    bound_vehicle_id: str | None,
    current_vehicle_id: str,
) -> None:
    if bound_vehicle_id is not None and bound_vehicle_id != current_vehicle_id:
        raise BusinessRuleViolationError("该司机已绑定其他车辆")


def validate_cert_type_matches_owner(
    cert_type: str,
    owner_type: str,
    vehicle_cert_types: frozenset[str],
    driver_cert_types: frozenset[str],
) -> None:
    if owner_type == "vehicle" and cert_type not in vehicle_cert_types:
        raise BusinessRuleViolationError("证照类型与所属对象不匹配：车辆不支持该证照类型")
    if owner_type == "driver" and cert_type not in driver_cert_types:
        raise BusinessRuleViolationError("证照类型与所属对象不匹配：司机不支持该证照类型")


def validate_vehicle_has_no_history(has_history: bool) -> None:
    if has_history:
        raise BusinessRuleViolationError("该车辆存在历史记录，不可删除，只能停用")


def validate_driver_has_no_history(has_history: bool) -> None:
    if has_history:
        raise BusinessRuleViolationError("该司机存在历史记录，不可删除，只能停用")
