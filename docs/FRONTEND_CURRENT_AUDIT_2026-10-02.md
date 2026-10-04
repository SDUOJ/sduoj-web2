# sduoj-web2 当前前端进展与整改清单

复核日期：2026-10-04

范围：当前 `sduoj-web2` 工作树中的路由、页面、公共组件、API 适配层、状态管理、构建、测试、依赖和开发环境行为。

## 当前结论

本轮已经完成多批修复，但清单尚未全部完成。当前没有确认的 P0；仍有 P1 代码回归、P1 真实业务验收缺口，以及 P2 性能、工具链和类型债务。此前“仓库内可以独立完成的前端修复已经全部完成”的表述不成立，以下待办表以当前代码复核结果为准。

| 门禁       | 当前结果                                                                                                      | 边界                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | `yarn typecheck` 通过（Node v24.20.0）                                                                        | 本轮使用 Node 24 和 fallback Git；CI 保持 `.nvmrc` 的 Node 24。                                                                          |
| 单元测试   | `yarn test:coverage`：106 suites/558 tests 通过                                                               | 渐进业务域门禁通过；仍未覆盖的真实生命周期由待办表跟踪。                                                                                 |
| ESLint     | 0 errors，0 个 warning                                                                                        | R-02 修复真实组件身份问题；R-03 将剩余 render-prop 配置为 `allowAsProps`，并清除了 FormModal 的依赖警告                                  |
| 依赖审计   | 0 vulnerabilities，345 个包                                                                                   | Yarn 仍提示 `path-to-regexp@8.4.0` resolution 与请求版本不一致，需要随依赖升级持续复核                                                   |
| 生产构建   | 通过，初始 JavaScript 56 文件/3,857,247 bytes                                                                 | bundle 上限 5 MiB；Vditor 延迟加载且内容寻址，artifact 727 文件/31,971,592 bytes 验证通过。                                              |
| 开发构建   | 3001 冷启动及本轮增量编译通过，无 TypeScript 错误                                                             | 保留 webpack 资源/入口体积 warning；lint 0 errors/0 warnings。                                                                           |
| 浏览器验收 | 81 跨浏览器 PASS/3 非适用视口 skipped，真实 dev 双视口矩阵 14 PASS + API 契约/上传各 1 PASS、安全代理 24 PASS | Java/AutoLab 的管理、竞赛、练习/限时题单、ZIP 去重上传、登出、代理和深链通过；standalone exam 完整生命周期、考勤矩阵和生产部署仍待验收。 |

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

| 完成 | 编号 | 优先级 | 状态     | 待办事项                                                                       | 证据/范围                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 关闭条件                                                                                                                                                                             |
| ---- | ---- | ------ | -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x]  | R-01 | P1     | 已修复   | 修复公共测试点弹窗的重复请求循环，并补失败、卸载、父组件重渲染和重复触发保护。 | `FormModal.tsx` 改用 loading/mounted refs、最新 API ref 和显式 `refreshKey`，调用方不再因内联 API 函数重渲染而重复请求；`FormModal.test.tsx` 覆盖初始请求只执行一次、父组件重渲染和卸载后的迟到响应；相关测试与 `yarn typecheck` 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 请求在挂载时只发起一次；请求结束不循环；题目切换由 `refreshKey` 触发；卸载后不更新状态。                                                                                             |
| [x]  | R-02 | P1     | 已修复   | 稳定 AutoTask 的触发组件身份，避免表单因父组件重渲染而重新挂载。               | `SummaryExport.tsx`、`SubjectiveReview.tsx` 使用按 `groupId` 缓存的稳定 adapter；`AutoTaskTriggerProps` 已导出；lint 从 13 降为 12 条 warning，typecheck 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 父组件重渲染不会重新创建触发组件；groupId 改变时才创建新的 adapter；剩余 warning 按 R-03 复核。                                                                                      |
| [x]  | R-03 | P1     | 已修复   | 重新核对 lint warning 基线，区分真正的 nested component 与第三方 render-prop。 | 重新导出后 11 条 nested-component warning 均位于表格、表单、下拉等 render callback 属性；R-02 的两个真实组件已提取稳定 adapter；`.eslintrc.cjs` 对该规则启用 `allowAsProps`，FormModal 依赖警告也已清除。`YARN_IGNORE_ENGINES=1 yarn lint`：0 errors/0 warnings。                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | warning 分类、规则配置和当前输出一致；新增 warning 会使 lint 门禁失败。                                                                                                              |
| [ ]  | R-04 | P1     | 待验收   | 完成 standalone exam 的真实生命周期回归。                                      | 2026-10-04 登录本地 Java gateway 后，只读探测 `/exam/getInfos`、`/exam/getInfo?examId=1`、`/manage/exam/getInfo/1` 均得到 envelope code 404；当前 checkout 没有 standalone exam controller。已有题单/AI 考务接口不能替代考试创建、开始、保存、重连、到时交卷和权限变化的契约。                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 提供对应真实考试服务、隔离账号、生命周期 fixture 和清理日志；保留可重复运行的 dev/CI 命令。                                                                                          |
| [ ]  | R-05 | P1     | 部分修复 | 完成上传、摄像头和 AutoLab 考勤的真实接口矩阵。                                | 新增真实 filesys 测试：匿名 single/batch 均 HTTP/code 401，两个 files 字段去重返回既有 ID，MD5 元数据不变；缺少 multipart 字段被拒绝但服务返回 HTTP/code 500，保留后端缺口。上传工具验证 cache/single/batch 引用和数量，取消迟到响应不发布 callback，20 个定向测试通过。quality 106 suites/558 tests、生产 build/bundle、81 跨浏览器 PASS/3 skipped、真实 dev 双视口 14 PASS 与上传接口 1 PASS。后端无题单拍照上传契约，签退明确未实现，唯一现有课程不属隔离账号，考勤/新文件缺公开清理 API。完整边界见 `docs/audit/UPLOAD_ATTENDANCE_MATRIX.md`，日志 `output/audit/R-05/`；不据局部通过关闭本项。                                                                                                                                | 每个流程覆盖成功、失败、取消、重复提交、权限拒绝、超时和资源清理；真实 fixture 接入 dev 验收或 CI。                                                                                  |
| [x]  | R-06 | P1     | 已修复   | 处理“返回老版”入口。                                                           | 没有已确认的旧版部署地址；已从 `MHeader` 移除会跳转到当前管理入口的误导性按钮。`Logout.test.tsx`、typecheck 和 lint 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 管理端不再显示无法验证的旧版入口；若未来恢复旧版，必须提供受控 URL 和导航测试。                                                                                                      |
| [x]  | R-07 | P2     | 已修复   | 在 Node 24 上重跑完整质量门禁并固定格式工具链。                                | 使用仓库提供的 Node `v24.19.0` 和 fallback Git；格式门禁修复 112 个新失败后为 `Format: 0 failures`，Node 24 下 typecheck、lint、audit（345 deps/0 vulnerabilities）和 94 suites/442 tests 全部通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Node 24 CI 通过 format、typecheck、lint、unit、build、audit；格式检查不依赖本机 Xcode license。                                                                                      |
| [x]  | R-08 | P2     | 已修复   | 拆分首屏和编辑器资源，建立真实性能预算。                                       | `Editor`、`MD2export` 和 `MarkdownPreview` 均改为按需加载 Vditor；webpack 的 Vditor vendor 仅允许进入异步 chunk。新增 `yarn bundle:check` 校验构建入口引用的 57 个 JavaScript 资源均存在、总大小不超过 5 MiB 且不包含 Vditor；Node 24 构建实测为 4,278,054 bytes，Vditor 未进入初始脚本列表。                                                                                                                                                                                                                                                                                                                                                                                                                                      | 首屏构建门禁固定 5 MiB 上限并阻止 Vditor 回流；后续真实桌面/移动网络的 gzip、LCP 和交互时间仍按部署环境持续观测。                                                                    |
| [x]  | R-09 | P2     | 已修复   | 收敛 API envelope、分页、认证、下载和 AI job/resource 的 `any` 类型。          | 通用 Get/Post 默认 `unknown`，Axios JSON/envelope/error/download 边界不再使用 `any`，成功必须包含 data；账号 profile/flags、文件引用、Java 字符串分页与 AutoLab 数字分页、竞赛/题单核心返回值和 nullable AI job/resource 建立 DTO。类型契约随 typecheck 编译；82 个定向测试、106 suites/543 tests、真实接口契约 1 PASS、桌面/Pixel 7 dev 回归 14 PASS、跨浏览器 81 PASS/3 非适用 skipped 通过，生产 build/bundle 通过。真实非空榜单缺 fixture，tuple 由后端源码及 mock 证明；未迁移 CRUD 输入和页面 any 不属于本次边界收敛，不能宣称全仓消除 any。完整契约依据与验收范围见 `docs/audit/API_TYPE_CONTRACTS.md`，日志 `output/audit/R-09/*-final.log`（UTC 2026-10-04）。                                                            | 按业务域建立 DTO 和 adapter；每个域有类型检查与契约测试；迁移期间不得用不准确类型掩盖运行时差异。                                                                                    |
| [x]  | R-10 | P2     | 已修复   | 消除共享表单和分页表格的隐式生命周期。                                         | `ModalFormUseForm` 已用 commit 阶段 effect 注入初始值，不再依赖 100 ms 定时器；`TableWithPagination` 通过 API signature/ref、请求代次和完整 effect 依赖控制刷新与竞态。现有测试覆盖多步骤初始值、重复打开、API 替换、筛选恢复、旧请求迟到和版本触发重试；Node 24 全量 94 suites/442 tests 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                   | 表单 readiness 来自已挂载实例；请求只接受最新代次；筛选、API 替换和外部版本更新均有显式测试。                                                                                        |
| [x]  | R-11 | P2     | 已修复   | 补齐 Markdown/HTML、下载和 WebSocket 协议边界的安全与兼容性 fixture。          | 新增真实 Vditor 浏览器 fixture，发现并修复 sanitize 仍保留 iframe 的缺口：在插入前 transform 清理危险节点/属性/协议，保留 Markdown、KaTeX、代码块和表格；Markdown/HTML 输入限制为 1 Mi 字符，预览失败有中英文反馈并在卸载时取消旧 render。下载验证 ZIP MIME、256 MiB 大小边界、JSON 错误、取消和 click 失败后的 object URL 清理，保留非 ZIP 的二进制 MIME。评测帧限制 1 Mi 字符/10,000 条记录，拒绝未知协议 envelope、非法版本/字段和超限帧，只派发订阅 ID；保留 legacy live、Redis wrapped、cumulative 协议与断线重连去重。全量质量 106 suites/527 tests PASS；四浏览器 81 PASS/3 合理跳过，真实本地服务 3 PASS。                                                                                                                 | 固定恶意/超限/错误 MIME/协议/重连 fixture 已纳入 CI；仅 WebKit 允许每例最多 2 条准确匹配的 ResizeObserver 延迟通知并保存附件，其他 pageerror 必须为零。                              |
| [ ]  | R-12 | P2     | 部分修复 | 扩展真实浏览器回归覆盖管理、考试、竞赛、题单、上传和登出路径。                 | 新增 `yarn test:dev-regression`：桌面和 Pixel 7 共 14 个真实 Java/AutoLab 测试通过，覆盖模板管理弹窗、竞赛标题/题目、既有练习与限时题单、真实 multipart ZIP 去重和页面缓存命中、取消/无持久新增、登出及管理深链、匿名考试深链、404 和代理。修复矩阵发现的表格/题单组 key、Card/Slider 旧属性、管理弹窗移动宽度。每轮保留实际服务镜像 ID、checkout/补丁/OpenAPI SHA256、10 张截图和精确错误预算；`pageerror`、意外 HTTP 错误、外部请求及非豁免 console 为 0。quality 106 suites/527 tests、生产构建/bundle、81 跨浏览器 PASS/3 非适用视口 skipped。详见 `docs/audit/REAL_BROWSER_MATRIX.md`。                                                                                                                                       | standalone exam 服务返回 code 404，生命周期仍随 R-04 待验收；不得把限时题单当作替代。上传/摄像头/考勤完整真实边界仍由 R-05 跟踪。                                                    |
| [x]  | R-13 | P2     | 已复核   | 复核 `path-to-regexp` resolution 与上游请求版本的长期兼容性。                  | Node 24 安装后 `@ant-design/pro-layout/node_modules/path-to-regexp` 实际为 `8.4.0`，而 ProLayout 声明 `8.2.0`；新增 `pathToRegexpResolution.test.ts` 固定该解析结果，同时确认顶层 React Router 使用独立的 `0.1.12` 兼容副本。生产构建、typecheck 和 audit 均通过，Yarn 的 resolution warning 已记录为有意覆盖。                                                                                                                                                                                                                                                                                                                                                                                                                    | 升级 ProLayout 后重新评估 resolution；测试阻止嵌套生产依赖回退到未审计版本。                                                                                                         |
| [ ]  | R-14 | P2     | 已隔离   | 清理工作树中的发布配置改动，或明确其归属。                                     | 用户原有发布相关改动隔离在三个未修改的 stash：`a3b2fcab455816ad53b00e0019a60b0cdc4dcae9`（before frontend audit fixes）、`4b6ba453c17c281528f4decdc558185aa4f666be`（surfaced during frontend audit）、`1890f9a12c545be0a2b196d5acd99504a8b72672`（resurfaced after build verification）。不依赖会变化的 stash 索引，也未纳入审计修复提交。                                                                                                                                                                                                                                                                                                                                                                                        | 由改动所有者明确恢复、拆分提交或丢弃；当前仅完成隔离，不能替所有者关闭。                                                                                                             |
| [ ]  | R-15 | P1     | 部分修复 | 加强发布产物、部署 smoke 和回滚验证。                                          | 新增只读制品级 smoke：下载并校验远端全部文件/入口/完整 ref/hash、深链 fallback、static 404、匿名 API 401、MIME、安全与缓存头。已跟踪预发布流程保存 before/after/rollback JSON；新发布绑定本地 manifest，失败回滚绑定发布前 manifest SHA256。共用 nginx manifest 改为 no-cache；新增故障测试和实际 nginx 四浏览器验收。详见 `docs/audit/DEPLOYMENT_SMOKE.md`。用户正式发布快照保持原样。                                                                                                                                                                                                                                                                                                                                            | 正式发布配置归属、实际远端 CI/非生产发布与回滚、真实预发布 nginx 接入仍未验收，本项不关闭。                                                                                          |
| [x]  | R-16 | P1     | 已修复   | 消除 AI ExaminationWorkbench 单测的时序/超时不稳定。                           | `ExaminationWorkbench.test.tsx` 为列表加载、标题和正式发布确认增加显式等待，并将该真实异步场景的测试上限设为 15 秒；全量复验 94 suites/442 tests 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 连续全量运行通过；等待针对具体 UI 状态，不使用无限重试或盲目隐藏失败。                                                                                                               |
| [x]  | R-17 | P2     | 已修复   | 修正 PWA manifest 中不存在的图标资源。                                         | `public/manifest.json:5-19` 现引用 `sduoj.ico`、`logo192.png`、`logo512.png`；补齐的 PNG 均为对应方形尺寸，`src/Config/manifestIcons.test.ts` 校验本地文件、格式和声明尺寸，生产构建后 `build/manifest.json` 的三个图标均存在。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | manifest icons 自动测试通过；构建后逐个请求 manifest icons 均返回 200 且 Content-Type、尺寸符合声明。                                                                                |
| [x]  | R-18 | P1     | 已验收   | 统一 Vditor 静态资源的生产 URL 前缀。                                          | 新增 `vditorResources.ts`，Editor、MD2export 和 MarkdownPreview 统一使用 `PUBLIC_URL + /vditor`，不再从 FRONT_ORIGIN 推导根路径；Node 24 构建和 `bundle:check` 通过（57 assets、4,278,054 bytes）。本地 `/v2` 静态服务验证 CSS、Lute、emoji、theme 四类资源均 HTTP 200。                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 生产反代仍需保持 `/v2/vditor/**` 与构建 `PUBLIC_URL=/v2/` 一致；真实部署 smoke 继续复核。                                                                                            |
| [x]  | R-19 | P2     | 已修复   | 将依赖安全审计纳入 CI/release 阻断条件。                                       | `.github/workflows/ci.yml` 在质量门禁前执行 `yarn audit --groups dependencies --level moderate --json`；命令失败会阻断后续构建，并通过 `dependency-audit.json` artifact 保留审计输出。Node 24 当前审计为 345 dependencies、0 vulnerabilities。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | CI 在安装依赖后先执行中等级别审计；发布 workflow 应复用同一命令或调用该 verify job，并保留带锁文件上下文的报告。                                                                     |
| [x]  | R-20 | P2     | 已修复   | 处理 Vditor 无 hash 静态资源的缓存一致性。                                     | `config/vditor-assets.cjs` 以全部文件名/内容生成 SHA256，构建注入并复制到 `vditor/<revision>/dist`；编辑器、Markdown、导出和开发服务器使用同一内容版本。产物校验重算摘要并拒绝无版本目录或伪造 hash。Node v24.20.0：4 个 hash/注入测试、12 artifact tests、3 suites/24 定向组件测试、quality 94 suites/447 单测、生产构建/bundle（57 assets/4,282,776 bytes）、57 跨浏览器测试（3 非适用视口跳过）及 3 个真实开发测试通过。真实浏览器一年 immutable fixture 验证旧版→新版→回滚正确且只发起两次 script 请求；详见 `docs/audit/VDITOR_CACHE.md`。                                                                                                                                                                                    | 内容变化必须改变 URL；构建复制路径与前端资源地址一致；长缓存更新/回滚 fixture 通过。生产发布仍由 R-15/R-21 验收，不宣称已执行线上部署。                                              |
| [ ]  | R-21 | P1     | 部分修复 | 保证发布备份和回滚不会丢失最后一个可用版本。                                   | 已跟踪预发布脚本拒绝复用恢复目录；同步失败/自动恢复失败均保留有效 backup 和带 release-id 的旧 backup，恢复失败时同时保留 stage。修复 smoke 内直接 exit 导致回滚分支不可达；实际 deploy 函数和生成的独立 rollback 经本地 rsync 故障/SIGTERM 注入验证。九项定向测试、静态检查及全量回归证据见 `docs/audit/RELEASE_RECOVERY.md`。用户隔离的正式 `scripts/release-local.sh` 未恢复、修改或运行。                                                                                                                                                                                                                                                                                                                                       | 正式发布脚本的备份窗口仍待所有者处理；真实 SSH/rsync 中断、部署 smoke 和正式回滚未验收，因此本项不关闭。                                                                             |
| [x]  | R-22 | P2     | 已修复   | 固定 GitHub Actions 依赖并补 shell/action 静态检查。                           | 当前外部 action 使用完整 commit SHA；pin 检查取消 release 文件名豁免，用户工作流恢复后自动进入门禁。新增固定版本和完整发行包 SHA256 的 actionlint/ShellCheck 安装器，CI 执行全部活动工作流、递归 shell 检查并上传 `static-analysis.json`。ShellCheck 发现并修复 timeout 条件和回滚 heredoc 在本机提前展开未定义 root 的错误；4 个 static fixtures 含生成回滚脚本语法测试、pin 正反例和本机真实 actionlint/ShellCheck 全 PASS。Node v24.20.0 quality 97 suites/468 tests、build/bundle、61 浏览器测试（3 非适用视口跳过）、7 真实开发测试、artifact/timeout 回归 PASS；详见 `docs/audit/STATIC_ANALYSIS.md`。                                                                                                                       | 关键 action 固定 commit SHA；活动 runner 执行 actionlint/ShellCheck 和 pin 门禁、保留报告；恢复的发布工作流不得豁免。用户隔离文件继续由 R-14 跟踪归属，未声称远端 CI 已运行。        |
| [ ]  | R-23 | P1     | 待验收   | 确认带 cookie API 的 CSRF 防护契约。                                           | `request.ts` 默认 `withCredentials=true`；多处管理 API 仍以 GET 执行 logout/invalidate/delete/apply/quit，前端没有 CSRF token/header。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 后端提供 SameSite、Origin/Referer 或 CSRF token 的明确契约，并以跨站请求 fixture 验证；必要时把有副作用操作迁移为 POST/DELETE。                                                      |
| [x]  | R-24 | P2     | 已修复   | 为静态站点补 CSP、frame、referrer 和 permissions policy 等安全响应头。         | 新增共用 nginx maps/headers/locations，HTML、缓存 JS、404、401 和 TLS 响应验证安全头；CSP 不开放 unsafe-eval/脚本 unsafe-inline，只允许内容哈希锁定的 Vditor ant 图标。将 Ajv 改为构建期 standalone 校验器，145 个请求、928 字段保持原校验语义，quality/build 阻断过期产物。实际 nginx 1.28.3 四浏览器 24 PASS，覆盖编辑器、数学/代码/表格/图片、真实 API/WS upgrade、blob worker、注入与嵌入阻断、32 KiB 报告体和脱敏；本地复现 CI 模式 20 PASS/4 真实服务例 skipped。7 脚本测试、88 定向校验、quality 106 suites/558 tests、生产 build/bundle、常规 81 PASS/3 skipped、真实 dev 14 PASS。详情 `docs/audit/SECURITY_HEADERS.md`、日志 `output/audit/R-24/`。仅生产样验收；未改变部署仓库/远程站点，真实发布与告警仍归 R-15/R-31。 | 在 production-like 反代中检查关键响应头和违规报告；确认编辑器、WebSocket、图片与 API 不因策略回归。                                                                                  |
| [x]  | R-25 | P1     | 已修复   | 验证无权限账号的后端管理 API 边界。                                            | `tests/local/authorization-boundary.spec.ts` 使用隔离非 admin cookie，直接调用真实 Java `/manage/user/list`、`/manage/user/update`、`/manage/user/delete`；三类请求均为 HTTP 403/code 403，写删未生效，finally 由 superadmin 删除账号并检查列表为空。`request.ts` 将 403 发布为认证边界事件，`LoginCheck` 清空认证状态并停止受保护管理布局的后续请求；补充 37 个请求/认证单测，并验证旧管理请求在认证边界发生后被 AbortController 取消。Node 24 专项 1 PASS、typecheck、format PASS。                                                                                                                                                                                                                                              | 后端角色边界、前端 403 状态清理和管理请求交接均有开发环境证据；继续保留页面级权限回归。                                                                                              |
| [x]  | R-26 | P1     | 已修复   | 防止同一构建产物在错误环境访问生产 API。                                       | HTML/manifest 记录 environment/API/front/WS 并校验一致；发布脚本与 CI 将目标 origin/前缀绑定产物，拒绝 test promotion 和错误部署目标。启动先检查页面 origin，再加载业务模块；跨四浏览器真实生产 artifact 错域测试零 API/WS 请求且显示可见错误。独立 build-test 只允许 loopback，不覆盖生产 build。Node 24 quality 97 suites/471 tests、生产 build/bundle、69 浏览器（3 非适用跳过）、7 真实 dev、13 artifact tests、static/timeout 门禁全部通过，详见 docs/audit/DEPLOYMENT_ENVIRONMENT.md。                                                                                                                                                                                                                                       | 错误环境不能初始化生产服务；测试 artifact 与发布 artifact 隔离；未来 staging 必须独立批准配置和构建，不用 smoke URL 隐式改服务。                                                     |
| [x]  | R-27 | P2     | 已修复   | 标注并同步历史审计文档中的过期基线。                                           | `FRONTEND_AUDIT.md`、`FRONTEND_FOLLOWUP.md` 已明确标注 2026-09-06 historical snapshot 并链接当前审计；`docs/audit/DEPENDENCIES.json` 的 note 标注 2026-09-05 历史快照，当前漏洞状态以 lockfile audit 和本文件为准。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 历史数字与当前数字分开展示；读者从旧文档可直接跳转到当前状态。                                                                                                                       |
| [x]  | R-28 | P2     | 已修复   | 避免批量导入用户页面把明文密码长期渲染到 DOM。                                 | `src/Component/user/AutoImportUsers.tsx:98-125,197-209,271-276` 由 `maskUserForDisplay` 将密码从预览模型中剥离并替换为固定掩码；取消、提交成功/失败和开始新导入时均调用 `reset` 清理预览及提交状态。`AutoImportUsers.test.ts:49-67` 断言预览模型不含原始密码。                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 预览 DOM 只显示掩码；提交仍使用独立的原始 payload；取消、提交结果和下一次导入前清理旧数据。生产传输仍需 HTTPS 和真实浏览器验收。                                                     |
| [x]  | R-29 | P2     | 已修复   | 取消写死的 hero 图片 hash preload。                                            | 移除 public/index.html 中固定 hash 的 preload；CHome.tsx 继续使用源图片 import，由 webpack 生成实际资源路径。模板格式检查通过；不再存在依赖旧 hash 的资源请求。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | HTML 不引用固定 hash；首页图片随构建产物更新。                                                                                                                                       |
| [x]  | R-30 | P2     | 已修复   | 明确 Vditor 编辑器的 HTML sanitize 配置并补恶意标记回归。                      | `MarkdownPreview.ts` 和 `Editor.tsx` 均显式设置 `markdown.sanitize: true`；`EditorLifecycle.test.tsx` 增加 `<script>` 恶意标记配置回归，MarkdownPreview 测试继续验证 sanitize。Node 24 针对性测试与 typecheck 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 编辑器和预览都显式启用审计过的 sanitize；后续真实环境继续扩展 `javascript:`、`data:`、SVG 和事件属性 fixture。                                                                       |
| [ ]  | R-31 | P2     | 部分修复 | 建立前端生产错误可观测性。                                                     | 新增 `src/Utils/errorReporter.ts` 统一事件契约：ErrorBoundary、入口 `window.error`、`unhandledrejection` 和 API 网络/5xx 失败均可进入同一脱敏报告；报告包含 release id、pathname、错误类型、时间和 API method/path/status，自动去除 query、hash、token、JWT、Bearer 等敏感值，并支持采样率与可选 adapter。`errorReporter.test.ts`、`ErrorBoundary.test.tsx`、`request.test.ts` 在 Node 24 下通过。当前仓库未提供生产日志接收端，adapter 接入和真实告警链路仍需部署验收。                                                                                                                                                                                                                                                           | 接入部署方的受控 adapter/collector，并用真实 route chunk、window error、unhandled rejection 和 API 失败 fixture 验证采样、留存和告警；禁止记录用户输入、请求体和凭据。               |
| [x]  | R-32 | P2     | 已修复   | 将错误边界 fallback 文本纳入国际化。                                           | `ErrorBoundary.tsx` 改用 i18n keys `errorBoundaryTitle`、`errorBoundaryDescription`、`Retry` 和 `Return`；新增中英文资源与 `ErrorBoundary.test.tsx` locale 回归，确认英文和中文 fallback 的标题、重试按钮均随语言切换。Node 24 针对性测试与 typecheck 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 全局和路由错误 fallback 不再硬编码中文；按钮保留可访问名称和键盘操作。                                                                                                               |
| [x]  | R-33 | P1     | 已修复   | 统一主观题附件下载 URL 的编码和权限边界。                                      | `SubjectivePreview.tsx` 改用 `cApi.getFileDownloadUrl`，同时对 `fileId` 和文件名进行独立 `encodeURIComponent`；新增 `SubjectivePreview.test.tsx` 覆盖含 `/`、`?`、`#` 的恶意 ID。权限拒绝和跨对象访问仍由后端契约验收。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 前端不再手工拼接未编码 ID；服务端继续负责鉴权和越权拒绝。                                                                                                                            |
| [x]  | R-34 | P2     | 已修复   | 为发布质量、构建、部署和回滚任务设置超时。                                     | 当前 CI/visual/Pages runner job 分别限 30/20/15 分钟；`timed-command.cjs` 为安装/构建、SSH、rsync 增加总时限，timeout 返回 124 并终止完整进程组，忽略 SIGTERM 时强制结束；SSH 连接/keepalive、curl 连接/响应/重试、rsync idle 及远端 apply/rollback 均有边界。7 个针对性测试含后代清理、外部取消、job 超时门禁、挂起 SSH 及超时后单独回滚通过；Node v24.20.0 quality 94 suites/447 tests、构建、bundle、57 跨浏览器测试（3 非适用视口跳过）和 3 真实开发测试通过。详见 `docs/RELEASE_V2_PRE.md`。                                                                                                                                                                                                                                  | 所有当前 runner job 与活跃部署阶段有总时限，超时保留输出并返回失败；独立 rollback 仍可调用。用户隔离正式发布脚本恢复后的审计由 R-14 跟踪，真实远端恢复验收归 R-15/R-21。             |
| [x]  | R-35 | P2     | 已修复   | 补齐标记为未知或空对象的 API 契约。                                            | 查证 Java ContestManageController/ContestPublicDTO：旧 /contest/publicQuestion 不存在且无调用者，删除错误客户端方法，mApi.publicQuestion 使用 /manage/contest/publicIt、必填 opt 0/1、正 64-bit 十进制 ID 和 Promise<null>；请求约束拒绝缺失/溢出/非法值。真实 ai_dev_ 管理账号创建唯一问答、公开/取消公开、确认 null envelope 后只清理自己创建的数据，完整列表恢复；保存 sanitized fixture。45 定向测试及 Node 24 全量 quality 98 suites/478 tests、build/bundle、69 浏览器（3 非适用跳过）、8 真实开发测试、artifact/static 门禁全部通过。详见 docs/audit/CONTEST_QUESTION_CONTRACT.md。                                                                                                                                         | 已保存真实 request/response 契约与清理证据；未知客户端路径不再存在，确认过的比赛 DTO 不回退到空对象/默认 any。                                                                       |
| [x]  | R-36 | P1     | 已修复   | 隔离并清理 AI 面试录音/屏幕片段的 IndexedDB 缓存。                             | `interview-media.ts` 为缓存条目绑定 `ownerId`，设置 24 小时 TTL 和 50 MiB 上限/淘汰，过期条目在读取时清理；媒体 ID 逐段编码。Redux middleware 在登出、鉴权失败和账号切换时清理缓存；`interview-media.test.ts` 与 `interviewMediaAuthMiddleware.test.ts` 覆盖账号隔离、TTL、URL 编码和清理动作，Node 24 typecheck、lint、定向测试通过。                                                                                                                                                                                                                                                                                                                                                                                             | A 录制失败后的离线媒体不会被 B 账号读取；登出/切换账号清理对应缓存；真实浏览器媒体权限和后端上传仍需部署环境验收。                                                                   |
| [x]  | R-37 | P2     | 已修复   | AI 管理页收敛硬编码中文并补英文 locale 覆盖。                                  | 在此前迁移基础上新增 262 对中英文文案，覆盖 PlagiarismWorkbench、NativeQuestionWorkbench、QuestionWorkflowPanel、AIOperations、AIRouteBoundary、NativeGroupQuestions 和 ExaminationWorkbench 剩余表单/状态/提示；原生题组批量录题入口与六个 AI 侧栏标题改用 locale key。`locale-source.test.ts` 遍历 AI 生产 TSX 的 AST，阻断中文 UI 字面量、缺失翻译键和插值错配；`locale-smoke.test.tsx` 为七个组件验证英文表单、操作、错误、空状态和 aria/placeholder。Node 24 `yarn quality` 104 suites/502 tests、全部 coverage 门槛、typecheck、lint 和格式 PASS；四浏览器回归 69 PASS/3 合理跳过，真实本地服务英文路由/创建表单/侧栏和基础服务共 3 PASS。                                                                                   | UI 文案和防回退门禁已验证；用户题目内容、资源名称和服务返回的原始错误不自动翻译。                                                                                                    |
| [x]  | R-38 | P2     | 已修复   | 合并重复的路由、菜单和移动端路由来源。                                         | 新增只读节点类型、`routeTrees`/`navigationTrees` 和共享 `RouteSwitch`；App/client/manage/exam/problemSet/contest 从同一 typed registry 生成 Switch/404，客户端父布局自动投影 canonical route；管理桌面/移动菜单共用树，竞赛/题单 tab 只投影 ID/参数，不重复声明路径。路由模块无显式 any；导航参数编码、ID/路径唯一性、组件映射、父 exact 和兼容链接 query/hash 有门禁。真实 dev 深链接发现并修复 protected LoginCheck 在已知 anonymous 状态不跳登录的问题，补四状态回归。Node v24.20.0 quality 97 suites/468 tests、build/bundle（57 assets/4,326,738 bytes）、61 浏览器测试（3 非适用视口跳过）、7 真实开发测试及 artifact/Vditor/timeout 门禁全部通过。详见 `docs/audit/ROUTE_TREE.md`。                                         | 所有现有路由域使用只读 typed node/registry，Switch/菜单/移动覆盖共享来源；保持路径/ID/组件投影门禁，未知路由及深链接回归通过。                                                       |
| [x]  | R-39 | P1     | 已修复   | 对生产 API、前端和 WebSocket origin 做协议与 host 校验。                       | `config/env.js` 在生产构建前校验 `REACT_APP_API_ORIGIN`、`REACT_APP_FRONT_ORIGIN`、`REACT_APP_SOCKET_ORIGIN` 的协议、host、端口、凭据和路径；`apiAddress.ts` 运行时使用同一批准 host 清单。`productionOrigins.test.ts` 与 `apiAddress.test.ts` 覆盖协议、恶意 host 和非 origin URL；Node 24 typecheck、定向测试通过。                                                                                                                                                                                                                                                                                                                                                                                                              | 构建期环境必须通过批准 host 清单；开发环境保留同源 HTTP/WS 例外。                                                                                                                    |
| [x]  | R-40 | P2     | 已修复   | 编码并校验 CAS 登录的 `service` 回调参数。                                     | `ThirdPartyLoginSDUCAS.tsx` 使用 `URL`/`searchParams` 构造回调和 CAS 登录地址，完整编码 `service`，并新增测试覆盖带查询串的前端 origin。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | service 参数不再手工拼接；生产 host allowlist 仍需由部署配置与后端 CAS 白名单共同验收。                                                                                              |
| [x]  | R-41 | P2     | 已修复   | 对发布 artifact 做 manifest、hash 和内容白名单校验。                           | `release-artifact.cjs` 为正式/预发布构建生成版本、完整 Git SHA、release-id、前缀、大小及逐文件 SHA256 清单；校验严格拒绝缺件、多件、篡改、符号链接、路径穿越、错误 ref/前缀、未批准文件及超限内容，并检查 HTML/webpack/PWA 入口。CI 和 GitHub Pages 发布前验证；预发布脚本本地上传前和远端 staging 同步后验证并保留 JSON 报告，失败不触碰 current。Node v24.20.0：11 个针对性测试、94 suites/442 单测、quality、生产构建、bundle 门禁、49 浏览器测试（3 个非适用视口跳过）及 2 个真实本地服务测试通过；实测 725 文件/30,528,875 bytes。详见 `docs/audit/RELEASE_ARTIFACTS.md` 和本页 R-41 复验记录。                                                                                                                               | 构建生成带版本/ref 的 manifest；同步到部署目录前验证 hash、路径白名单、大小及关键资源并保存报告。真实生产部署与用户隔离发布脚本的接入仍由 R-14/R-15 跟踪，不把本地验证写成线上验收。 |
| [x]  | R-42 | P2     | 已修复   | 为页面和业务域建立渐进覆盖率门槛。                                             | `jest.config.cjs` 保留 AI、AutoLab、题单适配器和上传工具门槛，新增考试时间描述/导航 90/90/90/90、题单导航 80/80/90/85、管理上传 55/55/20/55、多文件选择 90/45/70/90、用户上传 80/70/55/80 的独立文件门槛（statements/branches/functions/lines）。新增四组组件/工具测试覆盖导航边界、跨组切换、文件大小、上传回调、取消、下载和删除。Node 24 `yarn quality` 全量 102 suites/493 tests PASS；四浏览器组合 69 PASS/3 条仅手机布局测试在桌面跳过；真实本地 Java/AutoLab 服务回归 2 PASS。                                                                                                                                                                                                                                              | 渐进门槛已在 CI quality 阻断低于基线的报告；这不替代 R-04/R-05/R-12 的真实服务生命周期验收。                                                                                         |

## 未关闭项目

以下说明补充待办表中的证据边界。当前仍未关闭的是 R-04、R-05、R-12、R-14、R-15、R-21、R-23、R-31（8 项）；R-14 由改动所有者处理，其余条目需要服务、部署或专项验证。已关闭条目保留后续说明作为实现证据。当前已关闭 34 项，不能将剩余 8 项也视为已通过验收。

### A-19：首屏和编辑器资源体积

生产构建仍会复制 Vditor 的 MathJax、Mermaid、Graphviz、ECharts、Lute 等异步资源，但编辑器和 Markdown 预览不再把它们带入初始脚本列表。`yarn bundle:check` 解析 `build/index.html`，检查入口资源完整性、5 MiB JavaScript 预算以及 Vditor 延迟加载约束；Node 24 当前构建为 57 个入口脚本、4,278,054 bytes。真实桌面和移动网络的 gzip、LCP 与交互时间仍需在部署环境持续观测。

### A-21：standalone exam 真实生命周期

本机 Java/AutoLab 开发服务可用，R-35 已完成真实问答契约验证；2026-10-04 对 standalone exam 三个只读接口的认证探测均为 code 404。R-12 已验收可用业务的双视口浏览器矩阵，但不覆盖独立考试创建、开始、保存、重连、到时自动交卷和权限变化。需要对应服务和隔离生命周期 fixture。

### A-23：真实上传、摄像头和考勤环境

R-12 已验证既有 ZIP 的真实去重上传与页面缓存命中；题单拍照、AutoLab 签到/签退、座位和外部作业下载仍缺完整真实业务矩阵。需要成功、失败、取消、重复提交、权限和清理 fixture，并接入 CI 或可复现的 dev 验收环境。R-09 的真实 API 契约测试只覆盖读取型 DTO 和既有 fixture，不替代本项的业务生命周期验收。

### “返回老版”按钮

前端没有已确认的旧版部署地址。确认地址前不能把按钮改成猜测的外链；若旧版已下线，应移除入口并提供迁移说明。

### Node 与格式门禁

本轮最终门禁已在 Node v24.19.0 完成 typecheck、lint、单测、构建和 audit。格式脚本仍可能调用系统 `git` 并受 Xcode license 限制；CI 需验证标准工具链。

### 类型债务与 render-prop / nested-component warning

R-09 已按后端源码和真实接口收敛 API envelope、分页、核心 contest/problem set、认证、文件引用及 AI job/resource DTO；类型契约和运行日志见 `docs/audit/API_TYPE_CONTRACTS.md`。通用请求默认 `unknown`，历史页面与未迁移 CRUD 输入仍有 `any`，不宣称全仓类型债务已消失。R-02 已稳定 `SummaryExport` 和 `SubjectiveReview` 的组件类型；R-03 已区分剩余 render-prop 并清除 warning，当前 lint 为 0 errors/0 warnings。

### 发布、PWA 与静态资源

R-41 已增加逐文件 SHA256、路径/ref/前缀和 HTML/webpack/PWA 入口校验；CI、GitHub Pages 和预发布同步前均运行门禁。R-20 将 Vditor 资源统一为内容寻址 URL，开发/正式/预发布地址与复制目录一致，真实浏览器长缓存 fixture 验证更新和回滚。`manifest.json` 图标有本地资源门禁；线上深链 fallback、健康接口、安全头以及发布中断恢复仍由 R-15/R-21 等验收。

### CI 安全与回归稳定性

CI 的 `quality`、构建和 E2E 门禁没有包含依赖审计，手工得到的零漏洞结果不会阻断发布（R-19）。全量 Jest 最近出现 `ExaminationWorkbench` 超时，而单文件重跑通过，说明当前测试基线仍存在间歇性失败（R-16）。

权限、环境和历史记录也存在验收边界：前端角色判断不能替代后端 401/403，构建期生产域名不能直接复用于 staging，旧审计文档的数字需要标明历史日期（R-25、R-26、R-27）。

## 提交和验证记录

### 2026-10-04 20:30:56 UTC：剩余依赖复核

- 当前表格仍有 42 项，其中 34 项关闭、8 项未关闭；不把 R-15/R-21 的本地改进当作正式发布验收完成。
- 专用本地 `ai_dev_` 账号登录后，三个 standalone exam 只读接口再次返回 HTTP 200 / code 404；探测后登出返回 code 0。服务在线不等于考试生命周期已实现，R-04/R-12 仍需对应服务、权限 fixture 和清理协议。
- R-05 的 AutoLab 实现仍明确拒绝单独签退，已有考勤阻止删除课程/时间；filesys 公共 controller 没有新文件删除接口。没有借用非测试所有者的课程、创建不可清理的考勤或猜测拍照绑定协议。
- 登录响应仅记录无凭证的 cookie 属性：HTTPOnly、SameSite=Lax；这不是跨站防护验收，R-23 仍需后端明确契约和跨站 fixture。R-31 仍没有实际 collector/adapter 配置，单测 adapter 不能代替留存及告警链路。
- 三个用户发布 stash SHA 与本页工作树说明一致，工作树干净；没有收到快照恢复/拆分确认、非生产部署目标及执行授权。R-14/R-15/R-21 保持原验收边界，不自动恢复用户发布文件或执行线上发布。
- 脱敏复核证据：`output/audit/remaining-blockers-2026-10-04.json`。只有路径、HTTP/业务码、cookie 属性、Git/stash SHA 和配置存在性，没有密码、session cookie、原始响应体或用户资料。

### R-15：2026-10-04 制品级 smoke 和回滚版本绑定（部分完成）

- `yarn test:deployment-smoke`：17 PASS；恢复控制流 10 PASS，artifact 13 PASS，静态 shell/action 检查通过。更新旧测试夹具的 smoke 报告契约；子进程去除冲突的 FORCE_COLOR，不忽略其他 stderr。
- 实际 nginx/真实本地 gateway 四浏览器 28 PASS（含每轮 CLI 下载并验证 727 文件、733 个只读 GET）；CI 服务 fixture 模式 24 PASS/4 条真实通信 skipped，未声称远端 CI 运行。
- `yarn quality`：106 suites/558 tests PASS；生产 build/bundle、常规四浏览器 81 PASS/3 非适用 skipped、真实双视口开发矩阵 14 PASS。
- 日志：`output/audit/R-15/{smoke-unit.log,recovery.log,artifact.log,quality.log,static.log,build.log,bundle.log,e2e.log,dev-regression.log,nginx-real-final.log,nginx-ci-mode.log}`。实际服务模式/镜像证据分别保存在 `nginx-real-final-manifest.json` 和 `nginx-ci-manifest.json`，避免复用最后一轮 manifest 混淆模式。
- 本项保持部分修复；没有恢复用户正式发布快照、连接远端或修改部署仓库。接入前提和剩余边界见 `docs/audit/DEPLOYMENT_SMOKE.md`。

### R-21：2026-10-04 预发布失败恢复保护（部分完成）

- `yarn test:release-recovery`：9 PASS，覆盖备份/发布/恢复失败、SIGTERM、release-id 冲突、独立 rollback、smoke 失败及真实 deploy 调用者不删除恢复 stage。
- `yarn quality`：106 suites/558 tests PASS；artifact 定向测试、静态 shell/action 检查、生产 build/bundle 全部通过。
- 常规四浏览器 81 PASS/3 非适用 skipped；真实 Java/AutoLab 桌面与手机开发矩阵 14 PASS。日志：`output/audit/R-21/{recovery-final.log,quality.log,artifact.log,static-final.log,build.log,bundle.log,e2e.log,dev-regression.log}`。
- 不连接 SSH，不修改三个用户 stash，也不声称正式发布或远端中断恢复通过。本项仍未关闭，范围详见 `docs/audit/RELEASE_RECOVERY.md`。

### R-24：2026-10-04 生产样安全反代验收

- `yarn quality`：106 suites/558 tests PASS，包含确定性 standalone validator 一致性门禁；88 个原校验定向测试保持通过。
- `yarn test:security-unit`：7 PASS，验证全部请求校验器与 Ajv 的行为一致、无 runtime compiler、schema 变更失效、唯一 Vditor 图标 CSP 哈希及报告脱敏。
- 实际 nginx 四浏览器连续两轮各 24 PASS；没有 Java 的本地 CI 模式 20 PASS/4 明确 skipped；生产 build/bundle、常规 81 PASS/3 非适用 skipped 通过。安全策略使用实发响应头，报告来自浏览器，而不是 response mock。报告清理控制面一次经 nginx 请求超时，改为直接 loopback、5 秒时限后复验，原失败日志保留；没有增加重试。
- 开发服务器初次回归因旧 ESLint 实例缓存新增 ignore 前的结果失败；只重启本任务 3001 后，冷编译无 TypeScript 错误，真实双视口 14 PASS。未隐藏错误遮罩，也未重启用户 3000 服务。
- 生产样接入和明确的 Firefox/Vditor、WebKit 错误预算见 `docs/audit/SECURITY_HEADERS.md`；没有改动用户部署仓库或发布 stash、没有远程 reload。实际部署/告警仍随 R-15/R-31 验收。

### R-12：2026-10-04 真实开发矩阵与剩余边界

- `LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:dev-regression`：桌面/Pixel 7 共 14 PASS；真实 API 未 mock，10 张业务截图、服务 manifest 和逐项错误预算保存在 `playwright-report/r12/`。fixture 仅复用已有记录，ZIP multipart 上传/页面命中均返回既有 ID，取消前后模板列表和 MD5 记录一致。
- `yarn quality`：106 suites/527 tests PASS，TypeScript、lint 和格式门禁通过；`yarn test:e2e`：81 PASS/3 条仅手机布局测试在桌面跳过。
- `yarn build && yarn bundle:check`：727 文件/30,778,241 bytes 产物验证通过；57 初始 JS 资源/3,984,637 bytes。没有执行远程发布。
- 只读认证探测确认 standalone exam 的三个接口均为 envelope code 404。本项保持“部分修复”，R-04/R-05 不因限时题单和文件去重上传通过而关闭。日志：`output/audit/R-12/{matrix-final.log,quality.log,e2e.log,build.log}`；复现条件详见 `docs/audit/REAL_BROWSER_MATRIX.md`。
- 用户发布相关三个 stash 的内容和哈希未改变；未恢复、提交或丢弃其改动。

### R-22：2026-10-04 逐项复验

- 本机固定 actionlint 1.7.7、ShellCheck 0.11.0 发行包 SHA256 验证后运行；活动 ci/visual/Pages 及 `release-v2-pre.sh` 0 diagnostics。
- 4 static fixture tests、workflow pin 正反例、12 artifact tests、7 timeout tests、shell 语法 PASS。补回滚生成 fixture，保证 unset local root 不再导致 SSH 前失败。
- Node v24.20.0 `yarn quality` 97 suites/468 tests、format/typecheck/lint/coverage PASS；生产构建/bundle（57 assets/4,326,738 bytes）、artifact PASS。
- 四种浏览器 61 PASS/3 非适用视口 skipped，3001 真实 dev 7 PASS。报告位于 `output/audit/R-22/`，详见 `docs/audit/STATIC_ANALYSIS.md`；没有恢复用户 stash、触发远端 CI 或部署站点。

### R-38：2026-10-04 逐项复验

- `yarn quality`：Node v24.20.0，97 suites/468 tests、format/typecheck/lint/coverage 全部 PASS。路由模块无显式 `any`，保留类型和映射门禁。
- 正式构建、bundle 和 artifact PASS：57 入口脚本/4,326,738 bytes；723 文件/30,706,922 bytes，manifest SHA256 `5e9a54dbca75c59c50eb24638d73d671cf86c1e68b98051294e514399803ec23`。
- 四种浏览器 61 PASS/3 非适用视口 skipped；增加管理/考试树 unknown fallback，复验登录、登出、上传、移动菜单、资源和缓存。
- 真实 3001 dev 7 PASS；首次题单匿名深链接失败后修复 LoginCheck 交接并全量重跑，管理/考试/题单均保留 query/hash，无 pageerror。此前失败日志保留，不以重试掩盖问题。
- 12 artifact、4 Vditor、7 timeout 脚本测试 PASS。证据：`docs/audit/ROUTE_TREE.md` 和 `output/audit/R-38/`；生产部署和未覆盖业务验收不在本项结论中。

### R-34：2026-10-04 逐项复验

- Node v24.20.0；7 timeout tests、12 artifact tests、shell 语法门禁 PASS。fixture 没有连接 SSH，超时清理包含后代进程，之后独立回滚入口仍可调用。
- `yarn quality`：94 suites/447 tests PASS、格式/typecheck/lint PASS；构建、bundle（57 assets/4,282,776 bytes）、artifact（725 文件/30,568,349 bytes）PASS。
- `yarn test:e2e`：57 PASS/3 非适用视口 skipped；3001 开发环境真实服务、题库和 Vditor 资源 3 tests PASS。
- 报告：`output/audit/R-34/`；未修改用户 stash、未部署线上或执行真实回滚。真实中断恢复仍待 R-15/R-21。

### R-20：2026-10-04 逐项复验

- Node v24.20.0；`yarn test:vditor-assets` 4 PASS、`yarn test:artifact` 12 PASS、3 suites/24 定向组件测试 PASS。
- `yarn quality` 全部 PASS：94 suites/447 tests、格式 0 failures、typecheck PASS、lint 0 errors/0 warnings；新增缓存 E2E 后再次 typecheck 和 format 通过。
- 正式构建与 bundle 门禁 PASS：57 初始脚本/4,282,776 bytes；artifact 验证 725 文件/30,568,349 bytes，SHA256 `e28791a0122fc2c722848bf43124a10363dc81129001a3c5c5d0a9f0cd410d4c`。
- 内容 revision：`42b361fd7bab9d4b2934d81dab7cf4582297802ebf5f78e2fad608c2fb9a22cd`，无版本 runtime 路径在静态测试服务返回 404。
- 四种浏览器组合 57 PASS/3 非适用视口 skipped；一年 immutable 缓存 fixture 验证更新与回滚。开发服务器 3001 冷编译成功，无 TypeScript errors；真实 Java/AutoLab 代理、题库浏览和内容寻址资源 3 tests PASS。
- 证据：`docs/audit/VDITOR_CACHE.md`、`output/audit/R-20/`；未执行生产部署或修改用户 stash。

### R-41：2026-10-04 逐项复验

- 工具链：Node v24.20.0、Yarn 1.22.22、fallback Git；验证基准 HEAD 为 `adf28ca7d6c35bb898b88c2960cf013ecd0780cc`，测试包含本项未提交补丁。
- `yarn test:artifact`：11 tests PASS，含正式/预发布前缀、同长度篡改、缺失/多余文件、符号链接、错误 ref、伪造记录、HTML/webpack/PWA 错配、超限以及本地/远端拒绝时不执行发布。
- `yarn quality`：格式 0 failures、typecheck PASS、lint 0 errors/0 warnings、coverage 94 suites/442 tests PASS；新增浏览器脚本后再次执行 typecheck、format 和定向测试。
- `yarn build && yarn bundle:check`：PASS，57 个入口 JavaScript/4,282,125 bytes；产物清单 725 文件/30,528,875 bytes，报告 SHA256 为 `5644f5cea602df659035a667248443b0522d879c79b72689a6264db9cdb7cb15`。
- `yarn test:e2e`：Chromium、Firefox、WebKit、移动 Chromium 共 49 PASS/3 skipped；跳过项是仅适用 320px 手机视口的桌面组合，不是失败场景。新增测试通过 HTTP 检查清单 ref、入口资源大小和 SHA256。
- `yarn test:local tests/local/services.spec.ts`：2 PASS；真实本地 Java/AutoLab 代理可达，题库浏览无外部请求和 pageerror。这里的服务验证不代表 standalone exam、考勤和生产发布已验收。
- `bash -n scripts/release-v2-pre.sh`、工作流 action pin 检查、`git diff --check`：PASS。未连接部署 SSH，未同步或回滚线上目录。
- 本地日志：`output/audit/R-41/{full-regression.log,final-gates.log,dev-services.log,artifact-verification.json}`；浏览器附件位于 `playwright-report/`、`test-results/`，均按仓库约定不提交。

### R-25：2026-10-04 逐项复验

- `LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:local tests/local/authorization-boundary.spec.ts`：1 PASS。
- 测试通过真实 Java 服务创建隔离学生账号，以该账号直接调用管理用户的读、写、删接口；三类操作均为 HTTP 403/code 403，测试验证 nickname 未变更且账号未被学生删除，再由 superadmin 在 `finally` 中删除并检查列表为空。关闭 trace，不输出密码或 cookie。
- 证据代码：`tests/local/authorization-boundary.spec.ts`；页面级 `tests/e2e/permissions.spec.ts` 继续验证普通用户看到 403 且不挂载管理请求。
- R-25 已关闭：403 认证边界事件会清空本地角色状态，受保护布局随后停止挂载管理请求；真实后端读写删拒绝和测试账号清理均已验证。

### R-11：2026-10-04 逐项复验

- 真实 Vditor fixture 暴露 `markdown.sanitize=true` 仍保留 iframe；预览在插入前 `transform` 中使用 inert template 清理危险节点、事件属性、危险 URL 协议与用户 style，并在渲染后复查。Markdown、KaTeX、代码块、表格在 Chromium、Firefox、WebKit、移动 Chromium 中仍可显示，恶意脚本标志未执行。
- Markdown 和服务 rich text 输入最多 1 Mi 字符；超限预览显示中英文反馈。旧内容 generation/unmount 通过 AbortSignal 阻止迟到内容插入。下载最多接受 256 MiB 响应，ZIP 仅接受明确 ZIP/octet-stream MIME，拒绝 JSON/HTML 错误响应或错配类型；取消不产生 URL，点击失败也在 finally 释放 URL。该浏览器限额不是服务器流式限额，代理和后端仍须限制传输大小。
- 评测协议最多 1 Mi 字符/10,000 条记录，校验安全整数版本、字段、ID 和 checkpoint 索引，拒绝未知 protocol envelope；兼容现有 live、Redis wrapped、cumulative 帧，只处理本订阅 ID。浏览器 fixture 验证格式/超限拒绝反馈、断线重订阅、同一 checkpoint replay 不重复加分、终态版本持久化和连接关闭。
- 新增 `judgeMessages.test.ts`、`MarkdownText.test.tsx`、`protocol-boundaries.spec.ts`，扩展 Markdown、下载和 HTML 恶意矩阵。`yarn quality`：format 0 failures、typecheck PASS、lint 0 errors/0 warnings、106 suites/527 tests 和所有 coverage 门槛 PASS。
- `yarn test:e2e`：生产等价构建与四浏览器共 81 PASS/3 skipped（仅手机布局测试在桌面组合）。WebKit 两类内容布局曾各出现一次准确为 `ResizeObserver loop completed with undelivered notifications.` 的延迟通知；协议测试仅在 WebKit 允许每例最多 2 条该通知，附件记录数量，其他 pageerror 一律零预算。没有泛化忽略异常。
- `LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:local tests/local/services.spec.ts tests/local/vditor-assets.spec.ts`：真实 Java/AutoLab 代理、题库浏览和 content-addressed Vditor runtime 共 3 PASS。日志：`output/audit/R-11/{quality.log,e2e.log,local.log}`；未执行远程部署或改动用户发布 stash。

### R-37：2026-10-04 逐项复验

- 新增 262 对 locale 文案，完成七个剩余/部分迁移的 AI 组件，并处理原生题组批量录题入口和六个 AI 侧栏标题；保留接口字段、路由 ID、业务状态值和题目原文。
- `locale-source.test.ts` 遍历 AI 生产 TSX 的 AST，阻断中文 UI 字面量、缺失中英文键和插值占位符不一致。`locale-smoke.test.tsx` 为原生录题、查重、题目工作流、原生题组、任务、账号边界和考试编排补七个英文 smoke，用英文 fixture 验证正文、aria-label、placeholder、弹窗、空状态和错误提示。现有中文契约测试明确设置 locale，并全部通过。
- `yarn quality`：format 0 failures、typecheck PASS、lint 0 errors/0 warnings、104 suites/502 tests、全部 coverage 门槛 PASS。`yarn test:e2e`：生产等价构建和四浏览器组合 69 PASS/3 skipped（仅手机视口测试在桌面跳过）。
- `LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:local tests/local/ai-locale.spec.ts tests/local/services.spec.ts`：3 PASS。真实 Java/AutoLab 授权下访问任务、考试、查重和原生题组页面；验证英文侧栏、创建表单、批量录题两种方式，不发送创建业务资源请求。关闭 trace，不记录账号密码；用户题目和服务原始错误不属于自动翻译范围。
- 日志：`output/audit/R-37/{quality.log,e2e.log,local-final.log}`。未执行远程发布，未修改或恢复用户发布 stash。

### R-42：2026-10-04 逐项复验

- 新增 `ExamUtils.test.ts`、`ExamPageCtrl.test.tsx`、`ProblemSetPageCtrl.test.tsx` 和 `upload-ui.test.tsx`，共 10 tests。分别验证跨午夜时间描述、考试首尾导航和加载状态、题单组内/跨组导航，以及用户文件大小校验、上传完成、管理附件下载/删除、上传取消和多文件选择。
- `jest.config.cjs` 为上述六个关键文件设置独立门槛，防止低覆盖路径被全局平均值掩盖；保留已建立的 AI、AutoLab、数据适配和上传工具门槛。CI 的 `yarn quality` 执行 coverage，现有工作流上传报告。
- 全量实测（statements/branches/functions/lines）：考试两个文件均为 100%/100%/100%/100%；题单导航 94.44%/90%/100%/100%；管理上传 95.65%/75%/87.5%/95.23%；多文件选择 94.44%/50%/75%/94.11%；用户上传 84%/75%/62.5%/87.5%。门槛是渐进基线，不声称所有考试和上传页面已全覆盖。
- Node 24 `yarn quality`：format 0 failures、typecheck PASS、lint 0 errors/0 warnings、102 suites/493 tests 和全部覆盖率门槛 PASS。`yarn test:e2e`：Chromium、Firefox、WebKit、移动 Chromium 共 69 PASS/3 skipped，跳过的是仅手机视口测试在桌面组合；生产等价测试构建 PASS。
- `LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:local tests/local/services.spec.ts`：真实 Java/AutoLab 代理与题库浏览 2 PASS。日志：`output/audit/R-42/{quality.log,e2e.log,services.log}`。R-04、R-05、R-12 的真实业务生命周期仍单独待验收，未修改或恢复用户发布 stash。

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
Node 24 yarn test --runInBand                              PASS: 94 suites / 442 tests
Node 24 yarn lint                                          PASS: 0 errors / 0 warnings
Node 24 yarn audit --groups dependencies ...               PASS: 0 vulnerabilities / 345 dependencies
Node 24 yarn build                                         PASS: main entrypoint 4.08 MiB (2 size warnings)
Node 24 yarn bundle:check                                  PASS: 57 assets / 4,278,054 bytes; Vditor deferred
webpack serve --port 3001                                  PASS: cold compile, no TypeScript errors
Playwright /v2/unknown                                      PASS: 404, 0 console errors
Playwright protected deep link                             PASS: login `to` 保留 query/hash
```

`format:check` 已在 Node 24 和 fallback Git 下通过；系统 Git 仍可能被本机 Xcode license 阻断，因此 CI 必须使用标准 runner 工具链，详见 R-07。

## 工作树说明

本次接手时工作树干净，用户已有发布改动保存在三个独立 stash 快照中；没有 apply、pop、drop 或改写这些快照：

- `a3b2fcab455816ad53b00e0019a60b0cdc4dcae9`：`user-owned release changes before frontend audit fixes`，保存 `release.yml` 删除、`docs/RELEASE_CI.md` 修改以及未跟踪 `scripts/release-local.sh`。
- `4b6ba453c17c281528f4decdc558185aa4f666be`：`user-owned release changes surfaced during frontend audit`。
- `1890f9a12c545be0a2b196d5acd99504a8b72672`：`user-owned release changes resurfaced after build verification`，保存后续 package/前缀改动。

使用快照 SHA 标识而不是可移动的 `stash@{n}`。R-41 只修改当前已跟踪的构建、CI、GitHub Pages 和 `release-v2-pre.sh`，没有修改上述用户拥有的发布文件。恢复快照后应由所有者处理冲突、确认归属并同步 R-14/R-15/R-21；尚未将“保留并隔离”误报成“用户发布任务完成”。
