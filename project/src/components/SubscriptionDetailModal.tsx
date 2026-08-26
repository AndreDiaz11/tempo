import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, X } from 'lucide-react-native';
import { Entry } from '../types';
import { IconBadge } from './IconBadge';
import { colors } from '../theme/colors';
import { formatDue, formatMoney } from '../lib/tempoLogic';

interface Props {
  subscription: Entry | null;
  onClose: () => void;
  onPaid?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onEdit?: (sub: Entry) => void;
}

export function SubscriptionDetailModal({ subscription, onClose, onPaid, onReactivate, onEdit }: Props) {
  if (!subscription) return null;
  const readOnly = Boolean(subscription.isProjected) || !onPaid;
  const statusLabel = readOnly ? 'Próxima repetición' : subscription.active ? 'Activa' : 'Inactiva';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={estilos.backdrop}>
        <Pressable style={estilos.sheet} onPress={e => e.stopPropagation()}>
          <View style={estilos.actionsRow}>
            {!readOnly && onEdit && (
              <Pressable style={estilos.iconButton} onPress={() => onEdit(subscription)} hitSlop={8}>
                <Pencil size={18} color={colors.textMuted} />
              </Pressable>
            )}
            <Pressable style={estilos.iconButton} onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={estilos.header}>
            <IconBadge iconId={subscription.icon} />
            <View style={estilos.headerText}>
              <Text style={estilos.title} numberOfLines={2}>{subscription.title}</Text>
              <View style={[estilos.statusPill, subscription.active && estilos.statusPillActive]}>
                <Text style={[estilos.statusText, subscription.active && estilos.statusTextActive]}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={estilos.subtitle}>Suscripción · {subscription.recurrence}</Text>

          <View style={estilos.grid}>
            <View style={estilos.gridItem}>
              <Text style={estilos.gridLabel}>Monto</Text>
              <Text style={[estilos.gridValue, { color: colors.subscription }]}>
                {subscription.amount > 0 ? `S/ ${formatMoney(subscription.amount)}` : 'Sin monto'}
              </Text>
            </View>
            <View style={estilos.gridItem}>
              <Text style={estilos.gridLabel}>Vence</Text>
              <Text style={estilos.gridValue}>{formatDue(subscription.dueDate)}</Text>
            </View>
            {subscription.notes ? (
              <View style={estilos.gridItem}>
                <Text style={estilos.gridLabel}>Notas</Text>
                <Text style={estilos.gridValue}>{subscription.notes}</Text>
              </View>
            ) : null}
          </View>

          {!readOnly && (
            <Pressable
              style={estilos.actionButton}
              onPress={() => (subscription.active ? onPaid?.(subscription.id) : onReactivate?.(subscription.id))}>
              <Text style={estilos.actionButtonText}>{subscription.active ? 'Marcar como pagado' : 'Reactivar'}</Text>
            </Pressable>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 4 },
  iconButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 12 },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#F0F0FA', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  statusPillActive: { backgroundColor: colors.accentSoft },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  statusTextActive: { color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20 },
  gridItem: { minWidth: '40%' },
  gridLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  gridValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  actionButton: { backgroundColor: colors.accent, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
