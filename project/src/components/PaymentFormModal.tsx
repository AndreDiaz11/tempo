import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CalendarDays, Trash2 } from 'lucide-react-native';
import { Direction, Frequency, Item } from '../types';
import { colors } from '../theme/colors';
import { frequencyOptions, iconPickerOptions, formatLongDate, nextDate, todayKey } from '../lib/tempoLogic';
import { IconBadge } from './IconBadge';
import { DatePickerModal } from './DatePickerModal';

interface FormState {
  title: string;
  amount: string;
  dueDate: string;
  direction: Direction;
  kind: Frequency;
  customMonths: string;
  isInstallment: boolean;
  icon: string;
  currentInstallment: string;
  totalInstallments: string;
}

function defaultForm(direction: Direction = 'expense'): FormState {
  return {
    title: '',
    amount: '',
    dueDate: nextDate(1),
    direction,
    kind: 'Mensual',
    customMonths: '2',
    isInstallment: false,
    icon: 'servicios',
    currentInstallment: '1',
    totalInstallments: '12',
  };
}

interface Props {
  visible: boolean;
  direction: Direction;
  editingItem: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function PaymentFormModal({ visible, direction, editingItem, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm(direction));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingItem) {
      setForm({
        title: editingItem.title,
        amount: String(editingItem.amount ?? ''),
        dueDate: editingItem.dueDate,
        direction: editingItem.direction,
        kind: editingItem.kind,
        customMonths: String(editingItem.customMonths || '2'),
        isInstallment: editingItem.isInstallment,
        icon: editingItem.icon,
        currentInstallment: String(editingItem.currentInstallment || '1'),
        totalInstallments: String(editingItem.totalInstallments || '12'),
      });
    } else {
      setForm(defaultForm(direction));
    }
  }, [visible, editingItem, direction]);

  function guardar() {
    if (!form.title.trim()) {
      Alert.alert('Falta el nombre');
      return;
    }
    if (form.isInstallment) {
      const current = Number(form.currentInstallment || 1);
      const total = Number(form.totalInstallments || 1);
      if (current > total) {
        Alert.alert('La cuota actual no puede ser mayor al total de cuotas.');
        return;
      }
    }

    const payload: Item = {
      id: editingItem?.id || cryptoRandomId(),
      title: form.title.trim(),
      amount: Number(form.amount || 0),
      dueDate: form.dueDate,
      direction: form.direction,
      kind: form.kind,
      customMonths: form.kind === 'Personalizado' ? Number(form.customMonths || 2) : '',
      isInstallment: form.kind !== 'Único' && form.isInstallment,
      totalInstallments: form.isInstallment ? Number(form.totalInstallments || 1) : '',
      currentInstallment: form.isInstallment ? Number(form.currentInstallment || 1) : '',
      icon: form.icon,
      active: editingItem?.active ?? true,
      history: editingItem?.history ?? [],
    };
    onSave(payload);
  }

  function eliminar() {
    if (!editingItem) return;
    Alert.alert('¿Eliminar este pago?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(editingItem.id) },
    ]);
  }

  const isIncomeForm = form.direction === 'income';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={estilos.backdrop}>
        <View style={estilos.sheet}>
          <View style={estilos.header}>
            <Text style={estilos.title}>
              {editingItem ? (isIncomeForm ? 'Editar ingreso' : 'Editar pago') : isIncomeForm ? 'Nuevo ingreso' : 'Nuevo pago'}
            </Text>
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
              placeholder="Ej. Plan móvil"
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
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={estilos.fieldHalf}>
                <Text style={estilos.label}>{isIncomeForm ? 'Fecha de ingreso' : 'Fecha de cobro'}</Text>
                <Pressable style={estilos.dateButton} onPress={() => setShowDatePicker(true)}>
                  <CalendarDays size={18} color={colors.accent} />
                  <Text style={estilos.dateButtonText}>{formatLongDate(form.dueDate)}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={estilos.label}>Frecuencia</Text>
            <View style={estilos.kindPicker}>
              {frequencyOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={[estilos.kindOption, form.kind === option.value && estilos.kindOptionSelected]}
                  onPress={() =>
                    setForm({ ...form, kind: option.value, isInstallment: option.value === 'Único' ? false : form.isInstallment })
                  }>
                  <Text style={[estilos.kindOptionTitle, form.kind === option.value && estilos.kindOptionTitleSelected]}>
                    {option.value}
                  </Text>
                  <Text style={estilos.kindOptionNote}>{option.note}</Text>
                </Pressable>
              ))}
            </View>

            {form.kind === 'Personalizado' && (
              <>
                <Text style={estilos.label}>Cada cuántos meses</Text>
                <TextInput
                  style={estilos.input}
                  keyboardType="number-pad"
                  value={form.customMonths}
                  onChangeText={v => setForm({ ...form, customMonths: v })}
                />
              </>
            )}

            {form.kind !== 'Único' && (
              <View style={estilos.switchRow}>
                <Text style={estilos.label}>¿Es por cuotas?</Text>
                <Switch
                  value={form.isInstallment}
                  onValueChange={v => setForm({ ...form, isInstallment: v })}
                  trackColor={{ true: colors.accent, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            )}

            {form.kind !== 'Único' && form.isInstallment && (
              <View style={estilos.fieldGrid}>
                <View style={estilos.fieldHalf}>
                  <Text style={estilos.label}>Cuota actual</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="number-pad"
                    value={form.currentInstallment}
                    onChangeText={v => setForm({ ...form, currentInstallment: v })}
                  />
                </View>
                <View style={estilos.fieldHalf}>
                  <Text style={estilos.label}>Cuotas totales</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="number-pad"
                    value={form.totalInstallments}
                    onChangeText={v => setForm({ ...form, totalInstallments: v })}
                  />
                </View>
              </View>
            )}

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
            {editingItem && (
              <Pressable style={estilos.dangerButton} onPress={eliminar}>
                <Trash2 size={16} color={colors.expense} />
                <Text style={estilos.dangerButtonText}>Eliminar</Text>
              </Pressable>
            )}
            <Pressable style={estilos.submitButton} onPress={guardar}>
              <Text style={estilos.submitButtonText}>Guardar alerta</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={form.dueDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={value => {
          if (value < todayKey()) {
            Alert.alert('La fecha elegida ya pasó', 'La alerta se marcará como vencida al guardar. ¿Continuar?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Continuar', onPress: () => { setForm({ ...form, dueDate: value }); setShowDatePicker(false); } },
            ]);
            return;
          }
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  iconPicker: { flexDirection: 'row', gap: 10, marginTop: 4 },
  iconOption: { borderRadius: 999, padding: 2 },
  iconOptionSelected: { borderWidth: 2, borderColor: colors.accent },
  footer: { flexDirection: 'row', gap: 10, padding: 20, paddingTop: 12 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.expense },
  dangerButtonText: { color: colors.expense, fontWeight: '700', fontSize: 13 },
  submitButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
