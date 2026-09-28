# P01 Promise 学习协作 Playbook

> 用途：在新机器、新 Codex 任务或上下文丢失后，恢复当前 Promise 学习项目的协作纪律、验证方式和准确进度。
>
> 最后更新：2026-09-28

## 新任务启动方式

在新机器 clone 仓库后，可以把下面这段作为新任务的第一条消息：

```text
请继续 P01 Promise 学习任务。

开始前完整阅读：
- AGENTS.md
- MISSION.md
- TASKS.md
- chat/01-promise/README.md
- learning-records/0001-promise-state-reactions-and-scheduling.md
- learning-records/0002-promise-child-chaining-and-propagation.md
- learning-records/0003-promise-resolution-locks-and-guard-scope.md
- packages/01Promise/PHASE-1.md
- packages/01Promise/PHASE-2.md
- packages/01Promise/PHASE-3.md

然后检查 packages/01Promise 的当前实现、测试、git status 和最近提交。
遵循 playbook：我亲自写练习源码和测试；你负责讲解、拆解、审阅、验证与复盘。每次只给一个最小任务，不要直接替我实现。先报告当前精确状态，再从 README 记录的“下一步”继续。
```

## 不可破坏的协作边界

1. 这是学习项目。学习者亲自分析、设计并编写 `promise.ts`、测试和后续练习代码。
2. AI 默认只负责：
   - 解释概念和失败原因；
   - 把目标拆成一个个可验证的小步骤；
   - 审阅学习者提交的实现；
   - 运行测试、类型检查和静态检查；
   - 按用户要求维护学习文档、阶段记录与 handoff；
   - 在明确授权时执行 commit/push 等 Git 操作。
3. AI 不默认直接补全、改写或修复练习源码和测试。只有用户在当前任务中明确授权具体代码范围时，才能破例；授权不会自动延续到下一任务。
4. AI 可以创建或维护文档，但不能借文档任务隐含修改练习实现。
5. 遇到 bug 或测试失败时，先建立排查路径：现象 → 假设 → 最小验证 → 根因 → 提示。不要直接给出完整最终实现。
6. 不给出整段可复制的最终 Promise 实现。需要说明时使用心智模型、伪代码、类型契约、局部片段或逐级提示。
7. 保留用户已有改动。工作树可能是 dirty 的，不得覆盖、reset 或顺手清理无关内容。

仓库根目录的 `AGENTS.md` 是最高优先级的项目协作约定；本文件是 P01 的具体补充，若冲突应遵循 `AGENTS.md`。

## 对话语言和风格

- 教学、审阅和复盘使用中文。
- Vitest 的 `describe` / `it` 描述使用英文。
- TypeScript 类型、API 名和 Promise 规范术语可以保留英文，但必须说明其职责。
- 先给结论和证据，再解释原因。
- 每轮只推进一个认知目标或一个行为切片，避免同时处理泛型、thenable、scheduler、测试抽象等多个方向。
- 明确区分：
  - **Required**：当前步骤必须修正；
  - **Optional / Nit**：不阻塞，可以稍后处理；
  - **Boundary**：刻意保留给后续课程，不是当前 bug。
- 不因为测试通过就直接说“完成”；必须同时检查 diff、类型角色、测试是否可能假绿，以及是否越过当前课程边界。

## 短消息的含义

用户经常只发送短消息，它们的约定如下：

| 用户消息 | AI 应执行的动作 |
| --- | --- |
| `ready` / `rady` | 检查最新 diff，先审测试再审实现，运行 fresh verification，给出 verdict；通过后只给下一小步 |
| `move on` / `go on` | 含义与 `ready` 相同；不能假设上一项已经正确，仍需读取工作区并验证 |
| `check` | 只读审阅当前实现、测试、类型和已知边界，不自动修复 |
| `继续下一步` | 当前步骤验证通过后，给一个最小的新任务及验收标准 |
| `commit` / `push` | 先确认精确范围并 fresh verify，再显式暂存相关文件；未明确要求时不 push、不创建 PR |

如果短消息到来时上一项没有闭环，AI 应指出剩余 Required 项，而不是为了保持节奏而跳过。

## 标准教学循环

每个小步骤采用下面的循环：

```text
建立目标与边界
  → 学习者先回答关键问题或设计测试
  → RED：证明测试因目标行为缺失而失败
  → 学习者实现最小 GREEN
  → AI 审阅 diff 与失败/通过证据
  → REFACTOR：只整理类型、命名或结构，不混入新行为
  → fresh verification
  → 下一小步
```

并非所有步骤都要制造 RED：

- 新行为或 bugfix 应先建立能准确失败的测试；
- 纯命名、类型或结构 REFACTOR 使用现有行为测试作为安全网，不应人为制造失败；
- 测试加固如果只是证明当前已有行为，可以直接保持 GREEN，但必须说明它关闭了什么假阳性窗口。

## 每次审阅的固定顺序

1. `git status --short --branch`：确认分支、dirty 文件与范围。
2. `git diff --stat` 和目标文件 diff：确认是否混入无关改动。
3. 先审测试：
   - 描述是否对应断言；
   - 是否观察了最终 child 状态，而不只观察 handler 调用；
   - flush 前后是否分别断言；
   - `toBe` 是否用于引用身份，`toEqual` 是否用于结构；
   - RED 是否会因为正确原因失败；
   - 是否存在测试结束太早造成永久 pending 也能通过的情况。
4. 再审实现：
   - correctness；
   - readability；
   - type/architecture；
   - security；
   - performance 和 lifetime；
   - dead code；
   - 是否提前实现下一课程。
5. 运行 fresh verification，不依赖上一轮结果或他人报告。
6. 给出 `Approve` 或 `Request changes`，并把 Required 与 Optional 分开。
7. 只有通过后才给下一小步。

代码探索时优先使用 fast-context MCP（如果当前环境提供）；精确文本、文件和 Git diff 检查使用 `rg`、`rg --files` 与 Git。fast-context 不可用时，直接使用精确的 `rg`/diff，不因此停止学习流程。

## 固定验证命令

在 `packages/01Promise` 中运行：

```bash
pnpm test
pnpm typecheck
pnpm exec tsc --noEmit --noUnusedLocals --noUnusedParameters
```

在仓库根目录运行：

```bash
git diff --check
git status --short --branch
```

在提交前还要运行：

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached --name-status
```

验证报告必须包含实际退出码或明确的测试计数，不能使用“应该通过”“看起来没问题”等推测措辞。

## 换机器运行环境

仓库目前没有 `.nvmrc`、`.node-version` 或 `packageManager` 字段，因此新机器不能从配置文件自动恢复工具版本。本项目已实际验证过以下环境组合：

```text
本轮 fresh verification：Node.js v25.9.0，pnpm 9.0.5
此前 checkpoint：Node.js v22.17.1，pnpm 10.32.1
更早 checkpoint：Node.js v24.14.0，pnpm 9.0.5
packages/01Promise/pnpm-lock.yaml: lockfileVersion 9.0
```

当前 TypeScript/Vitest 依赖的 Node engine 交集要求使用 Node 20.19+（20.x）、Node 22.12+（22.x）或 Node 24+；换机时优先复现上面的任一已验证组合或同一受支持版本线。开始排查项目代码前先运行：

```bash
node --version
pnpm --version
```

Promise 包使用 package-local lockfile，所以依赖安装命令应在 `packages/01Promise` 中运行：

```bash
pnpm install --frozen-lockfile
```

如果 Node/pnpm 版本不兼容，测试工具可能在加载项目代码前就失败；应先解决环境问题，不能把这类启动错误判断为 Promise 实现 bug。

本轮所在 Mac 的 shell `PATH` 前部残留了旧 fnm multishell，默认 `node` 可能解析为 `v12.13.0`。其表现是 pnpm 10 在加载阶段因 optional chaining 报语法错误，或 Vitest 在项目测试开始前失败。本轮验证通过显式选择 Node `v22.17.1` 并确保 pnpm 子进程继承同一 `PATH` 完成。换机后应使用 `fnm use` 或等价版本管理方式修正整个 shell 的 Node，而不是长期复制本机绝对路径。

当前 Mac 的 shell 初始化偶尔会打印：

```text
parse error near `end'
operation not permitted: ps
```

如果随后的 pnpm/tsc 命令真实执行且退出码为 `0`，这属于本机 RVM 初始化噪声，不是项目失败。换机器后不要预设会有同样噪声。

## Promise 专用心智模型

### 三个时间点必须分开

```text
executor 调用       → 构造期间同步执行
resolve/reject      → 同步锁定首次 resolution request，可能继续采用 thenable
reaction handler    → 由 scheduler job 异步执行
```

`resolve` / `reject` 不是“立即运行 handlers”。普通值会同步进入终态并安排对应 reaction jobs；resolve 到 pending thenable 时结果已锁定，但状态仍可保持 pending。

### Resolved 不等于 Settled

```text
public resolve(pendingThenable)
  → public capability 立即锁定，迟到的 public reject 被忽略
  → Promise status 仍是 pending
  → inner thenable 稍后决定 fulfilled 或 rejected
```

外层 capability lock 保护 executor/public resolution request；每次外部 thenable 的局部 once guard 保护该次 `then(resolveOnce, rejectOnce)` 的 callback 竞争。两把锁不能复用。

L05 的三处竞争点必须分别记住：

| 竞争点 | 保护机制 | 不变量 |
| --- | --- | --- |
| executor 里的 public `resolve` / `reject` | 外层 `capabilityLocked` | 只有第一次 public 调用生效；resolve 到 thenable 之后迟到的 public reject 被忽略，反向顺序同理 |
| 同一次 `then` 调用拿到的 inner `resolve` / `reject` | 该次调用的局部 `called` 标记 | 只有第一个 callback 生效；先 reject 时迟到 candidate 的 `.then` 不会被读取 |
| 写入终态 | `status !== "pending"` 时直接 return | fulfilled / rejected 都是终态，不会被后来者覆盖 |

### Test scheduler 不属于 Promise API

`flushNext()` / `flushAll()` 是注入的 test scheduler 提供的观测工具：

- Promise 的 `resolve` / `reject` 负责 enqueue；
- 测试显式 flush 来推进队列；
- 默认 runtime scheduler 使用 `queueMicrotask` 自动执行；
- 不要把 flush 暴露为 PromiseLike 的生产 API。

### Parent 与 child 的两层决定

```text
parent settlement
  → 只选择 onFulfilled 或 onRejected
  → handler return / throw
  → 决定对应 child settlement
```

- `onRejected` 正常返回普通值表示 recovery，因此 child fulfilled；
- handler throw 会 reject child；
- missing/non-function handler 不是什么都不做，而是透明传播 value/reason；
- 每次 `then` 创建独立 child；siblings 不共享 settlement capability；
- 多级链每个 scheduler job 推进一层。

### 六类函数不可混用

| 角色 | 输入 | 返回值语义 | 当前类型方向 |
| --- | --- | --- | --- |
| executor resolve/reject capability | value/reason | 忽略，返回 `void` | `ResolveCapability` / `RejectCapability` |
| public `then` handler | value/reason | 决定 child | `FulfillCallback` / `RejectCallback` |
| internal reaction runner | settlement payload | 内部结算 child，返回 `void` | `ReactionRunner` |
| internal resolution/final settlement | candidate/reason | 采用 thenable 或写入终态 | `innerResolve` / `innerReject` / `finalFulfill` / `finalReject` |
| thenable-local guarded callbacks | value/reason | 本次 `then` 只有第一个 callback 获胜 | `resolveOnce` / `rejectOnce` |
| scheduler job | 无参数 | 只负责延迟执行 | `Job = () => void` |

TypeScript 的结构兼容不代表语义角色相同。测试保存 executor 参数时使用：

```text
Parameters<PromiseExecutor>[0] → resolve capability
Parameters<PromiseExecutor>[1] → reject capability
```

真正传给 `then` 的函数才使用 handler 类型。

## 当前项目 handoff

### 已提交检查点

- `1fc9b22`：状态机、first-settlement latch、reaction queue、test/runtime scheduler。
- `13f9375`：独立 child、普通值传播、recovery、handler throw、missing/non-function transparency、siblings 和多级链。
- `616939c`：收紧 reaction/capability 类型职责，完成 L04 行为 handoff。
- `14bca98`：开始 L05 Promise Resolution Procedure；加入共同 resolution 路径、thenable adoption、单次 `.then` 读取、getter 异常处理、递归采用与局部 once guard。
- `29684f3`：补齐 saved `then` 调用阶段的异常处理，并用 callback/throw 竞争测试锁定 thenable-local once guard。
- `0f4121c`：更新 handoff 与本文件，把 L05 已覆盖的 thenable 行为与遗留项写进 playbook。
- `27cfbcc`：补上 L05 剩余的 focused test，形成 51 条基线，并加入 `self === candidate` 的 `TypeError` 守卫。
- `fee5a87`：三条 guard test 锁定 public capability 双向竞争与 local guard 作用域，形成 54 条基线，并补上 `PHASE-3.md`、学习记录 0003 与 `TASKS.md` 进度同步。

详细阶段记录：

- `packages/01Promise/PHASE-1.md`
- `packages/01Promise/PHASE-2.md`
- `packages/01Promise/PHASE-3.md`
- `learning-records/0001-promise-state-reactions-and-scheduling.md`
- `learning-records/0002-promise-child-chaining-and-propagation.md`
- `learning-records/0003-promise-resolution-locks-and-guard-scope.md`

### 当前测试基线

当前 Promise 包共有 54 条 Vitest 测试：

| 顶层测试组 | 数量 | 子分组 |
| --- | ---: | --- |
| `MyPromise state machine` | 8 | `construction`、`state transitions`、`executor errors` |
| `MyPromise scheduling` | 9 | `scheduler queue`、`deferred handlers`、`runtime microtask` |
| `MyPromise child Promise` | 18 | `child identity`、`handler selection`、`missing or non-function handlers`、`ordinary value propagation`、`handler errors`、`siblings and chains` |
| `MyPromise thenable resolution` | 19 | `adoption`、`then property and candidate classification`、`resolution errors`、`thenable-local once guard`、`pending states`、`self-resolution`、`public capability lock` |

测试文件按功能分组：顶层 describe 对应职责，子 describe 对应同一职责下的具体不变量。查找某个不变量时先定位顶层组，再看子分组，不要依赖历史文件顺序。

2026-09-28 提交前 fresh verification（Node.js v26.10.0、pnpm 12.6.0）为 `54/54 passed`，`pnpm typecheck` 与 `tsc --noEmit --noUnusedLocals --noUnusedParameters` 退出码均为 `0`；新任务仍必须重新运行，不能只引用本文件。

注意 `noUnusedParameters` 不属于 `strict`：本轮曾出现 `vitest` 与 `pnpm typecheck` 同时为绿、而 strict unused 命令报 `TS6133` 的情况。两个命令必须都跑，不能用其中一个代替另一个。

### P01-L04 收束状态

L04 行为与类型 REFACTOR 已通过整体审查：

- `Reaction` 已从可选 public callbacks 改为两个必有的 internal `ReactionRunner`；
- settlement loop 已删除恒真的存在性检查，并使用 `runFulfilled` / `runRejected`；
- `PromiseExecutor` 已使用独立 `ResolveCapability` / `RejectCapability`；
- 旧测试已统一使用 `Parameters<PromiseExecutor>[0/1]` 保存 capability；
- missing-handler transparency 已改为使用 runner 参数，不再重新读取外层 parent `value` / `reason`；
- `isFunction` 已使用文件内部、具有明确调用签名的 `Callable` predicate，不再使用全局 `Function`；
- `ResolveCapability` / `RejectCapability` 当前被导出，这是可选公共 API 决定，不是测试需要；以后可选择去掉 `export`。

`TASKS.md` 中 P01-L04 已随本轮 L05 收束一起勾选。P01-L01 的勾选状态尚未核对，不代表 L01 一定有 Required 问题。

### 下一步

L05 已收束：三处竞争都有可执行判别证据，阶段记录写在 `packages/01Promise/PHASE-3.md`。下一小步进入 **P01-L06 · 用微任务对齐原生 Promise 调度**，仍然一次只做一个小任务，且只写测试、不改 `promise.ts`。

```text
observe the ordering of handwritten vs native handlers after synchronous code
```

要求：

- 使用默认 runtime scheduler，不注入 test scheduler，不调用 `flushNext()`；
- 断言**整条 log 序列**，而不是"handler 被调用过"；
- 至少覆盖两种注册时机：同步 resolve 后注册，以及与原生 Promise 交替注册；
- 预期会出现与原生不一致的顺序；若结果反而一致，先记录现象再解释原因，不要立刻改实现。

L05 的开放问题（环形 thenable 的处置策略、深层嵌套是否静默吞掉 `RangeError`、Promises/A+ 套件）已登记在 `PHASE-3.md` 的"已知债务与边界"，不要混入 L06。

### P01-L05 当前进度与边界

`14bca98` 已开始实现共同的 Promise Resolution Procedure。两个入口现在共享同一条路径：executor 直接 `resolve(x)`，以及 handler return 触发的 child `resolve(x)`。

已经实现并由当前测试覆盖：

- public capability lock 与 internal resolution/final settlement 分层；
- handler 返回手写 thenable、executor 直接 resolve thenable 时采用其最终值；
- `.then` 只读取一次，保存后以 candidate 为 `this` 调用；
- `null` 作为普通值 fulfilled；
- `.then` getter 抛错时以同一 error rejected；
- 嵌套 thenable 递归采用；
- 每次 callable `then` 拥有独立的 resolve/reject once guard；
- outer resolve 到 pending inner thenable 后，outer 的迟到 reject 被忽略，Promise 保持 resolved-but-pending，直到 inner 决定结果。
- 调用保存的 `then` 在任何 callback 前抛错时，以同一个 error reject，异常不会泄漏到构造调用者；
- outer resolve 到 pending inner thenable 后再 throw 时，迟到异常由同一个 local once guard 忽略，inner 仍可最终 fulfill parent；
- thenable 先 reject 后再 resolve 一个带可观察 getter 的 candidate 时，迟到 candidate 的 `.then` 不会被读取。

`27cfbcc` 把上一轮还缺 focused test 的路径补齐，并加入 self-resolution 守卫：

- `.then` 不可调用时，整个对象按普通值 fulfilled，且 `.then` getter 只读取一次；
- function-shaped thenable（函数对象带 `then`）按 thenable 采用；
- 保存的 `then` 确实以 candidate 为 `this`；
- thenable 直接返回但不调用任何 callback 时 parent 保持 pending；
- 同一个 thenable 连续 resolve 到 pending thenable 时，第二个 candidate 不会被读取；
- `self === candidate` 的判定放在读取 `.then` 之前，因此 `resolve(self)` 与 handler 返回自己的 child 都直接以 `TypeError` reject，不会递归读取自身。

本轮已完成：

- public capability 与 thenable callback 的双向竞争（`resolve(thenable)` 后迟到 public reject、public reject 后迟到 `resolve(thenable)`）；
- 同一 thenable 被两个 promise 采用时 local guard 的独立性，以及 guard 粒度必须精确到单次采用；
- L05 阶段记录（`PHASE-3.md`）、学习记录 0003、`TASKS.md` 进度同步与课程复盘。

仍未完成（详见 `PHASE-3.md` 的边界清单）：

- 更完整的多次 resolve/reject 竞争矩阵，含环形 thenable 与深层嵌套；
- 环形 thenable 的处置策略，以及深层嵌套 `RangeError` 是否被静默吞掉（未验证假设）；
- Promises/A+ conformance suite（如 `promises-aplus-tests` 适配器），保留给 P01-L07；
- 微任务调度与原生 Promise 的完整对齐（P01-L06）。
- 第 3 条 guard test 尚未在 p2 settle 之后回头再断言 p1 未被波及（可选加固）。

## Git 纪律

- 未经明确要求，不 commit、不 push、不创建 PR。
- commit 前先确认 scope；工作树混合时只显式暂存相关路径，不使用 `git add -A`。
- commit 前 fresh verify；commit 后再次检查 `git status` 和 `git show --stat`。
- push 前确认 remote、branch 和本地领先情况；push 后确认 upstream 与远程 commit。
- 不使用 `git reset --hard`、`git checkout --` 等破坏性命令清理用户改动。
- commit message 使用简短祈使句，并在 body 中记录行为边界、验证证据和明确遗留项。
- 用户只要求 commit/push 时，不自动创建 PR。

## 换机器检查清单

离开旧机器前：

```text
[ ] 检查 git status，确认要带走的 dirty files
[ ] 运行 tests、typecheck、strict unused check 和 diff check
[ ] 精确暂存并 commit 所有 handoff 所需文件
[ ] push 当前分支到 origin
[ ] fetch 后确认本地不再 ahead，远程包含最新 checkpoint
```

到达新机器后：

```text
[ ] clone/pull 最新仓库
[ ] 阅读 AGENTS.md、MISSION.md、TASKS.md 和本 playbook
[ ] 阅读三个 learning records 与三个 PHASE 文档
[ ] 检查 git status、当前分支和最近提交
[ ] 运行 node --version 与 pnpm --version，确认处于受支持版本线
[ ] 进入 packages/01Promise
[ ] 使用 package-local lockfile 执行 pnpm install --frozen-lockfile
[ ] 运行 54-test baseline、typecheck 和 strict unused check
[ ] 确认当前停在 P01-L06 的微任务对齐 checkpoint：L05 的 public capability 双向竞争与 local guard 作用域都有判别测试，环形 thenable 与 Promises/A+ 套件仍未覆盖
[ ] 从“下一步”恢复一次只做一个小任务的节奏
```

每次完成阶段 commit 后，应更新本文件的“当前项目 handoff”和“下一步”，但不要把它写成逐轮聊天流水账；只保留能够帮助下一台机器准确恢复的规则、证据、边界和未完成工作。
