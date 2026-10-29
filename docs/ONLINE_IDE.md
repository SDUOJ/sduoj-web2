> 当前隔离发布分支的范围与完整回归要求见 [2026-10-26发布准备](ONLINE_IDE_RELEASE_20261026.md)。下文较早的容量与架构记录保留其历史范围。

# Online IDE

基础工作区和智能服务可分别启用。普通题目页保留原提交入口，独立 IDE 支持题库、比赛和题单的编程题；不支持的模板继续使用原页面。

## 代码入口

| 路径                                            | 职责                                         |
| ----------------------------------------------- | -------------------------------------------- |
| `src/Pages/Client/CProblemIde.tsx`              | 题库独立 IDE                                 |
| `src/Pages/Client/CContextProblemIde.tsx`       | 比赛、题单上下文与原页面回退                 |
| `src/Component/answerIde/AnswerLayout.tsx`      | 题面、编辑器、用例/结果分区                  |
| `src/Component/answerIde/AnswerWorkspace.tsx`   | 自测、正式提交、草稿及历史                   |
| `src/Component/answerIde/useRunTask.ts`         | Run 创建、取消、轮询及恢复                   |
| `src/Component/answerIde/useCloudCode.ts`       | 云代码保存与历史恢复                         |
| `src/Component/answerIde/useIdeIntelligence.ts` | LSP session、同步、revision 协商及旧结果丢弃 |
| `src/Component/answerIde/MonacoCodeEditor.tsx`  | 自动补全、定义跳转和诊断标记                 |
| `src/Utils/API/ide-intelligence.ts`             | 可选智能服务传输与静默失败                   |

Monaco 和对应 worker/font 从本站打包资源加载。智能服务通过 `/api/ps/ide/**` 协商，支持单文件 C、C++、Java、Python。正常输入触发补全，不要求特殊按键；定义跳转限本文件，不提供标准库源码浏览、工程管理；在线 debug 使用独立可选服务。

标签页内全部智能请求至少间隔 300ms。后端按用户统一限制 100ms 最小准入间隔、5 次/固定秒、100 次/固定分钟；超限返回空值。空值、降级和网络失败静默处理，编辑、草稿、自测和正式提交继续使用各自接口。

源码同步超时后先查询当前 revision；409 按服务端版本有界重试，410 清理 session 并在后续操作中重建。同一编辑器按顺序同步和分析，切题、换用户或文本变化后不显示旧结果。

## 提交与验证

按 [项目验证说明](../README.md#verification)将依赖清单和锁文件一起提交，区分工作区、Run/云代码、LSP、共享接入及机械格式整理。当前完整提交清单和排除项在工作区 `work/artifacts/online-ide-submit-20261023/`，不是将整个 dirty tree 打包提交。

针对性测试覆盖 Run 恢复、失效任务、取消、云代码、上下文切换、HTTP 静默失败、300ms gate、revision 丢失确认和过期重建。前端模拟测试不代替真实工具链或网关登录验收。后端协议见 AutoLab `docs/IDE_INTELLIGENCE_SESSION.md`；部署、历史浏览器验收与容量实测见 deploy 的 IDE 文档。

开发代码可以进入评审；生产开启仍需按实际部署资源验收。1000 在线、100/300/500 活跃的现有容量结果保留原始数值，不能把用户接受当前功能解释成这些档位都通过了既定容量指标。

## 运行与调试（2026-10-23）

调试直接嵌入现有普通题、比赛及题单 IDE 的 AnswerWorkspace。原运行按钮采用下拉分裂按钮，在“运行”和“调试”之间切换；运行沿用原 Run 服务，调试使用可选 IDE Debug HTTP 服务。没有已验证工具链时禁用调试选项，原编辑/运行/提交仍可使用。

布局参照 VS Code 的 Run and Debug：左侧变量、监视、调用栈，编辑器上方独立控制条，底部“程序终端”和“调试指令”两个页签。断点命中/单步后自动依次读取调用栈、作用域及变量，更新当前行；切换停点后丢弃旧 frame/variable handle。展开变量有深度、每次条数和总节点上限，字符串由React按文本渲染。

快捷键仅在当前IDE工作区获得焦点时生效，忽略按住重复及输入法组合事件：F5启动/继续，F6暂停，F9切换光标行断点，F10单步跳过，F11进入，Shift+F11跳出，Shift+F5停止，Ctrl/Command+Shift+F5显式重启，Ctrl/Command+Shift+D打开调试模式。Ctrl+F5与原Ctrl/Command+Enter运行自定义用例；原Ctrl/Command+S保存不变。映射依据[VS Code官方快捷键](https://code.visualstudio.com/docs/reference/default-keybindings)。操作系统可能截获功能键，可使用悬浮工具条完成同样操作。

程序终端支持启动前多行stdin，以及暂停或运行时发送stdin（Enter发送、Shift+Enter换行）。输入回显、stdout/stderr在停止及显式重启后保留，最多保留64KiB，用户可清空。终端是有界文本界面，不是通用shell/PTY仿真器。调试指令支持 `continue/c`、`next/n`、`step/s`、`finish`、`break N`、`clear N`、`delete`、`backtrace/bt`、`info locals`、`info breakpoints`、`interrupt`、`quit`、`help`，以及清空指令记录的`clear`；映射为现有四语言共用协议。不会把用户文本传给GDB命令解释器，不支持shell、source、任意表达式或函数调用。

控制请求同步加锁，迟到旧snapshot不能覆盖新revision/cursor，单步超时不自动重试。停止保持可用，不被普通查询排队挡住；只在确认旧现场停止后执行用户明确要求的重启。调试运行期间锁定语言/源码编辑，允许停止后修改；无法确认源码对应关系时不显示误导停点。

本机产品入口为 `/v2/problem/SDUOJ-1000/ide`，使用真实 Gateway、授权 RPC 和 judge 派生 rootfs。后续四语言真实沙箱验收覆盖 C11（19v16）、C++17（32v13）、Python3.11（38v6）、Java21（51v0），共36个用例；这是本机 ARM64/cgroup v2 的功能与超时清理证据，不代表目标 cgroup v1 或1024驻留通过。独立3001页只保留为历史实验辅助，不是产品调试入口。最终源码/制品与生产门槛见 [上线准备](../../sduoj-deploy/docs/ONLINE_IDE_READINESS_20261023.md)。

调试模式自动显示工作台，只保留两个终端页签；运行模式停止并释放调试现场、隐藏调试区。侧栏可拖动/折叠，隐藏断点列表、特殊变量和手动刷新。浏览器按账号/上下文缓存进度，恢复必须由服务端重新核对owner、epoch、源码及模板；缓存丢失后新启动会先清理该账号旧现场。安全监视只支持数据路径，每段执行超过可信题目语言时限2倍则终止，暂停/编译不计入。完整协议与边界见[调试细化说明](../../sduoj-autolab/docs/ONLINE_DEBUGGER_REFINEMENTS.md)。

### 补全接入细节（2026-10-23）

`completionAdapter.ts` 统一处理LSP与Monaco类型、词前缀范围、过滤和排序、片段及有界同文件附加编辑；`MonacoCodeEditor` 传递 incomplete、取消令牌并校验文档版本和光标，参数提示通过 signatureHelp 获取。可信代码模板在浏览器生成，不新增后端进程。useIdeIntelligence 和HTTP gate丢弃旧位置任务，原有300ms及Redis配额保持不变。自动导入、头文件插入与工程索引没有因此开启。详见AutoLab docs/IDE_INTELLIGENCE_SESSION.md。
