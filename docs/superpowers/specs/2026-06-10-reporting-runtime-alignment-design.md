# Reporting Runtime Alignment Design

## Background

当前仓库的测试报告链路已经具备基础能力，但仍存在 3 个影响维护和体验的问题：

1. 报告 UI 默认语言不稳定。
   - 代码已经向 `allure awesome` 传入 `--report-language zh`。
   - 但实际生成出的 `reports/allure-report/index.html` 仍可能保留 `reportLanguage: "en"`。
   - 这意味着“默认中文”不能只依赖生成参数，需要在展示层做稳定兜底。

2. 报告职责边界仍然混杂。
   - `utils/allure.ts` 和 `utils/allureMetadata.ts` 属于数据层。
   - `scripts/lib/run-e2e-core.cjs` 属于编排层。
   - `scripts/lib/allure-report-shell.cjs` 属于展示层。
   - 当前虽然已经有初步拆分，但用户可感知的行为仍被多层代码共同影响，容易让问题定位变复杂。

3. 主工作区与 worktree 存在重复实现。
   - 报告核心逻辑曾在 worktree 中演进，再同步到主工作区。
   - 如果两边继续各自维护一套近似实现，后续每次报告优化都容易出现“某一边看起来回退了”的现象。

本轮目标不是继续堆功能，而是把“报告怎么生成、怎么展示、哪些字段该披露”彻底收敛清楚。

## Goals

本轮设计目标如下：

1. 把“默认中文”收敛为展示层能力，而不是业务元数据翻译能力。
2. 保持报告披露最小化。
   - 能隐藏的字段直接隐藏。
   - 必须展示的字段尽量保留原始值，不再做硬编码中文映射。
3. 让主工作区与 worktree 的报告链路保持一致。
4. 明确报告代码的 3 层职责：
   - 数据层
   - 编排层
   - 展示层
5. 清理历史兼容壳和重复入口，降低理解成本。

## Non-goals

以下内容不属于本轮范围：

1. 不重做 Allure 页面结构。
2. 不实现 breadcrumb 全链路可点击。
3. 不继续扩展业务模块中文映射。
4. 不引入新的报告引擎或替换 Allure。

## Design Principles

一个优秀的端到端自动化框架，在报告上应遵循以下原则：

1. 数据与展示分离。
   - 元数据负责表达“是什么”。
   - UI 壳层负责表达“怎么显示”。

2. 披露最小化。
   - 不让报告首页或用例页暴露大量低价值字段。
   - 让使用者更快看到 story、severity、owner、suite、trace 等核心信息。

3. 单一入口。
   - 测试执行只走一个统一 runner。
   - 报告打开只走一个统一 opener。

4. 防御性集成第三方工具。
   - 如果第三方 CLI 参数不稳定，就在生成后产物层兜底。
   - 不把关键体验建立在“上游应该会按预期工作”的假设上。

5. 同源实现。
   - 主工作区与 worktree 不能长期漂移。
   - 同一条报告链路应共享相同契约和相同实现。

## Proposed Architecture

### 1. Data Layer

数据层只负责报告结果数据本身，不负责翻译 UI。

涉及文件：

- `utils/allure.ts`
- `utils/allureMetadata.ts`
- `playwright.config.ts`

职责定义：

1. `utils/allureMetadata.ts`
   - 负责清洗标题。
   - 负责从测试文件路径推导 `featureName`、`subSuiteName`、`storyName`。
   - 负责构造环境信息。
   - 负责生成 Trace 使用说明文本。

2. `utils/allure.ts`
   - 在 `beforeEach` 中把元数据与附件注入到 Allure 结果中。

3. `playwright.config.ts`
   - 配置 `allure-playwright` reporter。
   - 配置失败分类。
   - 配置环境信息。

数据层约束：

1. 不再做业务模块中文穷举映射。
2. `feature`、`parentSuite` 等如果最终不对外披露，则可以保留原始值。
3. 报告需要展示的字段以“少而稳定”为原则。

### 2. Orchestration Layer

编排层只负责测试执行、报告生成和本地打开，不负责解释业务语义。

涉及文件：

- `scripts/run-e2e.cjs`
- `scripts/lib/run-e2e-core.cjs`
- `scripts/open-report.cjs`

职责定义：

1. 清理旧产物：
   - `./.allure-results`
   - `./reports/allure-report`
   - `./.playwright-artifacts`

2. 运行 Playwright 测试。

3. 调用 `allure awesome` 生成 HTML 报告。

4. 调用展示层补丁处理最终产物。

5. 本地环境自动打开报告，CI 环境不自动打开。

入口约束：

1. 保留 `npm run test:e2e` 系列命令。
2. 保留 `npm run report:open` 作为唯一打开入口。
3. 删除历史兼容壳 `scripts/test-with-allure.cjs`。

### 3. Presentation Layer

展示层只负责对最终 `index.html` 做稳定补丁，不参与测试执行和数据推导。

涉及文件：

- `scripts/lib/allure-report-shell.cjs`

职责定义：

1. 强制修正报告 UI 默认语言。
   - 生成后读取 `index.html`。
   - 如果 `window.allureReportOptions.reportLanguage !== "zh"`，则直接补丁为 `zh`。
   - 该行为视为对 `allure awesome` 参数不稳定的兜底。

2. 默认折叠元数据区。

3. 为未来的 UI 级开关保留扩展点。
   - 例如首页默认 section。
   - 例如某些快速筛选的可见性。

展示层约束：

1. 不改业务字段值。
2. 不写入新的业务元数据。
3. 所有 UI 级兜底都只落在生成后的静态报告上。

## Field Disclosure Strategy

报告字段披露策略收敛为：

1. 隐藏以下低价值或高噪音字段：
   - `package`
   - `feature`
   - `titlePath`
   - `parentSuite`
   - `subSuite`
   - `host`
   - `thread`

2. 保留以下核心字段：
   - `story`
   - `owner`
   - `severity`
   - `suite`
   - `framework`
   - `language`

3. 环境信息仅保留：
   - `执行模式`
   - `浏览器项目`
   - `Node 版本`
   - `操作系统`

4. Trace 通过附件和文本指导保留，不额外扩展运行日志字段。

## Main Refactoring Items

本轮建议合并或删除的代码如下：

1. 删除 `scripts/test-with-allure.cjs`
   - 当前只是 `require('./run-e2e.cjs')`
   - 没有独立职责

2. 报告实现以主工作区为准继续收敛，worktree 同步跟进。

3. 契约测试统一覆盖：
   - `scripts/__tests__/allure-metadata.test.ts`
   - `scripts/__tests__/allure-report-shell.test.cjs`
   - `scripts/__tests__/run-e2e-core.test.cjs`
   - `scripts/__tests__/run-e2e-contract.test.cjs`

## Implementation Plan

建议按以下顺序落地：

### Task 1. Stabilize UI Language

1. 为 `allure-report-shell.cjs` 增加 `reportLanguage` 强制修正逻辑。
2. 为该逻辑补充壳层测试。
3. 真实生成一次报告并确认 `index.html` 中的 `reportLanguage` 为 `zh`。

### Task 2. Remove Legacy Wrapper

1. 删除 `scripts/test-with-allure.cjs`。
2. 全局确认无引用残留。
3. 更新契约测试与文档。

### Task 3. Align Both Workspaces

1. 校对主工作区与 worktree 的：
   - `run-e2e-core.cjs`
   - `allure-report-shell.cjs`
   - `open-report.cjs`
   - `allure.ts`
   - `allureMetadata.ts`
   - `playwright.config.ts`
2. 保证同一条报告链路行为一致。

## Verification

本轮变更完成后需要验证：

1. 脚本层测试通过：
   - `node --import tsx --test scripts/__tests__/allure-metadata.test.ts`
   - `node --test scripts/__tests__/allure-report-shell.test.cjs scripts/__tests__/run-e2e-core.test.cjs scripts/__tests__/run-e2e-contract.test.cjs`

2. 真实用例通过：
   - `npm run test:interview-login`

3. 报告产物验证：
   - `reports/allure-report/index.html` 中 `reportLanguage` 为 `zh`
   - `data/test-results/*.json` 中不再暴露隐藏字段
   - 报告中仍可看到 `Trace 使用说明`

## Expected Outcome

完成后，仓库的报告能力会收敛为：

1. 数据层不再硬编码业务中文映射。
2. 报告 UI 默认中文由展示层稳定兜底。
3. 生成入口与打开入口保持单一。
4. 主工作区与 worktree 的报告实现不再漂移。
5. 后续继续优化报告时，可以明确知道该改哪一层，而不是在多个文件中来回试错。
