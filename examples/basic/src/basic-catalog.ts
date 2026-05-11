import type { A2UIServerMessage } from '@a2ui/vue-core'

export type BasicCatalogSection =
  | 'Layout'
  | 'Content'
  | 'Input'
  | 'Navigation'
  | 'Decoration'

export type BasicCatalogProp = {
  name: string
  description: string
  defaultValue: string
}

export type BasicCatalogEntry = {
  id: string
  label: string
  title: string
  section: BasicCatalogSection
  description: string
  usage: Record<string, unknown>
  props: BasicCatalogProp[]
  messages: A2UIServerMessage[]
}

export type BasicCatalogMeta = {
  badge: string
  icon: string
  status: string
  signature: string
  notes: string[]
}

export type BasicCatalogScenario = {
  label: string
  summary: string
  usage: Record<string, unknown>
  messages: A2UIServerMessage[]
}

export const basicCatalogSectionMeta: Record<BasicCatalogSection, { icon: string; description: string }> = {
  Layout: {
    icon: 'layout',
    description: 'Structure and composition primitives.',
  },
  Content: {
    icon: 'content',
    description: 'Typography, imagery, and media output.',
  },
  Input: {
    icon: 'input',
    description: 'Fields, controls, and bound selections.',
  },
  Navigation: {
    icon: 'navigation',
    description: 'Actions, tabs, and overlay flows.',
  },
  Decoration: {
    icon: 'decoration',
    description: 'Quiet separators and supporting accents.',
  },
}

const catalogIllustration =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' rx='32' fill='%23f7f4ff'/><rect x='56' y='56' width='528' height='248' rx='24' fill='white' stroke='%23ddd6fe'/><rect x='92' y='100' width='152' height='18' rx='9' fill='%23818cf8'/><rect x='92' y='136' width='238' height='12' rx='6' fill='%23c4b5fd'/><rect x='92' y='160' width='204' height='12' rx='6' fill='%23d8b4fe'/><rect x='390' y='94' width='140' height='140' rx='24' fill='%236366f1'/><path d='M428 166l26 26 40-40' stroke='white' stroke-width='16' stroke-linecap='round' stroke-linejoin='round' fill='none'/><rect x='92' y='214' width='438' height='46' rx='16' fill='%23f5f3ff' stroke='%23e9d5ff'/></svg>"

const sampleVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const sampleAudioUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'

const sectionOrder: BasicCatalogSection[] = [
  'Layout',
  'Content',
  'Input',
  'Navigation',
  'Decoration',
]

function createMessages(
  surfaceId: string,
  agentDisplayName: string,
  components: Record<string, any>[],
  dataModel?: Record<string, unknown>,
  primaryColor = '#6d5efc',
): A2UIServerMessage[] {
  const normalizedComponents = components.some((component) => component.id === 'root')
    ? components
    : [
        {
          id: 'root',
          component: 'Column',
          alignment: 'start',
          children: {
            explicitList: [components[0]?.id ?? 'preview'],
          },
        },
        ...components,
      ]

  const messages: A2UIServerMessage[] = [
    {
      createSurface: {
        surfaceId,
        catalogId: 'a2ui.org/standard-catalog/v0.9',
        theme: {
          primaryColor,
          agentDisplayName,
        },
      },
    },
    {
      updateComponents: {
        surfaceId,
        components: normalizedComponents,
      },
    },
  ]

  if (dataModel) {
    messages.push({
      updateDataModel: {
        surfaceId,
        value: dataModel,
      },
    })
  }

  return messages
}

export const basicCatalogEntries: BasicCatalogEntry[] = [
  {
    id: 'row',
    label: 'Row',
    title: 'Row',
    section: 'Layout',
    description: 'Horizontal flex container that distributes child components across a single line with compact spacing.',
    usage: {
      id: 'row-preview',
      component: 'Row',
      alignment: 'space-between',
      children: { explicitList: ['row-left', 'row-center', 'row-right'] },
    },
    props: [
      {
        name: 'alignment',
        description: 'Controls how child components are distributed along the row.',
        defaultValue: 'start',
      },
      {
        name: 'children',
        description: 'Explicit child IDs or a template child list rendered inside the row.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-row', 'Row', [
      { id: 'row-preview', component: 'Row', alignment: 'space-between', children: { explicitList: ['row-left', 'row-center', 'row-right'] } },
      { id: 'row-left', component: 'Text', text: { literalString: 'Left' }, usageHint: 'body' },
      { id: 'row-center', component: 'Text', text: { literalString: 'Center' }, usageHint: 'body' },
      { id: 'row-right', component: 'Text', text: { literalString: 'Right' }, usageHint: 'body' },
    ]),
  },
  {
    id: 'column',
    label: 'Column',
    title: 'Column',
    section: 'Layout',
    description: 'Vertical stack container for forms, cards, and narrative blocks with consistent spacing.',
    usage: {
      id: 'column-preview',
      component: 'Column',
      alignment: 'start',
      children: { explicitList: ['column-caption', 'column-title', 'column-copy'] },
    },
    props: [
      {
        name: 'alignment',
        description: 'Controls the horizontal alignment of children inside the vertical stack.',
        defaultValue: 'start',
      },
      {
        name: 'children',
        description: 'Explicit child IDs or a template child list rendered from top to bottom.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-column', 'Column', [
      { id: 'column-preview', component: 'Column', alignment: 'start', children: { explicitList: ['column-caption', 'column-title', 'column-copy'] } },
      { id: 'column-caption', component: 'Text', text: { literalString: 'CATALOG COLUMN' }, usageHint: 'caption' },
      { id: 'column-title', component: 'Text', text: { literalString: 'Stack content with stable rhythm' }, usageHint: 'h4' },
      { id: 'column-copy', component: 'Text', text: { literalString: 'Column is the default composition primitive for forms, settings panels, and editorial blocks.' }, usageHint: 'body' },
    ]),
  },
  {
    id: 'list',
    label: 'List',
    title: 'List',
    section: 'Layout',
    description: 'List renders repeated items with template binding, making it the core primitive for feeds and checklists.',
    usage: {
      id: 'task-list',
      component: 'List',
      children: {
        template: {
          componentId: 'task-card',
          dataBinding: '/tasks',
        },
      },
    },
    props: [
      {
        name: 'children',
        description: 'Accepts either an explicit child list or a template child list bound to array data.',
        defaultValue: '—',
      },
    ],
    messages: createMessages(
      'catalog-list',
      'List',
      [
        { id: 'task-list', component: 'List', children: { template: { componentId: 'task-card', dataBinding: '/tasks' } } },
        { id: 'task-card', component: 'Card', child: 'task-card-row' },
        { id: 'task-card-row', component: 'Row', alignment: 'space-between', children: { explicitList: ['task-check', 'task-title'] } },
        { id: 'task-check', component: 'CheckBox', label: { literalString: '' }, value: { path: 'done' } },
        { id: 'task-title', component: 'Text', text: { path: 'title' }, usageHint: 'body' },
      ],
      {
        tasks: [
          { title: 'Publish renderer tokens', done: true },
          { title: 'Verify list template scope', done: false },
          { title: 'Document examples/basic patterns', done: false },
        ],
      },
      '#10b981',
    ),
  },
  {
    id: 'card',
    label: 'Card',
    title: 'Card',
    section: 'Layout',
    description: 'Card wraps one child tree with elevated chrome and internal padding for grouped information.',
    usage: {
      id: 'insight-card',
      component: 'Card',
      child: 'insight-content',
    },
    props: [
      {
        name: 'child',
        description: 'Component ID rendered inside the card shell.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-card', 'Card', [
      { id: 'insight-card', component: 'Card', child: 'insight-content' },
      { id: 'insight-content', component: 'Column', alignment: 'start', children: { explicitList: ['insight-kicker', 'insight-title', 'insight-copy', 'insight-action'] } },
      { id: 'insight-kicker', component: 'Text', text: { literalString: 'INSIGHT' }, usageHint: 'caption' },
      { id: 'insight-title', component: 'Text', text: { literalString: 'Cards isolate high-signal content' }, usageHint: 'h4' },
      { id: 'insight-copy', component: 'Text', text: { literalString: 'Use Card to wrap summaries, settings groups, media blocks, and templated list items.' }, usageHint: 'body' },
      { id: 'insight-action', component: 'Button', label: { literalString: 'Open record' }, variant: 'primary' },
    ]),
  },
  {
    id: 'text',
    label: 'Text',
    title: 'Text',
    section: 'Content',
    description: 'Text covers the core type scale from headings to body and caption copy using usage hints.',
    usage: {
      id: 'headline',
      component: 'Text',
      text: { literalString: 'Composable Surface Studio' },
      usageHint: 'h1',
    },
    props: [
      {
        name: 'text',
        description: 'Literal or bound string content rendered by the component.',
        defaultValue: '—',
      },
      {
        name: 'usageHint',
        description: 'Selects the semantic and visual text treatment such as h1, h4, body, or caption.',
        defaultValue: 'body',
      },
    ],
    messages: createMessages('catalog-text', 'Text', [
      { id: 'text-preview', component: 'Column', alignment: 'start', children: { explicitList: ['text-h1', 'text-h4', 'text-body', 'text-caption'] } },
      { id: 'text-h1', component: 'Text', text: { literalString: 'Composable Surface Studio' }, usageHint: 'h1' },
      { id: 'text-h4', component: 'Text', text: { literalString: 'Typography scales with role-based hints' }, usageHint: 'h4' },
      { id: 'text-body', component: 'Text', text: { literalString: 'Text is the backbone of every generated surface, from screen titles to supporting instructions.' }, usageHint: 'body' },
      { id: 'text-caption', component: 'Text', text: { literalString: 'Caption styles are useful for labels, metadata, and tiny status cues.' }, usageHint: 'caption' },
    ]),
  },
  {
    id: 'image',
    label: 'Image',
    title: 'Image',
    section: 'Content',
    description: 'Image renders a responsive media block with rounded framing and graceful empty handling.',
    usage: {
      id: 'hero-image',
      component: 'Image',
      url: { literalString: catalogIllustration },
      alt: { literalString: 'Catalog illustration' },
    },
    props: [
      {
        name: 'url',
        description: 'Image source URL or data URI.',
        defaultValue: '—',
      },
      {
        name: 'alt',
        description: 'Alternative text used for accessibility.',
        defaultValue: '""',
      },
    ],
    messages: createMessages('catalog-image', 'Image', [
      { id: 'hero-image', component: 'Image', url: { literalString: catalogIllustration }, alt: { literalString: 'Catalog illustration' } },
    ]),
  },
  {
    id: 'icon',
    label: 'Icon',
    title: 'Icon',
    section: 'Content',
    description: 'Icon provides a compact badge-like visual marker for metadata rows and action clusters.',
    usage: {
      id: 'status-icon',
      component: 'Icon',
      icon: { literalString: 'A2' },
    },
    props: [
      {
        name: 'icon',
        description: 'Text or symbolic content displayed inside the icon badge.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-icon', 'Icon', [
      { id: 'icon-preview', component: 'Row', alignment: 'start', children: { explicitList: ['icon-a2', 'icon-ui', 'icon-api'] } },
      { id: 'icon-a2', component: 'Icon', icon: { literalString: 'A2' } },
      { id: 'icon-ui', component: 'Icon', icon: { literalString: 'UI' } },
      { id: 'icon-api', component: 'Icon', icon: { literalString: 'API' } },
    ]),
  },
  {
    id: 'video',
    label: 'Video',
    title: 'Video',
    section: 'Content',
    description: 'Video wraps a native player in the renderer visual language, with safe fallback when no source is present.',
    usage: {
      id: 'media-video',
      component: 'Video',
      url: { literalString: sampleVideoUrl },
    },
    props: [
      {
        name: 'url',
        description: 'Video source URL.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-video', 'Video', [
      { id: 'media-video', component: 'Video', url: { literalString: sampleVideoUrl } },
    ]),
  },
  {
    id: 'audio-player',
    label: 'AudioPlayer',
    title: 'AudioPlayer',
    section: 'Content',
    description: 'AudioPlayer shows a compact native audio control inside a framed shell that matches the rest of the catalog.',
    usage: {
      id: 'media-audio',
      component: 'AudioPlayer',
      url: { literalString: sampleAudioUrl },
    },
    props: [
      {
        name: 'url',
        description: 'Audio source URL.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-audio', 'AudioPlayer', [
      { id: 'media-audio', component: 'AudioPlayer', url: { literalString: sampleAudioUrl } },
    ]),
  },
  {
    id: 'text-field',
    label: 'TextField',
    title: 'TextField',
    section: 'Input',
    description: 'TextField handles labeled text input with placeholders, validation checks, and data model binding.',
    usage: {
      id: 'contact-name',
      component: 'TextField',
      label: { literalString: 'Name' },
      value: { path: '/form/name' },
      placeholder: { literalString: 'Enter your name' },
    },
    props: [
      {
        name: 'label',
        description: 'Field label shown above the input.',
        defaultValue: '—',
      },
      {
        name: 'value',
        description: 'Bound data path for the field value.',
        defaultValue: '—',
      },
      {
        name: 'placeholder',
        description: 'Optional hint displayed when the input is empty.',
        defaultValue: '""',
      },
      {
        name: 'checks',
        description: 'Optional validation functions used to gate dependent actions.',
        defaultValue: '[]',
      },
    ],
    messages: createMessages(
      'catalog-text-field',
      'TextField',
      [
        { id: 'text-field-preview', component: 'Column', alignment: 'start', children: { explicitList: ['field-name', 'field-email'] } },
        { id: 'field-name', component: 'TextField', label: { literalString: 'Name' }, value: { path: '/form/name' }, placeholder: { literalString: 'Enter your name' } },
        { id: 'field-email', component: 'TextField', label: { literalString: 'Email' }, value: { path: '/form/email' }, placeholder: { literalString: 'ops@a2ui.dev' } },
      ],
      {
        form: {
          name: 'Jamie Chen',
          email: 'ops@a2ui.dev',
        },
      },
    ),
  },
  {
    id: 'checkbox',
    label: 'CheckBox',
    title: 'CheckBox',
    section: 'Input',
    description: 'CheckBox binds boolean state and supports both labeled rows and compact icon-only usage inside lists.',
    usage: {
      id: 'checkbox-1',
      component: 'CheckBox',
      label: { literalString: 'Notify reviewers on publish' },
      value: { path: '/preferences/notify' },
    },
    props: [
      {
        name: 'label',
        description: 'Optional label displayed next to the checkbox.',
        defaultValue: '""',
      },
      {
        name: 'value',
        description: 'Bound boolean path that the checkbox reads and updates.',
        defaultValue: '—',
      },
    ],
    messages: createMessages(
      'catalog-checkbox',
      'CheckBox',
      [
        { id: 'checkbox-preview', component: 'Column', alignment: 'start', children: { explicitList: ['checkbox-1', 'checkbox-2'] } },
        { id: 'checkbox-1', component: 'CheckBox', label: { literalString: 'Notify reviewers on publish' }, value: { path: '/preferences/notify' } },
        { id: 'checkbox-2', component: 'CheckBox', label: { literalString: 'Archive summary after sign-off' }, value: { path: '/preferences/archive' } },
      ],
      {
        preferences: {
          notify: true,
          archive: false,
        },
      },
    ),
  },
  {
    id: 'slider',
    label: 'Slider',
    title: 'Slider',
    section: 'Input',
    description: 'Slider binds numeric values with instant feedback and tokenized track styling.',
    usage: {
      id: 'threshold-slider',
      component: 'Slider',
      min: { literalNumber: 0 },
      max: { literalNumber: 100 },
      step: { literalNumber: 5 },
      value: { path: '/settings/threshold' },
    },
    props: [
      {
        name: 'min',
        description: 'Minimum allowed numeric value.',
        defaultValue: '0',
      },
      {
        name: 'max',
        description: 'Maximum allowed numeric value.',
        defaultValue: '100',
      },
      {
        name: 'step',
        description: 'Increment between selectable values.',
        defaultValue: '1',
      },
      {
        name: 'value',
        description: 'Bound numeric path updated as the slider moves.',
        defaultValue: '—',
      },
    ],
    messages: createMessages(
      'catalog-slider',
      'Slider',
      [
        { id: 'slider-preview', component: 'Column', alignment: 'start', children: { explicitList: ['slider-copy', 'threshold-slider'] } },
        { id: 'slider-copy', component: 'Text', text: { literalString: 'Confidence threshold' }, usageHint: 'body' },
        { id: 'threshold-slider', component: 'Slider', min: { literalNumber: 0 }, max: { literalNumber: 100 }, step: { literalNumber: 5 }, value: { path: '/settings/threshold' } },
      ],
      {
        settings: {
          threshold: 70,
        },
      },
      '#f59e0b',
    ),
  },
  {
    id: 'datetime-input',
    label: 'DateTimeInput',
    title: 'DateTimeInput',
    section: 'Input',
    description: 'DateTimeInput wraps native date and time controls with renderer spacing, radius, and focus treatment.',
    usage: {
      id: 'launch-window',
      component: 'DateTimeInput',
      label: { literalString: 'Launch window' },
      mode: 'datetime',
      value: { path: '/schedule/launchAt' },
    },
    props: [
      {
        name: 'mode',
        description: 'Selects the native input type: date, time, or datetime.',
        defaultValue: 'date',
      },
      {
        name: 'value',
        description: 'Bound string path updated with the chosen value.',
        defaultValue: '—',
      },
      {
        name: 'label',
        description: 'Optional label displayed above the control.',
        defaultValue: '""',
      },
    ],
    messages: createMessages(
      'catalog-datetime',
      'DateTimeInput',
      [
        { id: 'datetime-preview', component: 'Column', alignment: 'start', children: { explicitList: ['date-field', 'time-field', 'datetime-field'] } },
        { id: 'date-field', component: 'DateTimeInput', label: { literalString: 'Review date' }, mode: 'date', value: { path: '/schedule/reviewDate' } },
        { id: 'time-field', component: 'DateTimeInput', label: { literalString: 'Start time' }, mode: 'time', value: { path: '/schedule/startTime' } },
        { id: 'datetime-field', component: 'DateTimeInput', label: { literalString: 'Launch window' }, mode: 'datetime', value: { path: '/schedule/launchAt' } },
      ],
      {
        schedule: {
          reviewDate: '2026-05-09',
          startTime: '09:30',
          launchAt: '2026-05-12T14:00',
        },
      },
    ),
  },
  {
    id: 'choice-picker',
    label: 'ChoicePicker',
    title: 'ChoicePicker',
    section: 'Input',
    description: 'ChoicePicker provides compact single-select and multi-select chips bound directly to the data model.',
    usage: {
      id: 'role-picker',
      component: 'ChoicePicker',
      options: [
        { label: 'Assistant', value: 'assistant' },
        { label: 'Researcher', value: 'researcher' },
        { label: 'Coder', value: 'coder' },
      ],
      value: { path: '/form/role' },
    },
    props: [
      {
        name: 'options',
        description: 'Array of label/value pairs rendered as chips.',
        defaultValue: '[]',
      },
      {
        name: 'value',
        description: 'Bound string or string[] path updated as options are selected.',
        defaultValue: '—',
      },
      {
        name: 'multi',
        description: 'Enables multi-select behavior when true.',
        defaultValue: 'false',
      },
    ],
    messages: createMessages(
      'catalog-choice-picker',
      'ChoicePicker',
      [
        { id: 'choice-preview', component: 'Column', alignment: 'start', children: { explicitList: ['choice-single-label', 'choice-single', 'choice-multi-label', 'choice-multi'] } },
        { id: 'choice-single-label', component: 'Text', text: { literalString: 'Single select' }, usageHint: 'body' },
        {
          id: 'choice-single',
          component: 'ChoicePicker',
          options: [
            { label: 'Assistant', value: 'assistant' },
            { label: 'Researcher', value: 'researcher' },
            { label: 'Coder', value: 'coder' },
          ],
          value: { path: '/form/role' },
        },
        { id: 'choice-multi-label', component: 'Text', text: { literalString: 'Multi select' }, usageHint: 'body' },
        {
          id: 'choice-multi',
          component: 'ChoicePicker',
          multi: true,
          options: [
            { label: 'Email', value: 'email' },
            { label: 'Slack', value: 'slack' },
            { label: 'Digest', value: 'digest' },
          ],
          value: { path: '/form/channels' },
        },
      ],
      {
        form: {
          role: 'assistant',
          channels: ['email', 'digest'],
        },
      },
    ),
  },
  {
    id: 'button',
    label: 'Button',
    title: 'Button',
    section: 'Navigation',
    description: 'Button supports default, primary, and borderless variants and can emit action events when clicked.',
    usage: {
      id: 'submit-button',
      component: 'Button',
      label: { literalString: 'Publish surface' },
      variant: 'primary',
      action: {
        event: {
          name: 'publish_surface',
          context: {
            source: { literalString: 'basic-catalog' },
          },
        },
      },
    },
    props: [
      {
        name: 'label',
        description: 'Button label content.',
        defaultValue: '—',
      },
      {
        name: 'variant',
        description: 'Visual style variant: default, primary, or borderless.',
        defaultValue: 'default',
      },
      {
        name: 'action',
        description: 'Optional emitted event or function call executed on click.',
        defaultValue: 'undefined',
      },
      {
        name: 'checks',
        description: 'Validation checks that must pass before click actions fire.',
        defaultValue: '[]',
      },
    ],
    messages: createMessages('catalog-button', 'Button', [
      { id: 'button-preview', component: 'Row', alignment: 'start', children: { explicitList: ['button-default', 'button-primary', 'button-borderless'] } },
      {
        id: 'button-default',
        component: 'Button',
        label: { literalString: 'Default' },
        variant: 'default',
        action: { event: { name: 'button_default', context: { variant: { literalString: 'default' } } } },
      },
      {
        id: 'button-primary',
        component: 'Button',
        label: { literalString: 'Primary' },
        variant: 'primary',
        action: { event: { name: 'button_primary', context: { variant: { literalString: 'primary' } } } },
      },
      {
        id: 'button-borderless',
        component: 'Button',
        label: { literalString: 'Borderless' },
        variant: 'borderless',
        action: { event: { name: 'button_borderless', context: { variant: { literalString: 'borderless' } } } },
      },
    ]),
  },
  {
    id: 'tabs',
    label: 'Tabs',
    title: 'Tabs',
    section: 'Navigation',
    description: 'Tabs handles simple multi-panel navigation by switching between child component trees.',
    usage: {
      id: 'settings-tabs',
      component: 'Tabs',
      tabs: [
        { title: 'Overview', child: 'tab-overview' },
        { title: 'Settings', child: 'tab-settings' },
      ],
    },
    props: [
      {
        name: 'tabs',
        description: 'Array of tab definitions with visible title and target child component ID.',
        defaultValue: '[]',
      },
    ],
    messages: createMessages('catalog-tabs', 'Tabs', [
      {
        id: 'settings-tabs',
        component: 'Tabs',
        tabs: [
          { title: 'Overview', child: 'tab-overview' },
          { title: 'Settings', child: 'tab-settings' },
        ],
      },
      { id: 'tab-overview', component: 'Column', alignment: 'start', children: { explicitList: ['tab-overview-title', 'tab-overview-copy'] } },
      { id: 'tab-overview-title', component: 'Text', text: { literalString: 'Overview tab' }, usageHint: 'h4' },
      { id: 'tab-overview-copy', component: 'Text', text: { literalString: 'Use this panel for summaries, KPIs, and quick status context.' }, usageHint: 'body' },
      { id: 'tab-settings', component: 'Column', alignment: 'start', children: { explicitList: ['tab-settings-title', 'tab-settings-copy'] } },
      { id: 'tab-settings-title', component: 'Text', text: { literalString: 'Settings tab' }, usageHint: 'h4' },
      { id: 'tab-settings-copy', component: 'Text', text: { literalString: 'Tabs can switch between more detailed settings surfaces without leaving the current card.' }, usageHint: 'body' },
    ]),
  },
  {
    id: 'modal',
    label: 'Modal',
    title: 'Modal',
    section: 'Navigation',
    description: 'Modal opens a teleported overlay using one component as a trigger and another as the modal body.',
    usage: {
      id: 'review-modal',
      component: 'Modal',
      trigger: 'review-trigger',
      child: 'review-content',
    },
    props: [
      {
        name: 'trigger',
        description: 'Component ID used as the modal trigger.',
        defaultValue: '—',
      },
      {
        name: 'child',
        description: 'Component ID rendered inside the modal content area.',
        defaultValue: '—',
      },
    ],
    messages: createMessages('catalog-modal', 'Modal', [
      { id: 'modal-preview', component: 'Column', alignment: 'start', children: { explicitList: ['modal-copy', 'review-modal'] } },
      { id: 'modal-copy', component: 'Text', text: { literalString: 'Open the dialog to inspect overlay, focus, and stacked content behavior.' }, usageHint: 'body' },
      { id: 'review-modal', component: 'Modal', trigger: 'review-trigger', child: 'review-content' },
      { id: 'review-trigger', component: 'Button', label: { literalString: 'Open Review Modal' }, variant: 'primary' },
      { id: 'review-content', component: 'Column', alignment: 'start', children: { explicitList: ['review-title', 'review-divider', 'review-body', 'review-note'] } },
      { id: 'review-title', component: 'Text', text: { literalString: 'Release review notes' }, usageHint: 'h3' },
      { id: 'review-divider', component: 'Divider' },
      { id: 'review-body', component: 'Text', text: { literalString: 'Modal is useful for confirmation flows, rich details, or compact multi-step content.' }, usageHint: 'body' },
      { id: 'review-note', component: 'Text', text: { literalString: 'Press Escape or click outside the dialog to close it.' }, usageHint: 'caption' },
    ]),
  },
  {
    id: 'divider',
    label: 'Divider',
    title: 'Divider',
    section: 'Decoration',
    description: 'Divider creates quiet visual separation between component groups without adding extra structural markup.',
    usage: {
      id: 'section-divider',
      component: 'Divider',
    },
    props: [],
    messages: createMessages('catalog-divider', 'Divider', [
      { id: 'divider-preview', component: 'Column', alignment: 'start', children: { explicitList: ['divider-top', 'section-divider', 'divider-bottom'] } },
      { id: 'divider-top', component: 'Text', text: { literalString: 'Section header' }, usageHint: 'h4' },
      { id: 'section-divider', component: 'Divider' },
      { id: 'divider-bottom', component: 'Text', text: { literalString: 'Use Divider when two groups need separation but not another card or tab.' }, usageHint: 'body' },
    ]),
  },
]

export const basicCatalogMeta: Record<string, BasicCatalogMeta> = {
  row: {
    badge: 'R',
    icon: 'row',
    status: 'Structural',
    signature: '<Row alignment="space-between" children={...} />',
    notes: [
      'Use Row when sibling components should share one horizontal track.',
      'Best with text, actions, toggles, and compact cards.',
    ],
  },
  column: {
    badge: 'C',
    icon: 'column',
    status: 'Structural',
    signature: '<Column alignment="start" children={...} />',
    notes: [
      'Column is the default stacking primitive for most generated surfaces.',
      'Use it to preserve vertical rhythm across mixed content.',
    ],
  },
  list: {
    badge: 'Ls',
    icon: 'list',
    status: 'Data-bound',
    signature: '<List children={{ template: { componentId, dataBinding } }} />',
    notes: [
      'List becomes powerful when paired with template child rendering.',
      'Ideal for feeds, task queues, and review items.',
    ],
  },
  card: {
    badge: 'Cd',
    icon: 'card',
    status: 'Container',
    signature: '<Card child="component-id" />',
    notes: [
      'Card wraps one child tree with elevation and padding.',
      'Useful for isolating summaries, forms, media blocks, and overlays.',
    ],
  },
  text: {
    badge: 'T',
    icon: 'text',
    status: 'Core',
    signature: '<Text text={...} usageHint="h1|body|caption" />',
    notes: [
      'Usage hints control both semantics and typography scale.',
      'Prefer Text for all narrative and labeling content inside surfaces.',
    ],
  },
  image: {
    badge: 'Im',
    icon: 'image',
    status: 'Media',
    signature: '<Image url={...} alt={...} />',
    notes: [
      'Image keeps responsive framing and empty-state handling consistent.',
      'Good for hero art, content illustrations, and thumbnails.',
    ],
  },
  icon: {
    badge: 'Ic',
    icon: 'icon',
    status: 'Utility',
    signature: '<Icon icon={...} />',
    notes: [
      'The current renderer treats Icon as a compact badge-like marker.',
      'Useful for metadata rails, stat chips, and button companions.',
    ],
  },
  video: {
    badge: 'V',
    icon: 'video',
    status: 'Media',
    signature: '<Video url={...} />',
    notes: [
      'Video wraps the native player in renderer-aligned chrome.',
      'Use it for tutorials, previews, or rich media reviews.',
    ],
  },
  'audio-player': {
    badge: 'Au',
    icon: 'audio',
    status: 'Media',
    signature: '<AudioPlayer url={...} />',
    notes: [
      'AudioPlayer gives you a compact audio control without custom transport UI.',
      'Works well for voice notes, snippets, and approval commentary.',
    ],
  },
  'text-field': {
    badge: 'Tf',
    icon: 'textField',
    status: 'Input',
    signature: '<TextField label={...} value={...} placeholder={...} />',
    notes: [
      'TextField supports validation-gated flows through checks on downstream actions.',
      'Use it for structured form entry and lightweight settings.',
    ],
  },
  checkbox: {
    badge: 'Cb',
    icon: 'checkbox',
    status: 'Input',
    signature: '<CheckBox label={...} value={...} />',
    notes: [
      'CheckBox supports both labeled rows and compact list usage.',
      'Best for boolean settings, task states, and review confirmations.',
    ],
  },
  slider: {
    badge: 'Sl',
    icon: 'slider',
    status: 'Input',
    signature: '<Slider min={...} max={...} step={...} value={...} />',
    notes: [
      'Slider provides immediate numeric feedback and tokenized track styling.',
      'Good for thresholds, confidence, intensity, and sizing controls.',
    ],
  },
  'datetime-input': {
    badge: 'Dt',
    icon: 'datetime',
    status: 'Input',
    signature: '<DateTimeInput mode="date|time|datetime" value={...} />',
    notes: [
      'DateTimeInput reuses native browser controls for speed and consistency.',
      'Use separate date/time fields when workflows need explicit granularity.',
    ],
  },
  'choice-picker': {
    badge: 'Cp',
    icon: 'choice',
    status: 'Input',
    signature: '<ChoicePicker options={[...]} value={...} multi />',
    notes: [
      'ChoicePicker is best for small discrete option sets.',
      'Single-select and multi-select both bind directly to the data model.',
    ],
  },
  button: {
    badge: 'Bt',
    icon: 'button',
    status: 'Action',
    signature: '<Button label={...} variant="primary" action={...} />',
    notes: [
      'Button is the main action primitive and can emit protocol events.',
      'Combine with checks when actions should be gated by form validity.',
    ],
  },
  tabs: {
    badge: 'Tb',
    icon: 'tabs',
    status: 'Navigation',
    signature: '<Tabs tabs={[{ title, child }]} />',
    notes: [
      'Tabs swaps child trees without leaving the current surface context.',
      'Best for overview/settings splits or compact multi-panel cards.',
    ],
  },
  modal: {
    badge: 'Md',
    icon: 'modal',
    status: 'Overlay',
    signature: '<Modal trigger="component-id" child="component-id" />',
    notes: [
      'Modal opens teleported content while preserving the renderer theme.',
      'Useful for confirmations, richer details, and review dialogs.',
    ],
  },
  divider: {
    badge: 'Dv',
    icon: 'divider',
    status: 'Decoration',
    signature: '<Divider />',
    notes: [
      'Divider is intentionally quiet and should separate groups, not dominate them.',
      'Prefer it when another card or tab would be too heavy.',
    ],
  },
}

export const basicCatalogAdvancedExamples: Record<string, BasicCatalogScenario> = {
  row: {
    label: 'Advanced',
    summary: 'Shows Row coordinating content and action rails inside a compact review toolbar.',
    usage: {
      id: 'review-toolbar',
      component: 'Row',
      alignment: 'space-between',
      children: { explicitList: ['review-count', 'review-actions'] },
    },
    messages: createMessages('advanced-row', 'Advanced Row', [
      { id: 'root', component: 'Card', child: 'review-shell' },
      { id: 'review-shell', component: 'Column', alignment: 'start', children: { explicitList: ['review-kicker', 'review-title', 'review-toolbar'] } },
      { id: 'review-kicker', component: 'Text', text: { literalString: 'REVIEW CENTER' }, usageHint: 'caption' },
      { id: 'review-title', component: 'Text', text: { literalString: 'Use Row to balance status and actions' }, usageHint: 'h4' },
      { id: 'review-toolbar', component: 'Row', alignment: 'space-between', children: { explicitList: ['review-count', 'review-actions'] } },
      { id: 'review-count', component: 'Text', text: { literalString: '3 pending reviews' }, usageHint: 'body' },
      { id: 'review-actions', component: 'Row', alignment: 'end', children: { explicitList: ['review-secondary', 'review-primary'] } },
      { id: 'review-secondary', component: 'Button', label: { literalString: 'Archive' }, variant: 'borderless' },
      { id: 'review-primary', component: 'Button', label: { literalString: 'Approve Batch' }, variant: 'primary' },
    ]),
  },
  column: {
    label: 'Advanced',
    summary: 'Uses Column as the main editorial stack for a release summary module.',
    usage: {
      id: 'release-column',
      component: 'Column',
      alignment: 'start',
      children: { explicitList: ['release-cap', 'release-title', 'release-copy', 'release-action'] },
    },
    messages: createMessages('advanced-column', 'Advanced Column', [
      { id: 'release-column', component: 'Column', alignment: 'start', children: { explicitList: ['release-cap', 'release-title', 'release-copy', 'release-action'] } },
      { id: 'release-cap', component: 'Text', text: { literalString: 'MILESTONE' }, usageHint: 'caption' },
      { id: 'release-title', component: 'Text', text: { literalString: 'Column keeps long-form content readable' }, usageHint: 'h3' },
      { id: 'release-copy', component: 'Text', text: { literalString: 'Stack labels, dense summaries, controls, and supporting hints vertically when the priority is scannability over compression.' }, usageHint: 'body' },
      { id: 'release-action', component: 'Button', label: { literalString: 'Read Change Log' }, variant: 'primary' },
    ]),
  },
  list: {
    label: 'Advanced',
    summary: 'Uses List with a richer repeated card layout for an approval queue.',
    usage: {
      id: 'approval-list',
      component: 'List',
      children: { template: { componentId: 'approval-item', dataBinding: '/approvals' } },
    },
    messages: createMessages(
      'advanced-list',
      'Advanced List',
      [
        { id: 'root', component: 'Column', alignment: 'start', children: { explicitList: ['approval-title', 'approval-list'] } },
        { id: 'approval-title', component: 'Text', text: { literalString: 'Approval Queue' }, usageHint: 'h3' },
        { id: 'approval-list', component: 'List', children: { template: { componentId: 'approval-item', dataBinding: '/approvals' } } },
        { id: 'approval-item', component: 'Card', child: 'approval-item-column' },
        { id: 'approval-item-column', component: 'Column', alignment: 'start', children: { explicitList: ['approval-item-top', 'approval-item-meta'] } },
        { id: 'approval-item-top', component: 'Row', alignment: 'space-between', children: { explicitList: ['approval-item-name', 'approval-item-owner'] } },
        { id: 'approval-item-name', component: 'Text', text: { path: 'name' }, usageHint: 'h4' },
        { id: 'approval-item-owner', component: 'Text', text: { path: 'owner' }, usageHint: 'caption' },
        { id: 'approval-item-meta', component: 'Text', text: { path: 'summary' }, usageHint: 'body' },
      ],
      {
        approvals: [
          { name: 'Launch checklist', owner: 'Ops', summary: 'Final pass for rollout sequencing and alerting.' },
          { name: 'Partner banner', owner: 'Brand', summary: 'Localized art set needs legal confirmation.' },
          { name: 'Usage digest', owner: 'Data', summary: 'Daily report template for market-facing metrics.' },
        ],
      },
      '#10b981',
    ),
  },
  card: {
    label: 'Advanced',
    summary: 'Shows Card wrapping a metrics summary with multiple nested layout layers.',
    usage: {
      id: 'metrics-card',
      component: 'Card',
      child: 'metrics-column',
    },
    messages: createMessages('advanced-card', 'Advanced Card', [
      { id: 'metrics-card', component: 'Card', child: 'metrics-column' },
      { id: 'metrics-column', component: 'Column', alignment: 'start', children: { explicitList: ['metrics-top', 'metrics-divider', 'metrics-bottom'] } },
      { id: 'metrics-top', component: 'Row', alignment: 'space-between', children: { explicitList: ['metrics-title', 'metrics-value'] } },
      { id: 'metrics-title', component: 'Text', text: { literalString: 'Activation Rate' }, usageHint: 'body' },
      { id: 'metrics-value', component: 'Text', text: { literalString: '84%' }, usageHint: 'h3' },
      { id: 'metrics-divider', component: 'Divider' },
      { id: 'metrics-bottom', component: 'Text', text: { literalString: 'Cards are useful when one insight needs clear visual ownership inside a larger surface.' }, usageHint: 'body' },
    ]),
  },
  text: {
    label: 'Advanced',
    summary: 'Demonstrates Text across a full editorial hierarchy instead of a single isolated node.',
    usage: {
      id: 'story-title',
      component: 'Text',
      text: { literalString: 'Design systems need hierarchy, not just labels.' },
      usageHint: 'h1',
    },
    messages: createMessages('advanced-text', 'Advanced Text', [
      { id: 'root', component: 'Column', alignment: 'start', children: { explicitList: ['story-cap', 'story-title', 'story-subtitle', 'story-body', 'story-note'] } },
      { id: 'story-cap', component: 'Text', text: { literalString: 'EDITORIAL' }, usageHint: 'caption' },
      { id: 'story-title', component: 'Text', text: { literalString: 'Design systems need hierarchy, not just labels.' }, usageHint: 'h1' },
      { id: 'story-subtitle', component: 'Text', text: { literalString: 'Text becomes much more useful once it carries semantic rhythm.' }, usageHint: 'h4' },
      { id: 'story-body', component: 'Text', text: { literalString: 'Advanced layouts rely on title, supporting copy, metadata, and action language all feeling related without looking identical.' }, usageHint: 'body' },
      { id: 'story-note', component: 'Text', text: { literalString: 'Caption styles are effective for context and low-priority metadata.' }, usageHint: 'caption' },
    ]),
  },
  image: {
    label: 'Advanced',
    summary: 'Places Image inside a richer content card with supporting narrative.',
    usage: {
      id: 'feature-image',
      component: 'Image',
      url: { literalString: catalogIllustration },
      alt: { literalString: 'Feature illustration' },
    },
    messages: createMessages('advanced-image', 'Advanced Image', [
      { id: 'root', component: 'Card', child: 'image-shell' },
      { id: 'image-shell', component: 'Column', alignment: 'start', children: { explicitList: ['image-cap', 'feature-image', 'image-copy'] } },
      { id: 'image-cap', component: 'Text', text: { literalString: 'MEDIA BLOCK' }, usageHint: 'caption' },
      { id: 'feature-image', component: 'Image', url: { literalString: catalogIllustration }, alt: { literalString: 'Feature illustration' } },
      { id: 'image-copy', component: 'Text', text: { literalString: 'Use Image for illustrations, screenshots, and branded inserts while keeping spacing and framing consistent.' }, usageHint: 'body' },
    ]),
  },
  icon: {
    label: 'Advanced',
    summary: 'Uses Icon as a supporting symbol system inside a compact status rail.',
    usage: {
      id: 'status-icon',
      component: 'Icon',
      icon: { literalString: 'OK' },
    },
    messages: createMessages('advanced-icon', 'Advanced Icon', [
      { id: 'root', component: 'Row', alignment: 'space-between', children: { explicitList: ['icon-ok', 'icon-progress', 'icon-alert'] } },
      { id: 'icon-ok', component: 'Icon', icon: { literalString: 'OK' } },
      { id: 'icon-progress', component: 'Icon', icon: { literalString: 'QA' } },
      { id: 'icon-alert', component: 'Icon', icon: { literalString: '!' } },
    ]),
  },
  video: {
    label: 'Advanced',
    summary: 'Wraps Video with contextual copy so the player sits inside a fuller review experience.',
    usage: {
      id: 'preview-video',
      component: 'Video',
      url: { literalString: sampleVideoUrl },
    },
    messages: createMessages('advanced-video', 'Advanced Video', [
      { id: 'root', component: 'Card', child: 'video-shell' },
      { id: 'video-shell', component: 'Column', alignment: 'start', children: { explicitList: ['video-cap', 'video-head', 'preview-video', 'video-copy'] } },
      { id: 'video-cap', component: 'Text', text: { literalString: 'PREVIEW' }, usageHint: 'caption' },
      { id: 'video-head', component: 'Text', text: { literalString: 'Video review module' }, usageHint: 'h4' },
      { id: 'preview-video', component: 'Video', url: { literalString: sampleVideoUrl } },
      { id: 'video-copy', component: 'Text', text: { literalString: 'Pair video playback with notes, decisions, or release summaries when the clip is part of a broader workflow.' }, usageHint: 'body' },
    ]),
  },
  'audio-player': {
    label: 'Advanced',
    summary: 'Places AudioPlayer inside a richer voice-note review card.',
    usage: {
      id: 'voice-note',
      component: 'AudioPlayer',
      url: { literalString: sampleAudioUrl },
    },
    messages: createMessages('advanced-audio', 'Advanced Audio', [
      { id: 'root', component: 'Card', child: 'audio-shell' },
      { id: 'audio-shell', component: 'Column', alignment: 'start', children: { explicitList: ['audio-cap', 'audio-head', 'voice-note', 'audio-copy'] } },
      { id: 'audio-cap', component: 'Text', text: { literalString: 'VOICE NOTE' }, usageHint: 'caption' },
      { id: 'audio-head', component: 'Text', text: { literalString: 'Approval commentary' }, usageHint: 'h4' },
      { id: 'voice-note', component: 'AudioPlayer', url: { literalString: sampleAudioUrl } },
      { id: 'audio-copy', component: 'Text', text: { literalString: 'AudioPlayer is useful when spoken feedback needs to sit alongside structured review UI.' }, usageHint: 'body' },
    ]),
  },
  'text-field': {
    label: 'Advanced',
    summary: 'Shows TextField as part of a small but realistic data-entry form.',
    usage: {
      id: 'project-name',
      component: 'TextField',
      label: { literalString: 'Project name' },
      value: { path: '/form/projectName' },
      placeholder: { literalString: 'Q3 Launch Hub' },
    },
    messages: createMessages(
      'advanced-text-field',
      'Advanced TextField',
      [
        { id: 'root', component: 'Card', child: 'field-shell' },
        { id: 'field-shell', component: 'Column', alignment: 'start', children: { explicitList: ['field-title', 'project-name', 'project-slug', 'field-action'] } },
        { id: 'field-title', component: 'Text', text: { literalString: 'Create project workspace' }, usageHint: 'h4' },
        { id: 'project-name', component: 'TextField', label: { literalString: 'Project name' }, value: { path: '/form/projectName' }, placeholder: { literalString: 'Q3 Launch Hub' } },
        { id: 'project-slug', component: 'TextField', label: { literalString: 'Project slug' }, value: { path: '/form/projectSlug' }, placeholder: { literalString: 'q3-launch-hub' } },
        { id: 'field-action', component: 'Button', label: { literalString: 'Continue' }, variant: 'primary' },
      ],
      {
        form: {
          projectName: 'Q3 Launch Hub',
          projectSlug: 'q3-launch-hub',
        },
      },
    ),
  },
  checkbox: {
    label: 'Advanced',
    summary: 'Uses CheckBox inside a review checklist rather than as a lone control.',
    usage: {
      id: 'approve-asset',
      component: 'CheckBox',
      label: { literalString: 'Artwork approved for publish' },
      value: { path: '/checks.artwork' },
    },
    messages: createMessages(
      'advanced-checkbox',
      'Advanced CheckBox',
      [
        { id: 'root', component: 'Card', child: 'check-shell' },
        { id: 'check-shell', component: 'Column', alignment: 'start', children: { explicitList: ['check-title', 'approve-asset', 'approve-copy', 'approve-legal'] } },
        { id: 'check-title', component: 'Text', text: { literalString: 'Publish checklist' }, usageHint: 'h4' },
        { id: 'approve-asset', component: 'CheckBox', label: { literalString: 'Artwork approved for publish' }, value: { path: '/checks/artwork' } },
        { id: 'approve-copy', component: 'CheckBox', label: { literalString: 'Copy reviewed by content team' }, value: { path: '/checks/copy' } },
        { id: 'approve-legal', component: 'CheckBox', label: { literalString: 'Legal sign-off received' }, value: { path: '/checks/legal' } },
      ],
      {
        checks: {
          artwork: true,
          copy: true,
          legal: false,
        },
      },
    ),
  },
  slider: {
    label: 'Advanced',
    summary: 'Places Slider inside a scoring settings panel with contextual labels.',
    usage: {
      id: 'confidence-slider',
      component: 'Slider',
      min: { literalNumber: 0 },
      max: { literalNumber: 100 },
      step: { literalNumber: 5 },
      value: { path: '/settings/confidence' },
    },
    messages: createMessages(
      'advanced-slider',
      'Advanced Slider',
      [
        { id: 'root', component: 'Card', child: 'slider-shell' },
        { id: 'slider-shell', component: 'Column', alignment: 'start', children: { explicitList: ['slider-title', 'slider-copy', 'confidence-slider'] } },
        { id: 'slider-title', component: 'Text', text: { literalString: 'Automation confidence' }, usageHint: 'h4' },
        { id: 'slider-copy', component: 'Text', text: { literalString: 'Adjust the threshold before the workflow escalates to manual review.' }, usageHint: 'body' },
        { id: 'confidence-slider', component: 'Slider', min: { literalNumber: 0 }, max: { literalNumber: 100 }, step: { literalNumber: 5 }, value: { path: '/settings/confidence' } },
      ],
      {
        settings: {
          confidence: 75,
        },
      },
      '#f59e0b',
    ),
  },
  'datetime-input': {
    label: 'Advanced',
    summary: 'Combines multiple DateTimeInput controls in a compact scheduling module.',
    usage: {
      id: 'launch-at',
      component: 'DateTimeInput',
      label: { literalString: 'Launch at' },
      mode: 'datetime',
      value: { path: '/schedule/launchAt' },
    },
    messages: createMessages(
      'advanced-datetime',
      'Advanced DateTimeInput',
      [
        { id: 'root', component: 'Card', child: 'time-shell' },
        { id: 'time-shell', component: 'Column', alignment: 'start', children: { explicitList: ['time-title', 'review-date', 'launch-at'] } },
        { id: 'time-title', component: 'Text', text: { literalString: 'Schedule release window' }, usageHint: 'h4' },
        { id: 'review-date', component: 'DateTimeInput', label: { literalString: 'Review date' }, mode: 'date', value: { path: '/schedule/reviewDate' } },
        { id: 'launch-at', component: 'DateTimeInput', label: { literalString: 'Launch at' }, mode: 'datetime', value: { path: '/schedule/launchAt' } },
      ],
      {
        schedule: {
          reviewDate: '2026-05-09',
          launchAt: '2026-05-12T14:00',
        },
      },
    ),
  },
  'choice-picker': {
    label: 'Advanced',
    summary: 'Uses ChoicePicker for a richer selection flow with single and multi-select controls.',
    usage: {
      id: 'persona-picker',
      component: 'ChoicePicker',
      options: [
        { label: 'Ops', value: 'ops' },
        { label: 'Brand', value: 'brand' },
        { label: 'Data', value: 'data' },
      ],
      value: { path: '/preferences/persona' },
    },
    messages: createMessages(
      'advanced-choice-picker',
      'Advanced ChoicePicker',
      [
        { id: 'root', component: 'Card', child: 'choice-shell' },
        { id: 'choice-shell', component: 'Column', alignment: 'start', children: { explicitList: ['choice-title', 'choice-persona-label', 'persona-picker', 'choice-channel-label', 'channel-picker'] } },
        { id: 'choice-title', component: 'Text', text: { literalString: 'Audience configuration' }, usageHint: 'h4' },
        { id: 'choice-persona-label', component: 'Text', text: { literalString: 'Primary owner' }, usageHint: 'body' },
        { id: 'persona-picker', component: 'ChoicePicker', options: [{ label: 'Ops', value: 'ops' }, { label: 'Brand', value: 'brand' }, { label: 'Data', value: 'data' }], value: { path: '/preferences/persona' } },
        { id: 'choice-channel-label', component: 'Text', text: { literalString: 'Delivery channels' }, usageHint: 'body' },
        { id: 'channel-picker', component: 'ChoicePicker', multi: true, options: [{ label: 'Email', value: 'email' }, { label: 'Slack', value: 'slack' }, { label: 'Digest', value: 'digest' }], value: { path: '/preferences/channels' } },
      ],
      {
        preferences: {
          persona: 'ops',
          channels: ['email', 'slack'],
        },
      },
    ),
  },
  button: {
    label: 'Advanced',
    summary: 'Demonstrates Button variants working together in a realistic action footer.',
    usage: {
      id: 'publish-button',
      component: 'Button',
      label: { literalString: 'Publish Changes' },
      variant: 'primary',
    },
    messages: createMessages('advanced-button', 'Advanced Button', [
      { id: 'root', component: 'Card', child: 'button-shell' },
      { id: 'button-shell', component: 'Column', alignment: 'start', children: { explicitList: ['button-title', 'button-actions'] } },
      { id: 'button-title', component: 'Text', text: { literalString: 'Action footer' }, usageHint: 'h4' },
      { id: 'button-actions', component: 'Row', alignment: 'end', children: { explicitList: ['save-button', 'publish-button'] } },
      { id: 'save-button', component: 'Button', label: { literalString: 'Save Draft' }, variant: 'default' },
      { id: 'publish-button', component: 'Button', label: { literalString: 'Publish Changes' }, variant: 'primary' },
    ]),
  },
  tabs: {
    label: 'Advanced',
    summary: 'Uses Tabs as a miniature multi-panel workspace instead of a bare control.',
    usage: {
      id: 'workspace-tabs',
      component: 'Tabs',
      tabs: [{ title: 'Overview', child: 'workspace-overview' }, { title: 'Settings', child: 'workspace-settings' }],
    },
    messages: createMessages('advanced-tabs', 'Advanced Tabs', [
      { id: 'workspace-tabs', component: 'Tabs', tabs: [{ title: 'Overview', child: 'workspace-overview' }, { title: 'Settings', child: 'workspace-settings' }] },
      { id: 'workspace-overview', component: 'Column', alignment: 'start', children: { explicitList: ['overview-title', 'overview-copy'] } },
      { id: 'overview-title', component: 'Text', text: { literalString: 'Overview panel' }, usageHint: 'h4' },
      { id: 'overview-copy', component: 'Text', text: { literalString: 'Tabs work best when multiple related panels need to live in the same visual container.' }, usageHint: 'body' },
      { id: 'workspace-settings', component: 'Column', alignment: 'start', children: { explicitList: ['settings-title', 'settings-copy', 'settings-toggle'] } },
      { id: 'settings-title', component: 'Text', text: { literalString: 'Settings panel' }, usageHint: 'h4' },
      { id: 'settings-copy', component: 'Text', text: { literalString: 'Treat tab children as full subtrees, not just text swaps.' }, usageHint: 'body' },
      { id: 'settings-toggle', component: 'CheckBox', label: { literalString: 'Notify on completion' }, value: { path: '/settings/notify' } },
    ], { settings: { notify: true } }),
  },
  modal: {
    label: 'Advanced',
    summary: 'Shows Modal embedded in a richer review pattern with trigger and body content.',
    usage: {
      id: 'review-modal',
      component: 'Modal',
      trigger: 'review-trigger',
      child: 'review-body',
    },
    messages: createMessages('advanced-modal', 'Advanced Modal', [
      { id: 'root', component: 'Card', child: 'modal-shell' },
      { id: 'modal-shell', component: 'Column', alignment: 'start', children: { explicitList: ['modal-title', 'modal-copy', 'review-modal'] } },
      { id: 'modal-title', component: 'Text', text: { literalString: 'Escalation review' }, usageHint: 'h4' },
      { id: 'modal-copy', component: 'Text', text: { literalString: 'Open the dialog to inspect a richer overlay flow with nested content.' }, usageHint: 'body' },
      { id: 'review-modal', component: 'Modal', trigger: 'review-trigger', child: 'review-body' },
      { id: 'review-trigger', component: 'Button', label: { literalString: 'Open Escalation Review' }, variant: 'primary' },
      { id: 'review-body', component: 'Column', alignment: 'start', children: { explicitList: ['review-body-title', 'review-body-divider', 'review-body-copy'] } },
      { id: 'review-body-title', component: 'Text', text: { literalString: 'Escalated item summary' }, usageHint: 'h3' },
      { id: 'review-body-divider', component: 'Divider' },
      { id: 'review-body-copy', component: 'Text', text: { literalString: 'Modal bodies can contain any renderer subtree, including lists, cards, forms, and supporting notes.' }, usageHint: 'body' },
    ]),
  },
  divider: {
    label: 'Advanced',
    summary: 'Demonstrates Divider separating real sections inside a denser content stack.',
    usage: {
      id: 'review-divider',
      component: 'Divider',
    },
    messages: createMessages('advanced-divider', 'Advanced Divider', [
      { id: 'root', component: 'Column', alignment: 'start', children: { explicitList: ['divider-title', 'divider-copy', 'review-divider', 'divider-followup'] } },
      { id: 'divider-title', component: 'Text', text: { literalString: 'Review summary' }, usageHint: 'h4' },
      { id: 'divider-copy', component: 'Text', text: { literalString: 'One group of content concludes here.' }, usageHint: 'body' },
      { id: 'review-divider', component: 'Divider' },
      { id: 'divider-followup', component: 'Text', text: { literalString: 'The next section starts below with a cleaner transition than another full card.' }, usageHint: 'body' },
    ]),
  },
}

export const basicCatalogGroups = sectionOrder.map((section) => ({
  section,
  entries: basicCatalogEntries.filter((entry) => entry.section === section),
}))
