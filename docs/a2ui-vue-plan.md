# A2UI Vue 3 组件库方案

## 1. 项目概述

### 1.1 背景

A2UI (Agent-to-UI) 是 Google 发起的开放协议（当前 v0.9），定义了 AI Agent 如何通过声明式 JSON 动态生成和控制用户界面。协议采用 **Adjacency List 扁平模型**，支持流式渐进渲染，适用于 LLM 实时输出 UI 场景。

当前官方仅有 Lit（Web Components）和 Flutter 渲染器，社区有 React 实现（`@zhama/a2ui-react`），但 **Vue 3 生态尚无官方支持**。

### 1.2 目标

构建基于 A2UI v0.9 协议的 Vue 3 渲染器 + 组件库，提供：

- 完整的 A2UI v0.9 协议解析与渲染
- 18 个基础组件的 Vue 3 实现
- 可插拔的传输层适配器（SSE / WebSocket / A2A）
- 客户端函数引擎（校验 + 格式化 + 逻辑）
- 自定义 Catalog 扩展机制

### 1.3 包名与许可证

- 包名：`@a2ui/vue`
- 许可证：Apache 2.0（与 A2UI 协议一致）

---

## 2. 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 + Composition API + `<script setup>` | UI 框架 |
| TypeScript (strict) | 类型安全 |
| Vite (库模式) | 构建工具 |
| Vitest | 单元测试 + 组件测试 |
| pnpm (workspace) | 包管理 + Monorepo |
| Turbo | Monorepo 任务编排 |

---

## 3. 架构设计

### 3.1 整体分层

```
┌─────────────────────────────────────────────────────┐
│                 Transport Layer                     │  SSE / WebSocket / A2A / AG-UI
├─────────────────────────────────────────────────────┤
│              Protocol Parser Layer                  │  JSON Schema 校验 + 消息分发
├─────────────────────────────────────────────────────┤
│            A2UI Renderer (Vue Core)                 │  Surface 管理 + 组件树重建 + 数据绑定
├─────────────────────────────────────────────────────┤
│            Component Catalog Layer                  │  18 个基础组件 + 自定义扩展
├─────────────────────────────────────────────────────┤
│         Functions & Validation Layer                │  客户端函数 + 校验引擎
└─────────────────────────────────────────────────────┘
```

### 3.2 消息处理流程

```
Agent JSON
  → Transport Adapter (SSE/WS)
  → Protocol Parser (Schema 校验)
  → 消息分发:
      createSurface    → 创建 Surface 实例 + 初始化 DataModel
      updateComponents → 更新 ComponentRegistry (Map<id, ComponentDef>)
      updateDataModel  → 更新响应式 DataModel (Proxy + JSON Pointer)
      deleteSurface    → 销毁 Surface 实例
  → ComponentResolver 递归解析 root
  → Vue 组件树渲染
```

### 3.3 核心数据结构

#### Adjacency List 模型

A2UI 使用扁平邻接表而非嵌套树，组件通过 ID 引用建立父子关系：

```typescript
// 协议消息中的组件定义（扁平列表）
[
  { id: "root", component: "Column", children: { explicitList: ["title", "form", "btn"] } },
  { id: "title", component: "Text", text: { literalString: "注册" } },
  { id: "form", component: "TextField", value: { path: "/user/name" } },
  { id: "btn", component: "Button", label: { literalString: "提交" } }
]

// 渲染器内部维护的 Map
componentRegistry = Map<ComponentId, ComponentDef>

// 渲染时从 root 递归解析 children 引用
```

#### Dynamic* 数据绑定

所有可绑定属性支持三种形式：

```typescript
type DynamicString =
  | { literalString: string }           // 静态字面量
  | { path: string }                     // JSON Pointer 路径（绝对 /foo 或相对 foo）
  | { functionCall: FunctionCall }       // 客户端函数调用

// 类似定义 DynamicNumber, DynamicBoolean, DynamicStringList
```

#### 响应式 DataModel

```typescript
// 使用 Vue 3 reactive + Proxy 实现
const dataModel = reactive<Record<string, any>>({})

// JSON Pointer 解析
function resolvePath(path: string, data: any, scope?: any): any {
  // 支持绝对路径 /user/name → data.user.name
  // 支持相对路径 name → scope.name（在 template 渲染中）
}
```

---

## 4. 包结构（Monorepo）

```
a2ui-vue/
├── packages/
│   ├── core/                    # @a2ui/vue-core
│   │   └── src/
│   │       ├── parser.ts        # JSON 消息解析 & Schema 校验
│   │       ├── surface.ts       # Surface 生命周期管理
│   │       ├── component-registry.ts  # 组件注册表
│   │       ├── data-model.ts    # 响应式数据模型 + JSON Pointer
│   │       ├── functions/       # 客户端函数引擎
│   │       │   ├── index.ts     # 函数注册表
│   │       │   ├── validation.ts # required, regex, email, length, numeric
│   │       │   ├── format.ts    # formatString, formatNumber, formatCurrency, formatDate
│   │       │   ├── logic.ts     # and, or, not
│   │       │   └── pluralize.ts # pluralize
│   │       └── types/           # TypeScript 类型
│   │           ├── protocol.ts  # 协议消息类型
│   │           ├── components.ts # 组件属性类型
│   │           ├── catalog.ts   # Catalog 定义
│   │           └── data-model.ts # 数据模型类型
│   │
│   ├── renderer/                # @a2ui/vue
│   │   └── src/
│   │       ├── index.ts         # 导出入口
│   │       ├── A2UIRenderer.vue # 顶层渲染器组件
│   │       ├── SurfaceRenderer.vue  # 单 Surface 渲染
│   │       ├── ComponentResolver.vue # 动态组件解析
│   │       ├── composables/
│   │       │   ├── useA2UI.ts   # 主 composable
│   │       │   ├── useSurface.ts # Surface 上下文
│   │       │   └── useDataModel.ts # 数据模型访问
│   │       ├── components/
│   │       │   ├── layout/      # Row.vue, Column.vue, List.vue
│   │       │   ├── display/     # Text.vue, Image.vue, Icon.vue, Divider.vue, Video.vue, AudioPlayer.vue
│   │       │   ├── input/       # TextField.vue, CheckBox.vue, ChoicePicker.vue, Slider.vue, DateTimeInput.vue
│   │       │   ├── container/   # Card.vue, Tabs.vue, Modal.vue
│   │       │   └── interactive/ # Button.vue
│   │       └── theme/
│   │           ├── tokens.ts    # 设计令牌
│   │           └── provide.ts   # 主题注入
│   │
│   └── transport/               # @a2ui/vue-transport
│       └── src/
│           ├── index.ts         # 传输层统一接口
│           ├── sse.ts           # SSE 适配器
│           └── websocket.ts     # WebSocket 适配器
│
├── examples/
│   └── basic/                   # 基础 demo 应用
│
├── docs/                        # 文档
│   ├── a2ui-vue-plan.md         # 本方案
│   ├── protocol-reference.md    # A2UI v0.9 协议参考
│   ├── api-reference.md         # API 文档
│   └── migration.md             # 迁移指南
│
├── specification/               # A2UI v0.9 JSON Schema（git submodule）
│
├── package.json                 # 根 package.json
├── pnpm-workspace.yaml          # pnpm 工作区配置
├── turbo.json                   # Turbo 任务配置
├── tsconfig.json                # 根 TypeScript 配置
├── vitest.config.ts             # 测试配置
└── .gitignore
```

---

## 5. 核心模块详细设计

### 5.1 Protocol Parser (`core/parser.ts`)

负责解析 A2UI JSON 消息流，校验 Schema 合规性。

```typescript
interface A2UIMessage {
  createSurface?: CreateSurfaceMessage
  updateComponents?: UpdateComponentsMessage
  updateDataModel?: UpdateDataModelMessage
  deleteSurface?: DeleteSurfaceMessage
}

// 解析单条 JSON 消息
function parseMessage(json: string): A2UIMessage

// 校验消息是否符合 v0.9 Schema
function validateMessage(message: A2UIMessage): ValidationResult
```

### 5.2 Surface Manager (`core/surface.ts`)

管理 Surface 生命周期，每个 Surface 对应一个独立的 UI 渲染上下文。

```typescript
interface SurfaceInstance {
  id: string
  catalogId: string
  theme?: Theme
  componentRegistry: Map<string, ComponentDef>
  dataModel: Reactive<DataModel>
  sendBackDataModel: boolean
}

class SurfaceManager {
  createSurface(msg: CreateSurfaceMessage): SurfaceInstance
  deleteSurface(surfaceId: string): void
  getSurface(surfaceId: string): SurfaceInstance | undefined
}
```

### 5.3 Component Registry (`core/component-registry.ts`)

维护 Adjacency List 组件注册表，支持增量更新。

```typescript
class ComponentRegistry {
  private components = new Map<string, ComponentDef>()

  // 增量更新：合并新组件定义
  updateComponents(components: ComponentDef[]): void

  // 获取组件定义
  getComponent(id: string): ComponentDef | undefined

  // 解析 children 引用为实际组件列表
  resolveChildren(id: string): ComponentDef[]

  // 解析模板渲染（template + data binding）
  resolveTemplate(template: TemplateChild): ComponentDef[]
}
```

### 5.4 Data Model (`core/data-model.ts`)

响应式数据模型，支持 JSON Pointer 访问和双向绑定。

```typescript
// JSON Pointer 解析（RFC 6901）
function getByPointer(obj: any, pointer: string): any
function setByPointer(obj: any, pointer: string, value: any): void

// Dynamic* 值解析
function resolveDynamic(
  dynamic: DynamicString | DynamicNumber | DynamicBoolean,
  dataModel: DataModel,
  scope?: Scope
): any

// 作用域管理（用于 template 渲染中的相对路径）
interface Scope {
  currentItem: any   // 当前迭代项
  index: number      // 当前索引
  parent?: Scope     // 父作用域（嵌套场景）
}
```

### 5.5 Client Functions (`core/functions/`)

内置 A2UI v0.9 规范定义的客户端函数。

#### 内置函数清单

| 函数 | 类型 | 说明 |
|------|------|------|
| `required` | validation | 值不为 null/undefined/空字符串 |
| `regex` | validation | 正则表达式匹配 |
| `length` | validation | 字符串长度约束 |
| `numeric` | validation | 数值范围约束 |
| `email` | validation | 邮箱格式校验 |
| `formatString` | format | 字符串插值，支持 `${path}` 语法 |
| `formatNumber` | format | 数字格式化（分组 + 精度） |
| `formatCurrency` | format | 货币格式化 |
| `formatDate` | format | 日期格式化 |
| `pluralize` | format | 复数形式选择 |
| `openUrl` | action | 在浏览器中打开 URL |
| `and` | logic | 逻辑与 |
| `or` | logic | 逻辑或 |
| `not` | logic | 逻辑非 |

### 5.6 Vue Renderer (`renderer/`)

#### A2UIRenderer.vue — 顶层渲染器

```vue
<script setup lang="ts">
import { provide, toRef } from 'vue'
import type { TransportAdapter, Theme } from '@a2ui/vue-core'
import { SurfaceRenderer } from './SurfaceRenderer.vue'

const props = defineProps<{
  transport: TransportAdapter
  theme?: Theme
}>()

// 接收传输层消息，分发到 Surface 管理
const surfaceManager = useSurfaceManager(props.transport)
</script>

<template>
  <div class="a2ui-renderer">
    <SurfaceRenderer
      v-for="[id, surface] in surfaceManager.surfaces"
      :key="id"
      :surface="surface"
    />
  </div>
</template>
```

#### ComponentResolver.vue — 动态组件解析

```vue
<script setup lang="ts">
import { computed, inject } from 'vue'

const props = defineProps<{ componentId: string }>()
const registry = inject('componentRegistry')

const component = computed(() => registry.getComponent(props.componentId))
const children = computed(() => registry.resolveChildren(props.componentId))
</script>

<template>
  <component :is="resolveComponentType(component.component)" v-bind="resolveProps(component)">
    <template v-if="children">
      <ComponentResolver
        v-for="child in children"
        :key="child.id"
        :component-id="child.id"
      />
    </template>
  </component>
</template>
```

### 5.7 18 个基础组件

遵循 A2UI v0.9 Basic Catalog 规范实现：

| 组件 | 类型 | 核心属性 |
|------|------|---------|
| `Text` | display | text (DynamicString), usageHint ("h1"~"h6"/"body"/"caption") |
| `Image` | display | url (DynamicString), alt (DynamicString) |
| `Icon` | display | icon (DynamicString) — 预定义图标名 |
| `Video` | display | url (DynamicString) |
| `AudioPlayer` | display | url (DynamicString) |
| `Divider` | display | — |
| `Row` | layout | alignment, children |
| `Column` | layout | alignment, children |
| `List` | layout | children (支持 template 渲染) |
| `Card` | container | child (单子组件) |
| `Tabs` | container | titles (string[]), children (TabPanel[]) |
| `Modal` | container | trigger (Button), child |
| `Button` | interactive | label (DynamicString), action, variant ("primary"/"borderless"), checks[] |
| `TextField` | input | label, value (双向绑定), placeholder, checks[] |
| `CheckBox` | input | label, value (双向绑定) |
| `ChoicePicker` | input | options, value (双向绑定), multi (boolean) |
| `Slider` | input | min, max, step, value (双向绑定) |
| `DateTimeInput` | input | mode ("date"/"time"/"datetime"), value (双向绑定) |

---

## 6. 传输层适配器

### 统一接口

```typescript
interface TransportAdapter {
  connect(): void
  disconnect(): void
  onMessage(callback: (message: A2UIMessage) => void): void
  sendAction(action: ActionMessage): void
  onError(callback: (error: Error) => void): void
}
```

### SSE 适配器

```typescript
function createSSETransport(config: { url: string; headers?: Record<string, string> }): TransportAdapter
```

### WebSocket 适配器

```typescript
function createWSTransport(config: { url: string; protocols?: string[] }): TransportAdapter
```

---

## 7. 主题系统

### 主题令牌

```typescript
interface Theme {
  primaryColor?: string       // 品牌主色（Hex）
  iconUrl?: string            // Agent 图标 URL
  agentDisplayName?: string   // Agent 显示名称
}
```

### 样式隔离

- 所有组件样式使用 `a2-` 前缀的 CSS 类名
- 使用 CSS 变量实现主题切换
- 支持 `light-dark()` 自动暗色模式
- 样式与宿主应用完全隔离

### 自定义 Catalog

```typescript
import { registerComponent, registerFunction } from '@a2ui/vue'

// 注册自定义组件
registerComponent('MyChart', MyChartComponent)

// 注册自定义函数
registerFunction('toUpper', (value: string) => value.toUpperCase())
```

---

## 8. 使用示例

### 基础用法

```vue
<script setup>
import { A2UIRenderer } from '@a2ui/vue'
import { createSSETransport } from '@a2ui/vue-transport/sse'

const transport = createSSETransport({ url: '/api/agent/stream' })
</script>

<template>
  <A2UIRenderer :transport="transport" />
</template>
```

### Agent 输出的 JSON 流示例

```jsonl
{"createSurface":{"surfaceId":"form-1","catalogId":"a2ui.org/standard-catalog/v0.9"}}
{"updateComponents":{"surfaceId":"form-1","components":[
  {"id":"root","component":"Column","children":{"explicitList":["title","name-field","email-field","submit-btn"]}},
  {"id":"title","component":"Text","text":{"literalString":"用户注册"},"usageHint":"h2"},
  {"id":"name-field","component":"TextField","label":{"literalString":"姓名"},"value":{"path":"/form/name"},"checks":[{"call":"required","message":"姓名不能为空"}]},
  {"id":"email-field","component":"TextField","label":{"literalString":"邮箱"},"value":{"path":"/form/email"},"checks":[{"call":"email","message":"请输入有效邮箱"}]},
  {"id":"submit-btn","component":"Button","label":{"literalString":"提交"},"action":{"event":{"name":"submit","context":{"name":{"path":"/form/name"},"email":{"path":"/form/email"}}}},"checks":[{"call":"required","args":{"value":{"path":"/form/name"}}},{"call":"required","args":{"value":{"path":"/form/email"}}}]}
]}}
{"updateDataModel":{"surfaceId":"form-1","value":{"form":{"name":"","email":""}}}}
```

### 自定义组件扩展

```vue
<script setup>
import { A2UIRenderer, registerComponent } from '@a2ui/vue'
import MyRating from './MyRating.vue'

// 注册自定义组件到 Catalog
registerComponent('Rating', MyRating)
</script>
```

---

## 8.1 组件完善计划

### 目标

当前渲染器已经具备基础协议渲染能力，但组件层仍存在三类明显问题：

- 容器层级和布局默认值不统一，导致组件容易缩成局部小块，视觉上不稳定。
- 输入与交互组件缺乏统一的尺寸、状态和反馈语言，与参考工作台风格存在差距。
- 示例页虽然已经具备预览与数据面板结构，但距离 `a2ui-composer` 的工作台质感仍有明显差距。

本轮目标不是简单修补单个样式，而是把组件库整理成一套更稳定的工作台式视觉系统，使其更接近 `https://a2ui-composer.ag-ui.com/custom-catalog` 的布局、密度和信息组织方式。

### 执行原则

- 先统一基础容器，再细化输入组件，最后补展示组件和示例页。
- 优先修改共享组件与 design tokens，避免在示例页堆叠一次性样式。
- 所有视觉调整必须兼顾桌面与窄屏，不允许只在单一 viewport 下成立。
- 组件修改完成后必须通过本地构建或类型检查，并在浏览器中回归验证。

### 分阶段计划

#### 第一阶段：基础布局组件统一

目标：先把承载层做稳，避免后续输入组件和展示组件继续建立在不稳定容器之上。

涉及文件：

- `packages/renderer/src/components/layout/Row.vue`
- `packages/renderer/src/components/layout/Column.vue`
- `packages/renderer/src/components/container/Card.vue`
- `packages/renderer/src/components/container/Tabs.vue`
- `packages/renderer/src/SurfaceRenderer.vue`

计划内容：

- 统一卡片、标签页和 surface 容器的圆角、边框、阴影和背景层次。
- 统一 `width: 100%`、`min-width: 0`、滚动容器和内容留白规则。
- 调整 `Row` / `Column` 的默认伸展行为，减少内容被挤压的情况。
- 优化 tabs header、active 态和内容区间距，使其更接近 composer 的 panel 语言。

#### 第二阶段：表单与交互组件精修

目标：让输入组件具备一致的尺寸、边框语言和交互反馈。

涉及文件：

- `packages/renderer/src/components/input/TextField.vue`
- `packages/renderer/src/components/input/ChoicePicker.vue`
- `packages/renderer/src/components/input/CheckBox.vue`
- `packages/renderer/src/components/input/Slider.vue`
- `packages/renderer/src/components/input/DateTimeInput.vue`
- `packages/renderer/src/components/interactive/Button.vue`

计划内容：

- 统一输入框高度、内边距、边框、focus ring 和 disabled / error 状态。
- 优化 `ChoicePicker` 的 chip 形态、选中态和 hover 态。
- 统一主按钮、默认按钮、无边框按钮的视觉层级。
- 调整 `Slider`、`CheckBox` 等小控件与文本体系的对齐关系。

#### 第三阶段：展示组件信息层次优化

目标：让展示组件不再只是“能显示”，而是具备稳定的阅读层次。

涉及文件：

- `packages/renderer/src/components/display/Text.vue`
- `packages/renderer/src/components/display/Divider.vue`
- `packages/renderer/src/components/display/Icon.vue`
- `packages/renderer/src/components/display/Image.vue`
- `packages/renderer/src/components/display/Video.vue`
- `packages/renderer/src/components/display/AudioPlayer.vue`

计划内容：

- 统一标题、正文、辅助文案的字级、字重和颜色体系。
- 调整 `Divider` 的弱分隔感，避免过度抢视觉。
- 为媒体类组件补齐容器感、占位感和空态策略。

#### 第四阶段：示例页工作台继续贴近参考站

目标：把 demo 页从“参考风格”推进到“更像 composer 的本地工作台”。

涉及文件：

- `examples/basic/src/App.vue`

计划内容：

- 细化左侧导航层级、辅助信息和当前态。
- 让右侧 JSON 面板更接近编辑器式信息结构。
- 优化中间预览区的框架感、tab 密度和 panel 头部。
- 将 action stream 进一步整理成更像控制台的区域。

#### 第五阶段：主题令牌与一致性收口

目标：把前面分散在组件内的样式决定，收口成更稳定的 tokens。

涉及文件：

- `packages/renderer/src/theme/design-tokens.ts`
- `packages/renderer/src/theme/tokens.ts`
- `packages/renderer/src/theme/provide.ts`

计划内容：

- 抽出 spacing、radius、border、shadow、focus 等核心视觉 token。
- 统一组件状态色和表层背景体系。
- 减少组件内硬编码颜色，提升后续换肤与维护性。

### 推荐执行顺序

建议按以下顺序推进：

1. 基础布局组件
2. 表单与交互组件
3. 展示组件
4. 示例页工作台
5. 主题令牌收口

### 当前优先级

当前最先应该完成的组件是：

- `Card`
- `Tabs`
- `TextField`
- `Button`
- `ChoicePicker`
- `Text`

这六个组件决定了大部分 demo 页的第一视觉质量，优先级最高。

---

## 9. 开发计划

| 阶段 | 内容 | 估时 |
|------|------|------|
| P0 | 项目脚手架 + Monorepo 配置 + TypeScript 类型定义 | 2d |
| P1 | Core: Protocol Parser + Surface Manager + DataModel | 4d |
| P2 | Core: Client Functions 引擎（validation + format + logic） | 2d |
| P3 | Renderer: A2UIRenderer + ComponentResolver + composables | 3d |
| P4 | Components: 18 个基础组件实现 | 5d |
| P5 | Transport: SSE + WebSocket 适配器 | 2d |
| P6 | 主题系统 + 自定义 Catalog 扩展 API | 2d |
| P7 | 测试（单元 + 组件 + 集成） | 3d |
| P8 | 文档 + 示例 + 发布 | 2d |

**总计约 25 个工作日。**

---

## 10. 验证方式

1. **Schema 校验**：使用 A2UI v0.9 官方 JSON Schema 做协议合规性校验
2. **单元测试**：每个组件、函数、数据绑定路径都有 Vitest 测试用例
3. **组件测试**：使用 `@vue/test-utils` 渲染组件并验证输出
4. **集成测试**：搭建 SSE mock server，模拟 Agent 输出 A2UI JSON，验证端到端渲染
5. **对比验证**：与官方 Lit 渲染器输出对比，确保一致性
6. **Agent 联调**：使用 Claude / Gemini 等 LLM 直接输出 A2UI JSON，验证真实场景

---

## 11. 与现有实现对比

| 特性 | 本项目 (Vue 3) | zhama-ai/a2ui-react | actioncard/a2ui-elixir |
|------|---------------|--------------------|-----------------------|
| 框架 | Vue 3 | React | Phoenix LiveView |
| 协议版本 | v0.9 | v0.9 | v0.9 |
| 渲染方式 | 客户端 Vue 组件 | 客户端 React 组件 | 服务端 HTML (WebSocket) |
| 数据绑定 | Vue reactive + Proxy | React state | LiveView assigns |
| 双向绑定 | Vue v-model 语义 | onChange 回调 | phx-change 事件 |
| 流式渲染 | 支持 (Adjacency List) | 支持 | 支持 (WebSocket push) |
| 自定义扩展 | registerComponent API | createTheme API | Elixir 函数组件 |
| 包大小目标 | < 30KB (gzipped) | ~40KB | N/A (服务端) |

---

## 12. 关键设计决策

| 决策 | 理由 |
|------|------|
| Vue 3 Composition API + `<script setup>` | Vue 社区标准，类型推导最佳，tree-shaking 友好 |
| Monorepo (pnpm + turbo) | core / renderer / transport 可独立复用，便于社区贡献 |
| 响应式 DataModel (Proxy) | 原生集成 Vue 响应式系统，双向绑定零成本 |
| Adjacency List 模型（Map 存储） | 严格遵循 A2UI 规范，支持流式渐进渲染 |
| CSS 类名 `a2-` 前缀 | 样式隔离，避免与宿主应用冲突 |
| 组件通过 ID 引用而非嵌套 | 支持增量 updateComponents，组件可乱序到达 |
| 客户端函数声明式定义 | 遵循 A2UI 规范，避免执行任意代码 |
