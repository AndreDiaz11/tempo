import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { buildMonthCells, capitalize, todayKey } from '../lib/tempoLogic';

interface Props {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function DatePickerModal({ visible, value, onClose, onSelect }: Props) {
  const initial = new Date(`${value}T12:00:00`);
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthCells(year, month);
  const monthLabel = capitalize(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(viewDate));

  function moveMonth(offset: number) {
    setViewDate(new Date(year, month + offset, 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={estilos.backdrop} onPress={onClose}>
        <Pressable style={estilos.sheet} onPress={e => e.stopPropagation()}>
          <View style={estilos.header}>
            <Text style={estilos.headerTitle}>{monthLabel}</Text>
            <View style={estilos.nav}>
              <Pressable onPress={() => moveMonth(-1)} hitSlop={8}>
                <ChevronLeft size={24} color={colors.accent} />
              </Pressable>
              <Pressable onPress={() => moveMonth(1)} hitSlop={8}>
                <ChevronRight size={24} color={colors.accent} />
              </Pressable>
            </View>
          </View>

          <View style={estilos.weekdays}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <Text key={`${d}-${i}`} style={estilos.weekday}>{d}</Text>
            ))}
          </View>

          <View style={estilos.grid}>
            {cells.map(cell => (
              <Pressable
                key={cell.key}
                style={[
                  estilos.cell,
                  !cell.inMonth && estilos.cellOutside,
                  cell.dateKey === value && estilos.cellSelected,
                  cell.isToday && cell.dateKey !== value && estilos.cellToday,
                ]}
                onPress={() => onSelect(cell.dateKey)}>
                <Text
                  style={[
                    estilos.cellText,
                    !cell.inMonth && estilos.cellTextOutside,
                    cell.dateKey === value && estilos.cellTextSelected,
                  ]}>
                  {cell.day}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={estilos.footer}>
            <Pressable onPress={() => onSelect(todayKey())}>
              <Text style={estilos.footerAction}>Hoy</Text>
            </Pressable>
            <Pressable onPress={onClose}>
              <Text style={estilos.footerAction}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = '14.28%';

const estilos = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  nav: { flexDirection: 'row', gap: 12 },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellOutside: { opacity: 0.3 },
  cellSelected: { backgroundColor: colors.accent, borderRadius: 999 },
  cellToday: { borderWidth: 1, borderColor: colors.accent, borderRadius: 999 },
  cellText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  cellTextOutside: { color: colors.textMuted },
  cellTextSelected: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  footerAction: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
