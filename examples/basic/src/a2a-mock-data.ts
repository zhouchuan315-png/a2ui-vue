/**
 * A2A Mock Data — 模拟 A2A Agent 响应（A2UI 原生格式）
 *
 * 模拟一个数据分析 Agent 的完整响应流程：
 * 1. 创建 Surface（含主题信息）
 * 2. 初始化 root Column
 * 3. 推送状态文本
 * 4. 推送实际内容组件（标题、指标卡片、摘要文本）
 * 5. 更新任务状态为 completed
 *
 * 所有消息直接以 A2UIServerMessage 格式返回，
 * 不经过 A2A→A2UI mapper 转换，确保渲染效果正确。
 */

import type { A2UIServerMessage } from '@nine1ie/a2ui-vue-core'

/** 模拟 Agent Card */
export const mockAgentCard = {
  name: '数据分析助手',
  version: '1.0.0',
  url: 'https://mock-agent.example.com',
  authentication: { schemes: [] as string[] },
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain', 'text/markdown', 'application/json'],
  capabilities: { streaming: true },
}

/** Surface ID 前缀 */
const SURFACE = 'a2a-mock'

// ─── 辅助函数 ───

function createSurface(surfaceId: string): A2UIServerMessage {
  return {
    createSurface: {
      surfaceId: `${SURFACE}-${surfaceId}`,
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: {
        agentDisplayName: '数据分析助手',
      },
    },
  }
}

function initRoot(surfaceId: string): A2UIServerMessage {
  return {
    updateComponents: {
      surfaceId: `${SURFACE}-${surfaceId}`,
      components: [
        { id: 'root', component: 'Column', children: { explicitList: [] } },
      ],
    },
  }
}

function updateRoot(surfaceId: string, childIds: string[]): A2UIServerMessage {
  return {
    updateComponents: {
      surfaceId: `${SURFACE}-${surfaceId}`,
      components: [
        { id: 'root', component: 'Column', children: { explicitList: childIds } },
      ],
    },
  }
}

function statusText(surfaceId: string, text: string): A2UIServerMessage {
  return {
    updateComponents: {
      surfaceId: `${SURFACE}-${surfaceId}`,
      components: [
        { id: 'status', component: 'Text', text: { literalString: text } },
      ],
    },
  }
}

function pushComponents(surfaceId: string, components: import('@nine1ie/a2ui-vue-core').ComponentDef[]): A2UIServerMessage {
  return {
    updateComponents: {
      surfaceId: `${SURFACE}-${surfaceId}`,
      components,
    },
  }
}

// ─── 默认对话：数据分析看板 ───

const defaultConversation: A2UIServerMessage[] = (() => {
  const sid = 'task-001'
  const childIds = [
    'heading', 'divider-1',
    'metrics-row',
    'text-intro', 'text-body',
    'divider-2', 'text-footer',
  ]

  return [
    // 创建 Surface + root
    createSurface(sid),
    initRoot(sid),

    // 状态
    statusText(sid, '正在分析数据...'),

    // 内容组件
    pushComponents(sid, [
      // 标题
      { id: 'heading', component: 'Text', usageHint: 'h2', text: { literalString: '本月销售概览' } },

      // 分割线
      { id: 'divider-1', component: 'Divider' },

      // 指标卡片行 — 4 个指标用 Row 布局，每个 Card 内部用 Column 包裹子组件
      {
        id: 'metrics-row',
        component: 'Row',
        children: {
          explicitList: ['metric-1', 'metric-2', 'metric-3', 'metric-4'],
        },
      },
      // 指标 1
      {
        id: 'metric-1',
        component: 'Card',
        child: 'metric-1-inner',
      },
      {
        id: 'metric-1-inner',
        component: 'Column',
        children: { explicitList: ['m1-label', 'm1-value', 'm1-change'] },
      },
      { id: 'm1-label', component: 'Text', usageHint: 'caption', text: { literalString: '总销售额' } },
      { id: 'm1-value', component: 'Text', usageHint: 'h3', text: { literalString: '¥1,234,567' } },
      { id: 'm1-change', component: 'Text', text: { literalString: '↑ 12.5%' } },

      // 指标 2
      {
        id: 'metric-2',
        component: 'Card',
        child: 'metric-2-inner',
      },
      {
        id: 'metric-2-inner',
        component: 'Column',
        children: { explicitList: ['m2-label', 'm2-value', 'm2-change'] },
      },
      { id: 'm2-label', component: 'Text', usageHint: 'caption', text: { literalString: '订单数' } },
      { id: 'm2-value', component: 'Text', usageHint: 'h3', text: { literalString: '8,432' } },
      { id: 'm2-change', component: 'Text', text: { literalString: '↑ 8.3%' } },

      // 指标 3
      {
        id: 'metric-3',
        component: 'Card',
        child: 'metric-3-inner',
      },
      {
        id: 'metric-3-inner',
        component: 'Column',
        children: { explicitList: ['m3-label', 'm3-value', 'm3-change'] },
      },
      { id: 'm3-label', component: 'Text', usageHint: 'caption', text: { literalString: '客单价' } },
      { id: 'm3-value', component: 'Text', usageHint: 'h3', text: { literalString: '¥146.4' } },
      { id: 'm3-change', component: 'Text', text: { literalString: '↑ 3.8%' } },

      // 指标 4
      {
        id: 'metric-4',
        component: 'Card',
        child: 'metric-4-inner',
      },
      {
        id: 'metric-4-inner',
        component: 'Column',
        children: { explicitList: ['m4-label', 'm4-value', 'm4-change'] },
      },
      { id: 'm4-label', component: 'Text', usageHint: 'caption', text: { literalString: '复购率' } },
      { id: 'm4-value', component: 'Text', usageHint: 'h3', text: { literalString: '34.2%' } },
      { id: 'm4-change', component: 'Text', text: { literalString: '↑ 2.1%' } },

      // 介绍文本
      { id: 'text-intro', component: 'Text', text: { literalString: '以下是您请求的数据概览，数据截至本月 13 日。' } },

      // 详情文本
      { id: 'text-body', component: 'Text', text: { literalString: '销售额同比增长 12.5%，主要受新品上线和促销活动拉动。订单量增长 8.3%，客单价同步提升。复购率稳步上升至 34.2%，用户粘性持续改善。' } },

      // 分割线
      { id: 'divider-2', component: 'Divider' },

      // 底部提示
      { id: 'text-footer', component: 'Text', usageHint: 'caption', text: { literalString: '如需进一步分析某个指标，请告诉我。' } },
    ]),

    // 更新 root 子节点
    updateRoot(sid, childIds),

    // 完成状态
    statusText(sid, '分析完成'),
  ]
})()

// ─── "你好" 对话 ───

const helloConversation: A2UIServerMessage[] = (() => {
  const sid = 'task-002'
  const childIds = ['hello-heading', 'hello-desc', 'hello-list']

  return [
    createSurface(sid),
    initRoot(sid),
    statusText(sid, '正在处理...'),
    pushComponents(sid, [
      { id: 'hello-heading', component: 'Text', usageHint: 'h3', text: { literalString: '你好！' } },
      { id: 'hello-desc', component: 'Text', text: { literalString: '我是数据分析助手，可以帮你：' } },
      {
        id: 'hello-list',
        component: 'Column',
        children: { explicitList: ['item-1', 'item-2', 'item-3'] },
      },
      { id: 'item-1', component: 'Text', text: { literalString: '• 生成数据看板' } },
      { id: 'item-2', component: 'Text', text: { literalString: '• 分析销售趋势' } },
      { id: 'item-3', component: 'Text', text: { literalString: '• 创建可视化图表' } },
    ]),
    updateRoot(sid, childIds),
    statusText(sid, '完成'),
  ]
})()

// ─── "趋势" 对话 ───

const trendConversation: A2UIServerMessage[] = (() => {
  const sid = 'task-003'
  const childIds = [
    'trend-heading', 'trend-divider',
    'trend-table',
    'trend-summary',
  ]

  return [
    createSurface(sid),
    initRoot(sid),
    statusText(sid, '正在查询趋势数据...'),
    pushComponents(sid, [
      { id: 'trend-heading', component: 'Text', usageHint: 'h2', text: { literalString: '近 6 个月销售趋势' } },
      { id: 'trend-divider', component: 'Divider' },

      // 趋势数据用 List + Row 表格样式
      {
        id: 'trend-table',
        component: 'List',
        children: { explicitList: ['row-header', 'row-1', 'row-2', 'row-3', 'row-4', 'row-5'] },
      },

      // 表头
      {
        id: 'row-header',
        component: 'Row',
        children: { explicitList: ['rh-month', 'rh-sales', 'rh-change'] },
      },
      { id: 'rh-month', component: 'Text', usageHint: 'caption', text: { literalString: '月份' } },
      { id: 'rh-sales', component: 'Text', usageHint: 'caption', text: { literalString: '销售额' } },
      { id: 'rh-change', component: 'Text', usageHint: 'caption', text: { literalString: '环比' } },

      // 数据行
      ...([
        ['row-1', '1月', '¥980,000', '-'],
        ['row-2', '2月', '¥1,050,000', '+7.1%'],
        ['row-3', '3月', '¥1,120,000', '+6.7%'],
        ['row-4', '4月', '¥1,180,000', '+5.4%'],
        ['row-5', '5月', '¥1,234,567', '+4.6%'],
      ] as const).flatMap(([rowId, month, sales, change]) => [
        {
          id: rowId,
          component: 'Row',
          children: { explicitList: [`${rowId}-m`, `${rowId}-s`, `${rowId}-c`] },
        },
        { id: `${rowId}-m`, component: 'Text', text: { literalString: month } },
        { id: `${rowId}-s`, component: 'Text', text: { literalString: sales } },
        { id: `${rowId}-c`, component: 'Text', text: { literalString: change } },
      ]),

      { id: 'trend-summary', component: 'Text', text: { literalString: '整体呈稳步上升趋势，Q2 增速略有放缓。' } },
    ]),
    updateRoot(sid, childIds),
    statusText(sid, '完成'),
  ]
})()

/** 根据用户输入选择最匹配的 mock 响应 */
export function getMockResponse(userInput: string): A2UIServerMessage[] {
  const lower = userInput.toLowerCase()
  if (lower.includes('你好') || lower.includes('hello') || lower.includes('hi')) {
    return helloConversation
  }
  if (lower.includes('趋势') || lower.includes('trend')) {
    return trendConversation
  }
  return defaultConversation
}
