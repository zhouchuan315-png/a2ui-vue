// Mock A2UI v0.9 messages simulating an Agent output stream

import type { A2UIServerMessage } from '@a2ui/vue-core'

// ─── Demo 1: User Registration Form ───
export const registrationForm: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'registration',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#6366f1', agentDisplayName: 'Registration Agent' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'registration',
      components: [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['title', 'card'] },
        },
        {
          id: 'title',
          component: 'Text',
          text: { literalString: 'Agent Registration' },
          usageHint: 'h2',
        },
        {
          id: 'card',
          component: 'Card',
          child: 'form',
        },
        {
          id: 'form',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['name-field', 'email-field', 'role-picker', 'divider', 'button-row'] },
        },
        {
          id: 'name-field',
          component: 'TextField',
          label: { literalString: 'Name' },
          value: { path: '/form/name' },
          placeholder: { literalString: 'Enter your name' },
          checks: [{ call: 'required', message: 'Name is required' }],
        },
        {
          id: 'email-field',
          component: 'TextField',
          label: { literalString: 'Email' },
          value: { path: '/form/email' },
          placeholder: { literalString: 'agent@example.com' },
          checks: [
            { call: 'required', message: 'Email is required' },
            { call: 'email', message: 'Invalid email format' },
          ],
        },
        {
          id: 'role-picker',
          component: 'ChoicePicker',
          options: [
            { label: 'Assistant', value: 'assistant' },
            { label: 'Researcher', value: 'researcher' },
            { label: 'Coder', value: 'coder' },
            { label: 'Designer', value: 'designer' },
          ],
          value: { path: '/form/role' },
        },
        {
          id: 'divider',
          component: 'Divider',
        },
        {
          id: 'button-row',
          component: 'Row',
          alignment: 'end',
          children: { explicitList: ['reset-btn', 'submit-btn'] },
        },
        {
          id: 'reset-btn',
          component: 'Button',
          label: { literalString: 'Reset' },
          variant: 'borderless',
        },
        {
          id: 'submit-btn',
          component: 'Button',
          label: { literalString: 'Register' },
          variant: 'primary',
          action: {
            event: {
              name: 'submit_registration',
              context: {
                name: { path: '/form/name' },
                email: { path: '/form/email' },
                role: { path: '/form/role' },
              },
            },
          },
          checks: [
            { call: 'required', args: { value: { path: '/form/name' } } },
            { call: 'required', args: { value: { path: '/form/email' } } },
          ],
        },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'registration',
      value: {
        form: { name: '', email: '', role: 'assistant' },
      },
    },
  },
]

// ─── Demo 2: Dynamic Task List ───
export const taskList: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'tasks',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#10b981', agentDisplayName: 'Task Agent' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'tasks',
      components: [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['header', 'add-row', 'task-list'] },
        },
        {
          id: 'header',
          component: 'Text',
          text: { literalString: 'Task Manager' },
          usageHint: 'h2',
        },
        {
          id: 'add-row',
          component: 'Row',
          alignment: 'center',
          children: { explicitList: ['add-input', 'add-btn'] },
        },
        {
          id: 'add-input',
          component: 'TextField',
          label: { literalString: 'New Task' },
          value: { path: '/newTask' },
          placeholder: { literalString: 'What needs to be done?' },
        },
        {
          id: 'add-btn',
          component: 'Button',
          label: { literalString: 'Add' },
          variant: 'primary',
          action: {
            event: {
              name: 'add_task',
              context: { title: { path: '/newTask' } },
            },
          },
        },
        {
          id: 'task-list',
          component: 'List',
          children: {
            template: {
              componentId: 'task-item',
              dataBinding: '/tasks',
            },
          },
        },
        {
          id: 'task-item',
          component: 'Card',
          child: 'task-item-row',
        },
        {
          id: 'task-item-row',
          component: 'Row',
          alignment: 'space-between',
          children: { explicitList: ['task-check', 'task-title'] },
        },
        {
          id: 'task-check',
          component: 'CheckBox',
          label: { literalString: '' },
          value: { path: 'done' },
        },
        {
          id: 'task-title',
          component: 'Text',
          text: { path: 'title' },
          usageHint: 'body',
        },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'tasks',
      value: {
        newTask: '',
        tasks: [
          { title: 'Design component API', done: true },
          { title: 'Implement renderer', done: false },
          { title: 'Write tests', done: false },
          { title: 'Publish to npm', done: false },
        ],
      },
    },
  },
]

// ─── Demo 3: Agent Dashboard with Tabs ───
export const agentDashboard: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'dashboard',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#f59e0b', agentDisplayName: 'Dashboard Agent' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'dashboard',
      components: [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['greeting', 'tabs'] },
        },
        {
          id: 'greeting',
          component: 'Text',
          text: { literalString: 'Welcome back, Agent' },
          usageHint: 'h1',
        },
        {
          id: 'tabs',
          component: 'Tabs',
          tabs: [
            { title: 'Overview', child: 'overview' },
            { title: 'Settings', child: 'settings' },
          ],
        },
        {
          id: 'overview',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['stat-card', 'slider-section'] },
        },
        {
          id: 'stat-card',
          component: 'Card',
          child: 'stat-content',
        },
        {
          id: 'stat-content',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['stat-label', 'stat-value'] },
        },
        {
          id: 'stat-label',
          component: 'Text',
          text: { literalString: 'Active Surfaces' },
          usageHint: 'caption',
        },
        {
          id: 'stat-value',
          component: 'Text',
          text: { functionCall: { call: 'formatNumber', args: { value: 3, precision: 0 } } },
          usageHint: 'h3',
        },
        {
          id: 'slider-section',
          component: 'Card',
          child: 'slider-col',
        },
        {
          id: 'slider-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['slider-label', 'slider'] },
        },
        {
          id: 'slider-label',
          component: 'Text',
          text: { literalString: 'Confidence Threshold' },
          usageHint: 'body',
        },
        {
          id: 'slider',
          component: 'Slider',
          min: { literalNumber: 0 },
          max: { literalNumber: 100 },
          step: { literalNumber: 5 },
          value: { path: '/settings/threshold' },
        },
        {
          id: 'settings',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['settings-card'] },
        },
        {
          id: 'settings-card',
          component: 'Card',
          child: 'settings-col',
        },
        {
          id: 'settings-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['settings-title', 'temp-input', 'save-btn'] },
        },
        {
          id: 'settings-title',
          component: 'Text',
          text: { literalString: 'Agent Configuration' },
          usageHint: 'h3',
        },
        {
          id: 'temp-input',
          component: 'TextField',
          label: { literalString: 'Temperature' },
          value: { path: '/settings/temperature' },
          placeholder: { literalString: '0.7' },
          checks: [
            { call: 'numeric', args: { value: { path: '/settings/temperature' }, min: 0, max: 2 }, message: 'Must be between 0 and 2' },
          ],
        },
        {
          id: 'save-btn',
          component: 'Button',
          label: { literalString: 'Save Settings' },
          variant: 'primary',
          action: {
            event: {
              name: 'save_settings',
              context: {
                temperature: { path: '/settings/temperature' },
                threshold: { path: '/settings/threshold' },
              },
            },
          },
        },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'dashboard',
      value: {
        settings: { temperature: '0.7', threshold: 50 },
      },
    },
  },
]
