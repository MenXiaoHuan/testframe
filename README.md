# Playwright Framework

它不替代 Playwright 的原生能力，主要补充两类本地研发体验：更高效地生成测试代码，以及更方便地查看执行结果和调试证据：
- 提供统一的 `codegen` 入口，支持 `env / role / header / device / browser` 等上下文注入，减少录制后再手工补环境和请求头的成本
- 接入本地报告链路，测试完成后自动生成并打开 Allure 报告，便于快速查看失败步骤、附件和关键信息
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
node ./scripts/run-codegen.cjs --name login --project chromium --url https://localhost:5173/#/pages/login/index
```

带环境和角色配置录制：

```bash
node ./scripts/run-codegen.cjs --name login --env local --role admin --url https://localhost:5173/#/pages/login/index
```

## 主命令说明

### `run-codegen.cjs`

作用：启动一个带上下文的本地录制会话，用来生成或补写测试代码。

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
| `npm run test:interview-login` | 执行登录单场景测试，默认带 `--headed` |
| `npm run codegen:interview-login` | 启动基础登录录制会话 |
| `npm run codegen:interview-login:admin` | 启动管理员登录录制会话，固化 `--env local --role admin` |

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
- `--role` 注入角色级请求头和Cookie
- `--header` 会覆盖同名的 `env.headers` 或 `role.headers`
- `--project chromium` 会带出默认浏览器 `chromium`
- 如果同时指定 `--browser`，显式 `--browser` 优先

## 目录职责说明：

- `config/recording/`：给 `run-codegen.cjs` 提供录制时使用的环境、角色和请求头配置
- `config/test-groups/`：存放测试分组的业务上下文配置，便于多个用例复用同一套前置条件
- `pages/`：页面对象层，封装页面元素定位和页面操作
- `scripts/`：命令入口和脚本实现，主要包括 `run-codegen.cjs`、`run-e2e.cjs` 及其底层能力
- `tests/codegen/`：录制生成或手工整理后的脚本草稿
- `tests/interview_agent/`：业务测试用例目录，按模块继续拆分场景
- `utils/`：通用能力封装，例如 Allure 元数据、分组上下文、公共测试基类
- `playwright.config.ts`：Playwright 全局配置，集中管理 reporter、artifact、project 和默认执行参数
