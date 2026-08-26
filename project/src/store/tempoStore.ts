import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { HistoryRecord, Item, NotificationSettings, Subscription } from '../types';
import {
  advanceDate,
  addMonths,
  defaultNotificationSettings,
  deactivateExpiredItems,
  nextDate,
  nextSubscriptionDue,
  normalizeItem,
  normalizeNotificationSettings,
  normalizeSubscription,
  todayKey,
} from '../lib/tempoLogic';
import { requestBatteryMode, syncTempoNotification, stopTempoNotification } from '../services/tempoNotification';

const STORAGE_KEY = 'tempo.items.v1';
const LEGACY_STORAGE_KEY = 'pagoalerta.items.v1';
const SUBSCRIPTIONS_KEY = 'tempo.subscriptions.v1';
const NOTIFICATION_ENABLED_KEY = 'tempo.notifications.enabled';
const NOTIFICATION_SETTINGS_KEY = 'tempo.notifications.settings.v1';

interface TempoState {
  loaded: boolean;
  esInstalacionNueva: boolean;
  items: Item[];
  subscriptions: Subscription[];
  notificationEnabled: boolean;
  notificationSettings: NotificationSettings;

  load: () => Promise<void>;
  reemplazarDatos: (items: Item[], subscriptions: Subscription[]) => void;

  saveItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  markAsPaid: (id: string) => void;
  reactivateItem: (id: string) => void;

  saveSubscription: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
  markSubscriptionPaid: (id: string) => void;
  reactivateSubscription: (id: string) => void;

  toggleNotifications: () => Promise<{ ok: boolean; error?: string }>;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
}

async function persistAll(items: Item[], subscriptions: Subscription[], enabled: boolean, settings: NotificationSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? 'true' : 'false');
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

function resyncNotifications(get: () => TempoState) {
  const { items, subscriptions, notificationSettings, notificationEnabled } = get();
  syncTempoNotification(items, subscriptions, notificationSettings, notificationEnabled).catch(() => {});
}

export const useTempoStore = create<TempoState>((set, get) => ({
  loaded: false,
  esInstalacionNueva: false,
  items: [],
  subscriptions: [],
  notificationEnabled: false,
  notificationSettings: defaultNotificationSettings,

  load: async () => {
    const [storedItems, legacyItems, storedSubs, enabledRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_STORAGE_KEY),
      AsyncStorage.getItem(SUBSCRIPTIONS_KEY),
      AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
      AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY),
    ]);

    const raw = storedItems || legacyItems;
    if (!raw) {
      set({ loaded: true, esInstalacionNueva: true });
      return;
    }

    try {
      let items: Item[] = JSON.parse(raw).map(normalizeItem);
      const { changed, items: deactivated } = deactivateExpiredItems(items);
      items = deactivated;

      const subscriptions: Subscription[] = storedSubs ? JSON.parse(storedSubs).map(normalizeSubscription) : [];
      const notificationEnabled = enabledRaw === 'true';
      let notificationSettings = defaultNotificationSettings;
      if (settingsRaw) {
        try {
          notificationSettings = normalizeNotificationSettings(JSON.parse(settingsRaw));
        } catch {
          // usa el default
        }
      }

      set({ items, subscriptions, notificationEnabled, notificationSettings, loaded: true, esInstalacionNueva: false });

      if (changed || legacyItems) {
        await persistAll(items, subscriptions, notificationEnabled, notificationSettings);
        if (legacyItems) await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      resyncNotifications(get);
    } catch {
      set({ loaded: true, esInstalacionNueva: true });
    }
  },

  reemplazarDatos: (items, subscriptions) => {
    const { notificationEnabled, notificationSettings } = get();
    persistAll(items, subscriptions, notificationEnabled, notificationSettings);
    set({ items, subscriptions, esInstalacionNueva: false });
    resyncNotifications(get);
  },

  saveItem: item => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const exists = items.some(i => i.id === item.id);
    const nextItems = exists ? items.map(i => (i.id === item.id ? item : i)) : [...items, item];
    persistAll(nextItems, subscriptions, notificationEnabled, notificationSettings);
    set({ items: nextItems });
    resyncNotifications(get);
  },

  deleteItem: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextItems = items.filter(i => i.id !== id);
    persistAll(nextItems, subscriptions, notificationEnabled, notificationSettings);
    set({ items: nextItems });
    resyncNotifications(get);
  },

  markAsPaid: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextItems = items.map(item => {
      if (item.id !== id) return item;

      const historyRecord: HistoryRecord = { date: item.dueDate, amount: item.amount, direction: item.direction };
      const history = [...(item.history || []), historyRecord];

      if (item.isInstallment && Number(item.currentInstallment) < Number(item.totalInstallments)) {
        return {
          ...item,
          currentInstallment: Number(item.currentInstallment) + 1,
          dueDate: advanceDate(item) || addMonths(item.dueDate, 1),
          active: true,
          history,
        };
      }

      const nextDueDate = item.isInstallment ? null : advanceDate(item);
      if (nextDueDate) return { ...item, dueDate: nextDueDate, active: true, history };
      return { ...item, active: false, history };
    });
    persistAll(nextItems, subscriptions, notificationEnabled, notificationSettings);
    set({ items: nextItems });
    resyncNotifications(get);
  },

  reactivateItem: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextItems = items.map(item => {
      if (item.id !== id) return item;
      let dueDate = item.dueDate;
      if (dueDate < todayKey()) dueDate = advanceDate(item) || nextDate(1);
      return { ...item, active: true, dueDate };
    });
    persistAll(nextItems, subscriptions, notificationEnabled, notificationSettings);
    set({ items: nextItems });
    resyncNotifications(get);
  },

  saveSubscription: sub => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const exists = subscriptions.some(s => s.id === sub.id);
    const nextSubs = exists ? subscriptions.map(s => (s.id === sub.id ? sub : s)) : [...subscriptions, sub];
    persistAll(items, nextSubs, notificationEnabled, notificationSettings);
    set({ subscriptions: nextSubs });
    resyncNotifications(get);
  },

  deleteSubscription: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextSubs = subscriptions.filter(s => s.id !== id);
    persistAll(items, nextSubs, notificationEnabled, notificationSettings);
    set({ subscriptions: nextSubs });
    resyncNotifications(get);
  },

  markSubscriptionPaid: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextSubs = subscriptions.map(sub => {
      if (sub.id !== id) return sub;
      const nextDueDate = nextSubscriptionDue(sub);
      return nextDueDate ? { ...sub, dueDate: nextDueDate, active: true } : sub;
    });
    persistAll(items, nextSubs, notificationEnabled, notificationSettings);
    set({ subscriptions: nextSubs });
    resyncNotifications(get);
  },

  reactivateSubscription: id => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const nextSubs = subscriptions.map(sub => {
      if (sub.id !== id) return sub;
      let dueDate = sub.dueDate;
      if (dueDate < todayKey()) dueDate = nextSubscriptionDue(sub) || nextDate(1);
      return { ...sub, active: true, dueDate };
    });
    persistAll(items, nextSubs, notificationEnabled, notificationSettings);
    set({ subscriptions: nextSubs });
    resyncNotifications(get);
  },

  toggleNotifications: async () => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();

    if (notificationEnabled) {
      set({ notificationEnabled: false });
      await persistAll(items, subscriptions, false, notificationSettings);
      await stopTempoNotification();
      return { ok: true };
    }

    if (!items.some(item => item.active)) {
      return { ok: false, error: 'Agrega una alerta activa antes de activar la notificación fija.' };
    }

    const batteryResult = await requestBatteryMode();
    if (!batteryResult.notificationPermissionGranted) {
      return { ok: false, error: 'Se necesita el permiso de notificaciones para activar esto.' };
    }

    const syncResult = await syncTempoNotification(items, subscriptions, notificationSettings, true);
    set({ notificationEnabled: syncResult.ok });
    await persistAll(items, subscriptions, syncResult.ok, notificationSettings);
    return { ok: syncResult.ok };
  },

  updateNotificationSettings: patch => {
    const { items, subscriptions, notificationEnabled, notificationSettings } = get();
    const next = normalizeNotificationSettings({ ...notificationSettings, ...patch });
    persistAll(items, subscriptions, notificationEnabled, next);
    set({ notificationSettings: next });
    resyncNotifications(get);
  },
}));
