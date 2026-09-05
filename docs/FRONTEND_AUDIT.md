# web2 全仓审查与整改清单

日期：2026-09-05。起点：`fced08d`，分支：`feature/upgrade-antd-v5`。

本轮采用 3 个指定为 `gpt-5.6-sol` 的子代理分别审查公共组件、状态与传输、业务流程，
主线检查客户端布局、登录、工具链、依赖和最终集成，并进行了子代理之间的交叉复审。
范围是全仓静态扫描与依赖扫描，加主干工作流的深入代码审查；不等于每个页面都已完成真实后端验收。
现有 AI 工作台未提交实现纳入静态检查，功能改动保留，仅整理了阻塞格式门禁的文件。

## 优先处理的剩余问题

以下编号用于后续任务、PR 和复验。P1 表示数据、流程或安全边界风险，应优先补复现；
P2 表示可靠性、契约、体验或维护问题。依赖公告级别与业务优先级分开记录。
“待验收”表示证据不足，不能按已通过处理；“待修复”已有具体代码依据。

| 编号 | 优先级/状态 | 位置与问题                                                                                                             | 建议修复与关闭条件                                                                                                              |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | P1 待修复   | `Component/common/Editor.tsx`、`Form/Item/ItemEditor.tsx`：多个编辑器默认使用相同 DOM/cache id，草稿缺少用户、文档隔离 | 明确 user/document/editor identity；测试两个文档、两个用户、异常退出后的恢复，证明不会串稿。                                    |
| A-02 | P1 待修复   | `Utils/fileUpload.ts`：上传、哈希和缓存查询的 Promise 被丢弃，调用方无法等待、取消或可靠处理失败                       | 联动上传控件改为可等待的结果契约；补哈希失败、缓存命中/未命中、网络失败、混合批次及取消测试。                                   |
| A-03 | P1 待修复   | `autolab/CourseTab.tsx`、`CourseDetail.tsx`、`group/CourseSignManagement.tsx`：课程/学生切换接受迟到响应               | 按课程、学生和请求代次绑定结果；B 先返回、A 后返回时界面仍属于 B，旧失败也不覆盖新状态。                                        |
| A-04 | P1 待修复   | `Pages/Manage/MAutolab.tsx`：异步加载数据与 `currentCourse` 分开更新，可能在 B 课程弹窗内显示 A 的数据                 | 把课程身份和加载结果绑定为一次弹窗会话；测试快速切换、关闭、旧响应、编辑提交的课程 ID。                                         |
| A-05 | P1 待修复   | `autolab/QRFloat.tsx`：异步 interval 可重叠，轮询失败缺少处理，初始化和 token 可能使用旧签到 ID                        | 改为串行调度，清理计时器和旧请求；补慢请求、断网、切换签到、关闭与 token 更新测试。                                             |
| A-06 | P1 待修复   | `problem/From/Item/ProblemAddBody.tsx`、`ProblemAddForm.tsx`：直接修改状态数组，题目查询失败被吞掉                     | 使用不可变更新并让字段校验保留拒绝；测试错误题号、并发查询、修正及提交。                                                        |
| A-07 | P1 待修复   | `user/AutoImportUsers.tsx:131` 使用 `xlsx` 解析用户选择的工作簿；当前 npm 版本有高危公告且 npm 审计无可用修复版本      | 评估维护中的解析器/受控发行版；补恶意和超大工作簿、原型污染、资源限制、导入正确性回归。不能只改扩展名过滤。                     |
| A-08 | P2 待修复   | `submission/Processing/Processing.tsx`：逐测试点处理仍修改捕获的 React 数组                                            | 改为函数式状态更新或批次更新；冻结状态后连续投递多条帧，验证私有/公有测试点完整保留。                                           |
| A-09 | P2 待修复   | 管理布局和部分 `MExam`、`MObjective` 页面仅检查是否登录，普通用户仍看到管理入口并触发被拒绝的请求                      | 统一角色感知的路由/菜单和权限不足状态；补学生、教师、管理员、会话失效测试。后端拒绝仍是授权边界，这不是已证明的越权漏洞。       |
| A-10 | P2 待修复   | `contest/Rank.tsx`：偏好只在挂载时读取，响应原地排序且无过期结果保护                                                   | 按 contestId 重置偏好，复制后排序，过滤迟到响应；补跨比赛导航与竞态测试。                                                       |
| A-11 | P2 待修复   | `common/Table/TableWithPagination.tsx`：内联 API、更换查询 props、筛选缓存与正负版本号语义仍隐式，保留 hooks 警告      | 先补同名表格更换 API、`initRequestProps`、重置筛选、版本恢复测试，再提取稳定查询入口。                                          |
| A-12 | P2 待修复   | `common/Form/ModalFormUseForm.tsx`：多步骤初始值仍依赖 100 ms 定时注入                                                 | 通过子表单就绪信号替代时间假设；真实 StepsForm 覆盖 next/back、延迟加载、关闭重开、嵌套初值。                                   |
| A-13 | P2 待修复   | `common/Form/Item/ItemUpload.tsx:45`：公开属性 `use`，实际判断 `ues`，用户上传模式无法按契约选路由                     | 为 user/admin 两种模式补上传适配器测试再修正；当前仓内调用是 admin，不能把未使用路径当成已验收。                                |
| A-14 | P2 待修复   | `user/Form/Item/ItemCaptcha.tsx`：刷新验证码请求没有竞态和拒绝处理，图像与 ID 可能过期                                 | 同步绑定图片、captchaId，旧请求不得覆盖新验证码；补双击刷新、失败重试和卸载。                                                   |
| A-15 | P2 待修复   | `Utils/API/request.ts`：成功响应假定 timestamp 合法，storage 异常可能被归为网络错误                                    | 明确缺失/非数值时间与不可用 storage 的降级策略；补成功 HTTP 的异常 envelope 测试。                                              |
| A-16 | P2 待修复   | `submission/Submit.tsx`：取消弹窗后，迟到提交结果仍可能打开结果页；校验与 API 失败路径混在一起                         | 明确取消是否仅关 UI 或取消请求；补 pending 时关闭、重试、业务失败、迟到成功的消费者测试。                                       |
| A-17 | P2 待修复   | `Component/common/Editor.tsx` 保存图标仍引用外部 58cdn SVG                                                             | 换为本地受控资产，浏览器阻断外部网络后仍能显示和操作保存按钮。                                                                  |
| A-18 | P2 待修复   | 依赖树存在 133 条去重公告，含构建/开发工具和运行时依赖；4 条 critical 公告均在开发/构建链                              | 依照下方依赖分组逐项确认可达性与升级路径；优先 XLSX、Axios 及对外使用的开发服务器，避免强制跨大版本 resolutions。               |
| A-19 | P2 待优化   | 生产初始入口约 4 MiB，仍有资源大小和 Browserslist 数据陈旧警告                                                         | 记录压缩体积/请求数和首屏耗时，按实际入口拆分 ProComponents、编辑器及高亮器；不能以隐藏 performance warnings 关闭。             |
| A-20 | P2 待修复   | 管理端 1200 px 内容加 200 px 侧栏，移动端管理表单仍跳过                                                                | 定义需要移动支持的管理流程；补抽屉导航、触摸操作、表格局部滚动和模态编辑后移除 skip。                                           |
| A-21 | 待验收      | 旧 standalone exam 后端不在当前 Java checkout，无法完成完整旧考试生命周期                                              | 提供隔离服务和学生/管理员 fixture，覆盖开始、答题、交卷、重连、到时自动交卷及权限。题单考试模式不能代替该验收。                 |
| A-22 | 待验收      | Markdown/HTML 和版权 HTML 是信任边界；Vditor 默认 sanitize=true，本轮未发现具体绕过                                    | 用恶意链接、事件属性、嵌套 HTML、图片/文件 URL 做浏览器安全回归；确认版权 HTML 的服务端写入权限。不能将缺少测试写成已发现 XSS。 |
| A-23 | P2 待完善   | CI 主要验证 mock API；真实 fixture 依赖本地生成文件，覆盖率仍集中在已迁移模块                                          | 建立可重复创建/清理的后端 fixture，持续记录覆盖率；增加上传、签到、题单答题/交卷、管理权限的真实验收。                          |
| A-24 | P2 待清理   | `submission/API/getSubmissionList.ts` 是未发现仓内消费者的旧缓存 hook，有重复请求和迟到写入问题                        | 先确认是否有外部导入；若无则删除，否则采用经过测试的查询契约迁移。                                                              |
| A-25 | P2 待清理   | `MProblem.tsx` 与 `Ext-HwsInfo.tsx` 仍有 4 处 Ant Design `addonAfter` 废弃属性                                         | 在对应页面迁移批次改为 `suffix`/`Space.Compact` 并补单位显示测试，避免只为 4 行改动重排两个 legacy baseline 文件。              |
| A-26 | P2 待修复   | `Pages/Client/CProblemInfo.tsx` 的 `problemInfoX` 仅在新值非空时更新，新 key/会话加载时右侧可能短暂显示旧 DTO          | hook 返回空时清除派生状态，或直接从当前会话值派生；补页面级 key 与登录会话切换测试，证明旧详情不会残留。                        |

## 本轮已修复

| 编号 | 修复组                                                                 | 主要回归证据                                                                                                      |
| ---- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| F-01 | 分页/搜索迟到覆盖，失败后 loading 无法恢复                             | `TableWithPagination.test.tsx`：B 先返回、A 后返回；失败后版本触发重试。                                          |
| F-02 | 弹窗并发 loader 覆盖和注入 timer 泄漏                                  | `ModalFormUseForm.test.tsx`：两个编辑加载逆序返回；清理和失效代次。                                               |
| F-03 | 同行数替换记录后 editable keys 没更新                                  | `CellEditTable.test.tsx`：行键 1/2 换成 3/4。                                                                     |
| F-04 | 表单双向值同步冲突和循环覆盖，空值破坏旧适配器                         | `FormExtraInfo.test.tsx`：初值、外部更新、冲突、显式空值同步、旧适配器默认兼容和重置。                            |
| F-05 | Vditor/Clipboard 实例泄漏和过期回调                                    | `EditorLifecycle.test.tsx`：换语言、关闭、卸载、当前回调和监听释放。                                              |
| F-06 | 题目/题单旧结果、失败缓存阻止重试、重复请求、跨会话复用及注销后回填    | 两个 `get*Info.test.tsx`：多消费者、已缓存/未完成时切换会话、A-B-A 重试、旧错误、注销与请求隔离。                 |
| F-07 | 摄像头晚于关闭才返回及正常关闭时未完整停流                             | `QRScanner.test.tsx`：ZXing controls 在关闭前/后就绪都只停止一次，不再创建两条独立流。                            |
| F-08 | 题单全局键盘/右键监听重复注册和卸载残留                                | `Problem.test.ts`：挂载订阅、清理与重新挂载。                                                                     |
| F-09 | 旧考试答案 effect 的依赖参数不是数组                                   | `getAnswerSheet.test.tsx`：答卷更新和 examId 切换不形成重复请求循环。                                             |
| F-10 | 题单/题组/主客观题转换修改原始对象                                     | `dataConvert.test.ts`：冻结输入，输出正确且源对象未变。                                                           |
| F-11 | 取消被当成网络失败、空响应二次异常、空 401 未跳转                      | `request.test.ts`：实际 CanceledError、空 503/401、编码返回地址。                                                 |
| F-12 | WebSocket 改写 Redux、批次丢帧、重复加分、公私编号冲突、重判沿用旧进度 | `submissionUpdates.test.ts` 与真实消费者 `SubmissionList.test.tsx`：同步多帧、typed key、重判、旧版本、冻结输入。 |
| F-13 | 提交详情 A 的迟到响应覆盖 B，响应被原地归一化                          | `Processing.test.tsx`：冻结 A/B，B 后请求先完成，A 不再覆盖。                                                     |
| F-14 | logout thunk 返回 void，无法等待与区分失败                             | `user.test.ts`：pending 时保留状态、成功清理、失败拒绝；客户端 Header 等待完成后跳转。                            |
| F-15 | 登录重复提交、返回地址未解码/丢参数                                    | `Login.test.tsx`、`CLogin.test.tsx`、浏览器：空表单、pending 防重、失败重试、完整本地返回路径。                   |
| F-16 | 验证邮件请求未处理失败且可重复发送，父组件渲染重置倒计时               | `ItemEmail.test.tsx`：拒绝后重试、pending 单请求、反复 rerender 后仍正常倒计时。                                  |
| F-17 | 客户端 1300 px 最小宽度使手机登录和分页不可操作                        | 响应式 Header/Content/Login；去掉两项 test.fail，加入 320 px 标签边界和页面宽度断言。                             |
| F-18 | 默认开发服务监听全网卡且关闭 Host 校验                                 | 默认 loopback 和限定 Host；LAN 调试需显式配置 `HOST` 与 `DEV_ALLOWED_HOSTS`。                                     |
| F-19 | 测试输出掩盖组件/依赖运行时诊断                                        | 修复列表 key、错误 Select 子项、废弃属性与 i18next；统一 Lezer，48 suites 的 console error/warn/info 均为 0。     |

交叉复审额外阻止了两类不完整修复：双向同步 effect 同时写两端，以及纯函数测试正确但实际批次消费者仍使用旧快照。
已补针对消费者的用例，未通过增加 baseline、禁用规则或把失败标记成预期失败来通过门禁。

## 依赖审计

[DEPENDENCIES.json](audit/DEPENDENCIES.json) 保存了公告链接、受影响/修复版本范围、
运行时依赖链与开发依赖链。扫描涉及 48 个包、133 条按公告 URL 去重的公告：
4 critical、65 high、53 moderate、11 low。Yarn 原始输出的 482 次依赖链命中不是 482 个独立漏洞。

- `xlsx`：实际工作簿导入路径，优先替换/升级评估。审计的 `<0.0.0` 修复范围表示该 npm 包没有可用修复版，不表示任意版本都安全。
- `axios` / `follow-redirects` / `form-data`：多数公告限定 Node adapter、proxy 或原型污染前提；浏览器 XHR 使用不自动满足前提，仍需升级与契约回归。
- `prismjs`、`lodash-es`、`fast-uri`、`cookie`、`path-to-regexp`：检查实际调用 API、输入是否可控，再决定修复优先级。
- `webpack-dev-server`、图片优化器及其解压/命令行依赖：属于开发/构建边界。默认绑定与 Host 校验已收紧，版本升级和供应链修复仍待处理。
- `decompress` 的 critical 公告在图片构建链且无 npm 修复版本，应评估替换整条旧工具链；不要只执行强制升级。

## 验证与度量

本节以主线最后一次 Node 24 集成结果为准，子报告中的中间计数和环境记录仅为过程证据。

| 项目                       | 本轮结果                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TypeScript / lint / format | Node 24 类型检查通过；0 errors；审计可比范围 warning 168 -> 156；全仓新增/修改文件格式通过                           |
| Jest / coverage            | 48 suites、267 tests 通过；console error/warn/info 均为 0；lines 18.31%、statements 17.89%                           |
| 浏览器 / 视觉              | 23 passed、1 个既有管理端移动 skip；桌面三浏览器及移动 Chromium 通过；2 个 Chromium 视觉基线通过                     |
| 本地真实服务               | 5 个场景通过：服务/代理、真实浏览、隔离账号题单/判题/WebSocket/登出、AI bank 与 AI mock fixture                      |
| any / non-null / 文件规模  | 可比 332 个生产文件：显式 any 1805 -> 1781，as any 25 -> 24；non-null 3、ts-ignore 2 未增加；全工作区 353 个生产文件 |

生产构建通过，Webpack 仍报告 3 条既有的 lint/资源与入口体积警告，初始入口约 4.04 MiB。
终验将并行开发中的 7 个 AI 面试/路由文件仅作 Prettier 机械格式化，没有改其业务逻辑。
随后全仓 `format:check` 与 `git diff --check` 均通过。
开发服务器浏览器 overlay 只拦截编译错误；受 baseline 管理的 warning 仍完整出现在终端、`yarn lint` 和 CI。
全量本地矩阵首次运行时，Autolab 被并行任务热重载，AI bank 的接口短暂返回 503；服务稳定后的独立终验通过。

静态指标使用 TypeScript AST 统计，而非只数包含 any 的行；基线文件的同比与包含新文件的全仓库存分别列出，
避免通过删除测试、改写为宽泛断言或把类型迁移到新文件来制造下降。

```sh
node scripts/audit-metrics.cjs fced08d > output/audit-metrics.json
yarn quality
yarn build
yarn test:e2e
yarn test:visual
LOCAL_BASE_URL=http://localhost:3002 yarn test:local services.spec.ts workflows.spec.ts
yarn audit --json > output/audit-dependencies.jsonl
```

真实服务测试需要独立的本地后端和既有隔离 fixture，见 [上一轮验收记录](FRONTEND_FOLLOWUP.md)。
新开发服务应使用修改后的配置启动。旧服务不会自动继承监听地址和 Host 策略。

## 子报告与维护方式

- [公共表单、表格、Markdown](audit/SHARED_COMPONENTS.md)
- [状态、传输和提交](audit/STATE_TRANSPORT.md)
- [业务流程](audit/DOMAIN_WORKFLOWS.md)
- [依赖公告数据](audit/DEPENDENCIES.json)

后续每个 PR 引用 A-xx 编号，保留复现条件，补能在旧代码失败的测试，记录实现与验证命令，再将状态改为“已修复”。
涉及真实服务的事项需补真实验收记录后才能关闭；纯 mock 测试、截图更新或构建成功不能替代它。
本轮的“已修复”指工作区实现和对应验证，不表示所有剩余事项已完成或已可无条件发布。
