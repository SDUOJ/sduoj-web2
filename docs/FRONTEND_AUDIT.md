# web2 全仓审查与整改清单

日期：2026-09-06。分支：`feature/upgrade-antd-v5`。

> 历史快照：本文件记录 2026-09-06 的审计结果，不代表当前工作树状态。当前状态、质量数字和关闭证据以 [FRONTEND_CURRENT_AUDIT_2026-10-02.md](FRONTEND_CURRENT_AUDIT_2026-10-02.md) 为准。

本清单只保留当前仍未完成或部分完成的审计事项。已经处理的审计项已归档到提交记录和
[FRONTEND_FOLLOWUP.md](FRONTEND_FOLLOWUP.md)，不在本文件重复列出。

## 待处理事项

P1 表示数据、安全或流程风险，应优先处理；P2 表示可靠性、维护、性能或验收缺口。
“部分完成”表示已有缓解措施，但尚未满足完整关闭条件；“待验收”表示实现或服务证据不足，
不能按已通过处理。

| 编号 | 优先级/状态 | 位置与问题                                                                                         | 当前措施与关闭条件                                                                                                                                                                                           |
| ---- | ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-19 | P2 待优化   | 生产初始入口约 4 MiB，仍有 Vditor 编辑器、语法高亮器等资源体积警告。                               | 当前构建 entrypoint 为 4.04 MiB（58 个入口资源，其中 57 个 JS；JS gzip 约 1.23 MiB）。继续拆分 ProComponents、编辑器、高亮器等入口，并以性能预算和实测首屏耗时验收；不能通过关闭 performance warnings 关闭。 |
| A-21 | 外部阻塞    | 旧 standalone exam 后端不在当前 Java checkout，完整考试生命周期无法在当前工作区启动。              | 已确认前端路由/API仍存在，但没有可运行的独立考试服务和 fixture；需要提供后端 checkout 或隔离服务后，覆盖开始、答题、交卷、重连、到时自动交卷和权限边界。题单 exam 模式验收不能替代 standalone exam 验收。    |
| A-23 | P2 部分完成 | 已有 mock 核心流程和本地真实服务验收；真实后端上传失败/取消、签到切换仍缺完整 fixture 与 CI 矩阵。 | 已补 Playwright 四浏览器矩阵的 ZIP 上传失败→重试成功、关闭取消和迟到结果丢弃；真实 workflow 仍覆盖题单答题/交卷、判题、WebSocket 重连和登出。继续补真实上传/签到 fixture 并纳入 CI 后关闭。                  |

## 当前验证基线

以下数字用于判断 2026-09-06 的回归影响，不代表当前工作树基线，也不代表上述待处理项已经关闭。

| 项目                       | 最近结果                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Jest / coverage            | 77 suites、367 tests 通过；Lines 28.66%；Statements 27.87%；Branches 27.75%；Functions 18.98%                                    |
| TypeScript / lint / format | TypeScript 通过；lint 0 errors；format 0 failures；`git diff --check` 通过                                                       |
| Mock Playwright            | 45 passed；3 个非移动项目跳过；覆盖登录/登出、权限拒绝、移动管理、HTML 安全边界和上传失败/取消                                   |
| 视觉回归                   | Chromium 桌面与移动基线通过                                                                                                      |
| 本地真实服务               | 3 个场景通过：代理、真实题目浏览、隔离账号题单答题/交卷/判题/WebSocket/登出                                                      |
| 生产构建                   | 通过；`xlsx` 已从 bundle 中移除，Browserslist 警告已消失；entrypoint 4.04 MiB，JS gzip 约 1.23 MiB，Vditor 资源体积警告归入 A-19 |

## 依赖审计范围

[DEPENDENCIES.json](audit/DEPENDENCIES.json) 保存基线扫描的公告链接、受影响版本范围和依赖链。
基线扫描为 48 个包、133 条按公告 URL 去重的公告；当前 `yarn audit --groups dependencies`
复验为 0 critical、0 high、0 moderate、0 low。ProLayout 的固定 `path-to-regexp@8.2.0` 通过
Yarn resolution 提升到已修复的 `8.4.0`，React Router 与开发服务器仍保留各自兼容版本。
Yarn 会提示该 resolution 与 ProLayout 的固定请求版本不同；这是有意的、仅限该嵌套生产依赖
的安全覆盖，安装后的实际模块版本和 audit 结果均已复验。

- `xlsx`：已从依赖树和业务导入路径移除；新适配层统一使用 `read-excel-file`/`write-excel-file`，并保留 ZIP 膨胀限制。
- `axios` / `follow-redirects` / `form-data`：分别确认浏览器 XHR、Node adapter、proxy 和原型污染前提，不能只按公告数量判断可达性。
- `webpack-dev-server`、图片优化器及其解压/命令行依赖：属于开发/构建边界，当前 audit 已无可报告漏洞；后续升级仍按维护计划进行。

## 复验要求

每个后续变更应引用 A-19、A-21 或 A-23，保留原始复现条件、实现说明和验证命令。
涉及真实服务的事项必须提供隔离 fixture 的创建、清理和运行日志；mock 测试、截图更新或构建成功
不能替代真实验收。新的风险接受决定应记录影响范围、补偿控制和复审日期。

建议复验命令：

```sh
yarn format:check
yarn typecheck
yarn lint
yarn test:coverage
yarn build
yarn test:e2e
yarn test:visual
LOCAL_BASE_URL=http://127.0.0.1:3002 yarn test:local tests/local/services.spec.ts tests/local/workflows.spec.ts
yarn audit --json > output/audit-dependencies.jsonl
```
