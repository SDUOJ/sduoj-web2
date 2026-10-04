# R-15：制品级部署 smoke（部分完成）

2026-10-04 UTC。本轮修改当前已跟踪的预发布流程，用户隔离的正式发布快照保持原样。R-15 仍需正式发布配置归属、非生产远端发布/回滚和实际 CI 运行证据，不能因本地 nginx 验证通过而关闭。

## 门禁

`scripts/deployment-smoke.cjs` 只发送无 cookie 的 GET：

- 读取服务端 release manifest，拒绝不安全/重复路径、跨环境 origin、错误前缀、超限文件和错误 hash。
- 下载清单中的全部文件，用已有 artifact 校验器重新验证路径、完整 Git SHA、大小、SHA256、HTML/runtime/main/资源引用、PWA 前缀和 Vditor 内容版本。不是只确认 `<div id="root">`。
- `/v2/` 或 `/v2-pre/` 根路径、登录深链和不存在的页面路由必须返回同一制品 HTML；不存在的 static JS 必须返回 404，不能回退为 SPA HTML。页面级 404 展示仍由浏览器回归验证。
- 哈希 JS/CSS 必须有一年 immutable cache 和可执行 MIME；HTML、release/asset/PWA manifest 必须有 no-cache/no-store/max-age=0。共用 nginx 配置新增三个 manifest 的 no-cache location。
- 所有响应检查 CSP、nosniff、frame、referrer 和 permissions 头；HTTPS 另检查非零 HSTS。匿名 `/api/user/getProfile` 必须返回 HTTP 401 和 code 401 JSON，不能用静态 HTML 冒充 API。
- POST、凭据、带 query/hash 的目标和 redirect 均不允许。最多 8 个下载 worker，单请求 10 秒、总时限 180 秒，文件/总制品上限复用 artifact 契约；不自动重试。成功或失败均清理本轮临时下载目录。

部署入口只接受 canonical HTTPS URL；`--loopback-audit` 仅接受固定 `http://127.0.0.1:4173/v2/` 和 test 制品，不允许用它发布 test 产物。

## 预发布接入

`release-v2-pre.sh` 将部署前、部署后和失败回滚后的报告保存至 `output/release-smoke/<release-id>/{before,after,rollback}.json`：

已存在该 release-id 的报告目录时拒绝发布，不覆盖失败或成功发布留下的证据。

1. 发布前记录既有服务端 manifest SHA256。任何制品、路由、API 或安全/缓存头失败都不进入 staging 同步。
2. 发布后用本地经上传门禁验证的 manifest 原始字节比对远端 manifest，然后下载验证全部文件。
3. 失败触发原有备份恢复；回滚 smoke 必须匹配发布前保存的 manifest SHA256，并再次验证资源和路由。失败继续保留恢复副本，不报发布成功。

部署方需先为既有版本生成/安装经过验证的 release manifest，并为实际 `/v2-pre/` server 接入同等路由、缓存和安全头。缺少这些前提时门禁会拒绝发布；不要回退到只检查根节点。当前仓库的 nginx 样例覆盖 `/v2/`，没有代替部署所有者修改真实预发布配置。

独立 `rollback` 命令执行恢复后也运行同一 smoke。它验证备份制品自身的一致性，但没有本次发布前的 manifest 绑定；精确恢复上一版本的绑定由 deploy 失败分支验证。正式脚本仍在用户 stash 中，本轮没有恢复、提交或运行它。

## 验证范围

17 项 Node 定向测试包括正常完整制品、危险目标、篡改 chunk、缺失 runtime、错误深链、static fallback、错误 MIME、可变 metadata/hashed asset 缓存、缺失安全头、API HTML、redirect、路径穿越、错误 staged/known-good manifest、单请求/总时限和非法 JSON 脱敏。HTTP 故障 fixture 明确使用 Connection close，避免快速复用同一 loopback 端口时测试客户端重用上一 fixture 的 socket；不是部署端重试。中断信号会取消下载并走同一清理路径。

四浏览器矩阵还启动实际 nginx，调用同一 CLI 下载真实 build-test 的全部文件。real-local-gateway 模式使用本机 Java/AutoLab；CI 模式只模拟匿名认证失败，四条真实通信测试仍显式跳过。二者都实际验证 nginx 和 artifact，但不证明远端部署或真实 GitHub CI 已运行。

```sh
yarn test:deployment-smoke
yarn test:release-recovery
yarn quality
yarn build && yarn bundle:check
yarn test:e2e
SDUOJ_SECURITY_REAL_SERVICES=1 yarn playwright test -c playwright.security.config.ts
yarn test:dev-regression
```

本轮 17 项 smoke、10 项恢复、13 项 artifact 定向测试通过；quality 106 suites/558 tests、生产 build/bundle、常规 81 PASS/3 非适用 skipped、真实开发矩阵 14 PASS。实际 nginx/真实本地 gateway 模式 28 PASS，CI fixture 模式 24 PASS/4 条真实通信 skipped；每个 CLI 验证 727 文件和 733 个只读 GET。

日志位于忽略目录 `output/audit/R-15/`，两种服务模式的独立 manifest 和具体命令见主审计 R-15 验证记录；实际制品校验报告附在 `playwright-report/security/` 的 `deployment-smoke` attachment。用户开发服务器和三个发布 stash 不变；没有执行远端 SSH、部署、nginx reload 或线上回滚。
