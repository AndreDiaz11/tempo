import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Entry } from '../types';
import { IconBadge } from './IconBadge';
import { colors } from '../theme/colors';
import {
  formatDue,
  formatMoney,
  formatSignedMoney,
  frequencyLabel,
  isIncome,
  recurrenceDetail,
} from '../lib/tempoLogic';

function amountToneColor(entry: Entry): string {
  if (entry.__type === 'sub') return colors.subscription;
  return isIncome(entry) ? colors.income : colors.expense;
}

function entryAmountText(entry: Entry): string {
  if (entry.__type === 'sub') {
    return entry.amount > 0 ? `S/ ${formatMoney(entry.amount)}` : 'Sin monto';
  }
  return entry.amount > 0 ? formatSignedMoney(entry) : 'Sin monto';
}

interface DebtCardProps {
  entry: Entry;
  onOpen: (entry: Entry) => void;
}

/** Fila compacta usada en la lista de Inicio (acordeones) */
export function DebtCard({ entry, onOpen }: DebtCardProps) {
  const frequencyText = entry.__type === 'sub' ? entry.recurrence : frequencyLabel(entry as any);
  const scheduleLabel =
    entry.__type === 'sub'
      ? recurrenceDetail(entry as any)
      : entry.isInstallment
        ? `Cuota ${entry.currentInstallment} de ${entry.totalInstallments}`
        : formatDue(entry.dueDate);

  return (
    <Pressable style={estilos.card} onPress={() => onOpen(entry)}>
      <IconBadge iconId={entry.icon} />
      <View style={estilos.info}>
        <Text style={estilos.title} numberOfLines={1}>{entry.title}</Text>
        <Text style={estilos.subtitle} numberOfLines={1}>{frequencyText}</Text>
        <Text style={estilos.schedule} numberOfLines={1}>{scheduleLabel}</Text>
      </View>
      <Text style={[estilos.amount, { color: amountToneColor(entry) }]}>{entryAmountText(entry)}</Text>
    </Pressable>
  );
}

interface SummaryCardProps {
  item: Entry;
  onOpen: (entry: Entry) => void;
}

/** Fila usada en el popup de "alertas del dia" del calendario */
export function SummaryCard({ item, onOpen }: SummaryCardProps) {
  const label =
    item.__type === 'sub'
      ? recurrenceDetail(item as any)
      : item.isInstallment
        ? `Cuota ${item.currentInstallment} de ${item.totalInstallments}`
        : `${formatDue(item.dueDate)} · ${frequencyLabel(item as any)}`;
  const amountLabel = item.isHistory || item.active ? entryAmountText(item) : 'Inactivo';

  return (
    <Pressable style={estilos.card} onPress={() => onOpen(item)}>
      <IconBadge iconId={item.icon} />
      <View style={estilos.info}>
        <Text style={estilos.title} numberOfLines={1}>{item.title}</Text>
        <Text style={estilos.subtitle} numberOfLines={1}>{label}</Text>
      </View>
      <View style={estilos.summaryRight}>
        <Text
          style={[
            estilos.amount,
            { color: item.isHistory || item.active ? amountToneColor(item) : colors.textMuted },
          ]}>
          {amountLabel}
        </Text>
        <ChevronRight size={22} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  schedule: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  amount: { fontSize: 14, fontWeight: '800' },
  summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
