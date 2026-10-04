# 工作流与 Shell 静态门禁（R-22）

当前外部 GitHub Actions 保持完整 commit SHA pin。`check-workflow-pins.cjs` 不再豁免 `release.yml`；该用户拥有的工作流当前不在活动树中，恢复或新增后会自动接受同一规则，不能借文件名绕过门禁。用户 stash 没有被恢复、改写或提交。

`install-static-checkers.cjs` 固定 actionlint 1.7.7 与 ShellCheck 0.11.0，对 Linux x64 CI 和 macOS arm64 本机分别保存完整发行包 SHA256。下载有连接/总时限，校验完成后才解包和安装。固定的是已验证版本，不声称是最新版本。工具位于未跟踪 `output/static-checkers/bin`，没有修改全局工具链。

```sh
node scripts/install-static-checkers.cjs --plan
node scripts/install-static-checkers.cjs
yarn test:static
yarn lint:static
```

`check-static.cjs` 检查所有活动 `.yml/.yaml` 工作流及递归 scripts 下的 shell 文件，actionlint 同时调用固定 ShellCheck。命令最多运行 60 秒；缺失 binary 或诊断返回非零并保存 JSON，不通过空目录启动等待 stdin 的进程。CI 安装同一工具并上传 `static-analysis.json`。

本轮 ShellCheck 发现了两处问题并修复：超时参数校验改为显式 if；生成远端回滚脚本的外层 heredoc 必须转义 `$root`，否则本机 unset 变量会在调用 SSH 前失败。新增隔离测试确认 local root 未定义时生成成功，远端脚本保留字面 `$root` 并通过 `bash -n`。未通过全局 suppress 掩盖这些诊断。

Node v24.20.0 本机验证：4 个 static fixture tests、workflow pin 正反例、actionlint/ShellCheck 全部通过；97 suites/468 tests 的 quality、生产构建/bundle、61 跨浏览器测试（3 个非适用视口跳过）、7 真实开发环境测试、12 artifact tests 和 7 timeout tests 全部通过。

官方发行包 checksum 已在本机验证，Linux checksum 对照发行清单固定。这里证明本地静态门禁与工作流配置有效，不声称已触发远端 GitHub Actions；真实发布/回滚仍属于 R-15/R-21。报告保存在 `output/audit/R-22/`，已下载发行包和 checksum 来源快照在 `output/audit/tools/`，均不纳入 Git。
