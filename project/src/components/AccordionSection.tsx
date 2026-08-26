import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface Props {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function AccordionSection({ title, count, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={estilos.section}>
      <Pressable style={estilos.header} onPress={() => setOpen(v => !v)}>
        <Text style={estilos.headerText}>{title} ({count})</Text>
        <ChevronDown
          size={20}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && <View style={estilos.body}>{children}</View>}
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={estilos.empty}>
      <Text style={estilos.emptyText}>{text}</Text>
    </View>
  );
}

export function MonthGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={estilos.monthGroup}>
      <Text style={estilos.monthGroupTitle}>{label}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  section: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerText: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 12, paddingBottom: 12 },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  monthGroup: { marginBottom: 8 },
  monthGroupTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 4 },
});
