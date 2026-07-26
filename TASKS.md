# Build Your Own X 学习任务总表

> 本文件是后续生成详细教程、记录进度和选择下一任务的唯一主清单。
>
> 课程来源：[build-your-own-x-前端全栈-CS复核版.html](./build-your-own-x-前端全栈-CS复核版.html)
> 来源快照：2026-07-22，SHA-256 `7292af5838cefc843fb9882c4134f7708acb480fcc41233cfe067efd0a7d9970`

## 学习目标

沿 JavaScript / TypeScript 主线，从前端底层进入全栈与 CS 基础。每个项目都由学习者亲自实现，AI 只负责生成讲解、任务拆解、逐级提示、检查点、验收标准与复盘引导。

## 如何使用这份清单

1. 优先沿主线路径推进：`P01 → P02 → P03 → P04 → P05 → P06 → P11 → P12 → P14`。
2. 项目编号是稳定入口。例如，后续可以提出：`为 P01 生成详细教程`。
3. “建议前置”用于安排学习顺序，不表示绝对的技术依赖；已有相应基础时可以跳过前置诊断。
4. 一个项目不必压缩成一篇长教程。生成详细教程时，应按认知负荷拆成多个短课，并始终关联项目编号。
5. 只有学习者提交实现证据并通过验收后，才把对应复选框改成 `[x]`；仅阅读教程不算完成。
6. 选做和提高项目按职业方向选择，不需要为了清空列表全部完成。

## 所有项目共同的完成定义

除任务自己的验收产出外，每个项目还需满足以下条件：

- [ ] 核心实现由学习者亲自完成，能够脱离教程解释关键设计。
- [ ] 至少包含单元测试、集成测试和一个负向或边界测试；全栈项目按需增加契约、端到端或负载测试。
- [ ] 留下一张结构图、状态图、数据流图或等价的机制说明。
- [ ] 记录至少一次失败假设、排查过程与修正结论。
- [ ] 完成一次复盘：学到了什么、哪些仍不确定、下一次如何验证。

---

## 阶段一：前端底层

### [ ] P01 · 从零实现 Promise（TDD）

- 类型：主线
- 技术 / 主题：JavaScript；异步、状态机
- 预计投入：4–8 小时
- 建议前置：熟悉函数、闭包、回调和基础测试
- 核心产出：实现 `pending / fulfilled / rejected`、thenable 解析、链式 `then`、`catch`，并为状态转换编写自动化测试。
- 扩展方向：Promises/A+ 测试、微任务调度、`finally`、`all`、`race`、`allSettled`，以及与原生 Promise 的差异记录。
- 原始教程：[Implementing Promises from Scratch（TDD）](https://www.mauriciopoppe.com/notes/computer-science/computation/promises/)
- 详细教程：
  - [ ] P01-L01 · [先观察，再实现 Promise](./lessons/0001-p01-observe-promise-behavior.html)
  - [x] P01-L02 · [用测试锁定状态机](./lessons/0002-p01-test-the-state-machine.html)
  - [x] P01-L03 · [注册与排空 Promise Reactions](./lessons/0003-p01-register-and-drain-reactions.html)
  - [ ] P01-L04 · [让 then 返回新的 Promise](./lessons/0004-p01-chain-with-a-new-promise.html)
  - [ ] P01-L05 · [安全执行 Promise Resolution Procedure](./lessons/0005-p01-resolve-thenables-safely.html)
  - [ ] P01-L06 · [用微任务对齐原生 Promise 调度](./lessons/0006-p01-align-with-microtasks.html)
  - [ ] P01-L07 · [运行 Promises/A+ 兼容测试](./lessons/0007-p01-run-conformance-tests.html)
  - [ ] P01-L08 · [Promise 项目验收与复盘](./lessons/0008-p01-acceptance-and-retrospective.html)
- 阶段记录：[P01 第一阶段检查点：状态机、Reactions 与调度边界](./packages/01Promise/PHASE-1.md)
- 随查资料：[Promise 机制速查](./reference/promise-field-guide.html)

### [ ] P02 · 构建自己的 React

- 类型：主线
- 技术 / 主题：JavaScript；渲染器、调度、reconciliation、hook
- 预计投入：8–16 小时
- 建议前置：P01；理解 DOM 与 JSX 的基本用途
- 核心产出：渲染函数组件、分片执行工作、提交 DOM 更新、让多个 `useState` 独立工作，并能画图解释 render / commit。
- 扩展方向：keyed reconciliation、批量更新、effect 清理、错误边界，以及全量重建和增量更新的对比测试。
- 原始教程：[Build your own React](https://pomb.us/build-your-own-react/)
- 对照材料：[Didact 源码](https://github.com/pomber/didact)
- 详细教程：
  - [ ] P02-L01 · [先观察渲染契约](./lessons/0009-p02-observe-rendering-contract.html)
  - [ ] P02-L02 · [从 JSX 到 DOM](./lessons/0010-p02-elements-jsx-and-dom.html)
  - [ ] P02-L03 · [把递归改造成 Fiber 工作单元](./lessons/0011-p02-fiber-work-units.html)
  - [ ] P02-L04 · [分片执行 render 工作](./lessons/0012-p02-schedule-interruptible-render.html)
  - [ ] P02-L05 · [分离 render 与 commit](./lessons/0013-p02-render-and-commit.html)
  - [ ] P02-L06 · [增量协调 DOM 更新](./lessons/0014-p02-reconcile-updates.html)
  - [ ] P02-L07 · [支持函数组件](./lessons/0015-p02-function-components.html)
  - [ ] P02-L08 · [用调用顺序保存多个 useState](./lessons/0016-p02-usestate-hook-queues.html)
  - [ ] P02-L09 · [React 渲染器项目验收与复盘](./lessons/0017-p02-acceptance-and-retrospective.html)
- 随查资料：[React 渲染器机制速查](./reference/react-renderer-field-guide.html)

### [ ] P03 · 构建最小模块打包器

- 类型：主线
- 技术 / 主题：JavaScript；模块图、代码转换、bundle runtime
- 预计投入：4–8 小时
- 建议前置：P02；熟悉 ESM 的 `import / export`
- 核心产出：走通 parser → dependency graph → bundle runtime，打印模块图，并测试嵌套依赖和重复依赖。
- 扩展方向：循环依赖、模块缓存、source map、loader / plugin hook、增量重建，以及 ESM 与 CommonJS 语义对比。
- 原始教程：[Build Your Own Module Bundler — Minipack](https://github.com/ronami/minipack)
- 对照材料：[Minipack 本地源码快照](./sources/minipack/src/minipack.js)
- 详细教程：
  - [ ] P03-L01 · [先观察模块打包契约](./lessons/0018-p03-observe-bundler-contract.html)
  - [ ] P03-L02 · [把一个源文件解析成模块资产](./lessons/0019-p03-parse-one-module.html)
  - [ ] P03-L03 · [解析路径并建立模块图](./lessons/0020-p03-resolve-and-build-graph.html)
  - [ ] P03-L04 · [把模块图序列化成模块表](./lessons/0021-p03-serialize-module-table.html)
  - [ ] P03-L05 · [运行 bundle runtime](./lessons/0022-p03-run-bundle-runtime.html)
  - [ ] P03-L06 · [用夹具锁定图与运行时](./lessons/0023-p03-test-graph-and-runtime.html)
  - [ ] P03-L07 · [校准教学模型边界与提高项](./lessons/0024-p03-model-boundaries-and-extensions.html)
  - [ ] P03-L08 · [模块打包器项目验收与复盘](./lessons/0025-p03-acceptance-and-retrospective.html)
- 随查资料：[模块打包器机制速查](./reference/module-bundler-field-guide.html)

### [ ] P04 · 构建最小编译器

- 类型：主线
- 技术 / 主题：JavaScript；tokenizer、parser、AST、transformer、code generator
- 预计投入：5–10 小时
- 建议前置：P03
- 核心产出：分别测试编译流水线的四个阶段，为 AST 增加 source location，并对非法 token 返回带行列号的结构化错误。
- 扩展方向：JSX 或 TypeScript 子集、作用域与符号表、常量折叠、错误恢复、source map、CLI。
- 原始教程：[The Super Tiny Compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)

### [ ] P05 · Browser Engineering

- 类型：主线、长项目
- 技术 / 主题：Python；HTTP、DOM、CSS、布局、绘制、事件、脚本
- 预计投入：30–60 小时
- 建议前置：P01–P04；Python 基础可以在任务开头补齐
- 核心产出：至少完成网络、HTML tree、CSS cascade、block / inline layout、paint 和基础交互，并能追踪一个元素从字节到像素的全过程。
- 扩展方向：layout / paint inspector、阶段耗时、缓存、Cookie、导航历史、same-origin 威胁模型与负向测试。
- 原始教程：[Browser Engineering](https://browser.engineering/)
- 安全补读：[The Same-Origin Policy](https://aosabook.org/en/500L/the-same-origin-policy.html)

---

## 阶段二：全栈补齐

### [ ] P06 · 从 TCP 开始构建 Web Server

- 类型：主线
- 技术 / 主题：Node.js；TCP、HTTP/1.1、协议状态机
- 预计投入：12–20 小时
- 建议前置：P05；熟悉 Node.js Buffer 和事件
- 核心产出：实现最小 HTTP/1.1 parser、路由、静态文件和错误响应，并用原始 socket 测试分段到达的请求。
- 扩展方向：keep-alive、chunked body、流式响应、backpressure、超时、body 限制、路径穿越防护、吞吐与尾延迟测试。
- 原始教程：[Build Your Own Web Server From Scratch in JavaScript](https://build-your-own.org/webserver/)

### [ ] P07 · 构建 Express 风格框架

- 类型：选做
- 技术 / 主题：Node.js；middleware stack、路由、错误传播
- 预计投入：5–10 小时
- 建议前置：P06
- 核心产出：实现 middleware stack、GET / POST 路由、参数解析、404 和四参数错误中间件，并验证执行顺序。
- 扩展方向：async handler 错误传播、子路由、参数校验、context，以及 Express 线性栈和 Koa async onion 的对比图。
- 原始教程：[Let's Build Express](https://github.com/antsmartian/lets-build-express)

### [ ] P08 · 创建一个真实可用的 CLI 工具

- 类型：选做
- 技术 / 主题：Node.js；工程化、开发者体验
- 预计投入：3–6 小时
- 建议前置：Node.js 基础；可以与任一主线长项目搭配
- 核心产出：支持参数、配置文件、交互提示、稳定退出码和 npm 发布，并在真实仓库中连续使用一周。
- 扩展方向：dry-run、结构化日志、shell completion、插件机制、跨平台路径测试和端到端测试。
- 原始教程：[Create a CLI Tool in JavaScript](https://citw.dev/tutorial/create-your-own-cli-tool)

### [ ] P09 · 构建迷你包管理器

- 类型：选做
- 技术 / 主题：TypeScript；依赖解析、安装布局、lockfile
- 预计投入：4–8 小时
- 建议前置：P03
- 核心产出：实现 registry 下载、递归依赖、简单冲突处理、扁平安装和确定性 lockfile，并验证相同输入可复现。
- 扩展方向：semver 约束求解、完整性哈希、离线缓存、workspace、bin symlink；执行生命周期脚本前先完成威胁分析。
- 原始材料：[Tiny Package Manager](https://github.com/g-plane/tiny-package-manager)

### [ ] P10 · 构建 DNS Server

- 类型：选做
- 技术 / 主题：Node.js；DNS、UDP、二进制协议
- 预计投入：8–16 小时
- 建议前置：P06
- 核心产出：解析 header / question / answer，支持常用记录，用 Wireshark 验证报文，并对畸形长度和未知类型安全失败。
- 扩展方向：name compression pointer、TTL cache、CNAME 链、TCP fallback，以及 RFC 1034 / 1035 测试向量。
- 原始教程：[Build a DNS Server in Node.js](https://engineerhead.github.io/dns-server/)

### [ ] P11 · 构建自己的 Redis

- 类型：主线、长项目
- 技术 / 主题：C / C++；socket、事件循环、协议、数据结构、TTL
- 预计投入：25–45 小时
- 建议前置：P06；C / C++ 基础可以先通过前置诊断补齐
- 核心产出：完成 TCP client / server、请求协议、event loop、KV、hash table、sorted set 和 TTL，并提交压测报告。
- 扩展方向：RESP 命令兼容、AOF、崩溃恢复、过期策略对比、Sanitizer 检查、p50 / p99 延迟。
- 原始教程：[Build Your Own Redis with C/C++](https://build-your-own.org/redis/)

---

## 阶段三：CS 基础

### [ ] P12 · Write Yourself a Git

- 类型：主线
- 技术 / 主题：Python；内容寻址、对象模型、DAG、引用
- 预计投入：12–24 小时
- 建议前置：主线顺序位于 P11 后；需要 Python 基础
- 核心产出：实现 `init`、`cat-file`、`hash-object`、`log`、`ls-tree`、`checkout`，并读取真实 Git 创建的小仓库。
- 扩展方向：index、三方合并与冲突、packfile / delta、误删分支恢复演练。
- 原始教程：[Write Yourself a Git](https://wyag.thb.lt/)

### [ ] P13 · 构建正则表达式引擎

- 类型：选做
- 技术 / 主题：JavaScript；parser、NFA、图遍历、复杂度
- 预计投入：6–12 小时
- 建议前置：P04
- 核心产出：画出模式到 NFA 的转换，支持教程语法，并用表驱动测试覆盖空串、分支、连接、重复和失败路径。
- 扩展方向：字符类、锚点、捕获、与原生 RegExp 的 differential testing、病理输入复杂度对比。
- 原始教程：[Implementing a Regular Expression Engine](https://deniskyashif.com/2019/02/17/implementing-a-regular-expression-engine/)

### [ ] P14 · 用 C 编写 Shell

- 类型：主线
- 技术 / 主题：C；进程、文件描述符、系统调用、信号
- 预计投入：8–16 小时
- 建议前置：P12；需要 C 基础
- 核心产出：实现 REPL、tokenize、fork / exec、wait、`cd / exit` 等 builtin，并用系统调用跟踪工具解释一次命令执行。
- 扩展方向：pipe、重定向、环境变量、引号转义、SIGINT、前后台 job、伪终端交互测试。
- 原始教程：[Write a Shell in C](https://brennan.io/2015/01/16/write-a-shell-in-c/)

### [ ] P15 · 构建简单数据库

- 类型：选做、长项目
- 技术 / 主题：C；page layout、B-tree、持久化存储
- 预计投入：20–40 小时
- 建议前置：P11、P14；熟悉指针和基础数据结构
- 核心产出：完成持久化 page、B-tree 查找和分裂，用批量数据验证重启后的数据与树不变量。
- 扩展方向：range scan、secondary index、页缓存、最小 WAL、crash recovery，以及不同写入模式下的延迟比较。
- 原始教程：[Let's Build a Simple Database](https://cstack.github.io/db_tutorial/)

### [ ] P16 · From NAND to Tetris

- 类型：选做、长期项目
- 技术 / 主题：HDL / VM / Jack；体系结构、汇编、编译、OS
- 预计投入：80–150 小时
- 建议前置：完成最小主线后再决定是否投入
- 核心产出：按课程测试套件完成硬件和软件两部分，并追踪一行 Jack 代码到 VM、汇编、机器指令和电路状态。
- 扩展方向：Jack 交互应用、自定义 CPU 指令及配套工具链修改、跨层性能分析。
- 原始课程：[From NAND to Tetris](https://www.nand2tetris.org/)

---

## 阶段四：提高项目

### [ ] P17 · 构建同步引擎

- 类型：提高
- 技术 / 主题：Node.js / Y.js；CRDT、离线编辑、实时协同
- 预计投入：12–24 小时
- 建议前置：P02、P06
- 核心产出：两个客户端离线编辑后能够收敛；更新可持久化；presence 与文档数据分通道；重连不重复应用操作。
- 扩展方向：断网、乱序、重复、延迟注入，snapshot / compaction、权限、审计和同步性能测量。
- 原始教程：[Build a Synchronization Engine with Node.js and Y.js](https://greenvitriol.com/posts/sync-engine-for-everyone)

### [ ] P18 · 构建多节点 CDN

- 类型：提高
- 技术 / 主题：Nginx / Lua / Docker；缓存、指标、负载测试
- 预计投入：20–40 小时
- 建议前置：P06、P11；能够使用 Docker 即可，不要求先完成 P19
- 核心产出：搭建 origin 与多节点 cache，模拟延迟、暴露指标并执行负载测试，解释 hit ratio、p95 / p99 和回源流量。
- 扩展方向：invalidation、stale-while-revalidate、origin shield、一致性哈希、故障注入和容量评估。
- 原始教程：[CDN Up and Running](https://github.com/leandromoreira/cdn-up-and-running)

### [ ] P19 · 从系统调用理解 Docker

- 类型：提高
- 技术 / 主题：Python / Linux；namespaces、cgroups、rootfs、capabilities
- 预计投入：16–30 小时
- 建议前置：P14；macOS 环境需要 Linux VM
- 核心产出：完成 workshop levels，并用进程、挂载、cgroup 文件和 capability 工具证明隔离效果。
- 扩展方向：seccomp、read-only rootfs、最小 capability、rootless，以及教学近似和真实逃逸风险的边界分析。
- 原始教程：[Docker From Scratch Workshop](https://github.com/Fewbytes/rubber-docker)

### [ ] P20 · 编写 BitTorrent Client

- 类型：提高
- 技术 / 主题：Node.js；P2P、二进制协议、并发连接、完整性校验
- 预计投入：12–24 小时
- 建议前置：P06；P10 可作为网络协议热身
- 核心产出：解析 torrent、请求 tracker、完成 peer handshake、下载并校验 piece，对断连和坏 piece 能够重试。
- 扩展方向：resume、并发 piece scheduler、choking / unchoking、magnet link / DHT，以及吞吐、公平性和资源上限测量。
- 原始教程：[Write Your Own BitTorrent Client](https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html)

### [ ] P21 · 构建 WebAssembly 编译器

- 类型：提高
- 技术 / 主题：TypeScript / WASM；parser、stack machine、binary encoding
- 预计投入：12–24 小时
- 建议前置：P04、P05
- 核心产出：生成合法 WASM module，支持函数、局部变量和控制流，从浏览器调用导出函数，并用 WAT 对照验证二进制。
- 扩展方向：静态类型检查、source location、import / export、内存访问，以及 JS / WASM 成本对比。
- 原始教程：[Build Your Own WebAssembly Compiler](https://blog.scottlogic.com/2019/05/17/webassembly-compiler.html)

---

## 必须补齐的生产能力

这些任务不属于 21 个“从零构建”项目，但原课程明确指出它们不能缺失。

### [ ] G01 · 认证、授权与 Web 安全

- 建议时机：P06 后开始，进入真实全栈项目前完成基础部分
- 学习范围：OIDC / OAuth、Session、Cookie、CSRF、XSS、密钥轮换、授权模型。
- 验收证据：为一个示例系统画出信任边界和认证流程，完成常见攻击的负向测试，并能区分认证与授权。

### [ ] G02 · 生产数据库能力

- 建议时机：P06 后学习使用层；若完成 P15，再回到本任务深化内部机制
- 学习范围：PostgreSQL 事务隔离、索引、执行计划、锁、迁移、备份与恢复。
- 验收证据：分析实际查询计划，复现一次并发异常，完成一次备份恢复演练。

### [ ] G03 · 测试体系

- 建议时机：从 P01 起贯穿所有项目
- 学习范围：unit、integration、negative case，以及按项目需要使用 contract、E2E、load test。
- 验收证据：每个 P 类任务都满足本文件的共同完成定义，并能解释不同测试层解决的问题。

### [ ] G04 · 部署与可观测性

- 建议时机：P06 后开始；P18 可作为综合实践
- 学习范围：CI/CD、配置与密钥管理、日志、指标、trace、告警、回滚、容量规划。
- 验收证据：部署一个学习项目，注入故障，通过可观测信号定位问题并完成可验证的回滚。

### [ ] G05 · API 工程

- 建议时机：P06 后；可与 P07 同步
- 学习范围：幂等、分页、限流、超时、重试、错误契约、版本策略、兼容性。
- 验收证据：为一个 API 写出明确契约，并用重复请求、超时、限流和版本变更验证其行为。

### [ ] G06 · 算法与数据结构长期练习

- 建议时机：贯穿全程，以主项目遇到的真实结构为入口
- 学习范围：数组、链表、栈、队列、哈希表、树、图、排序、搜索、复杂度分析。
- 验收证据：不把“刷完仓库”当完成；应能把算法选择应用到 P03、P11、P13、P15 等项目，并解释时间与空间取舍。
- 参考资料：[JavaScript Algorithms and Data Structures](https://github.com/trekhleb/javascript-algorithms)

---

## 详细教程生成约定

以后选择某个任务生成教程时，按以下流程执行：

1. 读取 [AGENTS.md](./AGENTS.md)、本文件、来源 HTML，以及已有的学习记录。
2. 先做轻量前置诊断，确认哪些基础已掌握，避免重复教学或难度跳跃。
3. 把任务拆成若干个可在短时间内完成的课次；每课只解决一个紧密问题，并明确关联的任务编号。
4. 每课包含：本节目标、必要原理、学习者任务、逐级提示、自查问题、验收标准和复盘方向。
5. 不提供完整可复制的最终实现；优先使用图解、伪代码、接口契约、测试案例和局部示例。
6. 教程生成后不自动勾选任务。只有学习者完成实现、提交证据并通过验收，才更新进度。

## 下一步

- [ ] 从 `P01` 开始生成第一组短教程。
