# Playwright Framework

基于 Playwright 的本地自动化研发框架，重点解决两件事：更快地写出测试代码，以及更直接地查看执行结果和调试证据。

它保留 Playwright 原生能力，在此基础上补充统一录制入口、分组测试模板和本地报告链路，适合日常本地编写、调试和回放自动化脚本。

## Overview

这个项目不是重新发明一套测试引擎，而是在 Playwright 之上约束一套更稳定的本地研发工作流：

- 用 `run-codegen.cjs` 启动带上下文的录制会话
- 用 `createGroupTest(...)` 收敛测试写法
- 用 `run-e2e.cjs` 串起执行、报告和调试证据
- 用 Allure 统一查看结果、附件和失败信息

## Features

- 统一的 `codegen` 入口，支持 `env`、`role`、`header`、`device`、`browser` 等上下文参数
- 统一的 `createGroupTest(...)` 测试 API，内置 `page/context` 初始化、`initialURL`、默认串行和 `runtime-url` 附件
- 统一的 `run-e2e.cjs` 执行入口，自动生成并打开 Allure 报告
- 默认集成截图、视频、Trace 等调试证据，便于本地排查问题
- 录制产物默认整理为当前框架推荐的测试模板，而不是直接保留原始 Playwright codegen 稿

## Requirements

- Node.js
- npm
- Playwright 浏览器依赖

## Installation

```bash
npm install
npx playwright install
```

## Quick Start

### 1. 录制一个新场景

```bash
node ./scripts/run-codegen.cjs --name demo --project chromium --url https://playwright.dev/
```

默认会生成到：

```text
tests/codegen/demo.spec.ts
```

### 2. 按推荐范式编写测试

```ts
import { expect } from '../../utils/allure';
import { demoGroupConfig } from '../../config/test-groups/demo';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest(demoGroupConfig);

test.describe('示例', () => {
  test('进入 Playwright 文档首页', async ({ page }) => {
    await page.getByRole('link', { name: 'Docs' }).click();
    await expect(page).toHaveURL(/\/docs\/intro/);
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
```

### 3. 运行测试

运行全量测试：

```bash
node ./scripts/run-e2e.cjs
```

运行指定测试文件：

```bash
node ./scripts/run-e2e.cjs --target tests/interview_agent/login/login.spec.ts
```

有头模式执行：

```bash
node ./scripts/run-e2e.cjs --headed
```

调试模式执行：

```bash
node ./scripts/run-e2e.cjs --debug
```

### 4. 查看报告

执行 `run-e2e.cjs` 后，会自动生成并在本地打开 Allure 报告：

```text
reports/allure-report
```

## Core Workflow

### `createGroupTest(...)`

当前框架推荐所有测试都基于 `createGroupTest(...)` 组织。

它默认会处理：

- 创建并注入当前测试使用的 `context` 和 `page`
- 应用 `baseURL`、`headers`、`cookies` 和 `contextOptions`
- 在每个测试开始前自动打开 `initialURL`
- 在每个测试结束后自动附加 `runtime-url`
- 默认以 `serial` 模式执行当前测试组

这意味着测试文件里通常不再需要手写：

- `test.describe.configure({ mode: 'serial' })`
- `beforeEach(() => page.goto(...))`
- `afterEach(() => attach runtime-url)`
- 额外的 `group.page` 包装层

### `run-codegen.cjs`

`run-codegen.cjs` 用于启动本地录制，并把录制结果整理成 `createGroupTest(...)` 模板。

生成模板示例：

```ts
import { expect } from '../../utils/allure';
import { createGroupTest } from '../../utils/groupContext';

const test = createGroupTest({
  initialURL: 'https://playwright.dev/'
});

test.describe('Demo', () => {
  test('executes recorded flow', async ({ page }) => {
    await page.getByRole('link', { name: 'Docs' }).click();
    await expect(page).toHaveURL(/\/docs\/intro/);
  });
});
```

补充说明：

- 录制底层仍然使用 Playwright 原生 `codegen`
- 录制完成后，脚本会把录制步骤回填到框架模板中
- `--name` 决定默认输出文件名和 `test.describe(...)` 标题
- 默认用例标题为 `executes recorded flow`
- 如果录制稿中的第一句 `page.goto(...)` 与 `initialURL` 重复，会在回填时自动去掉
- `headers` 会写入最终模板，但 Playwright 原生录制会话本身不直接携带 `extraHTTPHeaders`

### `run-e2e.cjs`

`run-e2e.cjs` 用于统一执行测试，并串联报告与调试证据链路。

默认行为：

- 执行 `npx playwright test`
- 生成 Allure 报告
- 本地自动打开报告
- 成功执行后保留报告目录
- 非平台模式下，成功执行后会清理中间运行产物目录

## Commands

### `run-codegen.cjs`

```bash
node ./scripts/run-codegen.cjs [options]
```

| 参数 | 说明 |
| --- | --- |
| `--name <scene>` | 场景名称；默认 `codegen`，同时用于生成默认输出文件名 |
| `--url <url>` | 录制入口页面地址 |
| `--output <path>` | 指定输出文件路径；默认 `tests/codegen/<name>.spec.ts` |
| `--project <project>` | 项目预设；当前 `chromium` 会带出默认浏览器 |
| `--browser <browser>` | 显式指定浏览器类型，优先级高于 `--project` |
| `--device <device>` | 指定 Playwright 设备预设 |
| `--env <env>` | 读取 `config/recording/envs/<env>.json` 注入环境配置 |
| `--role <role>` | 读取 `config/recording/roles/<role>.json` 注入角色配置 |
| `--header key=value` | 追加或覆盖单个请求头，可重复传入 |

示例：

```bash
node ./scripts/run-codegen.cjs --name login --env local --role admin --url https://localhost:5173/#/pages/login/index
```

### `run-e2e.cjs`

```bash
node ./scripts/run-e2e.cjs [options]
```

| 参数 | 说明 |
| --- | --- |
| `--target <file>` | 只执行指定测试文件 |
| `--grep <pattern>` | 按测试标题过滤执行范围 |
| `--project <project>` | 只执行指定 Playwright project |
| `--headed` | 有头模式执行，便于观察浏览器动作 |
| `--debug` | 调试模式执行，便于配合 Playwright Inspector 排查 |

示例：

```bash
node ./scripts/run-e2e.cjs --target tests/demo/google-demo.spec.ts --headed
```

相关全局配置见 [playwright.config.ts](file:///Users/bytedance/playwright_framework/playwright.config.ts)。

### Shortcut Scripts

项目在 [package.json](file:///Users/bytedance/playwright_framework/package.json) 中保留了少量场景化快捷脚本，这些只是命令别名，不是新增能力面：

| Script | 说明 |
| --- | --- |
| `npm run codegen:demo` | 启动 Playwright 官网 demo 的录制会话 |
| `npm run test:demo` | 执行 Playwright 官网 demo 场景，默认带 `--headed` |
| `npm run codegen:interview-login` | 启动登录页录制会话 |
| `npm run test:interview-login` | 执行登录单场景测试，默认带 `--headed` |

## Configuration

### Test Group Configuration

测试分组配置统一放在：

```text
config/test-groups/<scene>.ts
```

典型示例：

```ts
import type { GroupTestOptions } from '../../utils/groupContext';

export const demoGroupConfig = {
  baseURL: 'https://playwright.dev',
  initialURL: 'https://playwright.dev',
  headers: {},
  cookies: [],
} satisfies GroupTestOptions;
```

`GroupTestOptions` 字段说明：

| 字段 | 说明 |
| --- | --- |
| `baseURL` | 当前测试组使用的基础地址 |
| `initialURL` | 每个测试开始前自动打开的入口页 |
| `serial` | 是否串行执行；默认 `true`，传 `false` 可关闭 |
| `headers` | 创建 `context` 时注入的请求头 |
| `cookies` | 创建 `context` 后写入的 cookie 列表 |
| `contextOptions` | 透传给 `browser.newContext(...)` 的其他配置 |

参考文件：

- [demo.ts](file:///Users/bytedance/playwright_framework/config/test-groups/demo.ts)
- [interview_login.ts](file:///Users/bytedance/playwright_framework/config/test-groups/interview_login.ts)
- [interview.ts](file:///Users/bytedance/playwright_framework/config/test-groups/interview.ts)

### Recording Configuration

录制配置按以下约定读取：

```text
config/recording/envs/<env>.json
config/recording/roles/<role>.json
```

示例文件：

- [local.json](file:///Users/bytedance/playwright_framework/config/recording/envs/local.json)
- [admin.json](file:///Users/bytedance/playwright_framework/config/recording/roles/admin.json)

环境配置示例：

```json
{
  "headers": {
    "X-App-Env": "local"
  }
}
```

角色配置示例：

```json
{
  "headers": {
    "Authorization": "Bearer replace-with-admin-token"
  },
  "storageState": {
    "cookies": [],
    "origins": []
  }
}
```

合并规则：

- `env.headers` 先注入
- `role.headers` 在其上覆盖或补充
- 命令行 `--header` 最后覆盖同名字段
- `--project chromium` 会带出默认浏览器 `chromium`
- 如果同时指定 `--browser`，以显式 `--browser` 为准

## Project Structure

| 路径 | 说明 |
| --- | --- |
| `config/recording/` | `run-codegen.cjs` 使用的环境、角色与请求头配置 |
| `config/test-groups/` | `createGroupTest(...)` 的分组配置，例如 `baseURL`、`initialURL`、`headers`、`cookies` |
| `pages/` | 页面对象层，封装定位与页面行为 |
| `scripts/` | 命令入口和脚本实现，包括 `run-codegen.cjs`、`run-e2e.cjs` 及底层核心逻辑 |
| `tests/codegen/` | 录制生成或手工整理后的脚本草稿 |
| `tests/demo/` | 框架行为回归测试与稳定示例用例 |
| `tests/interview_agent/` | 业务测试用例目录 |
| `utils/` | 通用能力封装，例如 Allure 集成与 `createGroupTest(...)` |
| `playwright.config.ts` | Playwright 全局配置，集中管理 project、reporter、artifact 和默认执行策略 |

## Outputs

运行过程中会涉及以下产物目录：

| 路径 | 说明 |
| --- | --- |
| `tests/codegen/` | `run-codegen.cjs` 默认输出目录 |
| `reports/allure-report/` | `run-e2e.cjs` 生成并打开的最终报告目录 |
| `.allure-results/` | Allure 中间结果目录 |
| `.playwright-artifacts/` | Playwright 运行期截图、视频、Trace 等原始产物目录 |
| `test-results/.playwright-results.json` | 平台模式下额外生成的 JSON 报告 |

说明：

- 本地成功执行后，会保留 `reports/allure-report/`
- 非平台模式下，本地成功执行后会清理 `.allure-results/` 和 `.playwright-artifacts/` 中间目录
- 设置 `PLAYWRIGHT_PLATFORM_MODE=true` 时，会额外保留平台侧需要的运行产物

## Notes

- 当前 `playwright.config.ts` 默认配置了 `retries: 1`，失败用例会自动重试一次
- 报告目录始终相对当前工作目录计算
- 如果在不同 worktree 或不同项目目录执行命令，每个目录都会生成各自的报告与产物
