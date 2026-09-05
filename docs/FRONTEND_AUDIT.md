# web2 全仓审查与整改清单

日期：2026-09-05。起点：`fced08d`，分支：`feature/upgrade-antd-v5`。

本轮采用 3 个指定为 `gpt-5.6-sol` 的子代理分别审查公共组件、状态与传输、业务流程，
主线检查客户端布局、登录、工具链、依赖和最终集成，并进行了子代理之间的交叉复审。
范围是全仓静态扫描与依赖扫描，加主干工作流的深入代码审查；不等于每个页面都已完成真实后端验收。
现有 AI 工作台未提交实现纳入静态检查，功能改动保留，仅整理了阻塞格式门禁的文件。

本次续作继续使用 `gpt-5.6-sol` 子代理分别处理编辑器身份、Autolab 竞态和上传/题目表单，
主线补齐提交、排名、权限和客户端详情状态。所有修复均在当前工作树验证后再提交；并行 AI
文件仍不纳入本批次业务变更。

## 2026-09 Follow-up

本轮继续关闭了 A-01 至 A-06、A-08、A-10、A-13 至 A-17、A-24、A-26，并将 A-09
管理布局权限补齐。编辑器草稿现在按用户/文档/字段隔离，上传链路可等待且可取消，Autolab
课程、签到、二维码和验证码请求均有代次保护，题目表单使用不可变更新，比赛排名过滤迟到
响应，提交详情和提交弹窗不再接受过期结果。

A-07 已增加工作簿签名、大小、行列、单元格、字段白名单和原型键限制，但 `xlsx@0.17.4`
仍有上游公告且没有可用 npm 修复版本，因此只标记为部分缓解。A-11、A-12、A-18 至 A-23、
A-25 以及完整 standalone exam/上传/移动管理验收仍是后续工作。每项修复均保留原始失败条件的
回归测试；没有通过扩大 baseline、关闭规则或把失败改成 skip 来消除问题。

## 优先处理的剩余问题

以下编号用于后续任务、PR 和复验。P1 表示数据、流程或安全边界风险，应优先补复现；
P2 表示可靠性、契约、体验或维护问题。依赖公告级别与业务优先级分开记录。
“待验收”表示证据不足，不能按已通过处理；“待修复”已有具体代码依据。

| 编号 | 优先级/状态 | 位置与问题                                                                                                        | 建议修复与关闭条件                                                                                                              |
| ---- | ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | P1 已修复   | 编辑器 DOM/cache id 缺少用户、文档、字段隔离                                                                      | `EditorLifecycle.test.tsx` 覆盖两个用户、两个文档、字段隔离、异常 remount 和本地图标。                                          |
| A-02 | P1 已修复   | 上传、哈希和缓存查询的 Promise 被丢弃，调用方无法等待、取消或可靠处理失败                                         | `fileUpload.test.ts` 与上传控件测试覆盖命中/未命中、混合顺序、失败、AbortSignal；控件返回 abort 句柄。                          |
| A-03 | P1 已修复   | Autolab 课程/学生/签到切换接受迟到响应                                                                            | `CourseRace.test.tsx`、`CourseSignManagement.test.tsx` 覆盖代次、旧成功/失败和关闭后的隔离。                                    |
| A-04 | P1 已修复   | MAutolab 异步弹窗数据与 currentCourse 分离                                                                        | 弹窗按 kind+courseId+sessionId 绑定，旧加载/提交不得回写；保留课程提交 ID。                                                     |
| A-05 | P1 已修复   | QRFloat 轮询重叠、失败无处理、旧签到 token 回写                                                                   | 串行 setTimeout、会话代次和清理；`QRFloat.test.tsx` 覆盖慢轮询、切换签到和 token 隔离。                                         |
| A-06 | P1 已修复   | 题目表单直接修改状态数组且吞掉题目查询拒绝                                                                        | `problemLookup.test.ts`、题目表单测试覆盖不可变更新、并发复用、失败拒绝、修正题号和旧响应。                                     |
| A-07 | P1 部分缓解 | `AutoImportUsers` 使用存在高危公告且无 npm 修复版本的 `xlsx`                                                      | 已增加 5 MiB/5 sheet/5000 行/32 列/32767 字符、签名、白名单和原型键防护；解析器替换/受控发行版仍待评估。                        |
| A-08 | P2 已修复   | 提交详情逐测试点更新修改捕获的 React 数组                                                                         | 函数式状态更新；冻结快照与同步私有/公有帧测试通过。                                                                             |
| A-09 | P2 已修复   | 管理布局和部分管理页面仅检查是否登录，普通用户仍看到管理入口并触发被拒绝的请求                                    | `MLayout` 统一要求 `admin/superadmin`，普通用户显示 403 且不挂载管理子路由；`MLayout.test.ts` 覆盖角色边界。                    |
| A-10 | P2 已修复   | `contest/Rank.tsx`：偏好只在挂载时读取，响应原地排序且无过期结果保护                                              | `Rank.test.tsx` 覆盖 contestId 偏好隔离、空值清除、复制排序和迟到响应过滤。                                                     |
| A-11 | P2 待修复   | `common/Table/TableWithPagination.tsx`：内联 API、更换查询 props、筛选缓存与正负版本号语义仍隐式，保留 hooks 警告 | 先补同名表格更换 API、`initRequestProps`、重置筛选、版本恢复测试，再提取稳定查询入口。                                          |
| A-12 | P2 待修复   | `common/Form/ModalFormUseForm.tsx`：多步骤初始值仍依赖 100 ms 定时注入                                            | 通过子表单就绪信号替代时间假设；真实 StepsForm 覆盖 next/back、延迟加载、关闭重开、嵌套初值。                                   |
| A-13 | P2 已修复   | `ItemUpload` 读取错误的 `ues` 属性，user 模式未按契约选路由                                                       | `use` 路由已修正，user/admin 适配器测试和可取消 customRequest 已加入。                                                          |
| A-14 | P2 已修复   | 验证码刷新竞态可能让图片与 ID 不匹配                                                                              | `ItemCaptcha.test.tsx` 覆盖双击乱序、拒绝和卸载；刷新按钮为显式 button。                                                        |
| A-15 | P2 已修复   | 成功响应 timestamp/storage 异常处理不明确                                                                         | 无效 timestamp 跳过时钟校验，不可用 storage 不影响成功响应；请求测试覆盖四种无效值和 StorageError。                             |
| A-16 | P2 已修复   | 提交弹窗取消后迟到成功仍可打开结果页                                                                              | generation token 使取消失效当前请求结果；`Submit.test.tsx` 覆盖取消、迟到成功、失败后重试。                                     |
| A-17 | P2 已修复   | 编辑器保存图标依赖外部 58cdn                                                                                      | 使用仓内 `Assert/img/save.svg`，Editor lifecycle 测试阻断外网仍验证图标。                                                       |
| A-18 | P2 待修复   | 依赖树存在 133 条去重公告，含构建/开发工具和运行时依赖；4 条 critical 公告均在开发/构建链                         | 依照下方依赖分组逐项确认可达性与升级路径；优先 XLSX、Axios 及对外使用的开发服务器，避免强制跨大版本 resolutions。               |
| A-19 | P2 待优化   | 生产初始入口约 4 MiB，仍有资源大小和 Browserslist 数据陈旧警告                                                    | 记录压缩体积/请求数和首屏耗时，按实际入口拆分 ProComponents、编辑器及高亮器；不能以隐藏 performance warnings 关闭。             |
| A-20 | P2 待修复   | 管理端 1200 px 内容加 200 px 侧栏，移动端管理表单仍跳过                                                           | 定义需要移动支持的管理流程；补抽屉导航、触摸操作、表格局部滚动和模态编辑后移除 skip。                                           |
| A-21 | 待验收      | 旧 standalone exam 后端不在当前 Java checkout，无法完成完整旧考试生命周期                                         | 提供隔离服务和学生/管理员 fixture，覆盖开始、答题、交卷、重连、到时自动交卷及权限。题单考试模式不能代替该验收。                 |
| A-22 | 待验收      | Markdown/HTML 和版权 HTML 是信任边界；Vditor 默认 sanitize=true，本轮未发现具体绕过                               | 用恶意链接、事件属性、嵌套 HTML、图片/文件 URL 做浏览器安全回归；确认版权 HTML 的服务端写入权限。不能将缺少测试写成已发现 XSS。 |
| A-23 | P2 待完善   | CI 主要验证 mock API；真实 fixture 依赖本地生成文件，覆盖率仍集中在已迁移模块                                     | 建立可重复创建/清理的后端 fixture，持续记录覆盖率；增加上传、签到、题单答题/交卷、管理权限的真实验收。                          |
| A-24 | P2 已修复   | `submission/API/getSubmissionList.ts` 是未发现仓内消费者的旧缓存 hook，有重复请求和迟到写入问题                   | 已确认无仓内消费者并删除；现有列表统一使用 `TableWithSelection` 查询契约。                                                      |
| A-25 | P2 待清理   | `MProblem.tsx` 与 `Ext-HwsInfo.tsx` 仍有 4 处 Ant Design `addonAfter` 废弃属性                                    | 在对应页面迁移批次改为 `suffix`/`Space.Compact` 并补单位显示测试，避免只为 4 行改动重排两个 legacy baseline 文件。              |
| A-26 | P2 已修复   | `Pages/Client/CProblemInfo.tsx` 的派生 `problemInfoX` 可能残留旧 DTO                                              | 右侧详情/描述直接使用当前会话 `problemInfo`；页面测试覆盖新 key 加载期间显示空状态。                                            |

## 本轮已修复

续作关闭项：A-01 至 A-06、A-08 至 A-10、A-13 至 A-17、A-24、A-26；另将 A-09 管理布局
改为角色感知的 403 边界。A-07 的解析输入防护已完成，但因 `xlsx@0.17.4` 无上游修复版，
仍保留为“部分缓解”。

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
| TypeScript / lint / format | Node 24 类型检查通过；0 errors；审计可比范围 warning 168 -> 149；全仓新增/修改文件格式通过                           |
| Jest / coverage            | 64 suites、321 tests 通过；console error/warn/info 均为 0；lines 24.35%、statements 23.73%                           |
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
