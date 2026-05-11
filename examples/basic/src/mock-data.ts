// Mock A2UI v0.9 messages simulating an Agent output stream

import type { A2UIServerMessage } from '@a2ui/vue-core'

const showcaseIllustration =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' fill='%23f5f3ff'/><circle cx='118' cy='118' r='64' fill='%237a5cff' fill-opacity='0.18'/><rect x='72' y='214' width='218' height='18' rx='9' fill='%236366f1'/><rect x='72' y='246' width='324' height='12' rx='6' fill='%2394a3b8'/><rect x='72' y='270' width='268' height='12' rx='6' fill='%23cbd5e1'/><rect x='432' y='68' width='136' height='136' rx='28' fill='%237a5cff'/><path d='M480 136l24 24 54-54' stroke='white' stroke-width='18' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>"

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

// ─── Demo 4: Component Lab ───
export const componentLab: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'component-lab',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#0f9d7a', agentDisplayName: 'Component Lab' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'component-lab',
      components: [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['lab-title', 'lab-subtitle', 'lab-tabs'] },
        },
        {
          id: 'lab-title',
          component: 'Text',
          text: { literalString: 'Renderer Component Lab' },
          usageHint: 'h1',
        },
        {
          id: 'lab-subtitle',
          component: 'Text',
          text: { literalString: 'A focused demo surface for the refined controls, cards, tabs, and display blocks.' },
          usageHint: 'body',
        },
        {
          id: 'lab-tabs',
          component: 'Tabs',
          tabs: [
            { title: 'Controls', child: 'controls-pane' },
            { title: 'Display', child: 'display-pane' },
            { title: 'Media', child: 'media-pane' },
          ],
        },
        {
          id: 'controls-pane',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['controls-row', 'controls-actions-card'] },
        },
        {
          id: 'controls-row',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['profile-card', 'workflow-card'] },
        },
        {
          id: 'profile-card',
          component: 'Card',
          child: 'profile-col',
        },
        {
          id: 'profile-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['profile-eyebrow', 'profile-heading', 'profile-name', 'profile-email', 'profile-date'] },
        },
        {
          id: 'profile-eyebrow',
          component: 'Text',
          text: { literalString: 'TextField + DateTimeInput' },
          usageHint: 'caption',
        },
        {
          id: 'profile-heading',
          component: 'Text',
          text: { literalString: 'Launch Profile' },
          usageHint: 'h3',
        },
        {
          id: 'profile-name',
          component: 'TextField',
          label: { literalString: 'Owner name' },
          value: { path: '/profile/name' },
          placeholder: { literalString: 'Who owns this release?' },
          checks: [{ call: 'required', message: 'Owner name is required' }],
        },
        {
          id: 'profile-email',
          component: 'TextField',
          label: { literalString: 'Owner email' },
          value: { path: '/profile/email' },
          placeholder: { literalString: 'owner@a2ui.dev' },
          checks: [{ call: 'email', message: 'Use a valid email address' }],
        },
        {
          id: 'profile-date',
          component: 'DateTimeInput',
          label: { literalString: 'Launch window' },
          mode: 'datetime',
          value: { path: '/profile/launchAt' },
        },
        {
          id: 'workflow-card',
          component: 'Card',
          child: 'workflow-col',
        },
        {
          id: 'workflow-col',
          component: 'Column',
          alignment: 'start',
          children: {
            explicitList: [
              'workflow-eyebrow',
              'workflow-heading',
              'role-picker',
              'workflow-divider',
              'notify-check',
              'review-check',
              'threshold-label',
              'threshold-slider',
            ],
          },
        },
        {
          id: 'workflow-eyebrow',
          component: 'Text',
          text: { literalString: 'ChoicePicker + CheckBox + Slider' },
          usageHint: 'caption',
        },
        {
          id: 'workflow-heading',
          component: 'Text',
          text: { literalString: 'Workflow controls' },
          usageHint: 'h3',
        },
        {
          id: 'role-picker',
          component: 'ChoicePicker',
          options: [
            { label: 'Designer', value: 'designer' },
            { label: 'Researcher', value: 'researcher' },
            { label: 'Engineer', value: 'engineer' },
            { label: 'Operator', value: 'operator' },
          ],
          value: { path: '/profile/role' },
        },
        {
          id: 'workflow-divider',
          component: 'Divider',
        },
        {
          id: 'notify-check',
          component: 'CheckBox',
          label: { literalString: 'Notify channel owners before publishing' },
          value: { path: '/workflow/notifyOwners' },
        },
        {
          id: 'review-check',
          component: 'CheckBox',
          label: { literalString: 'Require human review for critical surfaces' },
          value: { path: '/workflow/reviewRequired' },
        },
        {
          id: 'threshold-label',
          component: 'Text',
          text: { literalString: 'Confidence threshold' },
          usageHint: 'body',
        },
        {
          id: 'threshold-slider',
          component: 'Slider',
          min: { literalNumber: 0 },
          max: { literalNumber: 100 },
          step: { literalNumber: 5 },
          value: { path: '/workflow/threshold' },
        },
        {
          id: 'controls-actions-card',
          component: 'Card',
          child: 'actions-col',
        },
        {
          id: 'actions-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['actions-heading', 'actions-text', 'actions-row'] },
        },
        {
          id: 'actions-heading',
          component: 'Text',
          text: { literalString: 'Action row' },
          usageHint: 'h4',
        },
        {
          id: 'actions-text',
          component: 'Text',
          text: { literalString: 'Primary, secondary, and borderless button treatments share one spacing and focus system.' },
          usageHint: 'body',
        },
        {
          id: 'actions-row',
          component: 'Row',
          alignment: 'start',
          children: { explicitList: ['preview-btn', 'save-btn', 'ghost-btn'] },
        },
        {
          id: 'preview-btn',
          component: 'Button',
          label: { literalString: 'Preview Release' },
          variant: 'primary',
          action: {
            event: {
              name: 'preview_release',
              context: {
                role: { path: '/profile/role' },
                threshold: { path: '/workflow/threshold' },
              },
            },
          },
        },
        {
          id: 'save-btn',
          component: 'Button',
          label: { literalString: 'Save Draft' },
          variant: 'default',
          action: {
            event: {
              name: 'save_draft',
              context: {
                owner: { path: '/profile/name' },
                launchAt: { path: '/profile/launchAt' },
              },
            },
          },
        },
        {
          id: 'ghost-btn',
          component: 'Button',
          label: { literalString: 'Reset Filters' },
          variant: 'borderless',
        },
        {
          id: 'display-pane',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['display-row', 'checklist-card'] },
        },
        {
          id: 'display-row',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['image-card', 'stats-card'] },
        },
        {
          id: 'image-card',
          component: 'Card',
          child: 'image-col',
        },
        {
          id: 'image-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['image-eyebrow', 'hero-image', 'image-title', 'image-body'] },
        },
        {
          id: 'image-eyebrow',
          component: 'Text',
          text: { literalString: 'Image + Text' },
          usageHint: 'caption',
        },
        {
          id: 'hero-image',
          component: 'Image',
          url: { literalString: showcaseIllustration },
          alt: { literalString: 'Illustration for component lab' },
        },
        {
          id: 'image-title',
          component: 'Text',
          text: { literalString: 'Launch board preview' },
          usageHint: 'h4',
        },
        {
          id: 'image-body',
          component: 'Text',
          text: { literalString: 'Display components now share the same card rhythm as form controls, instead of feeling like isolated primitives.' },
          usageHint: 'body',
        },
        {
          id: 'stats-card',
          component: 'Card',
          child: 'stats-col',
        },
        {
          id: 'stats-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['stats-eyebrow', 'stats-heading', 'stat-row-one', 'stat-row-two', 'stats-note'] },
        },
        {
          id: 'stats-eyebrow',
          component: 'Text',
          text: { literalString: 'Icon + Text' },
          usageHint: 'caption',
        },
        {
          id: 'stats-heading',
          component: 'Text',
          text: { literalString: 'Surface health summary' },
          usageHint: 'h4',
        },
        {
          id: 'stat-row-one',
          component: 'Row',
          alignment: 'start',
          children: { explicitList: ['stat-icon-one', 'stat-text-one'] },
        },
        {
          id: 'stat-icon-one',
          component: 'Icon',
          icon: { literalString: '✓' },
        },
        {
          id: 'stat-text-one',
          component: 'Text',
          text: { literalString: '12 protocol checks passing across the current catalog build.' },
          usageHint: 'body',
        },
        {
          id: 'stat-row-two',
          component: 'Row',
          alignment: 'start',
          children: { explicitList: ['stat-icon-two', 'stat-text-two'] },
        },
        {
          id: 'stat-icon-two',
          component: 'Icon',
          icon: { literalString: '⚙' },
        },
        {
          id: 'stat-text-two',
          component: 'Text',
          text: { literalString: '3 surfaces are using the refined panel, field, and inspector tokens.' },
          usageHint: 'body',
        },
        {
          id: 'stats-note',
          component: 'Text',
          text: { literalString: 'This tab exists to exercise the updated display primitives inside real cards, not just in isolation.' },
          usageHint: 'caption',
        },
        {
          id: 'checklist-card',
          component: 'Card',
          child: 'checklist-col',
        },
        {
          id: 'checklist-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['checklist-heading', 'checklist-body', 'checklist-list'] },
        },
        {
          id: 'checklist-heading',
          component: 'Text',
          text: { literalString: 'Refined list rendering' },
          usageHint: 'h4',
        },
        {
          id: 'checklist-body',
          component: 'Text',
          text: { literalString: 'The list below reuses template rendering so updated cards, text, and checkboxes are visible in one place.' },
          usageHint: 'body',
        },
        {
          id: 'checklist-list',
          component: 'List',
          children: {
            template: {
              componentId: 'checklist-item',
              dataBinding: '/checklist',
            },
          },
        },
        {
          id: 'checklist-item',
          component: 'Card',
          child: 'checklist-item-row',
        },
        {
          id: 'checklist-item-row',
          component: 'Row',
          alignment: 'space-between',
          children: { explicitList: ['checklist-item-check', 'checklist-item-text'] },
        },
        {
          id: 'checklist-item-check',
          component: 'CheckBox',
          label: { literalString: '' },
          value: { path: 'done' },
        },
        {
          id: 'checklist-item-text',
          component: 'Text',
          text: { path: 'label' },
          usageHint: 'body',
        },
        {
          id: 'media-pane',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['media-row', 'modal-card'] },
        },
        {
          id: 'media-row',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['video-card', 'audio-card'] },
        },
        {
          id: 'video-card',
          component: 'Card',
          child: 'video-col',
        },
        {
          id: 'video-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['video-eyebrow', 'video-heading', 'video-player', 'video-body'] },
        },
        {
          id: 'video-eyebrow',
          component: 'Text',
          text: { literalString: 'Video' },
          usageHint: 'caption',
        },
        {
          id: 'video-heading',
          component: 'Text',
          text: { literalString: 'Embedded preview player' },
          usageHint: 'h4',
        },
        {
          id: 'video-player',
          component: 'Video',
          url: { literalString: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
        },
        {
          id: 'video-body',
          component: 'Text',
          text: { literalString: 'The updated video block shares the same border, radius, and elevation language as the rest of the renderer.' },
          usageHint: 'body',
        },
        {
          id: 'audio-card',
          component: 'Card',
          child: 'audio-col',
        },
        {
          id: 'audio-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['audio-eyebrow', 'audio-heading', 'audio-player', 'audio-body'] },
        },
        {
          id: 'audio-eyebrow',
          component: 'Text',
          text: { literalString: 'Audio' },
          usageHint: 'caption',
        },
        {
          id: 'audio-heading',
          component: 'Text',
          text: { literalString: 'Inline audio control' },
          usageHint: 'h4',
        },
        {
          id: 'audio-player',
          component: 'AudioPlayer',
          url: { literalString: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' },
        },
        {
          id: 'audio-body',
          component: 'Text',
          text: { literalString: 'Audio controls are wrapped in a card-like shell so they no longer feel like naked browser chrome.' },
          usageHint: 'body',
        },
        {
          id: 'modal-card',
          component: 'Card',
          child: 'modal-col',
        },
        {
          id: 'modal-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['modal-eyebrow', 'modal-heading', 'modal-body', 'modal-demo'] },
        },
        {
          id: 'modal-eyebrow',
          component: 'Text',
          text: { literalString: 'Modal' },
          usageHint: 'caption',
        },
        {
          id: 'modal-heading',
          component: 'Text',
          text: { literalString: 'Dialog composition check' },
          usageHint: 'h4',
        },
        {
          id: 'modal-body',
          component: 'Text',
          text: { literalString: 'This interaction exists so the component library demo can directly validate trigger rendering and dialog content composition.' },
          usageHint: 'body',
        },
        {
          id: 'modal-demo',
          component: 'Modal',
          trigger: 'modal-trigger-btn',
          child: 'modal-content-col',
        },
        {
          id: 'modal-trigger-btn',
          component: 'Button',
          label: { literalString: 'Open Review Notes' },
          variant: 'primary',
        },
        {
          id: 'modal-content-col',
          component: 'Column',
          alignment: 'start',
          children: { explicitList: ['modal-content-title', 'modal-content-body', 'modal-content-divider', 'modal-content-list'] },
        },
        {
          id: 'modal-content-title',
          component: 'Text',
          text: { literalString: 'Pre-release review notes' },
          usageHint: 'h3',
        },
        {
          id: 'modal-content-body',
          component: 'Text',
          text: { literalString: 'Modal content now resolves from protocol-defined child components rather than an empty shell, so it can be exercised inside the local demo app.' },
          usageHint: 'body',
        },
        {
          id: 'modal-content-divider',
          component: 'Divider',
        },
        {
          id: 'modal-content-list',
          component: 'List',
          children: {
            template: {
              componentId: 'modal-list-item',
              dataBinding: '/reviewNotes',
            },
          },
        },
        {
          id: 'modal-list-item',
          component: 'Card',
          child: 'modal-list-item-row',
        },
        {
          id: 'modal-list-item-row',
          component: 'Row',
          alignment: 'space-between',
          children: { explicitList: ['modal-list-item-check', 'modal-list-item-text'] },
        },
        {
          id: 'modal-list-item-check',
          component: 'CheckBox',
          label: { literalString: '' },
          value: { path: 'done' },
        },
        {
          id: 'modal-list-item-text',
          component: 'Text',
          text: { path: 'label' },
          usageHint: 'body',
        },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'component-lab',
      value: {
        profile: {
          name: 'Ava Operator',
          email: 'ava@a2ui.dev',
          launchAt: '2026-05-09T14:30',
          role: 'designer',
        },
        workflow: {
          notifyOwners: true,
          reviewRequired: false,
          threshold: 70,
        },
        checklist: [
          { label: 'Refined tabs align with the workspace shell', done: true },
          { label: 'Controls share one focus and spacing system', done: true },
          { label: 'Examples/basic includes direct component demos', done: false },
        ],
        reviewNotes: [
          { label: 'Verify visual parity between renderer cards and workspace cards', done: true },
          { label: 'Confirm media blocks inherit updated tokens', done: true },
          { label: 'Validate modal trigger and content rendering flow', done: false },
        ],
      },
    },
  },
]

// ─── Demo 5: Control Suite ───
export const controlSuite: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'control-suite',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#2563eb', agentDisplayName: 'Control Suite' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'control-suite',
      components: [
        { id: 'root', component: 'Column', alignment: 'start', children: { explicitList: ['title', 'intro', 'grid', 'actions-card'] } },
        { id: 'title', component: 'Text', text: { literalString: 'Control Suite' }, usageHint: 'h1' },
        { id: 'intro', component: 'Text', text: { literalString: 'Dedicated demo for form inputs, selection controls, toggles, range input, and button treatments.' }, usageHint: 'body' },
        { id: 'grid', component: 'Column', alignment: 'start', children: { explicitList: ['profile-card', 'workflow-card'] } },

        { id: 'profile-card', component: 'Card', child: 'profile-col' },
        { id: 'profile-col', component: 'Column', alignment: 'start', children: { explicitList: ['profile-caption', 'profile-head', 'field-name', 'field-email', 'field-date'] } },
        { id: 'profile-caption', component: 'Text', text: { literalString: 'TextField + DateTimeInput' }, usageHint: 'caption' },
        { id: 'profile-head', component: 'Text', text: { literalString: 'Release profile' }, usageHint: 'h3' },
        { id: 'field-name', component: 'TextField', label: { literalString: 'Owner name' }, value: { path: '/profile/name' }, placeholder: { literalString: 'Owner name' } },
        { id: 'field-email', component: 'TextField', label: { literalString: 'Owner email' }, value: { path: '/profile/email' }, placeholder: { literalString: 'owner@a2ui.dev' }, checks: [{ call: 'email', message: 'Use a valid email address' }] },
        { id: 'field-date', component: 'DateTimeInput', label: { literalString: 'Launch window' }, mode: 'datetime', value: { path: '/profile/launchAt' } },

        { id: 'workflow-card', component: 'Card', child: 'workflow-col' },
        { id: 'workflow-col', component: 'Column', alignment: 'start', children: { explicitList: ['workflow-caption', 'workflow-head', 'role-picker-suite', 'workflow-divider', 'workflow-check-1', 'workflow-check-2', 'workflow-label', 'workflow-slider'] } },
        { id: 'workflow-caption', component: 'Text', text: { literalString: 'ChoicePicker + CheckBox + Slider' }, usageHint: 'caption' },
        { id: 'workflow-head', component: 'Text', text: { literalString: 'Workflow policy' }, usageHint: 'h3' },
        { id: 'role-picker-suite', component: 'ChoicePicker', options: [{ label: 'Design', value: 'design' }, { label: 'Research', value: 'research' }, { label: 'Engineering', value: 'engineering' }, { label: 'QA', value: 'qa' }], value: { path: '/workflow/role' } },
        { id: 'workflow-divider', component: 'Divider' },
        { id: 'workflow-check-1', component: 'CheckBox', label: { literalString: 'Notify reviewers before publish' }, value: { path: '/workflow/notify' } },
        { id: 'workflow-check-2', component: 'CheckBox', label: { literalString: 'Require sign-off for critical changes' }, value: { path: '/workflow/signoff' } },
        { id: 'workflow-label', component: 'Text', text: { literalString: 'Confidence threshold' }, usageHint: 'body' },
        { id: 'workflow-slider', component: 'Slider', min: { literalNumber: 0 }, max: { literalNumber: 100 }, step: { literalNumber: 5 }, value: { path: '/workflow/threshold' } },

        { id: 'actions-card', component: 'Card', child: 'actions-col' },
        { id: 'actions-col', component: 'Column', alignment: 'start', children: { explicitList: ['actions-caption', 'actions-head', 'actions-text', 'actions-row'] } },
        { id: 'actions-caption', component: 'Text', text: { literalString: 'Button variants' }, usageHint: 'caption' },
        { id: 'actions-head', component: 'Text', text: { literalString: 'Action treatments' }, usageHint: 'h4' },
        { id: 'actions-text', component: 'Text', text: { literalString: 'Primary, default, and borderless buttons can be validated here without switching tabs.' }, usageHint: 'body' },
        { id: 'actions-row', component: 'Row', alignment: 'start', children: { explicitList: ['primary-btn', 'default-btn', 'borderless-btn'] } },
        { id: 'primary-btn', component: 'Button', label: { literalString: 'Preview' }, variant: 'primary' },
        { id: 'default-btn', component: 'Button', label: { literalString: 'Save Draft' }, variant: 'default' },
        { id: 'borderless-btn', component: 'Button', label: { literalString: 'Reset' }, variant: 'borderless' },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'control-suite',
      value: {
        profile: { name: 'Ava Operator', email: 'ava@a2ui.dev', launchAt: '2026-05-09T14:30' },
        workflow: { role: 'design', notify: true, signoff: false, threshold: 70 },
      },
    },
  },
]

// ─── Demo 6: Media Gallery ───
export const mediaGallery: A2UIServerMessage[] = [
  {
    createSurface: {
      surfaceId: 'media-gallery',
      catalogId: 'a2ui.org/standard-catalog/v0.9',
      theme: { primaryColor: '#8b5cf6', agentDisplayName: 'Media Gallery' },
    },
  },
  {
    updateComponents: {
      surfaceId: 'media-gallery',
      components: [
        { id: 'root', component: 'Column', alignment: 'start', children: { explicitList: ['title', 'intro', 'image-card', 'video-card', 'audio-card', 'modal-card'] } },
        { id: 'title', component: 'Text', text: { literalString: 'Media Gallery' }, usageHint: 'h1' },
        { id: 'intro', component: 'Text', text: { literalString: 'Dedicated demo for image, video, audio, modal, and list-driven dialog content.' }, usageHint: 'body' },

        { id: 'image-card', component: 'Card', child: 'image-col' },
        { id: 'image-col', component: 'Column', alignment: 'start', children: { explicitList: ['image-cap', 'image-head', 'image-block', 'image-copy'] } },
        { id: 'image-cap', component: 'Text', text: { literalString: 'Image' }, usageHint: 'caption' },
        { id: 'image-head', component: 'Text', text: { literalString: 'Illustration block' }, usageHint: 'h4' },
        { id: 'image-block', component: 'Image', url: { literalString: showcaseIllustration }, alt: { literalString: 'Showcase illustration' } },
        { id: 'image-copy', component: 'Text', text: { literalString: 'Use this to verify image shell, aspect ratio, and empty-state handling.' }, usageHint: 'body' },

        { id: 'video-card', component: 'Card', child: 'video-col' },
        { id: 'video-col', component: 'Column', alignment: 'start', children: { explicitList: ['video-cap', 'video-head', 'video-block'] } },
        { id: 'video-cap', component: 'Text', text: { literalString: 'Video' }, usageHint: 'caption' },
        { id: 'video-head', component: 'Text', text: { literalString: 'Preview video player' }, usageHint: 'h4' },
        { id: 'video-block', component: 'Video', url: { literalString: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' } },

        { id: 'audio-card', component: 'Card', child: 'audio-col' },
        { id: 'audio-col', component: 'Column', alignment: 'start', children: { explicitList: ['audio-cap', 'audio-head', 'audio-block'] } },
        { id: 'audio-cap', component: 'Text', text: { literalString: 'Audio' }, usageHint: 'caption' },
        { id: 'audio-head', component: 'Text', text: { literalString: 'Inline audio player' }, usageHint: 'h4' },
        { id: 'audio-block', component: 'AudioPlayer', url: { literalString: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' } },

        { id: 'modal-card', component: 'Card', child: 'modal-col' },
        { id: 'modal-col', component: 'Column', alignment: 'start', children: { explicitList: ['modal-cap', 'modal-head', 'modal-copy', 'modal-demo-gallery'] } },
        { id: 'modal-cap', component: 'Text', text: { literalString: 'Modal + List' }, usageHint: 'caption' },
        { id: 'modal-head', component: 'Text', text: { literalString: 'Review dialog demo' }, usageHint: 'h4' },
        { id: 'modal-copy', component: 'Text', text: { literalString: 'Open the dialog to verify modal chrome, focus ring, and list-driven content.' }, usageHint: 'body' },
        { id: 'modal-demo-gallery', component: 'Modal', trigger: 'modal-gallery-trigger', child: 'modal-gallery-content' },
        { id: 'modal-gallery-trigger', component: 'Button', label: { literalString: 'Open Review Notes' }, variant: 'primary' },
        { id: 'modal-gallery-content', component: 'Column', alignment: 'start', children: { explicitList: ['modal-gallery-title', 'modal-gallery-copy', 'modal-gallery-divider', 'modal-gallery-list'] } },
        { id: 'modal-gallery-title', component: 'Text', text: { literalString: 'Pre-release review notes' }, usageHint: 'h3' },
        { id: 'modal-gallery-copy', component: 'Text', text: { literalString: 'The dialog content is rendered entirely from protocol components so it can be tested inside examples/basic.' }, usageHint: 'body' },
        { id: 'modal-gallery-divider', component: 'Divider' },
        { id: 'modal-gallery-list', component: 'List', children: { template: { componentId: 'modal-gallery-item', dataBinding: '/reviewNotes' } } },
        { id: 'modal-gallery-item', component: 'Card', child: 'modal-gallery-row' },
        { id: 'modal-gallery-row', component: 'Row', alignment: 'space-between', children: { explicitList: ['modal-gallery-check', 'modal-gallery-text'] } },
        { id: 'modal-gallery-check', component: 'CheckBox', label: { literalString: '' }, value: { path: 'done' } },
        { id: 'modal-gallery-text', component: 'Text', text: { path: 'label' }, usageHint: 'body' },
      ],
    },
  },
  {
    updateDataModel: {
      surfaceId: 'media-gallery',
      value: {
        reviewNotes: [
          { label: 'Verify image shells match renderer card language', done: true },
          { label: 'Confirm video and audio controls inherit updated tokens', done: true },
          { label: 'Check modal close and escape interactions', done: false },
        ],
      },
    },
  },
]
