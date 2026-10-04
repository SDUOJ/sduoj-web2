# R-24 生产样反代安全响应头

验证日期：2026-10-04（UTC）。本轮验证真实 nginx 和浏览器，不声称已修改生产服务器或用户的部署工作树。

## 交付与策略

`config/nginx/security-maps.conf` 放在 nginx 的 `http` 上下文，`web2-locations.conf` 放在 Web2 的 `server` 上下文。`security-headers.conf` 由 server 与覆盖缓存头的 location 重复 include，防止 location 的 `add_header` 使父级安全头失效。所有安全头使用 `always`，测试覆盖成功、404 与代理认证错误响应。

| 响应头                    | 实现与兼容性边界                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Content-Security-Policy   | 默认同源，禁止 object、frame 和跨源表单；脚本只接受同源与一个固定 Vditor 图标文件 SHA256；不允许 unsafe-eval、脚本 unsafe-inline 或内联事件属性 |
| X-Frame-Options           | DENY；与 frame-ancestors none 一起验证跨源嵌入被阻断                                                                                            |
| X-Content-Type-Options    | nosniff；静态 JS/CSS 使用真实 MIME，不靠 HTML fallback 掩盖缺失文件                                                                             |
| Referrer-Policy           | same-origin；跨源请求不携带页面 Referer                                                                                                         |
| Permissions-Policy        | 摄像头、麦克风、屏幕采集限于自身 origin；禁用 geolocation/payment/usb。该策略不替代 R-05 的真实设备验收                                         |
| Strict-Transport-Security | HTTPS 返回 max-age=31536000；HTTP 不发送。没有自动开启 includeSubDomains/preload，避免修改其他站点的安全边界                                    |

图片允许同源、data/blob 和 HTTPS，以保留既有题面图片；媒体和 worker 限于同源/blob。`style-src` 保留 unsafe-inline，因为 React/Ant Design/Vditor 使用动态 style，不能在没有 nonce 迁移的情况下直接删除。脚本策略没有同类宽泛例外。

### 两个实际发现的兼容性问题

1. Ajv 原先在浏览器编译 schema，严格 CSP 阻断 Function 构造器并导致应用无法挂载。现在 `scripts/compile-autolab-validators.cjs` 生成 standalone 校验器：145 个请求契约、928 个字段路径；保留引用、nullable、格式及 coerceTypes 行为。全部请求契约与原 Ajv 比较返回值、错误和转换后的数据；原有 88 个校验测试通过。生产浏览器不再编译这些 schema。
2. Vditor 的 ant 图标加载器将同源资源文本放入 inline script。策略只放行固定 SHA256 `qR4U4J3Ne5n0m3uNzGMB/tZ3TWJUf89OlxdXqjqALDM=`，安装包与 public 复制件必须同时匹配。升级图标必须显式更新策略与测试，不通过 unsafe-inline 放开其他脚本。Webpack runtime 全局对象改为 self，避免 worker/browser 下的 Function fallback。

生成文件是工具产物，只豁免该文件的人工格式和 no-redeclare 检查；没有扩大豁免到目录或其他源文件。`yarn validation:check` 比较完整确定性输出，webpack 配置另校验 schema SHA256；过期产物阻断 quality/build，不得以旧校验器继续构建。

## 生产样验证

`yarn test:security` 构建独立 test 制品，并启动实际 nginx 容器。容器挂载本轮交付的 maps、headers、locations 原文件，HTTP/TLS 共用它们；不是把响应头伪造到 Playwright response 上。

- 本机镜像：nginx 1.28.3，image ID / digest `sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236`（linux/arm64）。每轮 manifest 保存实际版本、image ID、服务模式及 `nginx -t` 的成功结果。
- 四浏览器组合为 Chromium、Firefox、WebKit、Pixel 7：验证 HTML、深链、缓存 JS、静态 404、401、TLS/HSTS、报告体边界、注入阻断、嵌入阻断、真实 Markdown/KaTeX/代码/表格/图片和可编辑 Vditor。
- 同源 API 请求实际连接本地 Java gateway/AutoLab，WebSocket 实际完成 gateway `/ws/submission` upgrade；另外的 echo socket 仅验证代理帧往返，不能作为评测业务协议证据。Blob worker 也在浏览器内启动和回收。
- 页面 API 数据 fixture 只用于确定性的渲染/编辑器测试；不会保存公告、答案、题单或模板。真实通信测试单独要求 `SDUOJ_SECURITY_REAL_SERVICES=1`。
- Firefox 渲染既有 Vditor 图片时最多允许两条已被阻断的 `script-src-attr` / inline 报告；只接受该 directive、blocked origin 和本轮页面。其余浏览器不得出现这些报告。WebKit 的 ResizeObserver 通知继续采用最多两条精确错误预算；其他 pageerror 必须为零。
- 有意注入另一个 inline script 仍被阻断，报告确实到达受控 receiver；不以“没有报告”替代执行阻断证明。
- 报告读取/清理控制面直接连接 loopback 4174，并设置 5 秒请求时限；报告提交、响应头、页面、API 和 WebSocket 仍经实际 nginx。首次矩阵曾在 nginx 到测试 receiver 的 DELETE 清理请求超时，失败日志保留为 `proxy-browser-infrastructure-timeout.log`；没有增加自动重试或放宽业务断言。
- CI 不含本地 Java 服务，启动明确标记的认证错误 fixture，只运行代理/浏览器策略矩阵；四条真实通信测试显式 skipped。没有把 CI fixture 写成真实后端验收，也没有声称远端 CI 已运行。

## CSP 违规报告

`/_security/csp` 只转给部署方的受控 `sduoj_security_reports` upstream，32 KiB 请求上限，10 requests/s、burst 20，关闭该 location access log。测试 receiver 仅存在于 `scripts/security-proxy.cjs`，不得把包含 `__fixture` 管理路径的测试进程部署到生产。

`scripts/security-report.cjs` 提供 collector 的归一化契约：保留 directive、disposition、document pathname、blocked origin 和 status；删除凭证、query/hash、script sample、source-file、referrer 和原始策略。一批最多 20 条。实际 nginx/browser 测试验证非法 JSON 400、超限 413、有效报告 204 和脱敏结果。

生产接收端的采样、持久留存、鉴权/限流与告警由部署方接入，仍属于 R-31；本项只证明生产样反代策略与报告发送/脱敏契约可用。

## 部署接入

不要直接修改现有用户发布 stash 或替换整个部署仓库配置。由部署所有者审阅后：

1. 将本仓库三个 `config/nginx/*.conf` 安装至 `/etc/nginx/security/`，令 `/usr/share/nginx/html/v2/` 指向经 artifact 门禁验证的构建产物。
2. 在 `http` 上下文 include `security-maps.conf`，配置 `sduoj_gateway` 和受控 `sduoj_security_reports` upstream，并保留 WebSocket connection map。
3. 在具有正确域名、TLS 证书的 Web2 server include `web2-locations.conf`。若业务 API/WebSocket 确需不同 origin，必须先扩展明确 allowlist 并重跑矩阵，不要改成星号。
4. 用 `nginx -t` 验证后执行部署方的 reload；对实际站点再检查登录深链、404、缓存资产、安全头、报告到达和业务流程。生产发布、回滚、真实告警仍由 R-15/R-21/R-31 验收。

开发服务的 HMR 与生产脚本不同，不应直接把此 CSP 加到 webpack dev server；本轮使用优化后的独立产物检验策略。临时 TLS 证书和报告测试数据位于忽略目录，不进入构建制品或 Git 提交。

## 复现入口与证据

```sh
yarn validation:compile
yarn validation:check
yarn test:security-unit
yarn test:security
yarn quality
yarn build && yarn bundle:check
yarn test:e2e
yarn test:dev-regression
```

需要已安装 Docker/nginx 镜像、OpenSSL、Playwright 浏览器和本机 Java/AutoLab；测试使用 loopback 4173、4174、9443，启动前必须空闲。Playwright graceful shutdown 发送 SIGTERM 并删除自己创建的容器；不会操作其他容器或既有开发服务器。

日志：`output/audit/R-24/{quality.log,build.log,bundle.log,e2e.log,proxy-browser.log,proxy-browser-confirmation.log,ci-proxy.log,dev-regression.log,security-unit.log,static-final.log}`，镜像证据 `output/audit/R-24/proxy/manifest.json`，浏览器 HTML/截图 `playwright-report/security/`。这些是本地忽略产物；提交内保存实现、测试、此范围说明和主审计摘要。
