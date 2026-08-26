import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { NotificationSettings } from '../types';
import { colors } from '../theme/colors';
import { elegirYLeerRespaldo, exportarJson } from '../lib/respaldo';
import { useTempoStore } from '../store/tempoStore';

const repeatOptions = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 240, label: '4 horas' },
  { value: 1440, label: '1 día' },
];

interface Props {
  settings: NotificationSettings;
  notificationEnabled: boolean;
  onChange: (patch: Partial<NotificationSettings>) => void;
  onToggleNotifications: () => void;
}

export function AjustesScreen({ settings, notificationEnabled, onChange, onToggleNotifications }: Props) {
  const items = useTempoStore(s => s.items);
  const subscriptions = useTempoStore(s => s.subscriptions);
  const reemplazarDatos = useTempoStore(s => s.reemplazarDatos);

  async function manejarExportar() {
    try {
      await exportarJson(items, subscriptions);
    } catch {
      Alert.alert('No se pudo exportar', 'Intenta nuevamente.');
    }
  }

  async function manejarImportar() {
    try {
      const previa = await elegirYLeerRespaldo();
      if (!previa) return;
      Alert.alert(
        '¿Importar este respaldo?',
        `${previa.numItems} pago${previa.numItems === 1 ? '' : 's'}/ingreso(s) · ${previa.numSubscriptions} suscripción${previa.numSubscriptions === 1 ? '' : 'es'}\n\nReemplazará los datos actuales.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: () => {
              reemplazarDatos(previa.items, previa.subscriptions);
              Alert.alert('Listo', 'Datos importados correctamente.');
            },
          },
        ],
      );
    } catch {
      Alert.alert('No se pudo importar', 'Verifica que sea un respaldo de Tempo.');
    }
  }

  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.content}>
      <View style={estilos.hero}>
        <View style={estilos.heroIcon}>
          <Bell size={30} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.heroTitle}>Alertas</Text>
          <Text style={estilos.heroText}>
            {settings.daysBefore === 0 ? 'El aviso llega el mismo día' : `El aviso llega ${settings.daysBefore} días antes`} a las {settings.time}.
          </Text>
        </View>
      </View>

      <View style={estilos.fieldGrid}>
        <View style={estilos.fieldThird}>
          <Text style={estilos.label}>Días antes</Text>
          <TextInput
            style={estilos.input}
            keyboardType="number-pad"
            value={String(settings.daysBefore)}
            onChangeText={v => onChange({ daysBefore: Number(v) || 0 })}
          />
        </View>
        <View style={estilos.fieldThird}>
          <Text style={estilos.label}>Hora</Text>
          <TextInput
            style={estilos.input}
            value={settings.time}
            onChangeText={v => onChange({ time: v })}
            placeholder="08:00"
          />
        </View>
      </View>

      <Text style={estilos.label}>Repetir cada</Text>
      <View style={estilos.repeatPicker}>
        {repeatOptions.map(option => (
          <Pressable
            key={option.value}
            style={[estilos.repeatOption, settings.repeatMinutes === option.value && estilos.repeatOptionSelected]}
            onPress={() => onChange({ repeatMinutes: option.value })}>
            <Text style={[estilos.repeatOptionText, settings.repeatMinutes === option.value && estilos.repeatOptionTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={estilos.toggleRow}>
        <Text style={estilos.toggleLabel}>Vibrar al avisar</Text>
        <Switch
          value={settings.vibrate}
          onValueChange={v => onChange({ vibrate: v })}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor="#fff"
        />
      </View>
      <View style={estilos.toggleRow}>
        <Text style={estilos.toggleLabel}>Encender pantalla al avisar</Text>
        <Switch
          value={settings.wakeScreen}
          onValueChange={v => onChange({ wakeScreen: v })}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor="#fff"
        />
      </View>

      <Pressable style={estilos.mainToggle} onPress={onToggleNotifications}>
        <Text style={estilos.mainToggleTitle}>
          {notificationEnabled ? 'Apagar notificación fija' : 'Activar notificación fija'}
        </Text>
        <Text style={estilos.mainToggleNote}>
          {notificationEnabled ? 'Los cambios se aplican automáticamente.' : 'Android pedirá permisos si hacen falta.'}
        </Text>
      </Pressable>

      <View style={estilos.backupPanel}>
        <Text style={estilos.backupEyebrow}>Respaldo de datos</Text>
        <Text style={estilos.backupTitle}>Exportar / importar</Text>
        <Text style={estilos.backupText}>
          Guarda tus pagos y suscripciones en un archivo JSON para restaurarlos si cambias de celular.
        </Text>
        <View style={estilos.backupActions}>
          <Pressable style={estilos.backupButton} onPress={manejarExportar}>
            <Text style={estilos.backupButtonText}>Exportar</Text>
          </Pressable>
          <Pressable style={estilos.backupButton} onPress={manejarImportar}>
            <Text style={estilos.backupButtonText}>Importar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 100 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  heroText: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  fieldGrid: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  fieldThird: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 44, paddingHorizontal: 12, fontSize: 14, color: colors.text, backgroundColor: colors.card },
  repeatPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatOption: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.card },
  repeatOptionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  repeatOptionText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  repeatOptionTextSelected: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 10 },
  toggleLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
  mainToggle: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, marginTop: 18 },
  mainToggleTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  mainToggleNote: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 4 },
  backupPanel: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 20 },
  backupEyebrow: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  backupTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  backupText: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  backupActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  backupButton: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backupButtonText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});
