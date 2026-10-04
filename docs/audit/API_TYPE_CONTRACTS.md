# R-09 API 类型与响应契约

证据日期：2026-10-04（UTC）。本轮连接本地 Java gateway 和 AutoLab，不将 mock 测试写成真实服务验收。

## 边界实现

- `Get`/`Post` 默认返回 `unknown`，不再让未迁移方法隐式返回 `any`。已迁移 adapter 显式指定业务 DTO。
- Axios JSON 响应先按 `unknown` 接收。`isApiEnvelope` 校验对象、整数业务码，以及成功响应必须存在的 `data` 字段；成功的 `data: null` 合法。HTML、数组、空对象、字符串业务码和缺少成功数据的响应显示本地化错误并上报一次。
- envelope 检查不等于业务 schema 校验。`data as Payload` 只存在于 adapter 边界；DTO 由后端源代码、契约测试和真实开发接口共同验证，不声称 TypeScript 可以验证任意服务器内容。
- Java Long ID、文件 size 和分页计数保留字符串；AutoLab 分页计数和题单 ID 保留数字。禁止为统一表格类型而转换大整数。
- 登录和第三方绑定返回用户 profile，不复用含密码的登录请求 DTO；用户 feature flags 接受服务当前返回的整数和兼容的布尔表示。
- 文件上传与 MD5 缓存返回 `FileReference`；查询未命中返回 `null`。批量上传按原始输入顺序拼回引用，禁止用泛型 `any` 或结果数组断言掩盖缺失引用。
- 竞赛查询、榜单、题单 info 和搜索分页分别声明 DTO；榜单中没有提交的题目允许空 tuple。AI job/resource 接受服务返回的 nullable scope、error、result 和完成时间，事件游标维持数字。
- 二进制请求指定 Blob/ArrayBuffer/string 边界，继续通过现有下载测试验证 JSON 错误、401/403、大小限制、文件名和 object URL 清理。

## 契约依据

本地后端 checkout 是本轮的契约依据，而不是理想化的前端接口：

| 域        | 核查来源                                               | 保留的差异                                                                                                    |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 账号      | Java `UserController` / `UserProfileRespDTO`           | profile 字符串 ID、nullable 联系信息、feature flags；验证码字段为 `captchaId`/`captcha`                       |
| 文件      | Java `FileDTO` / `LocalFileService`                    | 字符串 ID/size；MD5 未命中为 null；单文件与批量上传不同 FormData 字段                                         |
| Java 分页 | Java `PageResult` 与真实 contest list                  | Long 计数字符串，而不是 AutoLab 的数字                                                                        |
| 竞赛榜单  | Java `ContestRankDTO.OneProblemResult`                 | 空构造器返回 `[]`，已提交项为五元素 tuple；真实 fixture 当前榜单为空，因此非空 tuple 只由后端源码和 mock 证明 |
| 题单      | AutoLab `ser/problem_set.py` / `model/answer_sheet.py` | `showScoreInRunning` 控制 point 字段是否出现；练习时间设置和迟交权限可为 null                                 |
| AI        | AutoLab `server/auto_task_ai.py` 与真实 jobs/resources | nullable scope 与 job 结果；分页和事件 cursor 数字                                                            |

## 验证入口

- `tests/types/api-contracts.ts` 由 `yarn typecheck` 编译，证明请求默认值及已迁移返回值不是 `any`，并固定两类分页计数的区别。
- `request.test.ts`、`c-api.test.ts`、`ai-platform.test.ts`、`fileUpload.test.ts` 和题单缓存测试共 82 个定向测试。
- `LOCAL_BASE_URL=http://localhost:3001 yarn test:local api-response-contracts.spec.ts` 使用专用 `ai_dev_` 账号，验证真实 profile、Java/AutoLab 分页、既有题单、MD5 未命中和 AI job/resource。禁用 trace，附件不含密码和原始 profile。
- 真实测试只显式执行登录；`info_c` 可能为既有题单惰性初始化服务端进度，不能声称数据库完全只读。没有创建新题单、提交答案或修改 AI 资源。
- `yarn test:dev-regression` 重跑桌面/Pixel 7 的 14 个真实页面测试。
- 最终质量、构建、bundle 和跨浏览器日志在 `output/audit/R-09/*-final.log`。该目录是本地忽略产物，摘要随主审计文档提交。

## 关闭范围

R-09 收敛的是请求 envelope、认证、分页、下载、核心竞赛/题单返回值和 AI job/resource 的类型边界，不是全仓库消除 `any`。历史页面、部分未迁移 CRUD 输入仍有类型债务；它们的未知响应不再由通用请求 helper 隐式声明为 `any`。本轮不通过修改后端、强转空 fixture 或放宽生产 DTO 来让测试通过。
