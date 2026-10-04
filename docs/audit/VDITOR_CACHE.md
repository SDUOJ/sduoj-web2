# Vditor 缓存一致性（R-20）

构建通过 `config/vditor-assets.cjs` 对 `public/vditor/dist` 全部文件名和内容生成 SHA256。前端注入的 revision 不能被环境变量覆盖；CopyWebpackPlugin 将同一内容复制到 `vditor/<revision>/dist`，不会发布旧的无版本路径。编辑器、导出和 Markdown 预览通过同一 helper 生成 runtime、emoji 和主题 URL。

开发服务器将相同目录映射到 `/vditor/<revision>/dist`；生产构建分别使用 `/v2/vditor/<revision>/dist` 和 `/v2-pre/vditor/<revision>/dist`。资源字节或文件名变化会改变 revision，mtime 变化不会。回滚整个构建产物恢复原 revision 和字节，因此浏览器长缓存不会把新版 runtime 当成旧版复用。

`release-artifact.cjs` 要求产物只含一个版本目录，重新计算其文件内容摘要并确认目录名匹配；无 hash 路径、伪造 revision 和缺失 Vditor runtime 均拒绝发布。

```sh
yarn test:vditor-assets
yarn test:artifact
yarn test --runInBand src/Utils/vditorResources.test.ts src/Utils/MarkdownPreview.test.ts src/Component/common/EditorLifecycle.test.tsx
yarn quality && yarn build && yarn bundle:check
yarn test:e2e
LOCAL_BASE_URL=http://localhost:3001 yarn test:local tests/local/services.spec.ts tests/local/vditor-assets.spec.ts
```

缓存回归在真实 Chromium、Firefox、WebKit、移动 Chromium 上运行隔离 HTTP fixture：HTML 使用 no-store，script 使用一年的 immutable 缓存；旧版 → 新版 → 回滚依次读取对应字节，服务端只收到旧版/新版各一次请求。该验证不是生产部署记录，没有连接线上 SSH。

部署仍应让 HTML 重新验证或 no-cache；不能将 SPA HTML 设置为一年 immutable。更新时旧标签页请求已经删除的旧 hash 资源可能得到 404，因此需重新加载页面或由部署方保留近期 hash 目录。缓存一致性修复不声称解决原位同步期间的所有可用性窗口，这部分仍归 R-15/R-21。

本轮 Node v24.20.0：4 个 hash/构建注入测试、12 个 artifact 测试、3 suites/24 个组件测试、全量 94 suites/447 单测、57 浏览器测试（3 个非适用桌面视口跳过）和 3 个真实开发环境测试通过。初始 JavaScript 为 57 文件/4,282,776 bytes，Vditor 继续延迟加载。开发构建冷启动通过，无 TypeScript 错误。日志位于未跟踪的 `output/audit/R-20/`。
