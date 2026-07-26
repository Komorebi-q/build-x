# Promise 状态、Reactions 与调度已经形成独立心智模型

学习者已能用测试区分 executor 的同步执行、settlement 的一次性状态决定、reaction 的登记，以及 scheduler 对 handler 执行时机的控制；也能解释 pending reaction queue 在 settlement 后为何可以释放。这意味着后续 P01-L04 可以直接进入 parent/child 传播关系，不必重新讲解三态或“resolve 是否等于执行 handler”。

## Evidence

- 亲自完成并通过 8 条状态机测试、3 条 scheduler 契约测试、5 条 reaction 时间关系测试和 1 条 runtime microtask 测试。
- 能识别共享 settlement latch、零参数 scheduler job、closure 捕获结果和 reaction 所有权转移的必要性。
- 修正了 eager enqueue 假阳性、`vi.fn` 参数元组推导、`toBe`/`toEqual` 选择和隐藏 test queue 无法自动执行等问题。

## Implications

- 下一课以传播矩阵和 child Promise capability 为起点。
- 继续要求测试先证明 Red 的失败原因正确，再进入实现。
- `getSnapshot()`、`any` 与尚未处理的 thenable 都应视为明确的学习阶段边界，而不是已完成的标准 Promise 能力。
