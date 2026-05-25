import uuid

# 系统用户 ID，由数据库迁移脚本创建（username="system", status="disabled"）
# 用于出库自动创建调度任务等系统级操作
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
