# R-05 上传、拍照与考勤真实矩阵

复核时间：2026-10-04（UTC）。本项保持部分修复；下表区分真实服务、前端边界测试和缺失条件。

## 已完成

| 流程                   | 证据                                                                                                      | 限制                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ZIP 上传成功与重复内容 | R-12 双视口页面验证既有 ZIP、MD5 命中及取消表单；R-05 真实批量 multipart 两个 `files` 字段返回同一既有 ID | 使用已经存储的 ZIP，不宣称新内容上传/服务端清理通过                     |
| 匿名单文件/批量上传    | 真实 `/filesys/upload` 和 `/filesys/uploadFiles` 均 HTTP 401 / code 401                                   | 已隔离匿名 context，不提交新内容                                        |
| 缺少 multipart 字段    | 真实服务拒绝请求；日志分别记录 HTTP 与业务码                                                              | 当前返回 HTTP 500，属于后端错误映射缺口，不能按正确的 HTTP 400 验收关闭 |
| 上传元数据             | 相同 MD5 查询前后 FileReference 完全相同                                                                  | 未创建模板、修改题单或删除已有文件                                      |
| 非法上传引用           | cache、single、batch 在发布 callback 前验证非空字符串 ID；数量不符、空洞及无效项均拒绝                    | mock 证明客户端边界，不代表后端返回错误 DTO 已通过真实验收              |
| 取消与迟到响应         | 前端工具测试证明 AbortSignal 传播及完成后再次检查；取消后不调用 callback                                  | 尚未执行真实网络中途取消/30 秒超时，不以 mock 充当真实网络证据          |

`tests/local/upload-boundaries.spec.ts` 是可复现的本地真实 filesys 测试：限制 loopback URL，使用专用 `ai_dev_` 账号，关闭 trace；日志不含密码和原始用户信息。已有 ZIP 下载只对 429 最多重试两次，其余失败不得重试掩盖。

## 仍需服务或隔离 fixture

### 题单拍照

`PSTakePicture` 当前调用 `getDisplayMedia`，本地截帧后执行 `canvas.toDataURL`，没有发送上传请求，也没有保存成功的服务端确认。它并不是已接通摄像头上传的实现。本地 Java filesys 上传接口不能说明这些图像应如何绑定题单、用户、时间和权限。

真实 AutoLab OpenAPI 有 204 条路径，仅有 AI 文件上传，没有题单 proctor/photo/picture 上传契约。AI 文件上传用于文档等资源，不能猜测为监考接口。需要后端提供绑定、权限、频率、格式/大小、重试及保留/清理协议后再实现上传；当前不改变考试安全要求或假装已上传。

### AutoLab 考勤

- `/attendance/{sg_id}/sign-in` 暴露 `sign_type`，但 `model/sign_in_record.py` 对签退明确返回“当前系统仅支持签到，不支持单独签退”。需要实现或产品明确撤销签退验收要求，不能把失败当成功。
- 当前本地 `/ps/course/list` 返回唯一课程：course 2 / group 83；不属于专用测试账号，也不带隔离 fixture 标记。本轮未初始化、更改或删除它的考勤/座位。
- `CourseModel.remove_course_time` 拒绝删除已有学生考勤的时间，`delete_course` 拒绝仍有考勤的课程；缺少考勤记录清理 API。直接新建考勤 fixture 会留下无法通过公开接口回收的记录，不能宣称资源清理完成。
- 需要可重置的专用 group/course/student、预建 schedule/sign 和清理途径，再验证签到、重复签到、权限拒绝、二维码 token 消费、座位、超时/取消和并发结果。
- `AttendanceGrid` 未在现有页面导入，不能只测试该孤立组件就宣称线上考勤入口通过；实际管理入口是 `CourseSignManagement`。

### 新文件与外部作业

Java filesys `FileController` 暴露上传/查询/下载，没有客户端删除新文件 API。新内容 fixture 需要隔离文件存储或明确垃圾回收协议；外部作业需要专用安全下载目标、有效/失效凭证及资源清理策略。不得对当前用户资源作破坏性操作。

## 日志与状态

- `output/audit/R-05/preflight.log`：真实服务路径清单及非所有者课程元信息；没有凭证。
- `output/audit/R-05/real-upload.log`：真实上传拒绝、匿名权限、两文件去重、元数据不变。
- `output/audit/R-05/{typecheck.log,upload-unit.log,quality.log,build.log,bundle.log,e2e.log,dev-regression.log}`：定向和必要回归。
- 日志为忽略的本地产物；本文件及主审计文档保存提交内摘要。R-05 不因这些局部通过而关闭。2026-10-05 已确认 Java exam 退役，R-04 按废弃处置；R-12 跟踪活跃 AutoLab 考务/题单与业务生命周期，不再等待弃用 Java exam 服务。
