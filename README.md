# A2UI Vue

English | [简体中文](README.zh-CN.md)

A Vue 3 renderer and component library for A2UI Protocol v0.9. This repository includes the protocol core, Vue renderer, transport adapters, and a local demo workspace for inspecting and debugging rendered UI.

## Features

- Vue 3 renderer: render A2UI server messages with `A2UIRenderer`.
- Protocol core: surface management, component registry, data model, function calls, and protocol types.
- Base components: layout, content, input, navigation, and decoration primitives.
- Transport adapters: SSE and WebSocket integration entry points.
- Demo workspace: Basic Catalog, Composition Components, JSON Renderer, and Usage Docs pages.

## Project Structure

```text
packages/
  core/          A2UI protocol core and types, package @nine1ie/a2ui-vue-core
  renderer/      Vue 3 renderer and component library, package @nine1ie/a2ui-vue
  transport/     SSE / WebSocket transport adapters, package @nine1ie/a2ui-vue-transport

examples/
  basic/         Local demo workspace

docs/            Project plans and supporting docs
```

## Requirements

- Node.js >= 18
- pnpm 9.x

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the demo:

```bash
pnpm --filter @nine1ie/a2ui-example-basic dev
```

Common checks:

```bash
pnpm build
pnpm typecheck
pnpm test
```

## Publish To npm

The root project provides a publish helper that builds and publishes packages in dependency order:

1. `@nine1ie/a2ui-vue-core`
2. `@nine1ie/a2ui-vue`
3. `@nine1ie/a2ui-vue-transport`

Dry run:

```bash
pnpm publish:npm:dry
```

Publish:

```bash
pnpm publish:npm
```

Publish with a custom tag or npm 2FA OTP:

```bash
pnpm publish:npm -- --tag next
pnpm publish:npm -- --otp 123456
```

The script runs `pnpm typecheck`, `pnpm test`, and `pnpm build` before publishing. Use `--skip-tests` only when CI has already completed those checks.

## Demo Workspace

`examples/basic` currently includes four pages:

- Basic Catalog: inspect primitive component previews, props, minimal JSON, and advanced JSON.
- Composition Components: inspect real UI fragments assembled from primitives and review full configuration.
- JSON Renderer: paste a message array, a single message, or JSONL and preview the rendered result.
- Usage Docs: review installation, renderer integration, message ordering, and debugging guidance.

## Install In An Application

```bash
pnpm add @nine1ie/a2ui-vue @nine1ie/a2ui-vue-core
```

If you need SSE or WebSocket transport adapters:

```bash
pnpm add @nine1ie/a2ui-vue-transport
```

## Renderer Integration

`A2UIRenderer` is the runtime entry point. Your application fetches `A2UIServerMessage[]` from a server or agent and feeds those messages into the renderer in order.

Recommended order:

1. `reset()`: clear old surfaces before rendering a complete new page.
2. `createSurface`: create the target surface.
3. `updateComponents`: write the component tree.
4. `updateDataModel`: write bound data for forms, lists, and state.
5. Listen to `@action`: handle events emitted by buttons, tabs, modals, and other interactive components.

### Vue Example

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

`A2UIRenderer` exposes the following methods through its component ref:

- `processMessage(message)`: handles one `A2UIServerMessage`.
- `processJSON(json)`: handles one JSON string.
- `processJSONStream(chunk)`: handles newline-delimited JSONL chunks.
- `reset()`: clears all surfaces.

For streaming output, call `processMessage` as each message arrives. For a complete re-render, call `reset()` first.

## Transport Integration

`@nine1ie/a2ui-vue-transport` provides standard adapters for connecting the renderer to SSE or WebSocket services. The adapters share a `TransportAdapter` shape:

- `connect()`: open the transport connection.
- `disconnect()`: close the connection and stop reconnect work.
- `onMessage(callback)`: receive `A2UIServerMessage` objects from the server.
- `onAction(action)`: send an `ActionMessage` emitted by the renderer back to the server.
- `onError(callback)`: handle transport or parsing errors.
- `connected`: read the current connection state.

If your application already has its own request or streaming layer, you can call `renderer.processMessage(message)` directly and skip this package.

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
  // SSE receives messages from the server. Actions are posted back separately.
  transport.onAction(action)
}
```

## A2UI Server Message

The most common server message types are:

- `createSurface`: creates a surface and configures catalog, theme, and agent metadata.
- `updateComponents`: updates the component tree for a surface.
- `updateDataModel`: updates the data model for a surface.
- `deleteSurface`: deletes a surface.

Minimal JSON example:

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

## Component Authoring Tips

- Prefer `Row`, `Column`, `Card`, and other container components for root layout.
- Use `children.explicitList` for explicit child components.
- Use `children.template` for list templates.
- Bind form components through `value.path` and the data model.
- Configure `action.event.name` and `context` consistently on interactive components.
- Use `Divider` inside `Row` or `Column` children when content needs visual separation.

## Packages

### `@nine1ie/a2ui-vue-core`

Protocol core package:

- protocol types
- surface manager
- component registry
- data model
- parser
- client functions

### `@nine1ie/a2ui-vue`

Vue 3 renderer and component library. Main exports:

- `A2UIRenderer`
- base components and renderer styles

### `@nine1ie/a2ui-vue-transport`

Transport adapters:

- SSE adapter
- WebSocket adapter

## License

MIT
