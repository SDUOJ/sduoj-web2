# R-21：预发布恢复副本保护

2026-10-04 UTC。本次只修改已跟踪的 `scripts/release-v2-pre.sh`，不恢复或改写用户隔离的正式发布脚本。R-21 保持部分修复，不能用本地故障注入替代正式发布和远端恢复验收。

## 修复范围

- 备份前验证 current 入口；拒绝复用已有 backup-new/backup-old 的 release-id，不删除上次失败留下的恢复副本。
- 新快照同步成功后才轮换默认 backup。新版本同步失败时，从默认 backup 恢复 current；恢复成功也保留两份有效快照。
- 自动恢复失败时保留默认 backup、带 release-id 的旧 backup 和 staging；不再忽略 rsync 失败后删除唯一可用快照。人工回滚脚本仍从默认 backup 恢复。
- `smoke` 失败改为返回非零，允许调用者执行回滚。原来的 `die` 会直接退出整个脚本，使 post-deploy rollback 分支不可达。
- 生成的独立 rollback 脚本使用实际 remote root；正式 `/v2` 不在任何同步、删除或恢复目标中。

失败留下的带 release-id 副本不自动清理。部署所有者确认 current/backup 可用后再处理这些目录；不要重用失败的 release-id，也不要在恢复失败后继续发布覆盖证据。

## 故障注入与边界

`yarn test:release-recovery` 执行实际脚本函数和其生成的 rollback 脚本，但将 SSH 换成本地 shell，将 rsync 换成隔离临时目录内的文件复制/故障注入。macOS 的测试 timeout 入口复用已有 `timed-command.cjs`；每个 shell 另有 10 秒上限。没有 SSH 连接，没有覆盖开发数据库或远端站点。

九项断言：成功发布与独立回滚、快照同步失败、发布失败且恢复成功、发布和恢复都失败后独立回滚、同步中 SIGTERM 后独立回滚、release-id 冲突保留文件、smoke 失败返回调用者、post-deploy smoke 失败实际恢复且发布仍报错、deploy 在恢复失败后也不清理 staging。

最后两项只隔离构建、artifact 校验和 smoke 状态，以定向验证真实 deploy 控制流；artifact 正确性仍由 `test:artifact` 门禁验证。这些测试不冒充真实 rsync、SSH、站点 smoke 或用户正式发布脚本验收。CI 新增同一九项门禁；未声称远端 CI 已执行。

复现：

```sh
yarn test:release-recovery
yarn test:artifact
yarn lint:static
yarn quality
yarn build && yarn bundle:check
yarn test:e2e
yarn test:dev-regression
```

本轮九项故障注入、artifact 定向测试、静态检查、quality 106 suites/558 tests、生产 build/bundle、常规四浏览器 81 PASS/3 非适用 skipped、真实双视口开发矩阵 14 PASS。日志位于忽略目录 `output/audit/R-21/`，详见主审计的 R-21 验证记录。

用户的三个 release stash 保持原 SHA，待所有者确认正式发布改动的处理方式；实际 SSH/rsync 中断、正式 `/v2` 回滚和部署 smoke 仍属于 R-14/R-15/R-21 的剩余验收。
