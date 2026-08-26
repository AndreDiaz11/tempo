export type Direction = 'expense' | 'income';
export type Frequency = 'Único' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Personalizado';
export type Recurrence = 'Semanal' | 'Mensual' | 'Anual' | 'Personalizado';

export interface HistoryRecord {
  date: string;
  amount: number;
  direction: Direction;
}

export interface Item {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  direction: Direction;
  kind: Frequency;
  customMonths: number | '';
  isInstallment: boolean;
  icon: string;
  totalInstallments: number | '';
  currentInstallment: number | '';
  active: boolean;
  history: HistoryRecord[];
}

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  recurrence: Recurrence;
  notes: string;
  icon: string;
  active: boolean;
}

export interface NotificationSettings {
  daysBefore: number;
  time: string;
  repeatMinutes: number;
  vibrate: boolean;
  wakeScreen: boolean;
}

export interface Respaldo {
  app: string;
  version: number;
  exportedAt: string;
  items: Item[];
  subscriptions: Subscription[];
}

/** Entrada generica que combina items/suscripciones/historial/proyecciones para listas y calendario */
export interface Entry {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  direction?: Direction;
  kind?: string;
  icon: string;
  active: boolean;
  isHistory?: boolean;
  isProjected?: boolean;
  isInstallment?: boolean;
  totalInstallments?: number | '';
  currentInstallment?: number | '';
  customMonths?: number | '';
  recurrence?: Recurrence;
  notes?: string;
  __type: 'item' | 'sub';
}
