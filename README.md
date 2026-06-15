# Playwright Framework

它不替代 Playwright 原生能力，主要补两类本地研发体验：

- 更高效地生成测试代码
- 更方便地查看执行结果和调试证据

当前框架层主要做了四件事：

- 提供统一的 `codegen` 入口，支持 `env / role / header / device / browser` 等上下文注入
- 提供 `createGroupTest(...)`，把 `page/context` 初始化、`initialURL`、默认 `serial` 和 `runtime-url` 附件收进框架层
- 接入本地 Allure 报告链路，测试完成后自动生成并打开报告
- 默认保留截图、视频、Trace 等调试证据，方便本地回放和定位问题

## Quick Start

### Install

```bash
npm install
npx playwright install
```

### Run Tests

运行全量测试：

```bash
node ./scripts/run-e2e.cjs
```

运行指定测试文件：

```bash
node ./scripts/run-e2e.cjs --target tests/interview_agent/login/login.spec.ts
```

可视化观察浏览器动作：

```bash
node ./scripts/run-e2e.cjs --headed
```

调试模式执行：

```bash
node ./scripts/run-e2e.cjs --debug
```

### Start A Recording Session

基础录制：

```bash
node ./scripts/run-codegen.cjs --name demo --project chromium --url https://playwright.dev/
```

带环境和角色配置录制：

```bash
node ./scripts/run-codegen.cjs --name login --env local --role admin --url https://localhost:5173/#/pages/login/index
```

## 分组测试写法

推荐写法：

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

`createGroupTest(...)` 默认会处理：

- 创建并注入当前测试使用的 `page`
- 按配置创建 `context`
- 应用 `baseURL / headers / cookies / contextOptions`
- 每个测试开始前自动打开 `initialURL`
- 每个测试结束后自动附加 `runtime-url`
- 默认 `serial: true`

因此，分组测试不再需要手写：

- `test.describe.configure({ mode: 'serial' })`
- `beforeEach -> page.goto(...)`
- `afterEach -> runtime-url 附件`
- `group.page`

## 主命令说明

### `run-codegen.cjs`

作用：启动一个带上下文的本地录制会话，用来生成或补写测试代码。

启动录制前会先生成一个基于 `createGroupTest(...)` 的测试模板，后续可直接把录制步骤粘贴进 `async ({ page }) => {}`。

当前录制链路会优先调用 Playwright 原生 `codegen`。如果分组配置里包含 `headers`，这些请求头会保留在生成的 `createGroupTest(...)` 模板中，但原生录制会话本身无法直接带上这组 `extraHTTPHeaders`。

默认输出路径：

```text
tests/codegen/<scene>.spec.ts
```

| 参数 | 说明 |
| --- | --- |
| `--name <scene>` | 场景名称，用于生成默认输出路径 |
| `--url <url>` | 录制入口页面地址 |
| `--output <path>` | 指定录制输出文件路径；默认 `tests/codegen/<name>.spec.ts` |
| `--project <project>` | 项目预设；当前 `chromium` 会带出默认浏览器 |
| `--browser <browser>` | 显式指定浏览器类型，优先级高于 `--project` |
| `--device <device>` | 指定 Playwright 设备预设 |
| `--env <env>` | 读取 `config/recording/envs/<env>.json` 注入环境配置 |
| `--role <role>` | 读取 `config/recording/roles/<role>.json` 注入角色配置 |
| `--header key=value` | 追加或覆盖单个请求头，可多次传入 |

### `run-e2e.cjs`

作用：执行 Playwright 测试，并自动串联本地报告与调试证据查看流程。

默认行为：

- 执行测试
- 生成 Allure 报告
- 本地自动打开报告
- 保留截图、视频、Trace 等调试证据

| 参数 | 说明 |
| --- | --- |
| `--target <file>` | 只执行指定测试文件 |
| `--grep <pattern>` | 按测试标题过滤执行范围 |
| `--project <project>` | 只执行指定 Playwright project |
| `--headed` | 有头模式执行，便于观察浏览器动作 |
| `--debug` | 调试模式执行，便于配合 Inspector 排查 |

相关配置位于 [playwright.config.ts](file:///Users/bytedance/playwright_framework/playwright.config.ts)。

报告目录始终相对当前工作目录计算；如果你在不同 worktree 下执行命令，每个 worktree 都会生成自己的 `reports/allure-report`。

## Shortcut Scripts

项目脚本定义位于 [package.json](file:///Users/bytedance/playwright_framework/package.json)。

这些脚本只是少量场景化快捷入口，不是新的能力面：

| Script | Purpose |
| --- | --- |
| `npm run test:demo` | 执行 Playwright 官网 demo 场景，默认带 `--headed` |
| `npm run codegen:demo` | 启动 Playwright 官网 demo 录制会话 |
| `npm run test:interview-login` | 执行登录单场景测试，默认带 `--headed` |
| `npm run codegen:interview-login` | 启动基础登录录制会话 |
| `npm run codegen:interview-login:admin` | 启动管理员登录录制会话，固化 `--env local --role admin` |

## Test Group Configuration

测试分组配置统一放在：

```text
config/test-groups/<scene>.ts
```

典型写法：

```ts
import type { GroupTestOptions } from '../../utils/groupContext';

export const demoGroupConfig = {
  baseURL: 'https://playwright.dev',
  initialURL: 'https://playwright.dev',
  headers: {},
  cookies: [],
} satisfies GroupTestOptions;
```

配置项说明：

| 字段 | 说明 |
| --- | --- |
| `baseURL` | 当前分组测试使用的基础地址 |
| `initialURL` | 每个测试开始前自动打开的入口页 |
| `serial` | 是否默认串行执行；默认 `true`，传 `false` 可关闭 |
| `headers` | 创建 context 时注入的请求头 |
| `cookies` | 创建 context 后写入的 cookie 列表 |
| `contextOptions` | 透传给 `browser.newContext(...)` 的额外配置 |

当前示例文件：

- [demo.ts](file:///Users/bytedance/playwright_framework/config/test-groups/demo.ts)
- [interview_login.ts](file:///Users/bytedance/playwright_framework/config/test-groups/interview_login.ts)
- [interview.ts](file:///Users/bytedance/playwright_framework/config/test-groups/interview.ts)

## Recording Configuration

录制配置读取约定：

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

规则说明：

- `--env` 注入环境级通用请求头
- `--role` 注入角色级请求头和 Cookie
- `--header` 会覆盖同名的 `env.headers` 或 `role.headers`
- `--project chromium` 会带出默认浏览器 `chromium`
- 如果同时指定 `--browser`，显式 `--browser` 优先

## 目录职责说明

- `config/recording/`：给 `run-codegen.cjs` 提供录制时使用的环境、角色和请求头配置
- `config/test-groups/`：存放 `createGroupTest(...)` 使用的分组配置，例如 `baseURL / initialURL / headers / cookies`
- `pages/`：页面对象层，封装页面元素定位和页面操作
- `scripts/`：命令入口和脚本实现，主要包括 `run-codegen.cjs`、`run-e2e.cjs` 及其底层能力
- `tests/codegen/`：录制生成或手工整理后的脚本草稿
- `tests/demo/`：框架行为和稳定示例用例
- `tests/interview_agent/`：业务测试用例目录，按模块继续拆分场景
- `utils/`：通用能力封装，例如 Allure 元数据和 `createGroupTest(...)`
- `playwright.config.ts`：Playwright 全局配置，集中管理 reporter、artifact、project 和默认执行参数
