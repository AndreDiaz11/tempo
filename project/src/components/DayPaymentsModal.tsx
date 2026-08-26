import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Entry } from '../types';
import { colors } from '../theme/colors';
import { formatLongDate } from '../lib/tempoLogic';
import { SummaryCard } from './EntryCard';

interface Props {
  dateKey: string | null;
  items: Entry[];
  onClose: () => void;
  onOpen: (entry: Entry) => void;
}

export function DayPaymentsModal({ dateKey, items, onClose, onOpen }: Props) {
  if (!dateKey) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={estilos.backdrop} onPress={onClose}>
        <Pressable style={estilos.sheet} onPress={e => e.stopPropagation()}>
          <View style={estilos.header}>
            <View>
              <Text style={estilos.eyebrow}>Alertas del día</Text>
              <Text style={estilos.title}>{formatLongDate(dateKey)}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Text style={estilos.close}>Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 380 }}>
            {items.map(item => (
              <SummaryCard key={item.id} item={item} onOpen={onOpen} />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  eyebrow: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  close: { color: colors.accent, fontWeight: '700' },
});
