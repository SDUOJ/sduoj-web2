# sduoj-web2 当前前端进展与整改清单

复核日期：2026-10-03

范围：当前 `sduoj-web2` 工作树中的路由、页面、公共组件、API 适配层、状态管理、构建、测试、依赖和开发环境行为。

## 当前结论

本轮已经完成仓库内可以独立完成的前端修复，并按批次验证、提交。当前没有发现新的 P0/P1 前端代码阻塞；仍有少量必须依赖后端契约、部署配置或真实业务环境才能关闭的项目，见“未关闭项目”。

| 门禁 | 当前结果 | 边界 |
| --- | --- | --- |
| TypeScript | `YARN_IGNORE_ENGINES=1 yarn typecheck` 通过 | 当前本机 Node 为 20.20.2，`package.json` 要求 `>=24 <25`；需要 Node 24 CI 再验一次 |
| 单元测试 | 81 个 suite、371 个测试全部通过 | 测试含 AI、路由、请求、表格、题目、提交、AutoLab 和认证边界；真实后端流程仍不由 mock 代替 |
| ESLint | 0 errors，13 个 warning | 13 条均为 `react/no-unstable-nested-components`，来源是第三方表格/下拉组件要求的 render-prop 回调；本轮已清除所有 `exhaustive-deps` 和 `jsx-key` warning |
| 依赖审计 | 0 vulnerabilities，345 个包 | Yarn 仍提示 `path-to-regexp@8.4.0` resolution 与请求版本不一致，需要随依赖升级持续复核 |
| 生产构建 | 通过，main entrypoint 约 3.91 MiB | Vditor、MathJax、Mermaid、Graphviz 等静态资源仍超出 webpack 建议体积 |
| 开发构建 | 3001 端口全量冷启动编译通过，TypeScript 无错误 | webpack 仅保留 ESLint render-prop、资源体积和入口体积 3 组 warning |
| 浏览器验收 | 未知路径返回 404；登录深链接保留 query/hash | 本地后端不可用时登录页仍会出现代理相关 console warning/error；真实登录和业务数据需要后端环境 |

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
- 竞赛、题单、考试、提交评测、AutoLab 课程/考勤、外部作业下载和题目编辑器补齐 effect 依赖、竞态保护和失败状态。
- 修复 Problem/Objective/Subjective、汇总报表等组件在 render 阶段 setState 的问题；成绩汇总改为派生计算。
- 清除所有列表缺失 key，修复可变数组 `push` 造成的状态引用污染。

### AI、国际化和可访问性

- AI 工作区导航实现共享 navigation、规范 heading 和 canonical links；桌面恢复双栏，移动端单列。
- AI 页面硬编码 `/v2` 改用 `UrlPrefix`；AI 导航在 Router 外部独立渲染时回退为普通链接，避免业务测试和嵌入场景崩溃。
- Loading、LoadingData、ErrorBoundary、验证码、邮箱错误、主导航、语言选择、HTML lang、manifest 和键盘可操作链接补齐可访问性反馈。
- `TableWithSelection` 正式支持 `useAllData`，兼容旧拼写 `uesAlldata`，调用点已迁移。

## 未关闭项目

这些项目需要真实后端、部署配置或专门性能工作，当前代码提交不能单方面关闭。

### A-19：首屏和编辑器资源体积

生产构建入口约 3.91 MiB，Vditor 依赖 MathJax、Mermaid、Graphviz、ECharts、Lute 等大文件。后续应按路由和功能动态加载，建立 gzip/首屏性能预算，用真实桌面和移动网络测量 LCP 和交互可用时间。关闭条件是性能数据和预算通过，而不是关闭 webpack warning。

### A-21：standalone exam 真实生命周期

当前工作区没有对应 Java 后端 checkout，无法证明考试创建、开始、保存、重连、到时自动交卷和权限变化的完整契约。前端移动布局已修复，但必须在隔离账号和真实服务上补回归矩阵。

### A-23：真实上传、摄像头和考勤环境

题单拍照、文件提交、AutoLab 签到/签退、座位和外部作业下载目前只有前端边界测试。需要真实接口的成功、失败、取消、重复提交、权限和清理 fixture，并接入 CI 或可复现的 dev 验收环境。

### “返回老版”按钮

前端没有已确认的旧版部署地址。确认地址前不能把按钮改成猜测的外链；若旧版已下线，应移除入口并提供迁移说明。

### Node 与格式门禁

本机 Node 20 与仓库要求 Node 24 不一致，本轮所有本地命令使用 `YARN_IGNORE_ENGINES=1`。CI 应在 Node 24 重跑 typecheck、lint、单测、构建和 audit。格式脚本仍可能调用系统 `git` 并受 Xcode license 限制；CI 需验证标准工具链。

### 类型债务与低风险 render-prop warning

源文件仍有约 1,685 个 `any`，API envelope、分页、认证、文件下载和 AI job/resource DTO 仍需逐域收敛。剩余 13 条 nested-component warning 都是表格、下拉或列表的 render-prop 回调；它们不再伴随 effect/key warning，但可以在后续把回调提取为稳定组件以减少 remount 风险。

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
YARN_IGNORE_ENGINES=1 yarn typecheck                         PASS
YARN_IGNORE_ENGINES=1 yarn test --runInBand                 PASS: 81 suites / 371 tests
YARN_IGNORE_ENGINES=1 yarn lint                             PASS: 0 errors / 13 intentional warnings
YARN_IGNORE_ENGINES=1 yarn audit --groups dependencies ...  PASS: 0 vulnerabilities
YARN_IGNORE_ENGINES=1 yarn build                            PASS: main entrypoint 3.91 MiB
webpack serve --port 3001                                  PASS: cold compile, no TypeScript errors
Playwright /v2/unknown                                      PASS: 404, 0 console errors
Playwright protected deep link                             PASS: login `to` 保留 query/hash
```

## 工作树说明

修复提交均已提交。当前仍有以下用户已有改动，已刻意保留且没有加入修复 commit：

- `.github/workflows/release.yml`
- `docs/RELEASE_CI.md`
- `.github/actionlint.yaml`
- `scripts/deploy-production.sh`

因此最终工作树不会显示为完全 clean；这些文件不是本轮生成，也没有被回滚或覆盖。后续合并前应由其所有者决定是否提交、拆分或丢弃。
