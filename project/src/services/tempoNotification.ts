import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { Item, NotificationSettings, Subscription } from '../types';
import { getAlertWindow } from '../lib/tempoLogic';

const { TempoNotification } = NativeModules;

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const already = await PermissionsAndroid.check(permission);
  if (already) return true;
  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

interface PaymentPayload {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  direction: string;
  kind: string;
  detail: string;
  alertAt: number;
  alertWindowEndAt: number;
  repeatMinutes: number;
  vibrate: boolean;
  wakeScreen: boolean;
}

export async function syncTempoNotification(
  items: Item[],
  subscriptions: Subscription[],
  settings: NotificationSettings,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  if (!TempoNotification) return { ok: false };
  if (!enabled) {
    await stopTempoNotification();
    return { ok: true };
  }

  const subscriptionAlerts = subscriptions
    .filter(sub => sub.active)
    .map(sub => ({
      id: sub.id,
      title: sub.title,
      amount: sub.amount,
      dueDate: sub.dueDate,
      direction: 'expense',
      kind: 'Suscripción',
      detail: sub.notes || 'Suscripción',
      active: true,
      oneTimeAlert: true,
    }));

  const active: PaymentPayload[] = [...items, ...subscriptionAlerts]
    .filter((item: any) => item.active)
    .map((item: any) => {
      const alertWindow = getAlertWindow(item, settings);
      return {
        id: item.id,
        title: item.title,
        amount: Number(item.amount || 0),
        dueDate: item.dueDate,
        direction: item.direction || 'expense',
        kind: item.kind,
        detail: item.isInstallment ? `Cuota ${item.currentInstallment} de ${item.totalInstallments}` : item.detail || item.kind,
        alertAt: alertWindow.alertAt,
        alertWindowEndAt: alertWindow.alertWindowEndAt,
        repeatMinutes: item.oneTimeAlert ? 1440 : settings.repeatMinutes,
        vibrate: settings.vibrate,
        wakeScreen: settings.wakeScreen,
      };
    });

  if (active.length === 0) {
    await stopTempoNotification();
    return { ok: false };
  }

  try {
    await TempoNotification.sync(JSON.stringify(active));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function stopTempoNotification(): Promise<void> {
  if (!TempoNotification) return;
  try {
    await TempoNotification.stop();
  } catch {
    // no-op
  }
}

/** Pide el permiso de notificaciones (si hace falta) y la excepcion de ahorro de bateria. */
export async function requestBatteryMode(): Promise<{ ok: boolean; notificationPermissionGranted: boolean }> {
  const granted = await ensureNotificationPermission();
  if (!granted) return { ok: false, notificationPermissionGranted: false };

  if (!TempoNotification) return { ok: true, notificationPermissionGranted: true };
  try {
    await TempoNotification.requestBatteryExemption();
  } catch {
    // no-op
  }
  return { ok: true, notificationPermissionGranted: true };
}
