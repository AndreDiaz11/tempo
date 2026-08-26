import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors } from '../theme/colors';

export function SplashScreen() {
  return (
    <View style={estilos.container}>
      <View style={estilos.logo}>
        <CalendarDays size={40} color="#fff" />
      </View>
      <Text style={estilos.title}>tempo</Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} />
      <Text style={estilos.loading}>Cargando...</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textTransform: 'lowercase' },
  loading: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
