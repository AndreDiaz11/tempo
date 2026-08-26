import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Entry, Item, Subscription } from '../types';
import { colors, iconToneColors } from '../theme/colors';
import {
  buildMonthCells,
  capitalize,
  getCalendarDayTone,
  isSameMonth,
  projectFutureOccurrences,
} from '../lib/tempoLogic';
import { iconOptions } from '../lib/tempoLogic';

interface Props {
  items: Item[];
  subscriptions: Subscription[];
  historyEntries: Entry[];
  onSelectDate: (dateKey: string, entries: Entry[]) => void;
}

export function CalendarioScreen({ items, subscriptions, historyEntries, onSelectDate }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = capitalize(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(viewDate));
  const cells = buildMonthCells(year, month);

  const displayEntries = useMemo<Entry[]>(() => {
    const real: Entry[] = [
      ...items.map(item => ({ ...item, __type: 'item' as const })),
      ...historyEntries,
      ...subscriptions.map(sub => ({ ...sub, __type: 'sub' as const })),
    ];
    const projected = projectFutureOccurrences(items, subscriptions, year, month);
    return [...real, ...projected];
  }, [items, subscriptions, historyEntries, year, month]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const entry of displayEntries) {
      if (!map[entry.dueDate]) map[entry.dueDate] = [];
      map[entry.dueDate].push(entry);
    }
    return map;
  }, [displayEntries]);

  const alertCount = displayEntries.filter(entry => !entry.isHistory && isSameMonth(entry.dueDate, year, month)).length;

  function moveMonth(offset: number) {
    setViewDate(new Date(year, month + offset, 1));
  }

  return (
    <View style={estilos.container}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.eyebrow}>Calendario</Text>
          <Text style={estilos.monthLabel}>{monthLabel}</Text>
        </View>
        <View style={estilos.headerRight}>
          <Text style={estilos.alertCount}>{alertCount} alertas</Text>
          <Pressable onPress={() => moveMonth(-1)} hitSlop={8}>
            <ChevronLeft size={22} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => moveMonth(1)} hitSlop={8}>
            <ChevronRight size={22} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      <View style={estilos.weekdays}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Text key={`${d}-${i}`} style={estilos.weekday}>{d}</Text>
        ))}
      </View>

      <View style={estilos.grid}>
        {cells.map(cell => {
          const dayItems = cell.inMonth ? itemsByDate[cell.dateKey] || [] : [];
          const tone = getCalendarDayTone(dayItems);
          const disabled = !cell.inMonth || dayItems.length === 0;

          return (
            <Pressable
              key={cell.key}
              disabled={disabled}
              onPress={() => dayItems.length && onSelectDate(cell.dateKey, dayItems)}
              style={[
                estilos.cell,
                !cell.inMonth && estilos.cellOutside,
                cell.isToday && estilos.cellToday,
                tone === 'expense-day' && estilos.cellExpense,
                tone === 'income-day' && estilos.cellIncome,
              ]}>
              {cell.inMonth && (
                <>
                  <Text style={estilos.cellDay}>{cell.day}</Text>
                  <View style={estilos.dots}>
                    {dayItems.slice(0, 3).map(item => (
                      <IconDot key={item.id} item={item} />
                    ))}
                    {dayItems.length > 3 && <Text style={estilos.moreDots}>+{dayItems.length - 3}</Text>}
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function IconDot({ item }: { item: Entry }) {
  const option = iconOptions.find(icon => icon.id === item.icon) || iconOptions[0];
  const dim = item.isHistory || !item.active || item.isProjected;
  const color = iconToneColors[option.tone];
  return <View style={[estilos.dot, { backgroundColor: color, opacity: dim ? 0.4 : 1 }]} />;
}

const CELL_SIZE = '14.28%';

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  eyebrow: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  monthLabel: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertCount: { fontSize: 12, color: colors.textMuted },
  weekdays: { flexDirection: 'row', marginBottom: 6 },
  weekday: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 0.85, alignItems: 'center', paddingTop: 6, borderRadius: 10 },
  cellOutside: { opacity: 0 },
  cellToday: { backgroundColor: colors.accentSoft },
  cellExpense: { backgroundColor: '#FDECEC' },
  cellIncome: { backgroundColor: '#E9F8F0' },
  cellDay: { fontSize: 13, fontWeight: '700', color: colors.text },
  dots: { flexDirection: 'row', gap: 2, marginTop: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  moreDots: { fontSize: 8, color: colors.textMuted, marginLeft: 2 },
});
