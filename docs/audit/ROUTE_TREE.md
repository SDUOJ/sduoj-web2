# 路由和导航来源（R-38）

`src/Config/router/types.ts` 定义只读路由节点、React Router 支持的组件类型和 ReactNode 图标；路由模块不再显式使用 `any`。`routeTrees.ts` 汇总 layout、client、manage、exam、problemSet 和 contest 的同一组节点引用，并提供导航投影。保留旧模块导出兼容既有调用方，但没有重复声明其路径和组件。

`RouteSwitch` 统一扁平化可渲染节点，为带 children 的父页面设置 exact 边界，按树顺序只渲染一个路由，并提供同一 404 fallback。App、客户端、管理端、standalone exam、题单和竞赛布局均使用该组件。

顶层客户端布局由 canonical client route 的首段自动投影，不再维护独立的字符串路径表。多个客户端页面复用同一 lazy CLayout 身份；添加新客户端路由会自动进入布局投影。管理端桌面和抽屉共用 `navigationTrees.manage`；客户端菜单、竞赛和题单 tab 从 canonical 节点生成。`navigationLinks` 只接收菜单顺序/默认参数，不重新声明路径，参数按段编码，缺失参数或未知导航 ID 直接拒绝。

兼容 AI 链接保留 query/hash；路径/ID 唯一性、菜单与组件映射、父节点 exact、路由参数和 future-client 自动投影均由测试守护。

真实开发环境发现并修复一处交接缺陷：CLayout 先确认匿名，随后挂载的题单 protected LoginCheck 由于跳过 anonymous 分支而不跳转登录。现在该分支仍执行安全登录重定向，不重复请求 profile，也不在登录页形成 replace 循环。测试包含已知匿名、公共页、已登录及登录页四种状态。

```sh
yarn test --runInBand src/Config/router src/Component/common/LoginCheck.test.tsx
yarn quality && yarn build && yarn bundle:check
yarn test:e2e
LOCAL_BASE_URL=http://localhost:3001 yarn test:local tests/local/services.spec.ts tests/local/vditor-assets.spec.ts tests/local/routes.spec.ts
```

Node v24.20.0 最终全量：97 suites/468 tests、format/typecheck/lint/coverage、生产构建和 bundle 全部通过。四种浏览器 61 PASS/3 个非适用桌面视口 skipped；真实本地开发环境 7 PASS（管理/考试/题单深链接、404、Java/AutoLab 代理、题库和 Vditor）。初始脚本 57 文件/4,326,738 bytes；清单 723 文件/30,706,922 bytes。脚本门禁回归含 12 artifact、4 Vditor、7 timeout 测试，全部通过。

日志保存于未跟踪 `output/audit/R-38/`。开发环境测试不证明 standalone exam 的真实业务生命周期，也不等价于 R-12 完整业务矩阵；这些项目继续保持待验收。
