# sduoj-web2 当前前端进展与整改清单

复核日期：2026-10-03

范围：当前 `sduoj-web2` 工作树中的路由、页面、公共组件、API 适配层、状态管理、构建、测试、依赖和开发环境行为。

## 当前结论

本轮已经完成多批修复，但清单尚未全部完成。当前没有确认的 P0；仍有 P1 代码回归、P1 真实业务验收缺口，以及 P2 性能、工具链和类型债务。此前“仓库内可以独立完成的前端修复已经全部完成”的表述不成立，以下待办表以当前代码复核结果为准。

| 门禁       | 当前结果                                                                            | 边界                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| TypeScript | `YARN_IGNORE_ENGINES=1 yarn typecheck` 通过                                         | 当前本机 Node 为 22.22.0，`package.json` 和 `.nvmrc` 要求 Node 24；需要在 Node 24 且不忽略 engines 的 CI 再验一次 |
| 单元测试   | `YARN_IGNORE_ENGINES=1 yarn test --runInBand --silent`：82 个 suite、373 个测试通过 | Node 22 且忽略 engines；Node 24 CI 仍需重跑。`ExaminationWorkbench` 超时已通过显式异步等待和合理测试时限修复      |
| ESLint     | 0 errors，0 个 warning                                                              | R-02 修复真实组件身份问题；R-03 将剩余 render-prop 配置为 `allowAsProps`，并清除了 FormModal 的依赖警告           |
| 依赖审计   | 0 vulnerabilities，345 个包                                                         | Yarn 仍提示 `path-to-regexp@8.4.0` resolution 与请求版本不一致，需要随依赖升级持续复核                            |
| 生产构建   | 通过，main entrypoint 约 3.91 MiB                                                   | Vditor、MathJax、Mermaid、Graphviz 等静态资源仍超出 webpack 建议体积                                              |
| 开发构建   | 3001 端口全量冷启动编译通过，TypeScript 无错误                                      | webpack 仅保留 ESLint render-prop、资源体积和入口体积 3 组 warning                                                |
| 浏览器验收 | 未知路径返回 404；登录深链接保留 query/hash                                         | 本地后端不可用时登录页仍会出现代理相关 console warning/error；真实登录和业务数据需要后端环境                      |

## 本轮已关闭

### 路由、认证与错误恢复

- 顶层和嵌套路由增加唯一匹配和 catch-all 404，未知路径显示可返回首页的本地化页面。
- 父路由重定向保留 `pathname + search + hash`；登录返回地址统一安全编码并限制在 `/v2` 内。
- 认证状态区分 `unknown/authenticated/anonymous`，共享 profile 请求，受保护 layout 在认证未完成时不渲染业务请求；登出会清理相关缓存。
- 强制改密状态不可通过关闭按钮或 Esc 绕过，认证状态清理时同步关闭弹窗。
- 路由级 ErrorBoundary 会随 location reset，懒加载失败显示可见 loading/error，错误边界提供重试和返回操作。

### 请求、下载和 API 边界

- 普通 Axios 请求默认超时收敛到 30 秒；二进制下载独立处理 Blob、JSON 错误、鉴权失败、内容类型和 object URL 回收。
- 综合报表、ZIP、题目附件和主观题导出统一走下载 helper，文件名逐段编码，外部窗口使用 `noopener,noreferrer`。
- 列表和表格组件保留旧数据、显示错误和 Retry；题单公共页、监控页、排名页和自动任务页加入过期响应防护。
- Redux table/exam/user 边界补充不可变更新和非法索引保护。
- `moment`、`fast-uri` 已升级，依赖审计为 0 vulnerabilities。

### 核心业务和生命周期

- 题单拍照流程记录并清理 timer、interval、MediaStream tracks，加入卸载/generation guard；真实上传 contract 仍需后端验收。
- standalone exam 和移动考试布局去除全局固定宽度，题目、考试、竞赛和筛选布局增加移动断点。
- 竞赛、题单、考试、提交评测、AutoLab 课程/考勤、外部作业下载和题目编辑器的主要路径补充了 effect 依赖、竞态保护和失败状态；共享表单与分页表格已移除定时器初始化并加入请求代次保护。
- 修复 Problem/Objective/Subjective、汇总报表等组件在 render 阶段 setState 的问题；成绩汇总改为派生计算。
- 修复本轮发现的关键列表缺失 key 和可变数组 `push` 状态污染；历史 lint 基线仍需按 R-03 逐条复核。

### AI、国际化和可访问性

- AI 工作区导航实现共享 navigation、规范 heading 和 canonical links；桌面恢复双栏，移动端单列。
- AI 页面硬编码 `/v2` 改用 `UrlPrefix`；AI 导航在 Router 外部独立渲染时回退为普通链接，避免业务测试和嵌入场景崩溃。
- Loading、LoadingData、ErrorBoundary、验证码、邮箱错误、主导航、语言选择、HTML lang、manifest 基础元数据和键盘可操作链接补齐了主要反馈；manifest 图标资源已按 R-17 修复并由自动测试校验。
- `TableWithSelection` 正式支持 `useAllData`，兼容旧拼写 `uesAlldata`，调用点已迁移。

## 当前剩余问题待办表

状态只表示当前证据：`待修复` 需要改代码，`待验收` 需要真实环境或新增回归证据，`待决策` 需要产品或部署侧给出结论，`待迁移` 属于持续性的工程债务。每一项关闭时都应补充对应测试、运行日志或决策记录；通过 TypeScript、单元测试或生产构建本身不能关闭真实服务验收项。

| 完成 | 编号 | 优先级 | 状态     | 待办事项                                                                       | 证据/范围                                                                                                                                                                                                                                                                                        | 关闭条件                                                                                                                                                                                   |
| ---- | ---- | ------ | -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x]  | R-01 | P1     | 已修复   | 修复公共测试点弹窗的重复请求循环，并补失败、卸载、父组件重渲染和重复触发保护。 | `FormModal.tsx` 改用 loading/mounted refs、最新 API ref 和显式 `refreshKey`，调用方不再因内联 API 函数重渲染而重复请求；`FormModal.test.tsx` 覆盖初始请求只执行一次、父组件重渲染和卸载后的迟到响应；相关测试与 `yarn typecheck` 通过。                                                          | 请求在挂载时只发起一次；请求结束不循环；题目切换由 `refreshKey` 触发；卸载后不更新状态。                                                                                                   |
| [x]  | R-02 | P1     | 已修复   | 稳定 AutoTask 的触发组件身份，避免表单因父组件重渲染而重新挂载。               | `SummaryExport.tsx`、`SubjectiveReview.tsx` 使用按 `groupId` 缓存的稳定 adapter；`AutoTaskTriggerProps` 已导出；lint 从 13 降为 12 条 warning，typecheck 通过。                                                                                                                                  | 父组件重渲染不会重新创建触发组件；groupId 改变时才创建新的 adapter；剩余 warning 按 R-03 复核。                                                                                            |
| [x]  | R-03 | P1     | 已修复   | 重新核对 lint warning 基线，区分真正的 nested component 与第三方 render-prop。 | 重新导出后 11 条 nested-component warning 均位于表格、表单、下拉等 render callback 属性；R-02 的两个真实组件已提取稳定 adapter；`.eslintrc.cjs` 对该规则启用 `allowAsProps`，FormModal 依赖警告也已清除。`YARN_IGNORE_ENGINES=1 yarn lint`：0 errors/0 warnings。                                | warning 分类、规则配置和当前输出一致；新增 warning 会使 lint 门禁失败。                                                                                                                    |
| [ ]  | R-04 | P1     | 待验收   | 完成 standalone exam 的真实生命周期回归。                                      | 当前工作区没有对应 Java 后端 checkout，前端 mock 不能证明考试创建、开始、保存、重连、到时交卷和权限变化。                                                                                                                                                                                        | 提供隔离服务、账号、fixture 和清理日志；覆盖上述场景，并保留可重复运行的 dev/CI 命令。                                                                                                     |
| [ ]  | R-05 | P1     | 待验收   | 完成上传、摄像头和 AutoLab 考勤的真实接口矩阵。                                | 题单拍照、文件提交、签到/签退、座位和外部作业目前主要由 mock 或边界测试覆盖。                                                                                                                                                                                                                    | 每个流程覆盖成功、失败、取消、重复提交、权限拒绝、超时和资源清理；真实 fixture 接入 dev 验收或 CI。                                                                                        |
| [x]  | R-06 | P1     | 已修复   | 处理“返回老版”入口。                                                           | 没有已确认的旧版部署地址；已从 `MHeader` 移除会跳转到当前管理入口的误导性按钮。`Logout.test.tsx`、typecheck 和 lint 通过。                                                                                                                                                                       | 管理端不再显示无法验证的旧版入口；若未来恢复旧版，必须提供受控 URL 和导航测试。                                                                                                            |
| [x]  | R-07 | P2     | 已修复   | 在 Node 24 上重跑完整质量门禁并固定格式工具链。                                | 使用仓库提供的 Node `v24.19.0` 和 fallback Git；格式门禁修复 112 个新失败后为 `Format: 0 failures`，Node 24 下 typecheck、lint、audit（345 deps/0 vulnerabilities）和 82 suites/373 tests 全部通过。                                                                                             | Node 24 CI 通过 format、typecheck、lint、unit、build、audit；格式检查不依赖本机 Xcode license。                                                                                            |
| [x]  | R-08 | P2     | 已修复   | 拆分首屏和编辑器资源，建立真实性能预算。                                       | `Editor`、`MD2export` 和 `MarkdownPreview` 均改为按需加载 Vditor；webpack 的 Vditor vendor 仅允许进入异步 chunk。新增 `yarn bundle:check` 校验构建入口引用的 57 个 JavaScript 资源均存在、总大小不超过 5 MiB 且不包含 Vditor；Node 24 构建实测为 4,313,976 bytes，Vditor 未进入初始脚本列表。    | 首屏构建门禁固定 5 MiB 上限并阻止 Vditor 回流；后续真实桌面/移动网络的 gzip、LCP 和交互时间仍按部署环境持续观测。                                                                          |
| [ ]  | R-09 | P2     | 待迁移   | 收敛 API envelope、分页、认证、下载和 AI job/resource 的 `any` 类型。          | 当前生产源文件约 1,800 个 `any`（包含测试约 1,875 个），类型债务集中在 API 适配层和页面组件。                                                                                                                                                                                                    | 按业务域建立 DTO 和 adapter；每个域有类型检查与契约测试；迁移期间不得用不准确类型掩盖运行时差异。                                                                                          |
| [x]  | R-10 | P2     | 已修复   | 消除共享表单和分页表格的隐式生命周期。                                         | `ModalFormUseForm` 已用 commit 阶段 effect 注入初始值，不再依赖 100 ms 定时器；`TableWithPagination` 通过 API signature/ref、请求代次和完整 effect 依赖控制刷新与竞态。现有测试覆盖多步骤初始值、重复打开、API 替换、筛选恢复、旧请求迟到和版本触发重试；Node 24 全量 82 suites/373 tests 通过。 | 表单 readiness 来自已挂载实例；请求只接受最新代次；筛选、API 替换和外部版本更新均有显式测试。                                                                                              |
| [ ]  | R-11 | P2     | 待验收   | 补齐 Markdown/HTML、下载和 WebSocket 协议边界的安全与兼容性 fixture。          | Vditor 负责 Markdown HTML 生成，下载和 WebSocket 仍依赖后端内容/协议；当前没有完整恶意标记、版本和超限矩阵。                                                                                                                                                                                     | 固定恶意标记、超大 payload、错误内容类型、协议版本和断线重连 fixture；确认清理、拒绝和用户反馈。                                                                                           |
| [ ]  | R-12 | P2     | 待验收   | 扩展真实浏览器回归覆盖管理、考试、竞赛、题单、上传和登出路径。                 | 当前浏览器验收主要覆盖 404、登录深链和 mock 场景；本地后端不可用时仍有代理 console error/warning。                                                                                                                                                                                               | 在隔离 dev 服务运行桌面/移动矩阵，控制 console 错误预算，并保存报告、截图和服务版本。                                                                                                      |
| [ ]  | R-13 | P2     | 待复核   | 复核 `path-to-regexp` resolution 与上游请求版本的长期兼容性。                  | Yarn 提示 `8.4.0` resolution 与 ProLayout 声明版本不一致；当前 audit 无漏洞不等于兼容性已证明。                                                                                                                                                                                                  | 在 Node 24、生产构建和关键路由测试下确认实际解析版本；升级上游或记录有范围的固定策略。                                                                                                     |
| [ ]  | R-14 | P2     | 待处理   | 清理工作树中的发布配置改动，或明确其归属。                                     | 当前发布相关改动由用户任务并行维护，文件状态可能在复核期间变化；本批不擅自提交、回滚或覆盖。                                                                                                                                                                                                     | 由所有者提交、拆分或丢弃这些改动；修复批次完成后 `git status` 只保留明确的用户工作。                                                                                                       |
| [ ]  | R-15 | P1     | 待验收   | 加强发布产物、部署 smoke 和回滚验证。                                          | 当前工作树删除了原 `release.yml`，新增的 `scripts/release-local.sh:103-135,129-136` 仍主要检查入口 HTML 和 `<div id="root"></div>`，未验证 JS chunk、深链 fallback、API/缓存头；发布流程是否生效也没有 CI 运行证据。                                                                             | 构建验证 manifest 中所有入口资源存在且 hash 匹配；部署前后覆盖 `/v2/`、登录深链、未知路由、runtime/main JS 和健康/API；保留带 release-id 的可恢复备份并演练 rollback。                     |
| [x]  | R-16 | P1     | 已修复   | 消除 AI ExaminationWorkbench 单测的时序/超时不稳定。                           | `ExaminationWorkbench.test.tsx` 为列表加载、标题和正式发布确认增加显式等待，并将该真实异步场景的测试上限设为 15 秒；全量复验 82 suites/373 tests 通过。                                                                                                                                          | 连续全量运行通过；等待针对具体 UI 状态，不使用无限重试或盲目隐藏失败。                                                                                                                     |
| [x]  | R-17 | P2     | 已修复   | 修正 PWA manifest 中不存在的图标资源。                                         | `public/manifest.json:5-19` 现引用 `sduoj.ico`、`logo192.png`、`logo512.png`；补齐的 PNG 均为对应方形尺寸，`src/Config/manifestIcons.test.ts` 校验本地文件、格式和声明尺寸，生产构建后 `build/manifest.json` 的三个图标均存在。                                                                  | manifest icons 自动测试通过；构建后逐个请求 manifest icons 均返回 200 且 Content-Type、尺寸符合声明。                                                                                      |
| [ ]  | R-18 | P1     | 待验收   | 统一 Vditor 静态资源的生产 URL 前缀。                                          | `.env.production` 的 `FRONT_ORIGIN` 是站点根域名；`Editor.tsx:117,123`、`MarkdownPreview.ts:18-22`、`Md2export.tsx:22,28` 请求 `${FRONT_SERVER}/vditor`，而发布产物同步到 `/v2/vditor`，现有部署模板未证明根路径 `/vditor` 可用。                                                                | 在真实 dev/production-like 环境请求根路径与 `/v2/` 路径的 JS、CSS、emoji、theme 资源；编辑器和 Markdown 预览无 404。若根路径没有 alias，则统一改为 `${PUBLIC_URL}/vditor` 或补受控 alias。 |
| [x]  | R-19 | P2     | 已修复   | 将依赖安全审计纳入 CI/release 阻断条件。                                       | `.github/workflows/ci.yml` 在质量门禁前执行 `yarn audit --groups dependencies --level moderate --json`；命令失败会阻断后续构建，并通过 `dependency-audit.json` artifact 保留审计输出。Node 24 当前审计为 345 dependencies、0 vulnerabilities。                                                   | CI 在安装依赖后先执行中等级别审计；发布 workflow 应复用同一命令或调用该 verify job，并保留带锁文件上下文的报告。                                                                           |
| [ ]  | R-20 | P2     | 待验收   | 处理 Vditor 无 hash 静态资源的缓存一致性。                                     | `public/vditor/dist/**` 原样复制到产物，文件名无 content hash；部署脚本在 `/v2` 原位 `rsync --delete`，若反代对资源长缓存，发布后可能加载旧编辑器 runtime。                                                                                                                                      | 为 Vditor 资源提供版本化/hash URL，或明确 `/v2/vditor/**` 的 no-cache/短 TTL；发布后完成新旧缓存和回滚测试。                                                                               |
| [ ]  | R-21 | P1     | 待修复   | 保证发布备份和回滚不会丢失最后一个可用版本。                                   | 当前 `scripts/release-local.sh:168-206` 在更新前删除 `v2-backup` 再移动新备份，中断窗口可能留下无回滚副本。                                                                                                                                                                                      | 使用同目录原子 rename 或保留带 release-id 的 last-good 备份；模拟 rsync/进程中断后仍能完成 rollback。                                                                                      |
| [ ]  | R-22 | P2     | 待补门禁 | 固定 GitHub Actions 依赖并补 shell/action 静态检查。                           | 当前 `.github/workflows/ci.yml` 仍使用浮动 `@v4` action；actionlint/shellcheck 需在 CI runner 验证。发布 workflow 文件状态由并行发布任务维护。                                                                                                                                                   | 关键 action 使用审计过的 commit SHA；CI 执行 actionlint、shellcheck，并保存结果。                                                                                                          |
| [ ]  | R-23 | P1     | 待验收   | 确认带 cookie API 的 CSRF 防护契约。                                           | `request.ts` 默认 `withCredentials=true`；多处管理 API 仍以 GET 执行 logout/invalidate/delete/apply/quit，前端没有 CSRF token/header。                                                                                                                                                           | 后端提供 SameSite、Origin/Referer 或 CSRF token 的明确契约，并以跨站请求 fixture 验证；必要时把有副作用操作迁移为 POST/DELETE。                                                            |
| [ ]  | R-24 | P2     | 待验收   | 为静态站点补 CSP、frame、referrer 和 permissions policy 等安全响应头。         | `public/index.html` 没有 CSP 等响应头声明；最终安全边界由反代配置决定，当前仓库没有验收证据。                                                                                                                                                                                                    | 在 production-like 反代中检查关键响应头和违规报告；确认编辑器、WebSocket、图片与 API 不因策略回归。                                                                                        |
| [ ]  | R-25 | P1     | 待验收   | 验证无权限账号的后端管理 API 边界。                                            | `MLayout` 只按前端 roles 显示 403；现有 E2E 主要证明页面不挂载请求，不能证明直接调用 manage read/write/delete 会被拒绝。                                                                                                                                                                         | 用无权限 cookie 直接请求代表性读写删接口全部得到 401/403；角色过期或变更后前端清空权限并停止旧请求。                                                                                       |
| [ ]  | R-26 | P1     | 待验收   | 防止同一构建产物在错误环境访问生产 API。                                       | `.env.production` 在构建期写入生产 API、前端和 WebSocket 域名；`SDUOJ_RELEASE_URL` 只改变 smoke URL，不改变已编译地址。                                                                                                                                                                          | staging/备用域名必须按环境生成 artifact 或注入受控 runtime config；smoke 断言 API/WS host 与当前环境一致。                                                                                 |
| [ ]  | R-27 | P2     | 待整理   | 标注并同步历史审计文档中的过期基线。                                           | `docs/FRONTEND_AUDIT.md`、`docs/FRONTEND_FOLLOWUP.md` 仍写旧的 77/367、format 通过和 4.04 MiB；`docs/audit/DEPENDENCIES.json` 是历史公告基线，容易被误读为当前漏洞。                                                                                                                             | 明确 historical/current 标签和日期；所有当前数字只引用本文件或最新复验；历史公告与当前 lockfile audit 分开展示。                                                                           |
| [x]  | R-28 | P2     | 已修复   | 避免批量导入用户页面把明文密码长期渲染到 DOM。                                 | `src/Component/user/AutoImportUsers.tsx:98-125,197-209,271-276` 由 `maskUserForDisplay` 将密码从预览模型中剥离并替换为固定掩码；取消、提交成功/失败和开始新导入时均调用 `reset` 清理预览及提交状态。`AutoImportUsers.test.ts:49-67` 断言预览模型不含原始密码。                                   | 预览 DOM 只显示掩码；提交仍使用独立的原始 payload；取消、提交结果和下一次导入前清理旧数据。生产传输仍需 HTTPS 和真实浏览器验收。                                                           |
| [ ]  | R-29 | P2     | 待修复   | 取消或自动校验写死的 hero 图片 hash preload。                                  | `public/index.html:19` 固定引用 `ban1news.76b1e974.jpg`；图片 hash 变化后可能产生无效 preload 或 404，构建没有检查该目标。                                                                                                                                                                       | 由构建模板注入当前资源，或在构建门禁中校验 preload 目标存在并在资源变更时失败。                                                                                                            |
| [x]  | R-30 | P2     | 已修复   | 明确 Vditor 编辑器的 HTML sanitize 配置并补恶意标记回归。                      | `MarkdownPreview.ts` 和 `Editor.tsx` 均显式设置 `markdown.sanitize: true`；`EditorLifecycle.test.tsx` 增加 `<script>` 恶意标记配置回归，MarkdownPreview 测试继续验证 sanitize。Node 24 针对性测试与 typecheck 通过。                                                                             | 编辑器和预览都显式启用审计过的 sanitize；后续真实环境继续扩展 `javascript:`、`data:`、SVG 和事件属性 fixture。                                                                             |
| [ ]  | R-31 | P2     | 待验收   | 建立前端生产错误可观测性。                                                     | `ErrorBoundary` 只调用可选 `onError`，当前挂载点没有统一上报器；缺少 route chunk、window error 和 unhandledrejection 的脱敏关联信息。                                                                                                                                                            | 提供带 release id、路由和错误类型的采样上报；不记录用户敏感数据；覆盖 ErrorBoundary、lazy chunk 和 API 网络失败。                                                                          |
| [x]  | R-32 | P2     | 已修复   | 将错误边界 fallback 文本纳入国际化。                                           | `ErrorBoundary.tsx` 改用 i18n keys `errorBoundaryTitle`、`errorBoundaryDescription`、`Retry` 和 `Return`；新增中英文资源与 `ErrorBoundary.test.tsx` locale 回归，确认英文和中文 fallback 的标题、重试按钮均随语言切换。Node 24 针对性测试与 typecheck 通过。                                     | 全局和路由错误 fallback 不再硬编码中文；按钮保留可访问名称和键盘操作。                                                                                                                     |
| [x]  | R-33 | P1     | 已修复   | 统一主观题附件下载 URL 的编码和权限边界。                                      | `SubjectivePreview.tsx` 改用 `cApi.getFileDownloadUrl`，同时对 `fileId` 和文件名进行独立 `encodeURIComponent`；新增 `SubjectivePreview.test.tsx` 覆盖含 `/`、`?`、`#` 的恶意 ID。权限拒绝和跨对象访问仍由后端契约验收。                                                                          | 前端不再手工拼接未编码 ID；服务端继续负责鉴权和越权拒绝。                                                                                                                                  |
| [ ]  | R-34 | P2     | 待补门禁 | 为发布质量、构建、部署和回滚任务设置超时。                                     | 历史 `release.yml` 和当前发布说明没有为 production job 设置 `timeout-minutes`；自托管 runner 或 curl/rsync 卡住会长期占用发布并发。                                                                                                                                                              | 每个 job 有按阶段设置的上限；挂起步骤自动失败并保留日志，且回滚路径仍可执行。                                                                                                              |
| [ ]  | R-35 | P2     | 待验收   | 补齐标记为未知或空对象的 API 契约。                                            | `src/Utils/API/c-api.ts:180-183` 标注 `publicQuestion` 正确性未知；`m-api.ts:128-140` 和 `src/Type/types.ts:110-118` 仍有 `{}`/TODO 参数或 judgeTemplate 类型。                                                                                                                                  | 为 endpoint 保存请求/响应 fixture 或真实后端测试；补 DTO，禁止用 `{}`/默认 `any` 掩盖字段差异。                                                                                            |
| [ ]  | R-36 | P1     | 待修复   | 隔离并清理 AI 面试录音/屏幕片段的 IndexedDB 缓存。                             | `interview-media.ts:16-95` 将 Blob 持久化到共享 origin；失败/离线条目可能跨登出和账号切换保留，媒体 URL 还手工拼接 ID。                                                                                                                                                                          | 按用户/资源绑定存储，登出、过期和账号切换清理；设置 TTL/容量上限或加密；验证 A 录制失败后登出、B 登录不可读取 A 片段，并统一媒体 URL 编码。                                                |
| [ ]  | R-37 | P2     | 待修复   | 收敛 AI 管理页的硬编码中文并补英文 locale 覆盖。                               | `IntelligentManagement.tsx`、`AIAdmin.tsx`、`ExaminationWorkbench.tsx`、`InterviewSession.tsx` 等直接渲染状态、标题和错误文本，`en.json` 没有对应 key。                                                                                                                                          | 抽取双语资源；切换 English 的页面、表格、错误和空状态不出现未翻译中文；增加 locale smoke 断言。                                                                                            |
| [ ]  | R-38 | P2     | 待迁移   | 合并重复的路由、菜单和移动端路由来源。                                         | `router.tsx`、`routerC.tsx`、`routerC_M` 和 `routerM.tsx` 分别维护路径、页面、移动路由和菜单；新增/下线入口需要多处同步，存在重复或注释残留。                                                                                                                                                    | 建立单一 typed route tree 生成导航、菜单和 Switch；路径唯一性、组件映射和移动/桌面覆盖有自动测试。                                                                                         |
| [ ]  | R-39 | P1     | 待修复   | 对生产 API、前端和 WebSocket origin 做协议与 host 校验。                       | `apiAddress.ts` 直接信任 `REACT_APP_*_ORIGIN`；误配置可能把带 cookie 的 API 降级到 HTTP，或把资源/媒体指向任意站点。                                                                                                                                                                             | 生产构建拒绝非 HTTPS API/非 WSS socket 和未批准 host；开发环境保留明确例外；CI 阻止未审查的环境变量覆盖。                                                                                  |
| [x]  | R-40 | P2     | 已修复   | 编码并校验 CAS 登录的 `service` 回调参数。                                     | `ThirdPartyLoginSDUCAS.tsx` 使用 `URL`/`searchParams` 构造回调和 CAS 登录地址，完整编码 `service`，并新增测试覆盖带查询串的前端 origin。                                                                                                                                                         | service 参数不再手工拼接；生产 host allowlist 仍需由部署配置与后端 CAS 白名单共同验收。                                                                                                    |
| [ ]  | R-41 | P2     | 待补门禁 | 对发布 artifact 做 manifest、hash 和内容白名单校验。                           | 当前发布流程按 artifact 名称下载后直接同步，未显式校验 SHA256、文件清单、大小或构建 ref，错误 artifact 仍可能进入生产。                                                                                                                                                                          | 构建生成带版本/ref 的 manifest；部署前校验 hash、路径白名单和关键资源，再执行同步并保留校验报告。                                                                                          |
| [ ]  | R-42 | P2     | 待补门禁 | 为页面和业务域建立渐进覆盖率门槛。                                             | `jest.config.cjs` 只对少数 Redux/API 模块设置 threshold，CI 的 `test:coverage` 不会因考试、上传、摄像头和 AutoLab 页面覆盖不足而失败。                                                                                                                                                           | 为新增/迁移业务域设 lines/branches/functions 门槛，或明确用真实 E2E 替代；CI 上传并阻断低于门槛的报告。                                                                                    |

## 未关闭项目

以下详细说明与待办表对应；其中 R-01、R-02、R-03、R-13、R-16、R-19、R-22、R-27、R-29、R-30、R-32、R-33、R-34、R-35、R-36、R-37、R-38、R-39、R-40、R-41、R-42 可在当前前端仓库推进，R-04、R-05、R-06、R-07、R-08、R-11、R-12、R-15、R-18、R-20、R-21、R-23、R-24、R-25、R-26、R-31 需要服务、部署或专项验证，R-09 属于持续迁移，R-14 由改动所有者处理。

### A-19：首屏和编辑器资源体积

生产构建仍会复制 Vditor 的 MathJax、Mermaid、Graphviz、ECharts、Lute 等异步资源，但编辑器和 Markdown 预览不再把它们带入初始脚本列表。`yarn bundle:check` 解析 `build/index.html`，检查入口资源完整性、5 MiB JavaScript 预算以及 Vditor 延迟加载约束；Node 24 当前构建为 57 个入口脚本、4,313,976 bytes。真实桌面和移动网络的 gzip、LCP 与交互时间仍需在部署环境持续观测。

### A-21：standalone exam 真实生命周期

当前工作区没有对应 Java 后端 checkout，无法证明考试创建、开始、保存、重连、到时自动交卷和权限变化的完整契约。前端移动布局已修复，但必须在隔离账号和真实服务上补回归矩阵。

### A-23：真实上传、摄像头和考勤环境

题单拍照、文件提交、AutoLab 签到/签退、座位和外部作业下载目前只有前端边界测试。需要真实接口的成功、失败、取消、重复提交、权限和清理 fixture，并接入 CI 或可复现的 dev 验收环境。

### “返回老版”按钮

前端没有已确认的旧版部署地址。确认地址前不能把按钮改成猜测的外链；若旧版已下线，应移除入口并提供迁移说明。

### Node 与格式门禁

本机 Node 22.22.0 与仓库要求 Node 24 不一致，本轮历史命令使用过 `YARN_IGNORE_ENGINES=1`。CI 应在 Node 24 重跑 typecheck、lint、单测、构建和 audit。格式脚本仍可能调用系统 `git` 并受 Xcode license 限制；CI 需验证标准工具链。

### 类型债务与 render-prop / nested-component warning

生产源文件仍有约 1,800 个 `any`（包含测试约 1,875 个），API envelope、分页、认证、文件下载和 AI job/resource DTO 仍需逐域收敛。剩余 warning 不能统一视为低风险 render-prop：`SummaryExport` 和 `SubjectiveReview` 的触发器被 `AutoTaskFramework` 当作组件类型渲染，至少应按 R-02 处理；其余 warning 需要按 R-03 逐条确认。

### 发布、PWA 与静态资源

发布 workflow 和脚本目前只验证入口 HTML，尚未验证每个 JS/CSS 资源、深链 fallback、健康接口和可恢复回滚。`manifest.json` 的图标资源已补齐，并由单测校验本地文件、格式和尺寸；构建产物中的逐个 HTTP 返回仍属于发布 smoke 待办。Vditor 资源的 URL 前缀、缓存策略和发布目录也没有形成同一契约：前端使用根域 `/vditor`，产物位于 `/v2/vditor`，文件名又没有 content hash。这些问题分别对应 R-15、R-18 和 R-20。

### CI 安全与回归稳定性

CI 的 `quality`、构建和 E2E 门禁没有包含依赖审计，手工得到的零漏洞结果不会阻断发布（R-19）。全量 Jest 最近出现 `ExaminationWorkbench` 超时，而单文件重跑通过，说明当前测试基线仍存在间歇性失败（R-16）。

权限、环境和历史记录也存在验收边界：前端角色判断不能替代后端 401/403，构建期生产域名不能直接复用于 staging，旧审计文档的数字需要标明历史日期（R-25、R-26、R-27）。

## 提交和验证记录

工作树原有改动先以 `f9d55b2 chore: checkpoint existing frontend work` 留档；之后修复按批次提交：

- `86fd646` 依赖安全升级
- `3b6a5e9` 清理副作用和监考生命周期
- `4250991` 保护 layout 并保留导航状态
- `363eee7` 响应式导航与可访问性
- `df05e59` AI 工作区导航和表格契约
- `db380fe` 路由恢复和不可变状态边界
- `1b9cfb2` 竞赛与考试列表稳定性
- `8abb89d` 题集公共页和监控页请求生命周期
- `114f252` 排名与自动任务数据 effect
- `560378d` 异步表单、外部作业和考勤流程
- `3a92ae9` 列表渲染 key 和课堂选择器
- `86ba3eb` Router 外 AI 导航兼容性

最终复验命令和结果：

```text
Node 24 yarn format:check                                  PASS: 0 failures
Node 24 yarn typecheck                                     PASS
Node 24 yarn test --runInBand                              PASS: 82 suites / 373 tests
Node 24 yarn lint                                          PASS: 0 errors / 0 warnings
Node 24 yarn audit --groups dependencies ...               PASS: 0 vulnerabilities / 345 dependencies
Node 24 yarn build                                         PASS: main entrypoint 3.91 MiB (2 size warnings)
webpack serve --port 3001                                  PASS: cold compile, no TypeScript errors
Playwright /v2/unknown                                      PASS: 404, 0 console errors
Playwright protected deep link                             PASS: login `to` 保留 query/hash
```

`format:check` 已在 Node 24 和 fallback Git 下通过；系统 Git 仍可能被本机 Xcode license 阻断，因此 CI 必须使用标准 runner 工具链，详见 R-07。

## 工作树说明

修复提交均已提交。当前复核时仍有以下用户已有改动，已刻意保留且没有加入本次文档 commit：

- `.github/workflows/release.yml`：已删除
- `docs/RELEASE_CI.md`：已修改
- `scripts/release-local.sh`：未跟踪

因此最终工作树不会显示为完全 clean；这些发布改动不是本次审计生成，也没有被回滚或覆盖。后续合并前应由其所有者决定提交、拆分或丢弃，并同步更新 R-15、R-21 和发布说明。
