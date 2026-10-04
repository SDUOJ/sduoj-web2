# 构建环境与部署目标绑定（R-26）

生产构建继续使用批准的 HTTPS API/前端域名和 WSS 域名，不通过 smoke URL 隐式切换 API。构建将 environment、apiOrigin、frontOrigin、socketOrigin 写入 HTML metadata 和 release manifest；验证器检查两者一致，并将部署目标的 origin 和路径分别绑定到 frontOrigin 和 publicPath。测试 artifact、错误域名、错误前缀、带凭据或查询串的目标均不能发布。

```sh
yarn build
yarn artifact:verify build "$(git rev-parse HEAD)" /v2/ https://oj.qd.sdu.edu.cn/v2/
yarn build:test
yarn playwright test tests/e2e/deployment-environment.spec.ts
```

`build:test` 输出独立的 `build-test/`，只允许 `http://127.0.0.1:4173` 和对应 WebSocket origin，不覆盖生产 `build/`。浏览器回归服务器仅提供这个测试目录。环境变量中的 test 模式不能搭配生产 API；发布验证也拒绝将 test artifact 提升到 production。

应用启动先验证当前页面 origin，再动态加载 App 和 Store。生产 artifact 被放到 staging、备用域名或本机 HTTP origin 时显示可见错误，不初始化业务模块，也不发送 API/WS 请求。不得为了让预览正常而放宽批准域名；新增部署环境需要独立批准配置、构建和目标验证。GitHub Pages 或其它备用域名不是生产 artifact 的服务预览入口。

预发布脚本在本地上传前、远端 staging 同步后均传入 `SDUOJ_RELEASE_URL` 验证 artifact；CI 验证批准的正式目标。只改变 `SDUOJ_RELEASE_URL` 已不能把编译到生产服务的 artifact 部署到别的 origin。

2026-10-04，Node v24.20.0 验证：97 suites/471 tests 的 quality、生产 build/bundle（57 assets/3,984,637 bytes）、727 files/30,718,257 bytes 的 artifact 验证通过；69 个跨浏览器回归通过（3 个非适用视口跳过）、7 个真实开发测试、13 个 artifact tests、static checkers 与 7 个 timeout tests 通过。四个浏览器项目均使用真实生产 artifact 验证错误页面 origin，观察到零 API/外部请求、零 WebSocket；测试 artifact 只请求声明的 loopback API。

开发环境测试使用本机 Java/AutoLab 服务，不接触生产 API。浏览器测试对预期 API 使用固定响应，错误环境测试直接读取实际生产构建，不把 mock 当作真实发布验收。报告位于未跟踪 `output/audit/R-26/`；这里不声称已执行远端部署、真实生产 smoke 或回滚，仍由 R-15/R-21 跟踪。
