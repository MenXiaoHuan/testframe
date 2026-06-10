# Playwright Framework

一个面向 Web 场景的 Playwright 自动化测试脚手架，提供统一测试执行、上下文化录制、Allure 报告和调试证据保留能力。

## Why This Project

原生 Playwright 已经足够强大，但在真实团队协作里，常见痛点通常不在“能不能写测试”，而在：

- 测试入口分散，团队命令不统一
- 本地、CI、报告打开逻辑不一致
- 录制脚本缺少环境、角色、请求头等上下文
- 调试证据保留策略不统一
- 报告元数据缺少规范，结果难以归类

这个项目围绕这些问题做了一层轻量封装，让 Playwright 更适合团队协作和项目落地。

## Highlights

- Unified runner：统一 `E2E` 执行入口，覆盖本地、CI、调试模式
- Context-aware recording：统一录制入口，支持 `env / role / header / device / browser`
- Allure reporting：自动生成 Allure 报告，并在本地自动打开
- Debug artifacts：成功和失败场景都保留截图、视频、Trace
- Metadata conventions：按目录和标题自动补充 Allure 元数据

## Quick Start

### Prerequisites

- Node.js
- npm
- Playwright 浏览器依赖
- 一个可访问的被测服务

### Install

```bash
npm install
npx playwright install
```

### Run Tests

运行全量测试：

```bash
npm run test:e2e
```

可视化观察浏览器动作：

```bash
npm run test:e2e:headed
```

调试模式执行：

```bash
npm run test:e2e:debug
```

### Start A Recording Session

基础录制：

```bash
npm run codegen -- --name login --project chromium --url https://localhost:5173/#/pages/login/index
```

带环境和角色配置录制：

```bash
npm run codegen -- --name login --env local --role admin --url https://localhost:5173/#/pages/login/index
```

带临时请求头录制：

```bash
npm run codegen -- --name login --env local --role admin --header "X-Trace-Id=trace-001" --url https://localhost:5173/#/pages/login/index
```

## Core Workflows

### 1. Unified Test Runner

项目通过 [run-e2e.cjs](file:///Users/bytedance/playwright_framework/scripts/run-e2e.cjs) 统一执行测试，而不是依赖零散的 `playwright test` 命令拼接。

支持能力：

- 全量执行
- 单文件执行
- `--grep` 按标题过滤
- `--project` 按 Playwright project 过滤
- `--headed` 可视化执行
- `--debug` 调试执行
- 本地自动打开 Allure 报告
- CI 只生成报告、不自动打开

### 2. Context-Aware Recording

项目通过 [run-codegen.cjs](file:///Users/bytedance/playwright_framework/scripts/run-codegen.cjs) 统一启动带上下文的录制会话，并在进入页面后通过 `page.pause()` 进入可交互录制模式。

支持能力：

- `--name` 场景命名
- `--url` 录制入口地址
- `--output` 目标路径约定
- `--project` 项目预设
- `--device` 设备模拟
- `--browser` 浏览器类型
- `--env` 环境级配置
- `--role` 角色级配置
- `--header` 临时覆盖请求头

默认录制稿路径约定：

```text
tests/codegen/<scene>.spec.ts
```

### 3. Reporting And Evidence

测试执行完成后会生成 Allure 报告，并保留以下调试证据：

- 截图
- 视频
- Trace

当前报告展示策略：

- 报告默认以中文展示关键模块和失败分类
- 首页优先展示业务模块、失败项和关键证据
- Trace 会作为附件保留，并附带本地打开说明
- 执行环境信息会写入 `.allure-results/environment.properties`
- 成功与失败场景都会保留截图、视频和 Trace

如需本地直接打开 Trace，可使用：

```bash
npx playwright show-trace .playwright-artifacts/<case-folder>/trace.zip
```

相关配置位于 [playwright.config.ts](file:///Users/bytedance/playwright_framework/playwright.config.ts)。

## Common Commands

项目脚本定义位于 [package.json](file:///Users/bytedance/playwright_framework/package.json)。

| Command | Purpose |
| --- | --- |
| `npm run test:e2e` | 本地执行全量 E2E，自动生成并打开 Allure 报告 |
| `npm run test:e2e:headed` | 可视化执行测试，适合观察浏览器动作 |
| `npm run test:e2e:debug` | 调试模式执行，适合配合 Inspector 排查 |
| `npm run test:ci` | CI 模式执行测试，生成报告但不自动打开 |
| `npm run test:interview-login` | 执行登录单场景测试，默认带 `--headed` |
| `npm run codegen:interview-login` | 启动基础登录录制会话 |
| `npm run codegen:interview-login:admin` | 启动管理员登录录制会话，固化 `--env local --role admin` |
| `npm run report:open` | 打开已有 Allure 报告 |

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
  "baseURL": "https://localhost:5173",
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

- `--env` 注入环境级 `baseURL` 和通用请求头
- `--role` 注入角色级请求头和内联 `storageState`
- `--header` 会覆盖同名的 `env.headers` 或 `role.headers`
- `--project chromium` 会带出默认浏览器 `chromium`
- 如果同时指定 `--browser`，显式 `--browser` 优先
- `--device` 会合并进最终 `context` 配置

## Project Layout

```text
playwright_framework/
├── config/
│   ├── recording/              # 录制 Runner 的环境与角色配置
│   └── test-groups/            # 分组与业务上下文配置
├── docs/                       # Playwright 学习文档
├── pages/                      # 页面对象
├── scripts/                    # 统一 runner、codegen 与相关测试
├── tests/                      # Playwright 测试文件
├── utils/                      # Allure 与上下文公共能力
├── README.md
├── package.json
└── playwright.config.ts
```

## Documentation

如果你希望进一步学习 Playwright API 和测试设计，可以直接看：

- [playwright-api-quick-reference.md](file:///Users/bytedance/playwright_framework/docs/playwright-api-quick-reference.md)
- [playwright-system-learning.md](file:///Users/bytedance/playwright_framework/docs/playwright-system-learning.md)

## FAQ

### 为什么执行测试时没有弹出浏览器？

- `playwright test` 默认是无头模式
- 想看浏览器动作时，使用：

```bash
npm run test:e2e:headed
```

- 想进入调试状态，使用：

```bash
npm run test:e2e:debug
```

### 为什么会报 `net::ERR_CERT_AUTHORITY_INVALID`？

- 本地开发环境通常使用自签名证书
- 当前 [playwright.config.ts](file:///Users/bytedance/playwright_framework/playwright.config.ts#L6-L12) 已开启 `ignoreHTTPSErrors: true`
- 如果你没有走项目封装命令，仍然可能遇到证书问题

推荐直接使用项目脚本：

```bash
npm run codegen:interview-login
```

### 为什么提示 `No tests found`？

- Playwright 默认只识别符合测试命名约定的文件
- 正式测试文件统一使用 `*.spec.ts`
- 示例登录用例见 [login.spec.ts](file:///Users/bytedance/playwright_framework/tests/interview_agent/login/login.spec.ts)

### 为什么测试跑完没有自动看到报告？

- 只有走统一 Runner 的测试命令时，才会自动触发项目内的报告编排逻辑
- 如果你直接执行 `playwright test`，不会自动打开报告

本地推荐使用：

```bash
npm run test:e2e
```

如果报告已生成但没有打开：

```bash
npm run report:open
```

## Conventions

- 测试文件统一使用 `*.spec.ts`
- 页面对象推荐使用 `*Page.ts`
- 录制产物默认落在 `tests/codegen/`
- 整理后的正式业务用例应迁移到业务目录
- Allure 元数据由 [allure.ts](file:///Users/bytedance/playwright_framework/utils/allure.ts) 自动补充

## For Contributors

如果你想扩展这个项目，建议优先关注这些文件：

- [playwright.config.ts](file:///Users/bytedance/playwright_framework/playwright.config.ts)
- [run-e2e.cjs](file:///Users/bytedance/playwright_framework/scripts/run-e2e.cjs)
- [run-codegen.cjs](file:///Users/bytedance/playwright_framework/scripts/run-codegen.cjs)
- [run-e2e-core.cjs](file:///Users/bytedance/playwright_framework/scripts/lib/run-e2e-core.cjs)
- [run-codegen-core.cjs](file:///Users/bytedance/playwright_framework/scripts/lib/run-codegen-core.cjs)

## License

当前 `package.json` 中配置为 `ISC`。
