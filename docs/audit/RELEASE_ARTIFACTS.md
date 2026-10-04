# 发布产物校验（R-41）

`yarn build` 和 `yarn build:pre` 在构建后生成 `build/release-manifest.json`。清单保存完整 Git SHA、版本、release-id、生成时间、部署前缀，以及每个普通文件的大小和 SHA256。

```sh
yarn test:artifact
yarn artifact:verify build "$(git rev-parse HEAD)" /v2/
# 预发布构建必须使用对应前缀，不能复用 /v2 产物。
yarn artifact:verify build "$(git rev-parse HEAD)" /v2-pre/
```

校验器拒绝错误 ref/前缀、符号链接、路径穿越、隐藏文件、未列入清单的额外文件、缺失文件、大小或 hash 不匹配、源映射和未批准扩展名。单文件上限 40 MiB，总大小上限 150 MiB，文件数上限 20,000。发布资源限于固定根文件、`static/{js,css,media}` 资源和 Vditor 发行资源；Vditor 的 `.d.ts` 与 LICENSE 属于已审计第三方发行内容。

入口验证检查 React root、PWA 前缀、webpack resource map、runtime/main 及 HTML 中所有 script 引用，避免只验收 HTML 而遗漏 chunk。校验成功输出 JSON；失败返回非零退出码，不继续发布。

CI 保存 `artifact-verification.json`。GitHub Pages 在 publish action 前重新校验。`release-v2-pre.sh` 在本地上传前、远端 staging 目录同步后分别执行同一独立校验器；远端必须提供 Node。远端报告保存为 `.v2-pre-validation-<release-id>.json`，校验失败不调用 `remote_apply`。本地测试通过隔离 shell fixture 模拟本地篡改和远端拒绝，没有连接 SSH 或部署站点。

这不是签名或来源证明：SHA256 只能检测相对清单的完整性，清单与产物同时被恶意替换时仍需由可信 CI、artifact 来源和访问权限保证真实性。预发布脚本的真实 SSH 部署、生产发布及回滚仍需部署方验收。用户隔离的 `scripts/release-local.sh` 不在本次修改范围内；恢复后必须在任何同步到线上目录前接入相同门禁，不能仅检查 HTML。

开发环境验证使用现有本地服务，不修改正式 `/v2` 部署。针对性日志位于 `output/audit/R-41/`（未纳入 Git），浏览器报告位于 `playwright-report/` 与 `test-results/`；审计主表记录实际运行结果。
