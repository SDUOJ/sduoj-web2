# 比赛问答公开契约（R-35）

本机已有 `sduoj-server-private` checkout 和 Java 开发服务。原审计中“没有对应后端 checkout”的判断不再适用；不能据此推断其它真实业务已验收。

`ContestManageController` 在 `/manage/contest/publicIt` 提供管理员 POST 接口，接收 `ContestPublicDTO` 的 `clarificationId: Long` 与 `opt: Integer`，返回 `Void`，成功 envelope 的 data 为 null。`ContestManageService.publicIt` 校验根问答、比赛管理权限，然后更新 isPublic。原 `/contest/publicQuestion` 不存在，也没有调用者；已删除错误的客户端方法，在 mApi 中增加 typed `publicQuestion`，必须显式指定 opt 0/1。

请求约束检查正的 signed 64-bit 十进制 ID、必填 opt 和 0/1 值，在发送前拒绝缺失、溢出和非法值。没有把 Void 伪装成布尔值、空对象或 any。已确认契约的比赛更新/报表方法去掉未知 TODO；不改其它与本项无关的类型债务。

```sh
yarn test --runTestsByPath src/Utils/API/m-api.test.ts src/Utils/API/c-api.test.ts src/Config/validation/requests.test.ts
LOCAL_BASE_URL=http://localhost:3001 yarn test:local tests/local/contest-question-contract.spec.ts
```

真实测试仅接受 loopback，并使用本机 `ai_dev_` 隔离超级管理员。读取比赛后创建唯一 `FE-AUDIT-R35-*` 问答，依次公开/取消公开，核对两个成功响应 data=null 及列表 isPublic，最后仅删除自己创建的问答，并确认完整列表恢复到原值。未修改已有问答、创建比赛或访问生产服务。sanitized fixture 位于 `fixtures/contest-question-visibility.json`：ID 替换为代表性值，不包含凭据、cookie 或用户信息；测试报告附件保留两次实际观察与清理结果。

2026-10-04，Node v24.20.0：45 个针对性测试、真实契约测试通过；quality 98 suites/478 tests、生产 build/bundle（57 assets/3,984,637 bytes）、69 个跨浏览器测试（3 非适用视口跳过）、8 个真实开发测试、13 个 artifact tests、actionlint/ShellCheck 全部通过。日志位于未跟踪 `output/audit/R-35/`。CI 保留 mock 请求门禁；真实测试需要本地 checkout、隔离账号和服务，未声称远端 CI 已运行真实环境。
