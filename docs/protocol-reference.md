# A2UI v0.9 Protocol Reference

## Overview

A2UI (Agent-to-UI) is a JSON-based streaming protocol for dynamically rendering user interfaces. Agents produce declarative JSON describing UI intent, and clients render it using native components.

## Message Types

### Server → Client

#### `createSurface`

Initializes a new UI rendering surface.

```json
{
  "createSurface": {
    "surfaceId": "form-1",
    "catalogId": "a2ui.org/standard-catalog/v0.9",
    "theme": {
      "primaryColor": "#3b82f6",
      "agentDisplayName": "My Agent",
      "iconUrl": "https://example.com/icon.png"
    },
    "sendDataModel": false
  }
}
```

#### `updateComponents`

Sends component definitions as a flat adjacency list.

```json
{
  "updateComponents": {
    "surfaceId": "form-1",
    "components": [
      { "id": "root", "component": "Column", "children": { "explicitList": ["title", "input"] } },
      { "id": "title", "component": "Text", "text": { "literalString": "Hello" } },
      { "id": "input", "component": "TextField", "value": { "path": "/name" } }
    ]
  }
}
```

#### `updateDataModel`

Pushes data using upsert semantics.

```json
{ "updateDataModel": { "surfaceId": "form-1", "value": { "name": "World" } } }
{ "updateDataModel": { "surfaceId": "form-1", "path": "/name", "value": "A2UI" } }
{ "updateDataModel": { "surfaceId": "form-1", "path": "/temp" } }
```

#### `deleteSurface`

Removes a surface and all associated data.

```json
{ "deleteSurface": { "surfaceId": "form-1" } }
```

### Client → Server

#### `action`

Sent when user interacts with action-bearing components.

```json
{
  "action": {
    "name": "submit_form",
    "surfaceId": "form-1",
    "sourceComponentId": "submit-btn",
    "timestamp": "2025-12-03T10:30:00Z",
    "context": { "name": { "path": "/name" } }
  }
}
```

## Data Binding (Dynamic* Types)

### Literal Values

```json
{ "literalString": "Hello" }
{ "literalNumber": 42 }
{ "literalBoolean": true }
{ "literalArray": ["a", "b", "c"] }
```

### Path Binding (JSON Pointer)

```json
{ "path": "/user/name" }
{ "path": "/items/0/title" }
```

### Function Call

```json
{ "functionCall": { "call": "formatDate", "args": { "value": { "path": "/date" }, "format": "yyyy-MM-dd" } } }
```

## Adjacency List Model

Components use a flat list with tree structure built through ID references:

```json
[
  { "id": "root", "component": "Column", "children": { "explicitList": ["a", "b"] } },
  { "id": "a", "component": "Text", "text": { "literalString": "First" } },
  { "id": "b", "component": "Text", "text": { "literalString": "Second" } }
]
```

### Template Rendering (Data-Bound Lists)

```json
{
  "children": {
    "template": {
      "componentId": "item-template",
      "dataBinding": "/items"
    }
  }
}
```

## Built-in Functions

### Validation

| Function | Args | Description |
|----------|------|-------------|
| `required` | `value` | Not null/empty |
| `regex` | `value`, `pattern` | Regex match |
| `length` | `value`, `min?`, `max?` | String length |
| `numeric` | `value`, `min?`, `max?` | Number range |
| `email` | `value` | Email format |

### Format

| Function | Args | Description |
|----------|------|-------------|
| `formatString` | `template` | String interpolation with `${path}` |
| `formatNumber` | `value`, `precision?`, `grouping?` | Number formatting |
| `formatCurrency` | `value`, `currency?`, `precision?` | Currency formatting |
| `formatDate` | `value`, `format?` | Date formatting |
| `pluralize` | `count`, `zero?`, `one?`, `other?` | Pluralization |

### Logic

| Function | Args | Description |
|----------|------|-------------|
| `and` | `values` | Logical AND |
| `or` | `values` | Logical OR |
| `not` | `value` | Logical NOT |

### Action

| Function | Args | Description |
|----------|------|-------------|
| `openUrl` | `url` | Open URL in browser |

## Components (18)

### Layout

- **Row** — Horizontal flex container
- **Column** — Vertical flex container
- **List** — Scrollable list with template support

### Display

- **Text** — Text with markdown support and usage hints (h1-h6, body, caption)
- **Image** — Image display
- **Icon** — System icon
- **Video** — Video player
- **AudioPlayer** — Audio player
- **Divider** — Horizontal/vertical line

### Container

- **Card** — Card wrapper
- **Tabs** — Tabbed interface
- **Modal** — Dialog overlay

### Interactive

- **Button** — Action button with variants (primary, borderless, default)

### Input (Two-way binding)

- **TextField** — Text input
- **CheckBox** — Checkbox
- **ChoicePicker** — Single/multi option picker
- **Slider** — Numeric slider
- **DateTimeInput** — Date/time picker (date, time, datetime modes)
