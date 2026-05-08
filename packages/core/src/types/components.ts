// A2UI v0.9 Component Property Types

import type {
  DynamicString,
  DynamicNumber,
  DynamicBoolean,
  DynamicStringList,
  ChildList,
  Action,
  ValidationCheck,
} from './protocol'

// ─── Layout Components ───

export interface RowProps {
  alignment?: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
  children?: ChildList
}

export interface ColumnProps {
  alignment?: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
  children?: ChildList
}

export interface ListProps {
  children?: ChildList
}

// ─── Display Components ───

export interface TextProps {
  text: DynamicString
  usageHint?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption'
}

export interface ImageProps {
  url: DynamicString
  alt?: DynamicString
}

export interface IconProps {
  icon: DynamicString
}

export interface VideoProps {
  url: DynamicString
}

export interface AudioPlayerProps {
  url: DynamicString
}

export interface DividerProps {}

// ─── Container Components ───

export interface CardProps {
  child: string // ComponentId
}

export interface TabItem {
  title: string
  child: string // ComponentId
}

export interface TabsProps {
  tabs: TabItem[]
}

export interface ModalProps {
  trigger: string // ComponentId (Button)
  child: string   // ComponentId
}

// ─── Interactive Components ───

export interface ButtonProps {
  label: DynamicString
  action?: Action
  variant?: 'primary' | 'borderless' | 'default'
  checks?: ValidationCheck[]
}

// ─── Input Components ───

export interface TextFieldProps {
  label: DynamicString
  value: DynamicString
  placeholder?: DynamicString
  checks?: ValidationCheck[]
}

export interface CheckBoxProps {
  label: DynamicString
  value: DynamicBoolean
}

export interface ChoiceOption {
  label: string
  value: string
}

export interface ChoicePickerProps {
  options: ChoiceOption[]
  value: DynamicString | DynamicStringList
  multi?: boolean
}

export interface SliderProps {
  min: DynamicNumber
  max: DynamicNumber
  step?: DynamicNumber
  value: DynamicNumber
}

export interface DateTimeInputProps {
  mode: 'date' | 'time' | 'datetime'
  value: DynamicString
  label?: DynamicString
}

// ─── Component Type Map ───

export interface ComponentTypeMap {
  Text: TextProps
  Image: ImageProps
  Icon: IconProps
  Video: VideoProps
  AudioPlayer: AudioPlayerProps
  Divider: DividerProps
  Row: RowProps
  Column: ColumnProps
  List: ListProps
  Card: CardProps
  Tabs: TabsProps
  Modal: ModalProps
  Button: ButtonProps
  TextField: TextFieldProps
  CheckBox: CheckBoxProps
  ChoicePicker: ChoicePickerProps
  Slider: SliderProps
  DateTimeInput: DateTimeInputProps
}
