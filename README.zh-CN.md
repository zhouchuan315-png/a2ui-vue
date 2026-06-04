# A2UI Vue

[English](README.md) | 简体中文

A2UI Protocol v0.9 的 Vue 3 渲染器与组件库实现。这个仓库包含协议核心、Vue 渲染器、传输适配器，以及一个用于调试和查看组件效果的本地 demo。

## 功能

- Vue 3 渲染器：通过 `A2UIRenderer` 渲染 A2UI server messages。
- 协议核心：包含 surface、component registry、data model、function call 等核心能力。
- 基础组件：布局、内容、输入、导航、装饰等基础组件。
- 传输适配器：提供 SSE 与 WebSocket 对接入口。
- A2A 适配器：支持 Agent Card 发现、JSON-RPC 传输、流式事件解析，以及 A2A 到 A2UI 的映射。
- Demo 工作台：包含基础目录、组合组件、JSON 渲染、使用文档、餐厅查找、A2A Playground 页面。

## 项目结构

```text
packages/
  core/          A2UI 协议核心与类型，包名 @nine1ie/a2ui-vue-core
  renderer/      Vue 3 渲染器与组件库，包名 @nine1ie/a2ui-vue
  transport/     SSE / WebSocket 传输适配器，包名 @nine1ie/a2ui-vue-transport
  a2a/           A2A 协议适配器，包名 @nine1ie/a2ui-vue-a2a

examples/
  basic/         本地 demo 工作台

docs/            项目计划与补充文档
```

## 环境要求

- Node.js >= 18
- pnpm 9.x

## 本地开发

安装依赖：

```bash
pnpm install
```

启动 demo：

```bash
pnpm --filter @nine1ie/a2ui-example-basic dev
```

常用校验：

```bash
pnpm build
pnpm typecheck
pnpm test
```

## 发布到 npm

根目录提供了发布脚本，会按依赖顺序构建并发布三个包：

1. `@nine1ie/a2ui-vue-core`
2. `@nine1ie/a2ui-vue`
3. `@nine1ie/a2ui-vue-transport`
4. `@nine1ie/a2ui-vue-a2a`

先 dry-run 检查：

```bash
pnpm publish:npm:dry
```

正式发布：

```bash
pnpm publish:npm
```

指定 npm tag 或 2FA OTP：

```bash
pnpm publish:npm -- --tag next
pnpm publish:npm -- --otp 123456
```

发布前把所有包同步更新到指定版本：

```bash
pnpm publish:npm -- --set-version 0.1.1 --otp 123456
```

脚本发布前会执行 `pnpm typecheck`、`pnpm test` 和 `pnpm build`。只有在 CI 已完成这些检查时，才建议使用 `--skip-tests`。

## Demo 工作台

`examples/basic` 目前包含六个页面：

- 基础目录：查看基础组件预览、props、最小 JSON 和进阶 JSON。
- 组合组件：查看由多个基础组件组合出的业务片段，并查看完整配置。
- JSON 渲染：粘贴 message 数组、单条 message 或 JSONL，直接预览渲染结果。
- 使用文档：查看安装、渲染器接入、message 顺序、调试方式等说明。
- 餐厅查找：模拟 agent 流式输出餐厅推荐，并支持播放控制。
- A2A Playground：使用静态 mock 数据预览 A2A 输出，也可手动填写自定义 Agent Card URL。

## 安装到业务项目

```bash
pnpm add @nine1ie/a2ui-vue @nine1ie/a2ui-vue-core
```

如果需要 SSE 或 WebSocket 传输适配器：

```bash
pnpm add @nine1ie/a2ui-vue-transport
```

如果需要连接 A2A (Agent2Agent) agent：

```bash
pnpm add @nine1ie/a2ui-vue-a2a
```

## 对接渲染器

`A2UIRenderer` 是运行时入口。业务页面负责获取服务端或 agent 输出的 `A2UIServerMessage[]`，然后按顺序传给 renderer。

推荐顺序：

1. `reset()`：渲染完整新页面前清空旧 surface。
2. `createSurface`：创建 surface。
3. `updateComponents`：写入组件树。
4. `updateDataModel`：写入表单、列表、状态等绑定数据。
5. 监听 `@action`：处理按钮、标签页、弹窗等交互组件发出的事件。

### Vue 示例

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { A2UIRenderer } from '@nine1ie/a2ui-vue'
import type { ActionMessage, A2UIServerMessage } from '@nine1ie/a2ui-vue-core'

const rendererRef = ref<InstanceType<typeof A2UIRenderer> | null>(null)

const messages: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'demo',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: {
        primaryColor: '#6366f1',
        agentDisplayName: 'Demo Agent',
      },
    },
  },
  {
    updateComponents: {
      surfaceId: 'demo',
      components: [
        {
          id: 'root',
          component: 'Column',
          children: { explicitList: ['title', 'submit'] },
        },
        {
          id: 'title',
          component: 'Text',
          text: { literalString: 'Hello A2UI' },
          usageHint: 'h2',
        },
        {
          id: 'submit',
          component: 'Button',
          label: { literalString: 'Submit' },
          variant: 'primary',
          action: {
            event: {
              name: 'submit_demo',
              context: { source: 'readme' },
            },
          },
        },
      ],
    },
  },
]

function renderMessages(nextMessages: A2UIServerMessage[]) {
  const renderer = rendererRef.value
  if (!renderer) return

  renderer.reset()
  for (const message of nextMessages) {
    renderer.processMessage(message)
  }
}

function handleAction(action: ActionMessage) {
  console.log('A2UI action:', action.name, action.context)
}

onMounted(() => {
  renderMessages(messages)
})
</script>

<template>
  <A2UIRenderer ref="rendererRef" @action="handleAction" />
</template>
```

### Renderer API

`A2UIRenderer` 通过组件 ref 暴露以下方法：

- `processMessage(message)`：处理单条 `A2UIServerMessage`。
- `processJSON(json)`：处理单条 JSON 字符串。
- `processJSONStream(chunk)`：处理按换行分隔的 JSONL chunk。
- `reset()`：清空所有 surface。

流式输出时，可以在收到每条 message 后立即调用 `processMessage`。完整重渲染时，建议先调用 `reset()`。

## 传输对接

`@nine1ie/a2ui-vue-transport` 提供 SSE 和 WebSocket 的标准适配器，用于把 renderer 对接到服务端消息流。适配器共享同一套 `TransportAdapter` 形状：

- `connect()`：打开传输连接。
- `disconnect()`：关闭连接，并停止重连任务。
- `onMessage(callback)`：接收服务端发来的 `A2UIServerMessage`。
- `onAction(action)`：把 renderer 发出的 `ActionMessage` 回传给服务端。
- `onError(callback)`：处理传输错误或消息解析错误。
- `connected`：读取当前连接状态。

如果业务项目已经有自己的请求层或流式消息层，可以不使用这个包，直接调用 `renderer.processMessage(message)`。

### WebSocket

```ts
import { createWSTransport } from '@nine1ie/a2ui-vue-transport/websocket'
import type { ActionMessage } from '@nine1ie/a2ui-vue-core'

const transport = createWSTransport({
  url: 'wss://example.com/a2ui',
  reconnect: true,
})

transport.onMessage((message) => {
  rendererRef.value?.processMessage(message)
})

transport.onError((error) => {
  console.error('A2UI transport error:', error)
})

transport.connect()

function handleAction(action: ActionMessage) {
  transport.onAction(action)
}
```

### SSE

```ts
import { createSSETransport } from '@nine1ie/a2ui-vue-transport/sse'
import type { ActionMessage } from '@nine1ie/a2ui-vue-core'

const transport = createSSETransport({
  url: '/api/a2ui/events',
  withCredentials: true,
})

transport.onMessage((message) => {
  rendererRef.value?.processMessage(message)
})

transport.connect()

function handleAction(action: ActionMessage) {
  // SSE 负责接收服务端消息，action 会通过独立 HTTP 请求回传。
  transport.onAction(action)
}
```

## A2A 对接

`@nine1ie/a2ui-vue-a2a` 用于把 A2A agent 对接到 renderer。它会处理 Agent Card 发现、JSON-RPC 请求、SSE 流式响应，并把 A2A message、task、artifact、action 映射成 A2UI messages。

```ts
import { createA2ATransport } from '@nine1ie/a2ui-vue-a2a'
import type { ActionMessage } from '@nine1ie/a2ui-vue-core'

const transport = createA2ATransport({
  agentCardUrl: 'https://agent.example.com/.well-known/agent-card.json',
  streaming: true,
})

transport.onMessage((message) => {
  rendererRef.value?.processMessage(message)
})

transport.onError((error) => {
  console.error('A2A transport error:', error)
})

await transport.connect()
await transport.sendText('生成一个销售摘要 UI')

function handleAction(action: ActionMessage) {
  transport.onAction(action)
}
```

静态 demo 默认使用本地 mock 数据。远程 A2A 连接需要填写可访问的 Agent Card URL，如有鉴权需求，由业务侧提供认证头。

## A2UI Server Message

最常用的 server message 类型：

- `createSurface`：创建 surface，并设置 catalog、theme、agent 名称等信息。
- `updateComponents`：更新指定 surface 的组件树。
- `updateDataModel`：更新指定 surface 的数据模型。
- `deleteSurface`：删除指定 surface。

最小 JSON 示例：

```json
[
  {
    "createSurface": {
      "surfaceId": "demo",
      "catalogId": "a2ui.org/standard-catalog/v0.9"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "demo",
      "components": [
        {
          "id": "root",
          "component": "Text",
          "text": { "literalString": "Hello A2UI" }
        }
      ]
    }
  }
]
```

## 组件配置建议

- 根节点优先使用 `Row`、`Column`、`Card` 等容器组件组织布局。
- 显式子组件使用 `children.explicitList`。
- 列表模板使用 `children.template`。
- 表单类组件使用 `value.path` 绑定 data model。
- 交互组件统一配置 `action.event.name` 和 `context`。
- 需要分隔内容时使用 `Divider`，并放在 `Row` 或 `Column` 的 children 中。

## 包说明

### `@nine1ie/a2ui-vue-core`

协议核心包，包含：

- protocol types
- surface manager
- component registry
- data model
- parser
- client functions

### `@nine1ie/a2ui-vue`

Vue 3 渲染器与组件库，主要导出：

- `A2UIRenderer`
- 基础组件与渲染器样式

### `@nine1ie/a2ui-vue-transport`

传输适配器，包含：

- SSE adapter
- WebSocket adapter

### `@nine1ie/a2ui-vue-a2a`

A2A 协议适配器，包含：

- Agent Card 发现与校验
- JSON-RPC client
- SSE stream parser
- A2A task、message、artifact、action 映射

## License

MIT
