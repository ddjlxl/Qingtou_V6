# Fleet 已知问题清单

> **版本**：v1.2
> **创建日期**：2026-05-07
> **更新日期**：2026-05-27
> **用途**：记录所有已发现但未修复的问题，避免重复报告，确保不遗漏。
> **配套文件**：[review-checklist.md](./review-checklist.md) — 审查时使用的检查清单

---

## 使用说明

1. 新发现问题 → 追加到对应优先级表格
2. 问题修复 → 将状态改为 ✅，填写修复日期
3. 问题确认不需要修复 → 标记 WONTFIX，注明理由
4. 每次审查前先读此文件，避免重复报告已知问题

---

## P0 阻塞（必须修复才能进入开发）

| ID | 来源文件:行号 | 问题描述 | 修复建议 | 状态 | 发现日期 |
|----|-------------|---------|---------|:---:|:---:|
| ISS-001 | [design.md](file:///e:/Qingtou_V6/specs/features/fleet/design.md#L817-L822) | `_safe_attachment_path` 使用 `os.path.basename(attachment)` 截掉了子目录 `certificates/`，导致路径从 `uploads/certificates/abc123.jpg` 变成 `uploads/abc123.jpg` | 要么 `attachment` 只存纯文件名，子目录硬编码；要么改用安全的路径拼接保留子目录结构 | ✅ | 2026-05-07 |
| ISS-002 | [tasks.md](file:///e:/Qingtou_V6/specs/features/fleet/tasks.md) Task-002 | 任务 Description 遗漏了移除 `bound_vehicle_id` 和 `status`/`DriverStatus` 的步骤，与 design.md 不一致 | 在 Description 中补充步骤 4（移除 bound_vehicle_id）和步骤 5（移除 status/DriverStatus），验证标准同步补充 | ✅ | 2026-05-07 |
| ISS-003 | [design.md](file:///e:/Qingtou_V6/specs/features/fleet/design.md#L768) | `check_certificate_expiry()` 引用了 `app.core.database.async_session_factory`，但未审计该工厂函数是否存在 | 编码前先确认 `async_session_factory` 存在于 `apps/server/app/core/database.py`，接口为返回 AsyncSession 的 async context manager | ✅ | 2026-05-07 |

---

## P1 重要（建议修复后再开发）

| ID | 来源文件:行号 | 问题描述 | 修复建议 | 状态 | 发现日期 |
|----|-------------|---------|---------|:---:|:---:|
| ISS-004 | [design.md](file:///e:/Qingtou_V6/specs/features/fleet/design.md#L595-L650) | `useFleetStore` 包含 20+ actions，预估超过 300 行 | 考虑按实体拆分为多个 Store，或至少在 tasks.md 中增加拆分检查点 | ✅ | 2026-05-07 |
| ISS-005 | [tasks.md](file:///e:/Qingtou_V6/specs/features/fleet/tasks.md) Task-009 → Task-010 | Task-010（Axios 全局字段名转换）被 Task-009（审计）阻塞，可能阻塞所有后续前端任务 | 方案 A：Task-009/010 提升为独立基础设施任务提前完成；方案 B：fleet 前端暂时手动处理字段映射 | ✅ | 2026-05-07 |
| ISS-006 | [requirements.md](file:///e:/Qingtou_V6/specs/features/fleet/requirements.md) AC-019/AC-021 | 级联删除证照时，附件文件已被手动删除的边缘情况未在 requirements 中定义 | 在 Edge Cases 中补充 AC：附件文件不存在时静默跳过，不报错 | ✅ | 2026-05-07 |
| ISS-007 | [design.md](file:///e:/Qingtou_V6/specs/features/fleet/design.md#L270) | `/vehicles/{id}/availability` 路由可能被 `/vehicles/{id}` 先匹配，`availability` 被当作 `{id}` 参数 | 标注路由注册顺序要求（availability 在 {id} 之前），或改为 `/vehicles/{id}/check-availability` | ✅ | 2026-05-07 |

---

## P2 轻微（可延后修复）

| ID | 来源文件:行号 | 问题描述 | 修复建议 | 状态 | 发现日期 |
|----|-------------|---------|---------|:---:|:---:|
| ISS-008 | [requirements.md](file:///e:/Qingtou_V6/specs/features/fleet/requirements.md) | AC 编号跳跃（AC-032~035 穿插在 Happy Path 和 Edge Cases 之间），编号顺序与章节顺序不完全对应 | 非阻塞，下个版本整理编号 | 🟢 | 2026-05-07 |
| ISS-009 | [design.md](file:///e:/Qingtou_V6/specs/features/fleet/design.md#L540) | `__tests__/` 目录缺少 `FleetPage.test.ts` 和 `StatisticsTab.test.ts`（虽然后者在 tasks.md Task-507 中有） | 在 design.md 的测试目录结构中补充 | ✅ | 2026-05-07 |

---

## 已修复

| ID | 问题描述 | 修复日期 | 修复方式 |
|----|---------|:---:|------|
| ISS-001 | `_safe_attachment_path` 路径截断 Bug | 2026-05-07 | 修改设计：`attachment` 只存纯文件名，子目录 `certificates/` 在代码中硬编码 |
| ISS-002 | Task-002 遗漏步骤 | 2026-05-07 | 补充步骤：移除 `bound_vehicle_id`、移除 `status`/`DriverStatus` |
| ISS-003 | `async_session_factory` 不存在 | 2026-05-07 | 改为 `AsyncSessionLocal`（实际存在的 sessionmaker 实例） |
| ISS-004 | `useFleetStore` 超过 300 行 | 2026-05-27 | 按实体拆分为 6 个 Store：useFleetStore、useFleetVehicles、useFleetDrivers、useFleetCertificates、useFleetTransport、useFleetStatistics |
| ISS-005 | Axios 全局字段名转换阻塞 | 2026-05-27 | fleet 前端手动处理字段映射，后续统一优化 |
| ISS-006 | 附件缺失边缘情况未定义 | 2026-05-07 | 新增 AC-036：附件文件不存在时静默跳过，记录 warning 日志 |
| ISS-007 | 路由冲突风险 | 2026-05-07 | 在 API 设计部分标注路由注册顺序要求 |
| ISS-009 | 测试目录缺少 FleetPage.test.ts 和 StatisticsTab.test.ts | 2026-05-27 | 已创建 FleetPage.test.ts 和 StatisticsTab.test.ts |

---

## WONTFIX（确认不修复）

| ID | 问题描述 | 不修复理由 | 确认日期 |
|----|---------|-----------|:---:|
| | | | |

---

## 统计

| 优先级 | 待修复 | 已修复 |
|:---:|:---:|:---:|
| 🔴 P0 | 0 | 3 |
| 🟡 P1 | 0 | 4 |
| 🟢 P2 | 1 | 1 |
| **合计** | **1** | **8** |
