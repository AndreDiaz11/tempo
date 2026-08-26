import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarDays, Trash2 } from 'lucide-react-native';
import { Recurrence, Subscription } from '../types';
import { colors } from '../theme/colors';
import { recurrenceOptions, iconPickerOptions, formatLongDate, nextDate } from '../lib/tempoLogic';
import { IconBadge } from './IconBadge';
import { DatePickerModal } from './DatePickerModal';

interface FormState {
  title: string;
  amount: string;
  dueDate: string;
  recurrence: Recurrence;
  notes: string;
  icon: string;
}

function defaultForm(): FormState {
  return { title: '', amount: '', dueDate: nextDate(1), recurrence: 'Mensual', notes: '', icon: 'juegos' };
}

interface Props {
  visible: boolean;
  editingSubscription: Subscription | null;
  onClose: () => void;
  onSave: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionFormModal({ visible, editingSubscription, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingSubscription) {
      setForm({
        title: editingSubscription.title,
        amount: String(editingSubscription.amount ?? ''),
        dueDate: editingSubscription.dueDate,
        recurrence: editingSubscription.recurrence,
        notes: editingSubscription.notes || '',
        icon: editingSubscription.icon,
      });
    } else {
      setForm(defaultForm());
    }
  }, [visible, editingSubscription]);

  function guardar() {
    if (!form.title.trim()) {
      Alert.alert('Falta el nombre');
      return;
    }
    const payload: Subscription = {
      id: editingSubscription?.id || cryptoRandomId(),
      title: form.title.trim(),
      amount: Number(form.amount || 0),
      dueDate: form.dueDate,
      recurrence: form.recurrence,
      notes: form.notes,
      icon: form.icon,
      active: editingSubscription?.active ?? true,
    };
    onSave(payload);
  }

  function eliminar() {
    if (!editingSubscription) return;
    Alert.alert('¿Eliminar esta suscripción?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(editingSubscription.id) },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={estilos.backdrop}>
        <View style={estilos.sheet}>
          <View style={estilos.header}>
            <Text style={estilos.title}>{editingSubscription ? 'Editar suscripción' : 'Nueva suscripción'}</Text>
            <Pressable onPress={onClose}>
              <Text style={estilos.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView style={estilos.body} keyboardShouldPersistTaps="handled">
            <Text style={estilos.label}>Nombre</Text>
            <TextInput
              style={estilos.input}
              value={form.title}
              onChangeText={v => setForm({ ...form, title: v })}
              placeholder="Ej. Netflix"
              placeholderTextColor={colors.textMuted}
            />

            <View style={estilos.fieldGrid}>
              <View style={estilos.fieldHalf}>
                <Text style={estilos.label}>Monto</Text>
                <TextInput
                  style={estilos.input}
                  keyboardType="decimal-pad"
                  value={form.amount}
                  onChangeText={v => setForm({ ...form, amount: v })}
                  placeholder="Opcional"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={estilos.fieldHalf}>
                <Text style={estilos.label}>Fecha de vencimiento</Text>
                <Pressable style={estilos.dateButton} onPress={() => setShowDatePicker(true)}>
                  <CalendarDays size={18} color={colors.accent} />
                  <Text style={estilos.dateButtonText}>{formatLongDate(form.dueDate)}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={estilos.label}>Recurrencia</Text>
            <View style={estilos.kindPicker}>
              {recurrenceOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={[estilos.kindOption, form.recurrence === option.value && estilos.kindOptionSelected]}
                  onPress={() => setForm({ ...form, recurrence: option.value })}>
                  <Text style={[estilos.kindOptionTitle, form.recurrence === option.value && estilos.kindOptionTitleSelected]}>
                    {option.value}
                  </Text>
                  <Text style={estilos.kindOptionNote}>{option.note}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={estilos.label}>Notas</Text>
            <TextInput
              style={estilos.input}
              value={form.notes}
              onChangeText={v => setForm({ ...form, notes: v })}
              placeholder="Opcional"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={estilos.label}>Ícono</Text>
            <View style={estilos.iconPicker}>
              {iconPickerOptions.map(option => (
                <Pressable
                  key={option.id}
                  onPress={() => setForm({ ...form, icon: option.id })}
                  style={[estilos.iconOption, form.icon === option.id && estilos.iconOptionSelected]}>
                  <IconBadge iconId={option.id} size={30} />
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={estilos.footer}>
            {editingSubscription && (
              <Pressable style={estilos.dangerButton} onPress={eliminar}>
                <Trash2 size={16} color={colors.expense} />
                <Text style={estilos.dangerButtonText}>Eliminar</Text>
              </Pressable>
            )}
            <Pressable style={estilos.submitButton} onPress={guardar}>
              <Text style={estilos.submitButtonText}>Guardar suscripción</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={form.dueDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={value => {
          setForm({ ...form, dueDate: value });
          setShowDatePicker(false);
        }}
      />
    </Modal>
  );
}

function cryptoRandomId(): string {
  // @ts-ignore
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const estilos = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', paddingTop: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  closeText: { color: colors.textMuted, fontWeight: '600' },
  body: { paddingHorizontal: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 46, paddingHorizontal: 12, fontSize: 15, color: colors.text },
  fieldGrid: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 46, paddingHorizontal: 12 },
  dateButtonText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  kindPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindOption: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, minWidth: '30%' },
  kindOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  kindOptionTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  kindOptionTitleSelected: { color: colors.accent },
  kindOptionNote: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  iconPicker: { flexDirection: 'row', gap: 10, marginTop: 4 },
  iconOption: { borderRadius: 999, padding: 2 },
  iconOptionSelected: { borderWidth: 2, borderColor: colors.accent },
  footer: { flexDirection: 'row', gap: 10, padding: 20, paddingTop: 12 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.expense },
  dangerButtonText: { color: colors.expense, fontWeight: '700', fontSize: 13 },
  submitButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
