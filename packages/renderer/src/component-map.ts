// Component type registry - maps A2UI component names to Vue components

import type { Component } from 'vue'

// Built-in component imports
import A2Text from './components/display/Text.vue'
import A2Image from './components/display/Image.vue'
import A2Icon from './components/display/Icon.vue'
import A2Divider from './components/display/Divider.vue'
import A2Row from './components/layout/Row.vue'
import A2Column from './components/layout/Column.vue'
import A2List from './components/layout/List.vue'
import A2Card from './components/container/Card.vue'
import A2Tabs from './components/container/Tabs.vue'
import A2Modal from './components/container/Modal.vue'
import A2Button from './components/interactive/Button.vue'
import A2TextField from './components/input/TextField.vue'
import A2CheckBox from './components/input/CheckBox.vue'
import A2ChoicePicker from './components/input/ChoicePicker.vue'
import A2Slider from './components/input/Slider.vue'
import A2DateTimeInput from './components/input/DateTimeInput.vue'

const componentMap = new Map<string, Component>()

// Register built-in components
const builtinComponents: Record<string, Component> = {
  Text: A2Text,
  Image: A2Image,
  Icon: A2Icon,
  Divider: A2Divider,
  Row: A2Row,
  Column: A2Column,
  List: A2List,
  Card: A2Card,
  Tabs: A2Tabs,
  Modal: A2Modal,
  Button: A2Button,
  TextField: A2TextField,
  CheckBox: A2CheckBox,
  ChoicePicker: A2ChoicePicker,
  Slider: A2Slider,
  DateTimeInput: A2DateTimeInput,
}

for (const [name, comp] of Object.entries(builtinComponents)) {
  componentMap.set(name, comp)
}

export function registerComponent(name: string, component: Component): void {
  componentMap.set(name, component)
}

export function getComponentType(name: string): Component | undefined {
  return componentMap.get(name)
}
