import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPago: () => void;
  onIngreso: () => void;
  onSuscripcion: () => void;
}

export function AddChoiceModal({ visible, onClose, onPago, onIngreso, onSuscripcion }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={estilos.backdrop} onPress={onClose}>
        <Pressable style={estilos.sheet} onPress={e => e.stopPropagation()}>
          <View style={estilos.header}>
            <Text style={estilos.title}>¿Qué quieres agregar?</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Pressable style={estilos.option} onPress={onPago}>
            <View style={[estilos.optionIcon, { backgroundColor: colors.expense }]}>
              <ArrowDownCircle size={22} color="#fff" />
            </View>
            <Text style={estilos.optionText}>Pagos</Text>
          </Pressable>

          <Pressable style={estilos.option} onPress={onIngreso}>
            <View style={[estilos.optionIcon, { backgroundColor: colors.income }]}>
              <ArrowUpCircle size={22} color="#fff" />
            </View>
            <Text style={estilos.optionText}>Ingresos</Text>
          </Pressable>

          <Pressable style={estilos.option} onPress={onSuscripcion}>
            <View style={[estilos.optionIcon, { backgroundColor: colors.accent }]}>
              <RefreshCw size={22} color="#fff" />
            </View>
            <Text style={estilos.optionText}>Suscripciones</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
