import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, X } from 'lucide-react-native';
import { Entry } from '../types';
import { IconBadge } from './IconBadge';
import { colors } from '../theme/colors';
import { formatDue, formatSignedMoney, frequencyLabel, isIncome } from '../lib/tempoLogic';

interface Props {
  item: Entry | null;
  onClose: () => void;
  onPaid?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onEdit?: (item: Entry) => void;
}

export function PaymentDetailModal({ item, onClose, onPaid, onReactivate, onEdit }: Props) {
  if (!item) return null;
  const readOnly = Boolean(item.isHistory || item.isProjected) || !onPaid;
  const statusLabel = item.isHistory ? 'Pagado' : item.isProjected ? 'Próxima repetición' : item.active ? 'Activo' : 'Inactivo';
  const dateRowLabel = item.isHistory ? 'Pagado el' : item.isProjected ? 'Se repite el' : isIncome(item) ? 'Ingreso' : 'Cobro';
  const actionLabel = isIncome(item) ? 'Marcar como recibido' : 'Marcar como pagado';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={estilos.backdrop}>
        <Pressable style={estilos.sheet} onPress={e => e.stopPropagation()}>
          <View style={estilos.actionsRow}>
            {!readOnly && onEdit && (
              <Pressable style={estilos.iconButton} onPress={() => onEdit(item)} hitSlop={8}>
                <Pencil size={18} color={colors.textMuted} />
              </Pressable>
            )}
            <Pressable style={estilos.iconButton} onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={estilos.header}>
            <IconBadge iconId={item.icon} />
            <View style={estilos.headerText}>
              <Text style={estilos.title} numberOfLines={2}>{item.title}</Text>
              <View style={[estilos.statusPill, item.active && estilos.statusPillActive]}>
                <Text style={[estilos.statusText, item.active && estilos.statusTextActive]}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={estilos.subtitle}>
            {isIncome(item) ? 'Ingreso' : 'Pago'} · {frequencyLabel(item as any)}
          </Text>

          <View style={estilos.grid}>
            <View style={estilos.gridItem}>
              <Text style={estilos.gridLabel}>Monto</Text>
              <Text style={[estilos.gridValue, { color: isIncome(item) ? colors.income : colors.expense }]}>
                {formatSignedMoney(item)}
              </Text>
            </View>
            <View style={estilos.gridItem}>
              <Text style={estilos.gridLabel}>{dateRowLabel}</Text>
              <Text style={estilos.gridValue}>{formatDue(item.dueDate)}</Text>
            </View>
            {item.isInstallment && (
              <View style={estilos.gridItem}>
                <Text style={estilos.gridLabel}>Cuotas</Text>
                <Text style={estilos.gridValue}>{item.currentInstallment} de {item.totalInstallments}</Text>
              </View>
            )}
          </View>

          {!readOnly && (
            <Pressable
              style={estilos.actionButton}
              onPress={() => (item.active ? onPaid?.(item.id) : onReactivate?.(item.id))}>
              <Text style={estilos.actionButtonText}>{item.active ? actionLabel : 'Reactivar alerta'}</Text>
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
