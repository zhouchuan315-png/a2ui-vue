// A2UI v0.9 Protocol Types

// ─── Dynamic* Data Binding Types ───

export interface DynamicString {
  literalString?: string
  path?: string
  functionCall?: FunctionCall
}

export interface DynamicNumber {
  literalNumber?: number
  path?: string
  functionCall?: FunctionCall
}

export interface DynamicBoolean {
  literalBoolean?: boolean
  path?: string
  functionCall?: FunctionCall
}

export interface DynamicStringList {
  literalArray?: string[]
  path?: string
  functionCall?: FunctionCall
}

export type DynamicValue = DynamicString | DynamicNumber | DynamicBoolean | DynamicStringList

// ─── Function Call ───

export interface FunctionCall {
  call: string
  args?: Record<string, any>
}

// ─── Child List ───

export interface ExplicitChildList {
  explicitList: string[] // ComponentId[]
}

export interface TemplateChildList {
  template: {
    componentId: string
    dataBinding: string // DataPath
  }
}

export type ChildList = ExplicitChildList | TemplateChildList

export function isTemplateChildList(child: ChildList): child is TemplateChildList {
  return 'template' in child
}

// ─── Component Definition ───

export interface ComponentDef {
  id: string
  component: string
  [key: string]: any
}

// ─── Action ───

export interface ActionEvent {
  event: {
    name: string
    context?: Record<string, any>
  }
}

export interface ActionFunctionCall {
  functionCall: {
    call: string
    args?: Record<string, any>
  }
}

export type Action = ActionEvent | ActionFunctionCall

// ─── Validation Check ───

export interface ValidationCheck {
  call: string
  args?: Record<string, any>
  message?: string
}

// ─── Theme ───

export interface Theme {
  primaryColor?: string
  iconUrl?: string
  agentDisplayName?: string
}

// ─── Server-to-Client Messages ───

export interface CreateSurfaceMessage {
  surfaceId: string
  catalogId: string
  theme?: Theme
  sendDataModel?: boolean
}

export interface UpdateComponentsMessage {
  surfaceId: string
  components: ComponentDef[]
}

export interface UpdateDataModelMessage {
  surfaceId?: string
  path?: string
  value?: any
}

export interface DeleteSurfaceMessage {
  surfaceId: string
}

export interface A2UIServerMessage {
  createSurface?: CreateSurfaceMessage
  updateComponents?: UpdateComponentsMessage
  updateDataModel?: UpdateDataModelMessage
  deleteSurface?: DeleteSurfaceMessage
}

// ─── Client-to-Server Messages ───

export interface ActionMessage {
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string
  context: Record<string, any>
}

export interface ErrorMessage {
  code: string
  surfaceId?: string
  path?: string
  message: string
}

// ─── Capabilities ───

export interface A2UIClientCapabilities {
  supportedCatalogIds: string[]
  inlineCatalogs?: any[]
}

// ─── Validation Result ───

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  code: string
  surfaceId?: string
  path?: string
  message: string
}
