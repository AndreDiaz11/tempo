import { Entry, Frequency, Item, NotificationSettings, Recurrence, Subscription } from '../types';

export const frequencyOptions: { value: Frequency; note: string }[] = [
  { value: 'Único', note: 'Pago único' },
  { value: 'Semanal', note: 'Cada 7 días' },
  { value: 'Quincenal', note: 'Cada 15 días' },
  { value: 'Mensual', note: 'Cada mes' },
  { value: 'Personalizado', note: 'Cada X meses' },
];

export const recurrenceOptions: { value: Recurrence; note: string }[] = [
  { value: 'Semanal', note: 'Cada 7 días' },
  { value: 'Mensual', note: 'Cada mes' },
  { value: 'Anual', note: 'Cada año' },
  { value: 'Personalizado', note: 'Sin repetir sola' },
];

export interface IconOption {
  id: string;
  label: string;
  tone: 'blue' | 'violet' | 'mint' | 'teal' | 'amber' | 'red';
}

export const iconOptions: IconOption[] = [
  { id: 'servicios', label: 'Servicios', tone: 'blue' },
  { id: 'creditos', label: 'Créditos', tone: 'violet' },
  { id: 'juegos', label: 'Juegos', tone: 'mint' },
  { id: 'hogar', label: 'Hogar', tone: 'teal' },
  { id: 'otro', label: 'Otro', tone: 'amber' },
  { id: 'router', label: 'Internet', tone: 'mint' },
  { id: 'card', label: 'Tarjeta', tone: 'blue' },
  { id: 'bank', label: 'Banco', tone: 'teal' },
  { id: 'wallet', label: 'Préstamo', tone: 'teal' },
  { id: 'receipt', label: 'Recibo', tone: 'mint' },
  { id: 'phone', label: 'Teléfono', tone: 'blue' },
  { id: 'stream', label: 'Streaming', tone: 'red' },
  { id: 'software', label: 'Software', tone: 'violet' },
  { id: 'laptop', label: 'Equipo', tone: 'blue' },
  { id: 'shield', label: 'Seguro', tone: 'blue' },
  { id: 'education', label: 'Educación', tone: 'violet' },
  { id: 'health', label: 'Salud', tone: 'red' },
  { id: 'gym', label: 'Gimnasio', tone: 'mint' },
  { id: 'car', label: 'Vehículo', tone: 'blue' },
  { id: 'electricity', label: 'Luz', tone: 'amber' },
  { id: 'water', label: 'Agua', tone: 'blue' },
  { id: 'shopping', label: 'Compras', tone: 'violet' },
];

export const iconPickerOptions = iconOptions.slice(0, 5);

export const defaultNotificationSettings: NotificationSettings = {
  daysBefore: 0,
  time: '08:00',
  repeatMinutes: 60,
  vibrate: true,
  wakeScreen: true,
};

const MAX_PROJECTION_STEPS = 36;

export function nextDate(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function addMonths(value: string, months: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function addYears(value: string, years: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return toDateKey(date);
}

export function advanceDate(item: Pick<Item, 'kind' | 'dueDate' | 'customMonths'>): string | null {
  if (item.kind === 'Semanal') return addDays(item.dueDate, 7);
  if (item.kind === 'Quincenal') return addDays(item.dueDate, 15);
  if (item.kind === 'Mensual') return addMonths(item.dueDate, 1);
  if (item.kind === 'Personalizado') return addMonths(item.dueDate, Number(item.customMonths || 2));
  return null;
}

export function nextSubscriptionDue(sub: Pick<Subscription, 'recurrence' | 'dueDate'>): string | null {
  if (sub.recurrence === 'Semanal') return addDays(sub.dueDate, 7);
  if (sub.recurrence === 'Mensual') return addMonths(sub.dueDate, 1);
  if (sub.recurrence === 'Anual') return addYears(sub.dueDate, 1);
  return null;
}

export function normalizeItem(raw: any): Item {
  let kind: string = raw.kind;
  let customMonths = raw.customMonths;
  let isInstallment = Boolean(raw.isInstallment);

  if (kind === 'Cuota') {
    kind = 'Mensual';
    isInstallment = true;
  } else if (kind === 'Anual') {
    kind = 'Personalizado';
    customMonths = 12;
  } else if (kind === 'Deuda' || kind === 'Suscripción' || kind === 'Suscripcion') {
    kind = 'Único';
  }

  if (!frequencyOptions.some(option => option.value === kind)) kind = 'Mensual';
  if (kind === 'Único') isInstallment = false;

  return {
    id: raw.id || cryptoRandomId(),
    title: raw.title || '',
    amount: Number(raw.amount || 0),
    dueDate: raw.dueDate || nextDate(1),
    direction: raw.direction === 'income' ? 'income' : 'expense',
    kind: kind as Frequency,
    customMonths: kind === 'Personalizado' ? clampNumber(customMonths, 2, 24, 2) : '',
    isInstallment,
    totalInstallments: isInstallment ? Number(raw.totalInstallments || 1) : '',
    currentInstallment: isInstallment ? Number(raw.currentInstallment || 1) : '',
    icon: raw.icon || 'servicios',
    active: raw.active ?? true,
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

export function normalizeSubscription(raw: any): Subscription {
  return {
    id: raw.id || cryptoRandomId(),
    title: raw.title || '',
    amount: Number(raw.amount || 0),
    dueDate: raw.dueDate || nextDate(1),
    recurrence: recurrenceOptions.some(option => option.value === raw.recurrence) ? raw.recurrence : 'Mensual',
    notes: raw.notes || '',
    icon: raw.icon || 'juegos',
    active: raw.active ?? true,
  };
}

function cryptoRandomId(): string {
  // @ts-ignore - RN 0.81+ / Hermes trae randomUUID global
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function projectItemDates(item: Item, targetYear: number, targetMonth: number): string[] {
  if (!advanceDate(item)) return [];
  const dates: string[] = [];
  let cursor = item.dueDate;
  let remainingInstallments = item.isInstallment
    ? Math.max(0, Number(item.totalInstallments) - Number(item.currentInstallment) + 1)
    : Infinity;

  for (let step = 0; step < MAX_PROJECTION_STEPS && remainingInstallments > 0; step++) {
    const date = new Date(`${cursor}T12:00:00`);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (year === targetYear && month === targetMonth) dates.push(cursor);
    if (year > targetYear || (year === targetYear && month > targetMonth)) break;
    const next = advanceDate({ ...item, dueDate: cursor });
    if (!next) break;
    cursor = next;
    remainingInstallments--;
  }
  return dates;
}

export function projectSubscriptionDates(sub: Subscription, targetYear: number, targetMonth: number): string[] {
  if (!nextSubscriptionDue(sub)) return [];
  const dates: string[] = [];
  let cursor = sub.dueDate;

  for (let step = 0; step < MAX_PROJECTION_STEPS; step++) {
    const date = new Date(`${cursor}T12:00:00`);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (year === targetYear && month === targetMonth) dates.push(cursor);
    if (year > targetYear || (year === targetYear && month > targetMonth)) break;
    const next = nextSubscriptionDue({ ...sub, dueDate: cursor });
    if (!next) break;
    cursor = next;
  }
  return dates;
}

export function projectFutureOccurrences(
  items: Item[],
  subscriptions: Subscription[],
  year: number,
  month: number,
): Entry[] {
  const projected: Entry[] = [];

  for (const item of items) {
    if (!item.active || isSameMonth(item.dueDate, year, month)) continue;
    for (const date of projectItemDates(item, year, month)) {
      projected.push({ ...item, dueDate: date, isProjected: true, __type: 'item', id: `${item.id}-proj-${date}` });
    }
  }

  for (const sub of subscriptions) {
    if (!sub.active || isSameMonth(sub.dueDate, year, month)) continue;
    for (const date of projectSubscriptionDates(sub, year, month)) {
      projected.push({ ...sub, dueDate: date, isProjected: true, __type: 'sub', id: `${sub.id}-proj-${date}` });
    }
  }

  return projected;
}

export function deactivateExpiredItems(items: Item[]): { changed: boolean; items: Item[] } {
  const today = todayKey();
  let changed = false;
  const normalizedItems = items.map(item => {
    const finishedQuota = item.isInstallment && Number(item.currentInstallment) >= Number(item.totalInstallments);
    const expired = item.dueDate < today || (finishedQuota && item.dueDate <= today);
    if (item.active && expired) {
      changed = true;
      return { ...item, active: false };
    }
    return item;
  });
  return { changed, items: normalizedItems };
}

export function normalizeNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  return {
    daysBefore: clampNumber(settings.daysBefore, 0, 30, defaultNotificationSettings.daysBefore),
    time: /^\d{2}:\d{2}$/.test(settings.time || '') ? settings.time! : defaultNotificationSettings.time,
    repeatMinutes: clampNumber(settings.repeatMinutes, 5, 1440, defaultNotificationSettings.repeatMinutes),
    vibrate: settings.vibrate ?? defaultNotificationSettings.vibrate,
    wakeScreen: settings.wakeScreen ?? defaultNotificationSettings.wakeScreen,
  };
}

export function getAlertWindow(item: Pick<Item, 'dueDate'> & { oneTimeAlert?: boolean }, settings: NotificationSettings) {
  const [hour, minute] = settings.time.split(':').map(Number);
  const alertStart = new Date(`${item.dueDate}T12:00:00`);
  if (!item.oneTimeAlert) alertStart.setDate(alertStart.getDate() - settings.daysBefore);
  alertStart.setHours(hour, minute, 0, 0);

  const alertEnd = new Date(`${item.dueDate}T12:00:00`);
  alertEnd.setHours(23, 59, 59, 999);

  return { alertAt: alertStart.getTime(), alertWindowEndAt: alertEnd.getTime() };
}

export function frequencyLabel(item: Pick<Item, 'kind' | 'customMonths'>): string {
  if (item.kind === 'Personalizado') return `Cada ${item.customMonths || 2} meses`;
  return item.kind;
}

export function recurrenceDetail(sub: Subscription): string {
  if (sub.recurrence === 'Mensual') return dayOfMonthLabel(sub.dueDate);
  return formatDue(sub.dueDate);
}

export function isIncome(item: { direction?: string }): boolean {
  return item.direction === 'income';
}

export function isSameMonth(value: string, year: number, month: number): boolean {
  const date = new Date(`${value}T12:00:00`);
  return date.getFullYear() === year && date.getMonth() === month;
}

export function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function formatMoney(value: number): string {
  return Number(value || 0).toFixed(2);
}

export function formatSignedMoney(item: { amount: number; direction?: string }): string {
  return `${isIncome(item) ? '+ ' : '- '}S/ ${formatMoney(item.amount)}`;
}

export function formatDue(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
}

export function formatLongWeekday(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return capitalize(
    new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: '2-digit', month: 'long' }).format(date),
  );
}

export function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}

export function dayOfMonthLabel(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return `${date.getDate()} de cada mes`;
}

export interface MonthCell {
  key: string;
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

export function buildMonthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstWeekday);
  const today = todayKey();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);
    return {
      key: `${dateKey}-${index}`,
      dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: dateKey === today,
    };
  });
}

export function getCalendarDayTone(items: { direction?: string }[]): 'expense-day' | 'income-day' | '' {
  if (!items.length) return '';
  if (items.some(item => !isIncome(item))) return 'expense-day';
  return 'income-day';
}

export function groupByMonth<T extends { dueDate: string }>(entries: T[]): { key: string; label: string; entries: T[] }[] {
  const groups: { key: string; label: string; entries: T[] }[] = [];
  const byKey = new Map<string, { key: string; label: string; entries: T[] }>();

  for (const entry of entries) {
    const date = new Date(`${entry.dueDate}T12:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!byKey.has(key)) {
      const label = capitalize(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date));
      const group = { key, label, entries: [] as T[] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key)!.entries.push(entry);
  }
  return groups;
}
