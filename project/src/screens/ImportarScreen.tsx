import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTempoStore } from '../store/tempoStore';
import { elegirYLeerRespaldo } from '../lib/respaldo';
import { colors } from '../theme/colors';

export function ImportarScreen() {
  const reemplazarDatos = useTempoStore(s => s.reemplazarDatos);
  const [cargando, setCargando] = useState(false);

  async function importar() {
    setCargando(true);
    try {
      const previa = await elegirYLeerRespaldo();
      if (!previa) return;

      Alert.alert(
        '¿Importar este respaldo?',
        `${previa.numItems} pago${previa.numItems === 1 ? '' : 's'}/ingreso(s) · ${previa.numSubscriptions} suscripción${previa.numSubscriptions === 1 ? '' : 'es'}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: () => {
              reemplazarDatos(previa.items, previa.subscriptions);
              Alert.alert('Listo', 'Tus datos se importaron correctamente');
            },
          },
        ],
      );
    } catch {
      Alert.alert(
        'No se pudo importar',
        'Revisa que el archivo sea un respaldo válido de Tempo (el que ya generabas con "Exportar" en la versión anterior).',
      );
    } finally {
      setCargando(false);
    }
  }

  function empezarDeCero() {
    Alert.alert('Empezar de cero', '¿Seguro? Esto abre la app sin importar nada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Empezar de cero', onPress: () => reemplazarDatos([], []) },
    ]);
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={['top', 'bottom']}>
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>Bienvenido a la nueva Tempo</Text>
        <Text style={estilos.texto}>
          No encontramos datos guardados en este dispositivo. Si ya usabas Tempo antes, tus pagos, ingresos y
          suscripciones no se perdieron — solo hay que traerlos.
        </Text>

        <View style={estilos.pasos}>
          <Text style={estilos.paso}>1. Abre tu Tempo anterior</Text>
          <Text style={estilos.paso}>2. Entra a Ajustes → "Exportar"</Text>
          <Text style={estilos.paso}>3. Vuelve aquí y toca "Importar mi respaldo"</Text>
        </View>

        <Pressable style={estilos.botonPrincipal} onPress={importar} disabled={cargando}>
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.botonPrincipalTexto}>Importar mi respaldo</Text>
          )}
        </Pressable>

        <Pressable style={estilos.botonSecundario} onPress={empezarDeCero} disabled={cargando}>
          <Text style={estilos.botonSecundarioTexto}>No tengo respaldo, empezar de cero</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.background },
  contenido: { flex: 1, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  texto: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  pasos: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 28, gap: 10 },
  paso: { fontSize: 14, color: colors.text },
  botonPrincipal: {
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  botonPrincipalTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  botonSecundario: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  botonSecundarioTexto: { color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});
