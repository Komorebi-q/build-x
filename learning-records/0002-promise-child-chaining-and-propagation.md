# Promise child 链与传播矩阵已经形成独立心智模型

学习者已能把 parent settlement、handler selection 与 child settlement 分成三个连续但不同的决定，并用独立 child capability 解释错误恢复、异常传播、missing-handler transparency、siblings independence 和逐 job 多级链。这意味着后续不必重新讲解普通值传播，可以先收紧内部 reaction 类型，再直接进入 thenable resolution 的新复杂度。

## Evidence

- 亲自实现每次 `then` 创建独立 child，并让 pending 与 already-settled 两种路径通过同一个 scheduler 运行绑定 child capability 的 wrappers。
- 用 18 条 child tests 覆盖普通返回值、`onRejected` recovery、handler throw、缺失/非函数 handler、siblings 及三层 exact-value 传播；当前 Promise 包共有 35 条测试。
- 主动补齐了 pending missing-handler 在 flush 后的最终状态，以及多级链各层 handler 输入与 child 结果，关闭了只观察调用次数或 flush 前 pending 的测试假阳性。

## Implications

- P01-L04 的普通值行为已达到 GREEN checkpoint；下一小步是让 internal reaction jobs 与 public handlers/capabilities 的 TypeScript 角色一致。
- handler 返回 thenable 时仍被当作普通值，thenable assimilation、once guard、递归解析和 self-cycle detection 明确保留给 P01-L05。
- `getSnapshot()`、`any`、宽泛的 `Function` predicate 和重复测试结构仍是学习阶段债务，不应误认为最终 Promise API。
