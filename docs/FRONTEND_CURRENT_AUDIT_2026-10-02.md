# sduoj-web2 当前前端进展与整改清单

审查日期：2026-10-02

审查范围：`sduoj-web2` 当前工作树的路由、页面、公共组件、API 适配层、状态管理、构建配置、测试与静态资源。本文记录本次重新核验的结果；`docs/FRONTEND_AUDIT.md` 中 A-19、A-21、A-23 仍作为历史未关闭项保留。

## 当前状态

| 检查项 | 当前结果 | 判断 |
| --- | --- | --- |
| TypeScript | `YARN_IGNORE_ENGINES=1 yarn typecheck` 通过 | 类型编译可通过，但命令绕过了 `package.json` 的 Node 版本门槛 |
| ESLint | 0 errors，143 个历史 warning | 不能视为 warning 已关闭；其中 `exhaustive-deps` 60、`jsx-key` 63、`no-unstable-nested-components` 20 |
| 单元测试 | 81 suites / 370 tests；79 suites 通过，2 suites 失败，4 个测试失败 | 当前测试门禁为红色 |
| 单元测试复跑 | 单独运行 `ExaminationWorkbench` 时通过；`AuthoringWorkbench` 仍有 2 个失败 | 存在确定的文案/定位器失配，并有全量运行时序不稳定 |
| Playwright E2E | 48 项中 45 passed、3 skipped | 已覆盖登录、权限、移动管理、上传取消/重试和安全边界；仍缺大量真实业务流程 |
| 生产构建 | 通过 | `main` entrypoint 约 3.9 MiB，Vditor/MathJax/Mermaid/Graphviz 等资源继续触发体积 warning |
| 依赖审计 | 3 moderate | `fast-uri` 3.1.7、`moment` 2.30.1 仍在受影响版本 |
| 格式检查 | 当前环境无法完成 | `check-format.cjs` 调用系统 `git` 时被 Xcode license 错误中断，不能据此标记格式通过 |

当前 Node 为 20.20.2，而 `package.json:6-8` 要求 `>=24 <25`。CI 使用 Node 24 时应重新执行全部门禁；本地通过 `YARN_IGNORE_ENGINES=1` 的结果只说明当前依赖树可以运行，不能替代版本一致的 CI 结果。

## P1：发布前必须处理

### 1. AI 工作台路由、导航与测试契约相互矛盾

证据：

- `src/Config/router/router.tsx:63-158` 将 `/v2/ai-*` 入口全部 Redirect 到管理页。
- `src/Pages/Manage/AI/AIWorkspaceNav.tsx:1-4` 直接返回 `null`。
- `tests/local/ai-workspace.spec.ts:30-46` 要求每个 `/v2/ai-*` 页面存在名为“AI 工作区”的 navigation。
- `src/Pages/Manage/AI/AIWorkspaceNav.test.tsx:4-7` 又明确断言 navigation 不应存在。

影响：兼容入口的真实页面、工作区导航和本地真实验收没有统一目标。用户从旧 AI 链接进入后无法在 AI 功能之间切换；测试无法证明当前设计。

修复与验收：确定一个 canonical route 方案；若保留独立 AI 工作区，则实现可访问的 navigation、统一 heading 和移动布局，并同步路由与测试。若完全依托管理侧栏，则删除过期的 AI workspace E2E 合约并为重定向后的页面补完整验收。两套断言不能并存。

### 2. 未知路径没有 404，部分已禁用入口会渲染空白布局

证据：`src/App.tsx:32-41` 只遍历 `routerLayout`，没有 `Switch`/catch-all；`src/Config/router/router.tsx:20-41` 仍注册 `test`、`hws`、`studentMutualEvaluation` 等入口，而对应 `routerC.tsx:127-145` 页面已注释；`src/Component/layout/MLayout.tsx:43-49` 对有 children 的父路由只递归 children，忽略父组件。

影响：拼写错误或失效链接显示空页面；`/v2/manage/template`、`/v2/manage/problemSet`、`/v2/manage/course` 等分类父路径没有明确 index 页面；旧兼容路径还可能同时命中 Redirect 和宽泛的 layout route。

修复与验收：增加可国际化、可返回主页的 NotFound；用 `Switch` 或等价的唯一匹配策略；为分类路由补 index redirect 或明确页面；清理空入口；覆盖未知路径、父子路由重叠、懒加载失败和登录后返回上下文。

### 3. 综合报表下载使用了错误的响应契约

证据：`src/Utils/API/request.ts:68-91` 固定读取 `response.data.code/data` 并返回解包后的 `response.data.data`；`src/Utils/API/m-api.ts:139-154` 的 `exportComprehensive` 却以 `{ responseType: 'blob' }` 调用 `request.post`，随后读取 `ret.data` 和 `ret.headers`。

影响：二进制响应没有 `code/data` 时会被当作失败，导出逻辑拿不到 Axios response；相关报表导出流程无法可靠工作。

修复与验收：新增独立的 binary download adapter，检查 HTTP 状态和 `Content-Type`，统一处理鉴权、错误和 URL revoke；为正常文件、JSON 错误、401、网络失败和带特殊字符文件名补契约测试。

### 4. ZIP 下载绕过统一错误和鉴权处理

证据：`src/Utils/API/request.ts:16-37` 的 `getZipFile` 直接调用 `service.post`，不经过 `dealResponse`；任意 401/500 JSON 都会被当作 zip Blob，网络错误也不会进入统一提示/登录跳转。

修复与验收：复用二进制 adapter；拒绝非 zip 内容；保留 401 return-to 行为；在 `finally` 中撤销 object URL；覆盖取消、超时、服务端错误和重复点击。

### 5. 鉴权初始化有闪屏、重复请求和返回地址丢失

证据：

- `src/Component/common/LoginCheck.tsx:13-22` 只依赖 `isLogin`，没有 `unknown/loading` 状态，且读取了未列入依赖的 `dispatch/history/jump/location`。
- `src/Component/layout/CLayout.tsx`、`ELayout.tsx`、`PSLayout.tsx` 会在不同层级重复挂载 `LoginCheck`；同一题单页面可能并发多次 `/user/getProfile`。
- `LoginCheck.tsx:18-20` 只拼 `pathname`，没有 `search/hash`，也没有 `encodeURIComponent`。

影响：未登录用户可能先看到受保护内容并触发业务请求；快速切换路由时可能用旧 props 重定向；登录后筛选、分页或锚点状态丢失。

修复与验收：引入单一 AuthProvider/共享 in-flight 请求；`unknown` 状态期间只显示可访问的 loading；统一拼接并编码 `pathname + search + hash`；覆盖登录、登出、401、双布局挂载和重复请求。

### 5a. 强制改密弹窗可被关闭

证据：`src/Components/RequirePassChange.tsx:15-29` 在 `requirePasswordChange === 1` 时打开强制改密弹窗，但 `onCancel` 仍无条件执行 `setPassChange(false)`；关闭按钮相关限制被注释后，用户可以通过关闭按钮或 `Esc` 离开强制改密流程。该组件也没有在认证状态被清理时主动关闭弹窗。

修复与验收：强制改密状态下移除关闭入口，或让 `onCancel` 只在密码修改成功后允许关闭；认证状态丢失时清理弹窗状态，并由服务端成功响应更新 profile；补充关闭按钮、`Esc`、登出和刷新后的状态测试。

### 6. 列表请求失败被吞掉，用户无法区分空数据和加载失败

证据：`src/Component/common/Table/TableWithPagination.tsx:180-182` 与 `TableWithAllData.tsx:72-74` 的 catch 只保留注释；`src/Component/problemSet/UpcomingListHome.tsx:116-145` 失败后把数据置空并显示 Empty。

影响：网络故障显示成“暂无数据”，没有 Retry，也没有可观察的错误状态；业务人员无法恢复或判断数据是否真实为空。

修复与验收：公共表格增加 `error`、`retry`、`aria-live` 状态；保留旧数据并显示错误；Upcoming 页面区分 empty/error；覆盖首载失败、刷新失败、过期响应和重试成功。

### 6a. 请求默认超时过长且缺少按操作分类

证据：`src/Utils/API/request.ts:10-13` 将所有请求统一设置为 5 分钟超时；普通登录、列表和管理写操作可能长时间挂起，取消又依赖调用者显式传入 `AbortSignal`。

修复与验收：为普通查询、写操作、上传和 AI 长任务设置分级超时；长任务显式声明较长超时；路由卸载时统一取消未完成请求，并在超时后给出可重试反馈。

### 6b. 题单拍照流存在实际失效和资源泄漏风险（P1）

证据：`src/Component/problemSet/PSTakePicture.tsx:14-25` 获取 `MediaStream` 后立即调用依赖旧闭包的 `sendPicture`，此时 `stream` 仍可能是 `undefined`，导致 video/canvas 没有有效画面；`sendPicture():47-68` 递归使用 `setTimeout`，组件卸载时没有取消 timer 或停止 tracks，`check` interval 也会在重渲染时重复注册。

影响：拍照上传可能一直产生空画面；离开题单后仍可能继续截屏和上传，造成隐私、网络和资源泄漏。

修复与验收：用 ref 或显式参数传递最新 stream，在 video ready 后再捕获；记录并清理 timer、interval 和 `MediaStreamTrack`；增加 generation guard；覆盖允许/拒绝屏幕共享、上传失败、快速离开、重复进入和浏览器刷新。

### 7. 移动端 standalone exam 仍不可用

证据：`src/Component/layout/EHeader.tsx:17-26` 使用 `minWidth: 550`；`ELayout.tsx:32-36` 使用 `minWidth: 500`；`src/App.css:299-302` 的 `.ExamRun` 使用 `min-width: 1300px`；`App.css:381-405` 的考试 modal/card 使用 `min-width: 1100px`、`width: 1250px`；`App.css:434-447` 的题目/提交区域仍有 600/1200px 宽度。

影响：320–390px 视口必然横向滚动，考试弹窗和答题区域溢出；现有移动 E2E 没有覆盖 standalone exam 生命周期。

修复与验收：以流式布局、可横向滚动的局部表格和移动版 modal 替代全局固定宽度；补 320/390/768px 的开始、答题、保存、交卷、重连、到时自动交卷和权限测试。历史 A-21 仍被 standalone exam 后端缺失阻塞，后端补齐前只能标记为未验收。

### 8. 生产依赖仍有 3 个 moderate 漏洞

复验命令：`YARN_IGNORE_ENGINES=1 yarn audit --groups dependencies --level moderate`。

- `fast-uri@3.1.7`：经 `ajv`、`ajv-formats` 引入，修复版本为 `>=3.1.8`。
- `moment@2.30.1`：直接依赖，修复版本为 `>=2.31.0`。

修复与验收：升级或安全 resolution 后重新安装 lockfile，运行 typecheck、构建、单测和 audit；若暂时接受风险，记录受影响路径、利用前提和复审日期。现有 `path-to-regexp` resolution 的兼容性 warning 也应在依赖升级后重新确认。

### 9. 下载 URL 和 cookie 会话的安全边界需要统一

证据：`src/Utils/API/c-api.ts:96-107` 直接拼接 `file_id/file_name`；调用点包括 `Pages/Ext/Ext-HwsInfo.tsx:128,244`、`Component/problem/Subjective/Subjective.tsx:135-142,187-196`、`Component/common/Form/Item/ItemUpload.tsx:68-71`、`Component/problemSet/SubjectivePreview.tsx:26-30`；多个调用使用 `window.open` 而没有 `noopener,noreferrer`。`request.ts:14` 全局 `withCredentials=true`，而 `c-api.ts` 和 `m-api.ts` 仍有删除/撤销操作使用 GET。

影响：特殊文件名中的 `/ ? # %` 可能破坏路由；未隔离的新窗口存在 reverse-tabnabbing 风险；若后端没有 SameSite/Origin/CSRF 防护，带 cookie 的 GET 变更操作存在 CSRF 前提风险。

修复与验收：集中实现同源、逐段编码的下载 helper；所有新窗口使用安全特性；优先把有副作用的 GET 改为 POST/DELETE；与后端核对 SameSite、Origin 和 CSRF contract，并用真实浏览器测试验证。

### 10. 部署地址硬编码，环境切换容易误连生产

证据：`src/Utils/API/apiAddress.ts:11-16` 将生产 API、前端和 WebSocket 全部固定为 `https://oj.qd.sdu.edu.cn`；只有 development 使用当前 origin，没有 staging/预发布注入和构建时校验。

修复与验收：通过构建环境变量注入 origin，分别校验 API/WS 协议和允许域名；CI 构建 staging/prod 两套产物并检查最终 bundle 不含错误环境地址。

## P2：应在本轮之后持续收敛

### 11. 首屏包体和 Vditor 资源过大

证据：本次生产构建的 main entrypoint 约 3.9 MiB；`public/vditor/dist` 含 MathJax、Mermaid、Graphviz、ECharts、Lute 等多个 0.8–3.8 MiB 文件，构建报告继续提示资源超过 244 KiB；`docs/FRONTEND_AUDIT.md` 的 A-19 尚未关闭。

修复与验收：按路由和功能动态加载编辑器、预览器和图形语言；建立 gzip/首屏性能预算，用真实桌面和移动网络测量 LCP/交互可用时间；不能通过关闭 webpack warning 作为关闭条件。

### 12. React 生命周期和列表稳定性 warning 仍然集中存在

143 个 warning 中有 60 个 `react-hooks/exhaustive-deps`、63 个 `react/jsx-key`、20 个 `react/no-unstable-nested-components`。高风险位置包括：

- `Component/common/AutoTask/AutoTaskFramework.tsx:255,331,348,378`
- `Component/problemSet/AutoTask.tsx:250,337,357,390`
- `Component/contest/ContestHeader.tsx:54,61`、`Rank.tsx:289,499,527`
- `Component/exam/API/getExamInfo.ts:29`、`ExamRun.tsx:34`
- `Component/problemSet/PSHeader.tsx:90`、`Problem.tsx:62`、`Public.tsx:26`
- `Component/submission/Processing/Processing.tsx:177`

缺失依赖可能产生旧闭包和过期请求；渲染期创建组件会让子树反复 remount；缺 key 会导致列表状态错配。应按业务模块逐项修复并为异步竞态、拖拽、分页、切换语言补回归测试，不能把 warning baseline 当作完成。

### 13. 类型债务使 API 和状态契约无法被编译器保护

当前源文件中约 1,685 个 `any`；高密度文件包括 `Pages/Manage/MAutolab.tsx`、`Utils/API/c-api.ts`、`Component/group/CourseSignManagement.tsx`、`Component/problem/ProCheckPoints.tsx`、`Utils/API/m-api.ts`。`tsconfig.json` 虽设置 `strict: true`，但同时启用 `allowJs`、`skipLibCheck`，公共 API 的 `Get/Post` 仍以宽泛类型承载响应。

修复顺序：先为 request envelope、文件下载、分页、认证和 AI resource/job 建立 DTO；再按域迁移 API 与 Redux；保留运行时校验，避免只用错误的类型替换 `any`。

### 14. Redux 仍有外部引用写入和陈旧 session 崩溃风险

证据：`src/Redux/Reducer/table.ts:13-61` 虽复制了表层对象，但直接保存 `action.data`；`user.ts:11-19`、其他 domain reducer 也直接保存 payload；`src/Redux/Action/exam.ts:32-46` 假设 `examProListInfo[groupKey]` 一定存在。

修复与验收：按变更路径做不可变更新；对外部 payload 做边界复制或运行时 schema 校验；对过期考试路由返回可恢复错误；补冻结旧快照、失败写入、独立 store 和登出测试。

### 15. 管理菜单状态和父子路由组织不稳定

证据：`src/Component/layout/MMenu.tsx:18-32` 用未转义的 RegExp 匹配含 `:` 的路径；`MMenu.tsx:45-50` 将 `selectedKeys` 和 `openKeys` 混用，并在展开时累加，无法可靠收起。`MLayout.tsx:43-49` 又把父组件和 children 的责任混在一个递归函数中。

修复与验收：使用 pathname segment 匹配和独立的 selected/open state；路由树拆为 layout route、index route 和 leaf route；覆盖展开/收起、刷新保持、参数路由和无权限项。

### 16. AI 桌面双栏被全局样式覆盖成单列

证据：`src/Pages/Manage/AI/ai-workspace.css:36-40` 定义双栏 grid，但 `business-feature.css:54-57` 在所有尺寸强制 `display:flex; flex-direction:column`，只在移动端才恢复 grid。

影响：Grading 和 Examination 桌面页面的资源列表与详情上下堆叠，宽屏空间没有被利用，也与 AI 工作区的设计意图不一致。

修复与验收：仅在移动断点覆盖为单列；桌面恢复 grid；补 1440px 与 390px 截图和横向滚动断言。

### 17. 国际化和页面元数据不完整

证据：`src/Config/i18n.tsx:46-60` 未配置 `fallbackLng`；`en.json` 有 1003 个键，`zh.json` 有 983 个键，存在 `examReport`、`answerDetails`、`DisplayRank` 等差集；`routerM.tsx:38-50,163-188` 和多个 AI 页面直接写中文；`public/index.html:2` 固定 `lang="en"`；`public/manifest.json` 仍写 `React App/Create React App Sample`，并引用不存在的 `favicon.ico`、`logo512.png`。

修复与验收：补齐两种语言键、fallback 和 AI 文案；语言切换时同步 `document.documentElement.lang`；更新 manifest、图标和 start URL；覆盖中英文路由、表单错误、空状态和读屏输出。

### 18. 可访问性和错误恢复不足

证据：

- `src/Component/user/Form/Item/ItemCaptcha.tsx:34-55` 的独立验证码输入无 label，图片无 alt，刷新按钮无 aria-label；`ItemEmail.tsx:64-100` 标题硬编码且错误 catch 静默。
- `src/Pages/Client/CGroup.tsx:115-119`、`src/Pages/Client/UpcomingListHome.tsx:77-84` 等使用不可键盘操作的 `div/a onClick`。
- `src/Utils/ErrorBoundary.tsx:26-35` 只显示固定中文文本，没有 `role="alert"`、重试/返回按钮和 i18n；`App.tsx:28-31` 顶层懒加载失败 fallback 为 `null`。
- `src/Utils/Loading.tsx:4-10` 和 `Component/common/LoadingData.tsx:3-13` 没有 status/aria-live/aria-busy；`App.css:360-365` 的绝对定位 spinner 在长页面可能离开视口。
- `CHeader.tsx:37-48` 的主导航没有 aria-label，`ChangeLang.tsx:47-58` 的语言选择缺少可识别 label。

修复与验收：使用真实 Link/Button 和键盘焦点；补 label、alt、status、错误可见反馈；ErrorBoundary 提供刷新/返回；为懒加载失败、验证码失败、网络失败和键盘操作补 axe/浏览器测试。

`src/App.tsx:24-31` 还把整个 Router 放在同一个 ErrorBoundary 内；`src/Utils/ErrorBoundary.tsx:17-35` 一旦捕获异常就永久保持 `hasError=true`。应按 layout/page 分层，并在路由变化后允许 reset，否则单个页面崩溃会卸载整站导航，只能整页刷新。

### 19. 多处计时器和 effect 会反复注册或使用旧闭包

证据：`src/Pages/Error/TimeError.tsx:19-22` 的 effect 没有依赖数组，`add()` 又读取旧的 `sysTime/serTime`；`src/Component/problemSet/PSLayout.tsx:24-32`、`Pages/Client/CContestInfo.tsx:21-26` 也会在每次 render 重新注册监听器；`src/Component/common/DTime.tsx:12-15`、`src/Pages/Client/Overview.tsx:289-292` 的计时 effect 同样可能每次 render 重建 interval；`src/Utils/MarkdownText.tsx:7-18` 将字符串状态声明为 boolean，异步预览没有序号/取消保护。

修复与验收：使用函数式 setState、稳定 handler、正确依赖和 cleanup；给 Markdown 预览加入 generation guard；覆盖快速切换、卸载、语言切换和重复刷新。

### 20. 低视口筛选和比赛页布局仍缺断点

证据：`src/Pages/Client/CContest.tsx:36-68` 固定 `Col span={17}`/`span={7}`，没有 `xs/md` 断点；`TableWithPagination.tsx:278-289,346-355` 的搜索框固定 300px。

修复与验收：移动端使用 24/24 栅格，搜索框使用 `width:100%; max-width:300px` 并允许换行；补 320、390 和桌面截图回归。

### 21. “返回老版”按钮没有切换到旧版

证据：`src/Component/layout/MHeader.tsx:48-56` 点击后仍 `replace(UrlPrefix + '/manage')` 并刷新当前应用，没有旧版地址配置。

修复与验收：确认旧版实际部署地址后改为受配置控制的链接；若旧版已下线，移除按钮并补迁移提示；用 E2E 断言最终 URL。

### 22. 公共组件命名和部署前缀仍有迁移债务

证据：`src/Component/common/Table/TableWithSelection.tsx:69-77` 暴露拼写错误的 `uesAlldata` prop，`src/Component/problem/ProCheckPoints.tsx:291` 仍依赖它；`src/Pages/Manage/AI/AIRouteBoundary.tsx:27,57-59`、`InterviewSession.tsx:341,418` 和 `InterviewWorkbench.tsx:141,153,231` 直接写 `/v2`，没有使用 `UrlPrefix`。

影响：新调用者传入正确的 `useAllData` 会静默走错分支；部署前缀改变或 staging 使用其他 base path 时，AI 页面链接和重定向失效。

修复与验收：兼容旧 prop 的同时增加正式命名并逐步迁移；统一通过 `UrlPrefix`/路由 helper 生成链接；在非 `/v2` base path 构建并运行导航 E2E。

## 历史未关闭项

以下项目在 `docs/FRONTEND_AUDIT.md` 中已有记录，本次未发现关闭证据：

- A-19：生产入口约 4 MiB，编辑器和语法/图形资源仍需拆分并按真实性能预算验收。
- A-21：standalone exam 后端不在当前 Java checkout，考试完整生命周期无法验收。
- A-23：真实后端上传失败/取消、签到切换及相关 fixture/CI 矩阵仍未完整覆盖。

此外，真实 automatic-task、attendance、seat、contest、standalone exam、文件提交和摄像头流程不能由 mock 测试或构建成功替代。应为每个流程提供隔离账号、fixture、清理步骤和日志。

## 建议实施顺序

1. 先恢复 CI 可判定性：固定 Node 24、修复/同步 AI 测试契约、修复 moderate 依赖、让 format check 在 CI 可执行。
2. 再修路由和数据边界：404/父子路由、认证 gate、binary download、ZIP 下载、错误/重试状态。
3. 接着修移动和核心业务：standalone exam 布局、比赛/筛选断点、AI 桌面双栏、真实上传/考试验收。
4. 最后持续降低风险债务：effect/key/nested-component warning、DTO/Redux 不可变契约、i18n、a11y、错误恢复和首屏性能。

每项关闭都应同时保留：代码位置、复现输入、实现说明、自动化测试、真实服务证据（若涉及后端）和复验日期。
