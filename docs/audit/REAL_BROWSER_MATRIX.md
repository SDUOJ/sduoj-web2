# R-12 真实开发浏览器矩阵

2026-10-05 范围修订：项目所有者确认 Java exam 已废弃。本文 2026-10-04 的独立考试 404 与匿名跳登录记录保留为历史证据；当前旧考试页显示退役提示，不再探测旧 API。AutoLab 考务/限时题单仍属活跃范围。新增 GitHub issue 内容与真实 dev 回归见 `GITHUB_ISSUES_AND_REMAINING.md`，不得把预期失败计为功能通过。

验收日期：2026-10-04（UTC；原始报告保留时区时间）。本文件记录可重复的真实服务回归，不将 mock、限时题单或 AI 考务页面视为 standalone exam 生命周期验收。

## 运行

```sh
LOCAL_BASE_URL=http://127.0.0.1:3001 yarn test:dev-regression
```

- Node 24、Yarn 1.22.22、Chromium；`playwright.dev-regression.config.ts` 顺序运行桌面和 Pixel 7 两个项目。
- 必须提供本地 webpack 开发服务器、Java gateway/filesys/contest/user 服务与 AutoLab。测试拒绝非 `localhost`/`127.0.0.1` 目标。
- 本地账号从相邻部署仓库的 `data/dev/ai-integration/test-user.json` 读取，用户名必须以 `ai_dev_` 开头。凭据不写入报告，认证流程关闭 trace。
- 复用当前账号名下已有的 `FE-DEV-*-exam` 和匹配的 `*-practice` 题单；缺少 fixture 时失败，不临时创建不可清理的题单。
- 报告：`playwright-report/r12/index.html`；包含服务 manifest、截图和错误预算。运行日志保存在 `output/audit/R-12/`，这些输出不提交到仓库。

## 已覆盖的真实契约

| 范围      | 断言                                                                                   | 数据影响                                    |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| 管理      | 模板列表加载、创建弹窗打开、移动宽度不超过视口、取消弹窗                               | 不保存模板；取消后列表与原快照一致          |
| 竞赛      | 从真实管理列表取竞赛 ID，真实客户端标题和题目行可见                                    | 只读；不报名、不提交、不编辑竞赛            |
| 题单      | 已有练习/限时题单概览和客观题内容可见                                                  | 不选择答案、不标记、不交卷                  |
| 上传      | 下载已有 ZIP，MD5 记录先存在；真实 multipart 上传返回同一 ID；页面上传组件命中同一记录 | 不新增持久文件；取消后 MD5 记录与原快照一致 |
| 登出      | 菜单登出返回首页；重新访问管理深链跳到登录并保留 `to`                                  | 仅结束本次测试会话                          |
| 路由/代理 | 匿名管理/考试/题单深链、未知路由 404、Java/AutoLab proxy、真实题库浏览                 | 只读                                        |

矩阵共 14 个真实测试（每视口 7 个），不拦截或伪造 API 响应。ZIP 下载只有 HTTP 429 时允许最多两次、每次间隔 1.2 秒的读取重试；其他 HTTP/业务失败不得以重试掩盖。上传去重依赖本地 filesys 的内容哈希契约，不能据此宣称新文件失败、取消或权限矩阵已完成（R-05）。

## 错误预算

业务流程的 `pageerror`、意外 API HTTP 失败、外部请求和未列举的 console error/warning 均为 0。报告逐项保存以下已知消息的实际次数：

| 消息                                   | 每视口上限 | 原因                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------- |
| webpack 开发构建体积告警摘要           | 6          | 六次完整页面加载；不豁免编译错误和 overlay                          |
| webpack asset size limit               | 12         | 每次加载最多两条同类开发体积消息                                    |
| webpack entrypoint size limit          | 12         | 同上；生产体积仍由 `bundle:check` 门禁负责                          |
| Ant Design 静态 `message` context 告警 | 1          | 现有登出通知；仅精确匹配该文本                                      |
| 401 Unauthorized 资源 console error    | 1          | 登出后管理深链的 profile 探测；API 仅豁免 `/user/getProfile` 的 401 |

本批修复矩阵发现的竞赛/题单/首页公告行 key、题单多组 key、旧 Card/Slider API 和表单弹窗移动最小宽度问题；这些警告不加入豁免。

## 服务版本与边界

每轮报告记录 frontend HEAD/补丁 SHA256、回归源 SHA256、Java/AutoLab checkout HEAD、运行容器名/ID/镜像 tag、Java 服务不可变镜像 ID、AutoLab 实际 OpenAPI 路径 SHA256和时间。checkout 版本仅说明本地源码，不冒充实际服务镜像版本。

2026-10-04 本机 Java checkout 为 `d70c76deb8f915ba84f3c9351d5904e6273a6e1e`，AutoLab checkout 为 `da27fc81b796e766eba3990ae3b541fced5d1c23`。`/api/exam/getInfos` 返回 HTTP 200 / envelope code 404，另外只读探测 `/api/exam/getInfo?examId=1` 和 `/api/manage/exam/getInfo/1` 同样为 code 404。报告将 standalone exam 标记为 `lifecycle: not-verified`；R-04 和 R-12 的 standalone exam 部分保持待验收。

独立考试服务、生命周期 fixture 和账号权限契约补齐后，需要另外覆盖创建、开始、保存、重连、自动交卷和权限变化。这里的限时题单页面回归不是替代品。
