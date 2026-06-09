# Contributing

感谢你关注这个项目。

这份文档面向希望参与维护、补充测试、改进 Runner 或完善文档的贡献者，帮助你快速理解协作方式和基本约定。

## Before You Start

请先确保本地已完成以下准备：

```bash
npm install
npx playwright install
```

如果项目中的示例场景依赖本地服务，请先启动被测服务，例如：

```text
https://localhost:5173/#/pages/login/index
```

## Development Workflow

建议使用下面的顺序开展修改：

1. 理解当前目标和相关文件
2. 在尽量小的范围内修改代码或文档
3. 运行与改动直接相关的测试或验证命令
4. 确认 README、脚本和配置口径保持一致
5. 再提交 commit

## Common Commands

安装依赖：

```bash
npm install
```

安装 Playwright 浏览器：

```bash
npx playwright install
```

运行全量测试：

```bash
npm run test:e2e
```

可视化执行测试：

```bash
npm run test:e2e:headed
```

调试模式执行：

```bash
npm run test:e2e:debug
```

执行登录单场景：

```bash
npm run test:interview-login
```

启动基础录制会话：

```bash
npm run codegen:interview-login
```

启动管理员录制会话：

```bash
npm run codegen:interview-login:admin
```

打开报告：

```bash
npm run report
```

## Project Conventions

### Test Files

- 正式测试文件统一使用 `*.spec.ts`
- 测试文件放在 `tests/` 下
- `tests/codegen/` 主要用于临时录制稿

### Page Objects

- 页面对象放在 `pages/`
- 推荐使用 `*Page.ts` 命名

### Recording Config

- 环境配置放在 `config/recording/envs/`
- 角色配置放在 `config/recording/roles/`
- `role` 配置内联 `storageState`

### Reports And Artifacts

- Allure 原始结果目录：`.allure-results/`
- Allure HTML 报告目录：`reports/allure-report/`
- 截图、视频、Trace 目录：`.playwright-artifacts/`

## When You Change Code

请尽量遵循下面的原则：

- 变更保持聚焦，不顺手做无关重构
- 命令、脚本、README 和配置修改要同步
- 如果改了 Runner 或参数解析，优先补脚本层测试
- 如果改了用户可见行为，补充必要文档

### Script-Level Verification

如果你修改了 `scripts/` 下的参数解析或核心逻辑，优先运行相关单测，例如：

```bash
node --test scripts/__tests__/run-e2e-options.test.cjs scripts/__tests__/run-e2e-core.test.cjs
```

或：

```bash
node --test scripts/__tests__/run-codegen-options.test.cjs scripts/__tests__/run-codegen-core.test.cjs
```

## Documentation Expectations

以下变更通常需要同步文档：

- 新增命令
- 修改命令语义
- 新增配置项
- 录制或执行流程变化
- 目录规范变化

优先更新：

- `README.md`
- `docs/playwright-api-quick-reference.md`
- `docs/playwright-system-learning.md`

## Commit Guidance

建议使用清晰、可检索的提交信息，例如：

```text
feat: add context-aware recording role config
fix: align report command with package scripts
docs: improve README for open source usage
test: cover codegen runtime config merging
```

推荐前缀：

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `chore`

## Pull Request Checklist

在提交 PR 前，建议自查：

- 变更目标是否清晰
- 相关测试是否已运行
- README 和命令示例是否仍然准确
- 是否引入了无关文件或临时调试代码
- 产物目录和本地缓存文件是否未被误提交

## Questions

如果你不确定改动应该放在哪一层，建议先区分：

- `playwright.config.ts`：全局 Playwright 配置
- `scripts/`：统一 Runner 和录制入口
- `config/recording/`：环境与角色上下文
- `tests/`：测试用例
- `pages/`：页面对象
- `utils/`：公共能力

先明确边界，再落代码，通常会更稳。
