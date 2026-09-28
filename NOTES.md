# Teaching Notes

- 教学语言：中文。
- 学习者亲自写代码；不要提供完整可复制实现。
- 优先使用原理图、行为表、伪代码、测试案例和逐级提示。
- 详细教程从 `TASKS.md` 的稳定编号生成，并拆成短课。
- 当前假设：具备 JavaScript 函数、闭包、回调和基础测试经验；尚未验证。
- P01 第一课包含前置诊断，后续审阅应根据诊断结果调整提示粒度。
- P03 假设学习者使用过 ESM `import / export`，但尚未验证 AST、图遍历与模块解析基础；以 P03-L01 的六题诊断校准提示粒度。
- P03 教学核心限定为静态相对 ESM 子集，并把 asset 图去重与 runtime 模块缓存分开讲解和验收。
- P04 假设学习者已通过 P03 接触 AST，但尚未验证递归下降、visitor enter/exit、source span 与结构化诊断能力；以 P04-L01 的诊断题校准提示粒度。
- P04 核心语言限定为数字、字符串、函数名与括号调用表达式；source location 采用 1-based line、0-based column、end-exclusive 约定。
