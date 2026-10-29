# Online IDE 发布源码范围（2026-10-26）

本分支基于 a488630，准备基础 Online IDE、Run、自定义用例、云代码及历史、LSP、Debugger 的同一份前端制品。开发与生产使用相同源代码；真实服务地址和凭据按部署环境提供。完整构建与真实浏览器验收须绑定最终提交和制品哈希，具体结果由发布收据记录，历史结果不代替本分支集成回归。

## 提交分组

1. Monaco 构建：依赖清单与锁文件、同站 worker/font、异步 chunk。
2. 基础工作区：布局、草稿、Run/取消/恢复、云代码/历史、正式提交，以及普通题/比赛/题单的上下文与原页面回退。
3. LSP：300ms 浏览器门禁、revision 同步、补全/定义/诊断/参数提示、旧响应丢弃。
4. Debugger：断点、step/watch、输入输出、终态/恢复及状态版本轮询。
5. 共享接入：仅 IDE 布局与 API 错误恢复、公共用例预览；保持其他开发中 AI 入口在 production 隐藏。

共享文件保留原下载接口、普通主题和管理页面；不携带首页快捷入口、全局任务列表、公共用例自动生成或全站换肤。公共用例预览保留权限检查和真实输入/输出导入，仅提供该既有能力，不增加管理任务。

## 验证

README 的 Node24/Yarn1.22.22、quality/build/artifact/e2e 仍为发布检查入口。现有 ide-worker-live 实际浏览器测试覆盖四语言补全与调试；完整集成回归还需覆盖 Run、自定义用例取消/刷新恢复、云代码保存与历史、正式提交/WebSocket、比赛/题单地址与权限、不支持模板的原页面回退。

production 的 IDE 三条路由不标记 devOnly。不要通过 deployment=test 打开生产 IDE；它会同时打开其他开发功能。路由测试明确检查 production 保留三个 IDE 上下文而拒绝未完成功能直链。

## 真实业务浏览器回归入口

`playwright.ide-business.config.ts` 配合 `tests/local/ide-release-business.spec.ts` 使用真实页面、API 与 WebSocket，不替换网络响应。六项用例分别覆盖普通题自定义运行/比较、运行刷新恢复后取消、云代码保存与历史恢复、正式提交终态与 WebSocket 重连回放、比赛和题单 Run 上下文、production IDE/AI 路由边界。它补充四语言 LSP/Debug 测试；权限拒绝和不支持模板回退仍须独立验收。

运行前设置 `IDE_BUSINESS_BASE`、`IDE_BUSINESS_STORAGE`、`IDE_BUSINESS_FIXTURE_JSON`。后两项为本机文件路径，认证文件权限必须为 600。production 编译域名可通过 `IDE_BUSINESS_PROXY=http://127.0.0.1:<port>` 映射到独立 dev TLS 服务；必须由部署验收者核实该映射，禁止指向真实生产服务。配置仅在此入口忽略本机 TLS 证书错误，关闭 trace/video，报告不收集请求头、Cookie 或源码。

fixture JSON 字段：

```json
{
  "schemaVersion": 1,
  "localOnly": true,
  "expectedOrigin": "https://oj.qd.sdu.edu.cn",
  "problemCode": "SDUOJ-1000",
  "template": { "language": "cpp", "id": "<real template id>", "title": "<exact UI title>" },
  "source": "<accepted solution for ordinary and both context problems>",
  "cancelSource": "<real program that remains active across reload, within dev run limits>",
  "customCase": { "input": "1 2\n", "expectedOutput": "3\n" },
  "formal": { "expectedJudgeResult": 1, "expectedJudgeScore": 100 },
  "contexts": [
    {
      "kind": "contest",
      "idePath": "/v2/contest/<id>/problem/<contest problem code>/ide",
      "problemCode": "<display problemCode returned by the context problem API>",
      "context": { "type": 1, "bizId": "<id>", "problemCode": "<contest problem code>" }
    },
    {
      "kind": "problemSet",
      "idePath": "/v2/problemSet/<id>/problem/0/0/ide",
      "problemCode": "<display problemCode returned by the context problem API>",
      "context": { "type": 2, "bizId": "<id>", "groupIndex": 0, "problemIndex": 0 }
    }
  ]
}
```

`source` 和 `cancelSource` 为真实源码，测试会添加唯一注释避免复用旧云代码。取消测试必须获得同一任务的 `judgeResult=99`，自然超时不能通过。缺通用 fixture 会在收集阶段失败；缺 contexts 会使上下文用例明确失败，无 skip。准备上下文期间可显式 `--grep-invert '^contexts '` 运行普通题及路由用例，此部分结果不代表全套通过。

```sh
node node_modules/@playwright/test/cli.js test --config playwright.ide-business.config.ts
```
