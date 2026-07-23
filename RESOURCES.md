# Build Your Own X 学习资源

## Knowledge

- [本地课程总览：build-your-own-x 前端 → 全栈 + CS 基础复核版](./build-your-own-x-前端全栈-CS复核版.html)
  当前学习路线的范围、顺序、投入和验收基线。用于：选择模块和避免项目间重复。
- [本地上游快照：codecrafters-io/build-your-own-x](./sources/build-your-own-x/README.md)
  上游仓库在提交 `aa17439b62f384511a5561ce308e9598b94d8989` 的本地只读参考。用于：离线核对分类、教程条目和原始链接。
- [教程：Implementing an A+ Conformant Promise Library in JavaScript the TDD Way](https://www.mauriciopoppe.com/notes/computer-science/computation/promises/)
  P01 的原始动手路线。用于：观察如何以测试逐步逼出状态机、链式调用和 thenable 解析；其中的调度方式需要与现代原生 Promise 行为分开理解。
- [标准：Promises/A+](https://promisesaplus.com/)
  P01 的首要行为规范，精确定义 `then`、回调规则和 Promise Resolution Procedure。用于：决定测试预期和处理边界条件。
- [标准：ECMAScript® Language Specification — Promise Objects](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)
  原生 JavaScript Promise 的规范算法和内部记录。用于：区分 Promises/A+ 兼容与原生 ECMAScript 行为，尤其是 reaction jobs 与 `PerformPromiseThen`。
- [测试套件：promises-aplus-tests](https://github.com/promises-aplus/promises-tests)
  Promises/A+ 官方兼容性测试。用于：通过最小 adapter 验证 `then` 行为并按规范条款定位失败。
- [MDN：Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
  面向使用者的 Promise 链、错误传播和组合说明。用于：把底层实现映射回日常代码。
- [MDN：Using microtasks in JavaScript with queueMicrotask()](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
  浏览器中 task 与 microtask 的可读说明。用于：设计顺序实验、解释为何 reaction 不应在当前调用栈内执行。
- [教程：Build your own React](https://pomb.us/build-your-own-react/)
  P02 的原始教学路线。用于：以 Didact 模型串起 element、Fiber、分片工作、commit、reconciliation、函数组件与 `useState`；其调度和协调策略应视为教学近似。
- [本地对照快照：pomber/didact](./sources/didact/readme.md)
  P02 的本地只读源码参考，固定于提交 `bb72345b2300dd4658b4736b65843e05dac39643`。用于：离线核对原教程最终结构，不用于复制实现。
- [React：Render and Commit](https://react.dev/learn/render-and-commit)
  React 官方对 render 与 commit 的用户层概念说明。用于：校正“render 等于直接写 DOM”的误解。
- [React：State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
  React 官方对一次 render 中状态快照的说明。用于：理解 setter 安排下一次 render，而不是修改当前调用中的状态变量。
- [React：Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
  React 官方对状态更新排队与函数式 updater 的说明。用于：设计连续 action 的顺序测试，并区分 P02 简化队列与真实 batching。
- [React：Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
  React 官方 Hooks 调用规则。用于：把 P02 的索引槽位实验映射到“顶层稳定调用顺序”。
- [React 源码仓库](https://github.com/facebook/react)
  现代 React 的首要源码参考。用于：验收后研究 reconciler、scheduler 与真实生产实现；P02 核心阶段不进行大规模源码考古。
- [教程：Build Your Own Module Bundler — Minipack](https://github.com/ronami/minipack)
  P03 的原始教学骨架。用于：串起单文件 asset、依赖图、模块表与 bundle runtime；仓库主动省略了解析去重、模块缓存和循环语义，必须结合本课程夹具暴露这些边界。
- [本地对照快照：ronami/minipack](./sources/minipack/README.md)
  P03 的本地只读参考，固定于提交 `a4d91ea1087fc23d96f63e8c893fdf16137ee4d4`。用于：离线核对原始注释、三文件示例和最小 runtime，不用于复制实现或沿用其旧依赖。
- [MDN：import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
  静态 import 的语法、顶层限制、只读 live binding 和 host-defined specifier resolution 概览。用于：解释 AST 能静态发现什么，并校准教学 runtime 与原生 ESM 的差距。
- [Babel：@babel/parser](https://babeljs.io/docs/babel-parser)
  现代 Babel parser 的 parsing goal、AST、source location 和错误字段说明。用于：定义 P03 单文件资产的解析输入、节点证据与结构化语法错误。
- [Babel：@babel/traverse](https://babeljs.io/docs/babel-traverse)
  Babel AST 的 visitor 与按节点类型遍历接口。用于：只从已声明支持的依赖节点收集 specifier，而不是用正则扫描源码。
- [Babel：Transform ES Modules to CommonJS](https://babeljs.io/docs/babel-plugin-transform-modules-commonjs)
  ESM import/export 语法到 CommonJS 形式的转换和 interop 选项。用于：确定转换代码期待的 runtime 接口；官方明确说明该插件不了解不同模块系统的解析算法。
- [标准：ECMAScript® Language Specification — Scripts and Modules](https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html)
  Module Records、加载、链接、导出解析与求值的规范基线。用于：验收阶段校准缓存、循环和 live binding；核心实现不要求复刻这些完整算法。
- [Webpack：Dependency Graph](https://webpack.js.org/concepts/dependency-graph/)
  生产打包器对入口与依赖图的概念说明。用于：把 P03 的有向图映射回真实工具术语，不用来推断 P03 已支持 Webpack resolution、loader 或优化能力。

## Wisdom (Communities)

- [Promises/A+ specification repository](https://github.com/promises-aplus/promises-spec)
  标准文本及历史讨论。用于：遇到条款歧义时查看实现者之间的讨论，而不是依据博客猜测。
- [TC39 ecma262 repository](https://github.com/tc39/ecma262)
  ECMAScript 规范维护社区。用于：追踪原生 Promise 语义、规范勘误和 host job 相关讨论。

## Gaps

- P01 默认以浏览器和通用 JavaScript 微任务模型讲解。若学习者选择 Node.js 作为唯一运行环境，需要补充对应 Node 版本的 event loop 与 `process.nextTick` 官方资料。
- 当前还没有学习者完成诊断后的学习记录；难度会在 P01 第一课后根据实际表现校准。
- P02 默认使用浏览器 DOM 作为宿主环境，并以可注入 scheduler 做确定性测试。若选择纯 Node 测试环境，需要自行确定 DOM 实现或把宿主操作全部替换为测试记录器。
- P02 的 index-based reconciliation、空闲分片和 Hook 队列是教学模型，不代表现代 React 的完整 Fiber、优先级、lane、提交阶段或 Hooks 实现。
- P03 核心只覆盖单入口、JavaScript 文件和已声明的静态相对 ESM 子集。bare package、动态 import、re-export、非 JavaScript 资源与 Node / 浏览器完整 resolution 必须明确标为不支持或另行补充资料。
- Minipack 本地快照使用 Babel 6 时代的包名和依赖，只适合阅读教学结构。学习者自己的实现应记录实际选择的现代 parser / transform 版本，不应把参考仓库的旧 lockless 依赖安装方式当作工程基线。
- P03 将“同一 canonical filename 只建一个 asset”与“同一模块实例只执行一次”分开验证。核心阶段可以先保留无 runtime cache 的可观察限制，但必须写明策略；模块缓存、CommonJS 风格部分初始化和原生 ESM 循环语义不能互相等同。
