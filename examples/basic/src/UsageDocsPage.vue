<script setup lang="ts">
import { computed, ref } from 'vue'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import vue from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github.css'
import type { Locale } from './i18n'

interface CodeBlock {
  title: string
  language: 'bash' | 'json' | 'typescript' | 'vue'
  code: string
}

interface DocSection {
  id: string
  title: string
  body: string[]
  bullets?: string[]
  codeBlocks?: CodeBlock[]
}

interface UsageDocsCopy {
  eyebrow: string
  title: string
  summary: string
  navTitle: string
  sections: DocSection[]
}

interface HighlightedCodeBlock extends CodeBlock {
  html: string
}

interface HighlightedDocSection extends Omit<DocSection, 'codeBlocks'> {
  codeBlocks?: HighlightedCodeBlock[]
}

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('vue', vue)

const props = withDefaults(defineProps<{
  locale?: Locale
}>(), {
  locale: 'zh',
})
const copiedCodeKey = ref<string | null>(null)

const installCode = `pnpm add @a2ui/vue @a2ui/vue-core`
const transportInstallCode = `pnpm add @a2ui/vue-transport`

const renderCode = [
  '<script setup lang="ts">',
  "import { onMounted, ref } from 'vue'",
  "import { A2UIRenderer } from '@a2ui/vue'",
  "import type { ActionMessage, A2UIServerMessage } from '@a2ui/vue-core'",
  '',
  'const rendererRef = ref<InstanceType<typeof A2UIRenderer> | null>(null)',
  'const messages = ref<A2UIServerMessage[]>([])',
  '',
  'function handleAction(action: ActionMessage) {',
  "  console.log('A2UI action:', action.name, action.context)",
  '}',
  '',
  'onMounted(() => {',
  '  renderMessages(messages.value)',
  '})',
  '',
  'function renderMessages(nextMessages: A2UIServerMessage[]) {',
  '  const renderer = rendererRef.value',
  '  if (!renderer) return',
  '',
  '  renderer.reset()',
  '  for (const message of nextMessages) {',
  '    renderer.processMessage(message)',
  '  }',
  '}',
  '</' + 'script>',
  '',
  '<template>',
  '  <A2UIRenderer ref="rendererRef" @action="handleAction" />',
  '</template>',
].join('\n')

const messageFlowCode = `const renderer = rendererRef.value
if (!renderer) return

renderer.reset()
renderer.processMessage({
  createSurface: {
    surfaceId: 'demo',
    catalogId: 'a2ui.org/standard-catalog/v0.9',
  },
})
renderer.processMessage({
  updateComponents: {
    surfaceId: 'demo',
    components: [
      {
        id: 'root',
        component: 'Text',
        text: { literalString: 'Hello A2UI' },
      },
    ],
  },
})`

const actionCode = `function handleAction(action: ActionMessage) {
  switch (action.name) {
    case 'submit_demo':
      submitDemo(action.context)
      break
    default:
      console.info('Unhandled A2UI action', action)
  }
}`

const websocketTransportCode = `import { createWSTransport } from '@a2ui/vue-transport/websocket'
import type { ActionMessage } from '@a2ui/vue-core'

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
}`

const sseTransportCode = `import { createSSETransport } from '@a2ui/vue-transport/sse'
import type { ActionMessage } from '@a2ui/vue-core'

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
}`

const messageCode = `[
  {
    "createSurface": {
      "surfaceId": "demo",
      "catalogId": "a2ui.org/standard-catalog/v0.9",
      "theme": {
        "primaryColor": "#6366f1",
        "agentDisplayName": "Demo Agent"
      }
    }
  },
  {
    "updateComponents": {
      "surfaceId": "demo",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": { "explicitList": ["title", "submit"] }
        },
        {
          "id": "title",
          "component": "Text",
          "text": { "literalString": "Hello A2UI" },
          "usageHint": "h2"
        },
        {
          "id": "submit",
          "component": "Button",
          "label": { "literalString": "Submit" },
          "variant": "primary",
          "action": {
            "event": {
              "name": "submit_demo",
              "context": { "source": "usage-docs" }
            }
          }
        }
      ]
    }
  }
]`

const jsonlCode = `{"createSurface":{"surfaceId":"demo","catalogId":"a2ui.org/standard-catalog/v0.9"}}
{"updateComponents":{"surfaceId":"demo","components":[{"id":"root","component":"Text","text":{"literalString":"JSONL message"}}]}}`

const docsByLocale: Record<Locale, UsageDocsCopy> = {
  zh: {
    eyebrow: '使用文档',
    title: 'A2UI Vue 使用文档',
    summary: '从安装、渲染、协议消息到本地调试，整理 demo 项目中最常用的接入方式。',
    navTitle: '文档目录',
    sections: [
      {
        id: 'install',
        title: '1. 安装依赖',
        body: [
          '在业务项目中安装 Vue 渲染器和协议类型包。当前 monorepo demo 通过 workspace 引用，外部项目按包名安装即可。',
          '如果需要直接对接 SSE 或 WebSocket 服务，再安装 @a2ui/vue-transport。',
        ],
        codeBlocks: [
          { title: '渲染器与协议类型', language: 'bash', code: installCode },
          { title: '传输适配器', language: 'bash', code: transportInstallCode },
        ],
      },
      {
        id: 'renderer',
        title: '2. 接入渲染器',
        body: [
          'A2UIRenderer 是运行时入口。业务页面只需要挂载这个组件，然后把服务端或 agent 返回的 A2UIServerMessage 按顺序送进去。',
          '推荐把 renderer 封装在一个稳定的预览容器里：组件负责渲染，业务层负责获取消息、清空旧 surface、处理交互 action。',
        ],
        bullets: [
          '用 ref 拿到 A2UIRenderer 实例。',
          '每次渲染一组新消息前先调用 reset，避免旧 surface 残留。',
          '按 createSurface、updateComponents、updateDataModel 的顺序调用 processMessage。',
          '监听 @action，把按钮、标签页、弹窗等交互事件转发给业务逻辑。',
          '如果是流式输出，可以在收到每条 message 后立即调用 processMessage。',
        ],
        codeBlocks: [
          { title: 'Vue 页面接入示例', language: 'vue', code: renderCode },
          { title: '按顺序写入 message', language: 'typescript', code: messageFlowCode },
          { title: '处理 renderer 发出的 action', language: 'typescript', code: actionCode },
        ],
      },
      {
        id: 'renderer-api',
        title: '3. Renderer API 与消息顺序',
        body: ['A2UIRenderer 暴露的方法很少，重点是让渲染入口保持确定性。页面通常只需要下面几类调用。'],
        bullets: [
          'processMessage(message)：处理单条 A2UIServerMessage，适合普通数组遍历或流式消息。',
          'processJSON(json)：处理单条 JSON 字符串，内部会 JSON.parse 后调用 processMessage。',
          'processJSONStream(chunk)：处理按换行分隔的 JSONL chunk。',
          'reset()：清空所有 surface，重新渲染完整页面前应先调用。',
          'message 顺序很重要：没有 createSurface 时，updateComponents 找不到目标 surface。',
        ],
      },
      {
        id: 'transport',
        title: '4. 使用 @a2ui/vue-transport',
        body: [
          '@a2ui/vue-transport 提供统一的 TransportAdapter 接口，用来把服务端消息送入 renderer，并把 renderer 发出的 action 回传给服务端。',
          '如果业务已经有自己的请求层，可以不使用这个包，直接调用 renderer.processMessage。需要标准 SSE 或 WebSocket 对接时再引入它。',
        ],
        bullets: [
          'WebSocket：双向通道，服务端消息通过 onMessage 进入 renderer，action 通过同一个连接发送回服务端。',
          'SSE：服务端到浏览器的单向通道，action 会通过 POST 请求回传。',
          'connect() 建议在页面挂载或会话开始时调用，disconnect() 应在页面卸载或会话结束时调用。',
          'onError() 应统一接入业务侧错误提示或重连状态展示。',
        ],
        codeBlocks: [
          { title: 'WebSocket 对接', language: 'typescript', code: websocketTransportCode },
          { title: 'SSE 对接', language: 'typescript', code: sseTransportCode },
        ],
      },
      {
        id: 'messages',
        title: '5. Surface Message 结构',
        body: ['A2UI 的 UI 输出由一组 server message 组成。最小可用结构一般包含 surface 创建消息和组件更新消息。'],
        bullets: [
          'createSurface：创建一个 surface，并设置 catalog、主题、agent 名称等信息。',
          'updateComponents：向指定 surface 写入组件树，组件之间通过 id 引用。',
          'updateDataModel：写入数据模型，用于 TextField、CheckBox、Slider 等绑定控件。',
          'deleteSurface：删除指定 surface。',
        ],
        codeBlocks: [{ title: '最小 message 数组', language: 'json', code: messageCode }],
      },
      {
        id: 'debug',
        title: '6. 使用 JSON 渲染页调试',
        body: [
          'JSON 渲染页适合快速验证 agent 输出。可以粘贴完整 message 数组、单条 message，或按行分隔的 JSONL。',
          '渲染失败时页面会展示解析错误；渲染成功后可以在预览区交互，并在动作流中查看 Button、Tabs、Modal 等组件发出的 action。',
        ],
        codeBlocks: [{ title: 'JSONL 输入示例', language: 'json', code: jsonlCode }],
      },
      {
        id: 'authoring',
        title: '7. 编写组件配置的建议',
        body: ['组件配置应尽量保持可读、可复用，并让数据绑定路径稳定。'],
        bullets: [
          '根组件建议使用 Row、Column、Card 等容器组件组织布局。',
          '显式子组件使用 children.explicitList，列表模板使用 children.template。',
          '交互组件统一配置 action.event.name 和 context，便于业务侧处理。',
          '表单类组件使用 value.path 绑定 data model，不要把用户输入写死在组件 props 中。',
          '需要分隔内容时使用 Divider，并放在 Row 或 Column 的 children 中。',
        ],
      },
      {
        id: 'demo',
        title: '8. Demo 项目页面说明',
        body: ['当前 demo 提供四个工作区，分别覆盖基础组件、组合组件、JSON 调试和本文档。'],
        bullets: [
          '基础目录：查看每个基础组件的预览、props 和最小 JSON。',
          '组合组件：查看由多个基础组件组合出的真实业务片段，并检查完整配置。',
          'JSON 渲染：粘贴协议 JSON 并查看实时渲染结果。',
          '使用文档：快速确认项目接入方式和协议编写规则。',
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Usage Docs',
    title: 'A2UI Vue Usage Docs',
    summary: 'A practical guide for installation, rendering, protocol messages, and local debugging in the demo project.',
    navTitle: 'Contents',
    sections: [
      {
        id: 'install',
        title: '1. Install Packages',
        body: [
          'Install the Vue renderer and protocol type package in your application. This monorepo demo uses workspace packages; external apps can install by package name.',
          'Install @a2ui/vue-transport as well when you want standard SSE or WebSocket integration.',
        ],
        codeBlocks: [
          { title: 'Renderer and protocol types', language: 'bash', code: installCode },
          { title: 'Transport adapters', language: 'bash', code: transportInstallCode },
        ],
      },
      {
        id: 'renderer',
        title: '2. Mount The Renderer',
        body: [
          'A2UIRenderer is the runtime entry point. Mount the component, then feed A2UIServerMessage objects returned by your server or agent in order.',
          'Keep the renderer in a stable preview container. The component renders UI, while your page fetches messages, clears old surfaces, and handles emitted actions.',
        ],
        bullets: [
          'Use a ref to access the A2UIRenderer instance.',
          'Call reset before rendering a new full message set so old surfaces do not remain.',
          'Call processMessage in createSurface, updateComponents, updateDataModel order.',
          'Listen to @action and forward button, tab, modal, and form events to business logic.',
          'For streaming output, call processMessage as each message arrives.',
        ],
        codeBlocks: [
          { title: 'Vue page integration', language: 'vue', code: renderCode },
          { title: 'Write messages in order', language: 'typescript', code: messageFlowCode },
          { title: 'Handle emitted actions', language: 'typescript', code: actionCode },
        ],
      },
      {
        id: 'renderer-api',
        title: '3. Renderer API And Message Order',
        body: ['A2UIRenderer exposes a small API. The important part is keeping the render entry deterministic. Most pages only need the following calls.'],
        bullets: [
          'processMessage(message): handles one A2UIServerMessage, useful for arrays and streaming output.',
          'processJSON(json): handles one JSON string by parsing it and passing the message to processMessage.',
          'processJSONStream(chunk): handles newline-delimited JSONL chunks.',
          'reset(): clears every surface and should be called before rendering a complete new page.',
          'Message order matters: updateComponents cannot target a surface that has not been created.',
        ],
      },
      {
        id: 'transport',
        title: '4. Use @a2ui/vue-transport',
        body: [
          '@a2ui/vue-transport provides a shared TransportAdapter interface for sending server messages into the renderer and forwarding emitted actions back to the server.',
          'If your application already has its own request layer, you can skip this package and call renderer.processMessage directly. Use it when you want standard SSE or WebSocket adapters.',
        ],
        bullets: [
          'WebSocket: bidirectional transport. Server messages enter the renderer through onMessage, and actions are sent back over the same connection.',
          'SSE: one-way server-to-browser transport. Actions are posted back with a separate HTTP request.',
          'Call connect() when the page mounts or a session starts, and disconnect() when the page unmounts or the session ends.',
          'Connect onError() to your application error UI or reconnect state.',
        ],
        codeBlocks: [
          { title: 'WebSocket integration', language: 'typescript', code: websocketTransportCode },
          { title: 'SSE integration', language: 'typescript', code: sseTransportCode },
        ],
      },
      {
        id: 'messages',
        title: '5. Surface Message Shape',
        body: ['A2UI output is represented as server messages. A minimal usable payload usually includes a surface creation message and a component update message.'],
        bullets: [
          'createSurface: creates a surface and configures catalog, theme, and agent metadata.',
          'updateComponents: writes the component tree into a surface; components reference each other by id.',
          'updateDataModel: writes bound data for TextField, CheckBox, Slider, and other controlled components.',
          'deleteSurface: removes a surface by id.',
        ],
        codeBlocks: [{ title: 'Minimal message array', language: 'json', code: messageCode }],
      },
      {
        id: 'debug',
        title: '6. Debug With JSON Renderer',
        body: [
          'The JSON Renderer page is designed for quick agent-output validation. Paste a full message array, a single message, or newline-delimited JSONL.',
          'Parse errors are shown inline. After a successful render, interact with the preview and inspect emitted actions from Button, Tabs, Modal, and other components.',
        ],
        codeBlocks: [{ title: 'JSONL input example', language: 'json', code: jsonlCode }],
      },
      {
        id: 'authoring',
        title: '7. Component Authoring Tips',
        body: ['Keep component config readable, reusable, and stable across data model changes.'],
        bullets: [
          'Use Row, Column, Card, and other container components to organize the root layout.',
          'Use children.explicitList for explicit children, and children.template for list templates.',
          'Configure action.event.name and context consistently on interactive components.',
          'Bind form components through value.path instead of hardcoding user input in props.',
          'Use Divider inside Row or Column children when content needs visual separation.',
        ],
      },
      {
        id: 'demo',
        title: '8. Demo Workspace Guide',
        body: ['This demo exposes four workspaces covering primitive components, composed examples, JSON debugging, and this documentation.'],
        bullets: [
          'Basic Catalog: inspect each primitive component, props, preview, and minimal JSON.',
          'Composition Components: inspect real UI fragments assembled from primitives and review full config.',
          'JSON Renderer: paste protocol JSON and preview the rendered output.',
          'Usage Docs: review integration steps and protocol authoring rules.',
        ],
      },
    ],
  },
}

const docs = computed<UsageDocsCopy>(() => docsByLocale[props.locale])
const copyLabel = computed(() => (props.locale === 'zh' ? '复制' : 'Copy'))
const copiedLabel = computed(() => (props.locale === 'zh' ? '已复制' : 'Copied'))
const highlightedSections = computed<HighlightedDocSection[]>(() =>
  docs.value.sections.map((section) => ({
    ...section,
    codeBlocks: section.codeBlocks?.map((block) => ({
      ...block,
      html: highlightCode(block),
    })),
  })),
)

function highlightCode(block: CodeBlock) {
  return hljs.highlight(block.code, {
    language: block.language,
    ignoreIllegals: true,
  }).value
}

function getCodeBlockKey(section: HighlightedDocSection, block: HighlightedCodeBlock) {
  return `${section.id}-${block.title}`
}

async function copyCode(code: string, key: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      copyCodeWithFallback(code)
    }
  } catch {
    copyCodeWithFallback(code)
  }

  copiedCodeKey.value = key
  window.setTimeout(() => {
    if (copiedCodeKey.value === key) {
      copiedCodeKey.value = null
    }
  }, 1600)
}

function copyCodeWithFallback(code: string) {
  const textArea = document.createElement('textarea')
  textArea.value = code
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}
</script>

<template>
  <div class="docs-page">
    <header class="docs-header">
      <div>
        <p class="eyebrow">{{ docs.eyebrow }}</p>
        <h1>{{ docs.title }}</h1>
        <p class="docs-summary">{{ docs.summary }}</p>
      </div>
    </header>

    <section class="docs-layout">
      <aside class="docs-nav panel">
        <p class="nav-title">{{ docs.navTitle }}</p>
        <a
          v-for="section in docs.sections"
          :key="section.id"
          class="nav-link"
          :href="`#${section.id}`"
        >
          {{ section.title }}
        </a>
      </aside>

      <main class="docs-content">
        <section
          v-for="section in highlightedSections"
          :id="section.id"
          :key="section.id"
          class="doc-section panel"
        >
          <div class="section-copy">
            <h2>{{ section.title }}</h2>
            <p v-for="paragraph in section.body" :key="paragraph">
              {{ paragraph }}
            </p>

            <ul v-if="section.bullets?.length" class="doc-list">
              <li v-for="bullet in section.bullets" :key="bullet">
                {{ bullet }}
              </li>
            </ul>
          </div>

          <div v-if="section.codeBlocks?.length" class="code-stack">
            <figure
              v-for="block in section.codeBlocks"
              :key="`${section.id}-${block.title}`"
              class="code-frame"
            >
              <figcaption class="code-caption">
                <span class="code-title">{{ block.title }}</span>
                <span class="code-tools">
                  <span class="code-language">{{ block.language }}</span>
                  <button
                    class="copy-button"
                    type="button"
                    @click="copyCode(block.code, getCodeBlockKey(section, block))"
                  >
                    {{ copiedCodeKey === getCodeBlockKey(section, block) ? copiedLabel : copyLabel }}
                  </button>
                </span>
              </figcaption>
              <pre class="code-block"><code :class="`language-${block.language}`" v-html="block.html"></code></pre>
            </figure>
          </div>
        </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
.docs-page {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.docs-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.14);
}

.eyebrow {
  margin: 0 0 8px;
  color: #7a5cff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.docs-header h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
  line-height: 1.02;
}

.docs-summary {
  max-width: 58rem;
  margin: 10px 0 0;
  color: #6d667f;
  font-size: 1.02rem;
  line-height: 1.55;
}

.docs-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.panel {
  overflow: hidden;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(57, 45, 101, 0.06);
}

.docs-nav {
  position: sticky;
  top: 16px;
  display: grid;
  gap: 6px;
  padding: 14px;
}

.nav-title {
  margin: 0 0 8px;
  color: #8d859f;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.nav-link {
  display: block;
  padding: 10px 12px;
  border-radius: 12px;
  color: #5d586d;
  font-size: 0.92rem;
  line-height: 1.35;
  text-decoration: none;
}

.nav-link:hover {
  color: #1f1b2d;
  background: #f4f1fb;
}

.docs-content {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.doc-section {
  scroll-margin-top: 16px;
}

.section-copy {
  padding: 20px 22px;
}

.section-copy h2 {
  margin: 0 0 12px;
  color: #1e1930;
  font-size: 1.24rem;
  line-height: 1.25;
}

.section-copy p {
  margin: 0;
  color: #6d667f;
  font-size: 0.96rem;
  line-height: 1.7;
}

.section-copy p + p {
  margin-top: 8px;
}

.doc-list {
  margin: 14px 0 0;
  padding-left: 1.2rem;
  color: #4a435b;
  line-height: 1.65;
}

.doc-list li + li {
  margin-top: 6px;
}

.code-stack {
  display: grid;
  gap: 10px;
  padding: 0 18px 18px;
}

.code-frame {
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(120, 112, 150, 0.14);
  border-radius: 14px;
  background: #ffffff;
}

.code-caption {
  min-height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(120, 112, 150, 0.12);
  background: #f8f6fd;
  color: #5c566d;
  font-size: 0.78rem;
  font-weight: 700;
}

.code-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-tools {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.code-language {
  color: #8d859f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.copy-button {
  min-height: 1.7rem;
  padding: 0 9px;
  border: 1px solid rgba(120, 112, 150, 0.18);
  border-radius: 8px;
  background: #ffffff;
  color: #5c566d;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.copy-button:hover {
  border-color: rgba(122, 92, 255, 0.34);
  color: #2f2840;
  box-shadow: 0 6px 14px rgba(74, 58, 120, 0.08);
}

.code-block {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(252, 251, 255, 0.98) 0%, rgba(248, 246, 254, 0.98) 100%);
  color: #2f2840;
  font: 0.86rem/1.65 "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
}

.code-block code {
  display: block;
  min-width: max-content;
  padding: 16px 18px;
  white-space: pre;
  background: transparent;
}

.code-block :deep(.hljs-keyword),
.code-block :deep(.hljs-selector-tag),
.code-block :deep(.hljs-built_in) {
  color: #6d5efc;
}

.code-block :deep(.hljs-string),
.code-block :deep(.hljs-attr),
.code-block :deep(.hljs-name) {
  color: #047857;
}

.code-block :deep(.hljs-title),
.code-block :deep(.hljs-function) {
  color: #b45309;
}

.code-block :deep(.hljs-literal),
.code-block :deep(.hljs-number) {
  color: #be123c;
}

@media (max-width: 1020px) {
  .docs-layout {
    grid-template-columns: 1fr;
  }

  .docs-nav {
    position: static;
  }
}

@media (max-width: 700px) {
  .section-copy {
    padding: 18px;
  }
}
</style>
