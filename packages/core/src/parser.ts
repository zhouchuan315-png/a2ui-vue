// A2UI v0.9 Protocol Parser - JSON message parsing and validation

import type {
  A2UIServerMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
  ValidationResult,
  ValidationError,
} from './types/protocol'

// ─── Message Type Detection ───

export function parseMessage(json: string): A2UIServerMessage {
  let parsed: any
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    throw new A2UIParseError(`Invalid JSON: ${(e as Error).message}`)
  }

  const message: A2UIServerMessage = {}

  if ('createSurface' in parsed) {
    message.createSurface = parsed.createSurface as CreateSurfaceMessage
  } else if ('updateComponents' in parsed) {
    message.updateComponents = parsed.updateComponents as UpdateComponentsMessage
  } else if ('updateDataModel' in parsed) {
    message.updateDataModel = parsed.updateDataModel as UpdateDataModelMessage
  } else if ('deleteSurface' in parsed) {
    message.deleteSurface = parsed.deleteSurface as DeleteSurfaceMessage
  } else {
    throw new A2UIParseError('Unknown message type. Expected one of: createSurface, updateComponents, updateDataModel, deleteSurface')
  }

  return message
}

export function parseMessageStream(chunk: string): A2UIServerMessage[] {
  // Handle JSONL (newline-delimited JSON)
  const lines = chunk.split('\n').filter((line) => line.trim())
  return lines.map((line) => parseMessage(line))
}

// ─── Validation ───

export function validateMessage(message: A2UIServerMessage): ValidationResult {
  const errors: ValidationError[] = []

  if (message.createSurface) {
    validateCreateSurface(message.createSurface, errors)
  } else if (message.updateComponents) {
    validateUpdateComponents(message.updateComponents, errors)
  } else if (message.updateDataModel) {
    validateUpdateDataModel(message.updateDataModel, errors)
  } else if (message.deleteSurface) {
    validateDeleteSurface(message.deleteSurface, errors)
  }

  return { valid: errors.length === 0, errors }
}

function validateCreateSurface(msg: CreateSurfaceMessage, errors: ValidationError[]): void {
  if (!msg.surfaceId) {
    errors.push({ code: 'VALIDATION_FAILED', path: '/createSurface/surfaceId', message: 'surfaceId is required' })
  }
  if (!msg.catalogId) {
    errors.push({ code: 'VALIDATION_FAILED', path: '/createSurface/catalogId', message: 'catalogId is required' })
  }
}

function validateUpdateComponents(msg: UpdateComponentsMessage, errors: ValidationError[]): void {
  if (!msg.surfaceId) {
    errors.push({ code: 'VALIDATION_FAILED', surfaceId: msg.surfaceId, path: '/updateComponents/surfaceId', message: 'surfaceId is required' })
  }
  if (!Array.isArray(msg.components)) {
    errors.push({ code: 'VALIDATION_FAILED', surfaceId: msg.surfaceId, path: '/updateComponents/components', message: 'components must be an array' })
    return
  }

  const ids = new Set<string>()
  for (let i = 0; i < msg.components.length; i++) {
    const comp = msg.components[i]
    if (!comp.id) {
      errors.push({
        code: 'VALIDATION_FAILED',
        surfaceId: msg.surfaceId,
        path: `/updateComponents/components/${i}/id`,
        message: 'Component id is required',
      })
    } else if (ids.has(comp.id)) {
      errors.push({
        code: 'VALIDATION_FAILED',
        surfaceId: msg.surfaceId,
        path: `/updateComponents/components/${i}/id`,
        message: `Duplicate component id: ${comp.id}`,
      })
    } else {
      ids.add(comp.id)
    }

    if (!comp.component) {
      errors.push({
        code: 'VALIDATION_FAILED',
        surfaceId: msg.surfaceId,
        path: `/updateComponents/components/${i}/component`,
        message: 'Component type is required',
      })
    }
  }
}

function validateUpdateDataModel(msg: UpdateDataModelMessage, errors: ValidationError[]): void {
  if (!msg.surfaceId) {
    errors.push({ code: 'VALIDATION_FAILED', path: '/updateDataModel/surfaceId', message: 'surfaceId is required' })
  }
}

function validateDeleteSurface(msg: DeleteSurfaceMessage, errors: ValidationError[]): void {
  if (!msg.surfaceId) {
    errors.push({ code: 'VALIDATION_FAILED', path: '/deleteSurface/surfaceId', message: 'surfaceId is required' })
  }
}

// ─── Errors ───

export class A2UIParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'A2UIParseError'
  }
}
