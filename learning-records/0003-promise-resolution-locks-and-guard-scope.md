# Promise 的两把锁与 guard 作用域已经形成独立心智模型

学习者已经能把 Promise Resolution Procedure 中的三处竞争分开：public capability 的一次性由外层 `capabilityLocked` 保护，单次采用内的 callback 竞争由局部 `called` 保护，终态写入由 `status` 自身保护。更关键的是，学习者理解了两把锁不能复用、不能互相代替，并把内层 guard 的作用域精确到"一次 `then.call` 调用"。这意味着后续可以进入微任务调度对齐与 Promises/A+ 适配器，不必重新讲解采用语义。

## Evidence

- 亲自补写三条 guard test，关闭三处假阳性窗口：迟到 public reject 不能改写 `resolve(thenable)` 已锁定的结果；public reject 在前时迟到 candidate 的 `.then` getter 读取次数为 0；同一 thenable 被两个 promise 采用时 `.then` 读取两次、两个 promise 各自独立结算。
- 三条测试与已有的嵌套采用用例构成三角覆盖：迟到 reject、不短路、按 candidate 记忆化、guard 跨 promise 共享、guard 提到 Promise 闭包，五种错误实现各有明确判别者。当前 Promise 包共有 54 条测试。
- 用只读实验（复制源码到临时目录生成变体）确认了 guard 作用域的边界：把 `called` 提到 Promise 闭包时，"同一 thenable 被两个 promise 采用"这条测试**依然通过**，失败会出现在已有的嵌套采用用例，形态是 parent 永不 settle。
- 验证过程中被 strict unused 检查抓出一次 `TS6133`，而 `vitest` 与 `pnpm typecheck` 同时为绿；确认了 `noUnusedParameters` 不属于 `strict`，两个命令必须都跑。

## Implications

- P01-L05 的采用语义与三处竞争已达到 GREEN checkpoint；下一小步是 P01-L06 的微任务对齐，A+ 适配器保留给 P01-L07。
- 外层锁的判定位置（读取 `.then` 之前）决定可观察副作用的有无，而不只是最终状态；测试必须落在"错误实现会变、正确实现不变"的量上（例如 getter 读取次数），只观察最终状态无法区分"锁短路"与"采用后丢弃"。
- 环形 thenable 在原生与当前实现下都永不 settle，但机制不同（微任务饥饿 vs 同步递归撞栈后被局部 guard 吞掉）；深层嵌套是否同样被静默吞掉 `RangeError` 仍是未验证假设。
- `any`、`getSnapshot()` 的公开边界、更完整的多次竞争矩阵与 A+ 套件仍是学习阶段债务，不应误认为最终 Promise API。
