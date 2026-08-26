import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Car,
  Cloud,
  CreditCard,
  Droplets,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  ReceiptText,
  Router,
  Shield,
  ShoppingBag,
  Smartphone,
  Tv,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { iconOptions } from '../lib/tempoLogic';
import { iconToneColors } from '../theme/colors';

const iconComponents: Record<string, LucideIcon> = {
  servicios: Smartphone,
  creditos: CreditCard,
  juegos: Gamepad2,
  hogar: Home,
  otro: ShoppingBag,
  router: Router,
  card: CreditCard,
  bank: Landmark,
  wallet: Wallet,
  receipt: ReceiptText,
  phone: Smartphone,
  stream: Tv,
  software: Cloud,
  laptop: Laptop,
  shield: Shield,
  education: GraduationCap,
  health: HeartPulse,
  gym: Dumbbell,
  car: Car,
  electricity: Zap,
  water: Droplets,
  shopping: ShoppingBag,
};

interface Props {
  iconId: string;
  size?: number;
}

export function IconBadge({ iconId, size = 42 }: Props) {
  const option = iconOptions.find(item => item.id === iconId) || iconOptions[0];
  const Icon = iconComponents[option.id] || Smartphone;
  const backgroundColor = iconToneColors[option.tone];

  return (
    <View style={[estilos.badge, { backgroundColor, width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 }]}>
      <Icon size={size * 0.62} color="#fff" strokeWidth={2} />
    </View>
  );
}

const estilos = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
