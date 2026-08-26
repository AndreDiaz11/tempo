import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CalendarDays, Home, Plus, Settings } from 'lucide-react-native';
import { useTempoStore } from '../store/tempoStore';
import { Direction, Entry, Item, Subscription } from '../types';
import { colors } from '../theme/colors';
import { formatLongWeekday, formatMoney, formatSignedMoney, isSameMonth } from '../lib/tempoLogic';
import { InicioScreen } from './InicioScreen';
import { CalendarioScreen } from './CalendarioScreen';
import { AjustesScreen } from './AjustesScreen';
import { AddChoiceModal } from '../components/AddChoiceModal';
import { PaymentFormModal } from '../components/PaymentFormModal';
import { SubscriptionFormModal } from '../components/SubscriptionFormModal';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { SubscriptionDetailModal } from '../components/SubscriptionDetailModal';
import { DayPaymentsModal } from '../components/DayPaymentsModal';

type Tab = 'inicio' | 'calendario' | 'config';

function toEntry(item: Item): Entry {
  return { ...item, __type: 'item' };
}
function subToEntry(sub: Subscription): Entry {
  return { ...sub, __type: 'sub' };
}

export function PrincipalScreen() {
  const items = useTempoStore(s => s.items);
  const subscriptions = useTempoStore(s => s.subscriptions);
  const notificationEnabled = useTempoStore(s => s.notificationEnabled);
  const notificationSettings = useTempoStore(s => s.notificationSettings);
  const updateNotificationSettings = useTempoStore(s => s.updateNotificationSettings);
  const toggleNotifications = useTempoStore(s => s.toggleNotifications);
  const saveItem = useTempoStore(s => s.saveItem);
  const deleteItem = useTempoStore(s => s.deleteItem);
  const markAsPaid = useTempoStore(s => s.markAsPaid);
  const reactivateItem = useTempoStore(s => s.reactivateItem);
  const saveSubscription = useTempoStore(s => s.saveSubscription);
  const deleteSubscription = useTempoStore(s => s.deleteSubscription);
  const markSubscriptionPaid = useTempoStore(s => s.markSubscriptionPaid);
  const reactivateSubscription = useTempoStore(s => s.reactivateSubscription);

  const [tab, setTab] = useState<Tab>('inicio');
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formDirection, setFormDirection] = useState<Direction>('expense');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedSubEntry, setSelectedSubEntry] = useState<Entry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<Entry[]>([]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [items],
  );
  const sortedSubscriptions = useMemo(
    () => [...subscriptions].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [subscriptions],
  );

  const activeItems = sortedItems.filter(item => item.active);
  const activeSubscriptions = sortedSubscriptions.filter(sub => sub.active);
  const activePayments = activeItems.filter(item => item.direction !== 'income');
  const activeIncomes = activeItems.filter(item => item.direction === 'income');
  const nextPayment = activePayments[0];

  const monthTotal = useMemo(() => {
    const today = new Date();
    return activeItems
      .filter(item => item.direction !== 'income' && isSameMonth(item.dueDate, today.getFullYear(), today.getMonth()))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [activeItems]);

  const historyEntries = useMemo<Entry[]>(
    () =>
      items.flatMap(item =>
        (item.history || []).map((record, index) => ({
          id: `${item.id}-hist-${index}`,
          title: item.title,
          amount: record.amount,
          dueDate: record.date,
          direction: record.direction,
          kind: item.kind,
          icon: item.icon,
          active: false,
          isHistory: true,
          __type: 'item' as const,
        })),
      ),
    [items],
  );

  function openEntry(entry: Entry) {
    if (entry.__type === 'sub') {
      setSelectedSubEntry(entry);
      return;
    }
    setSelectedEntry(entry);
  }

  function openNewForm(direction: Direction) {
    setEditingItem(null);
    setFormDirection(direction);
    setShowForm(true);
  }

  function openEditForm(entry: Entry) {
    const item = items.find(i => i.id === entry.id);
    if (!item) return;
    setSelectedEntry(null);
    setEditingItem(item);
    setFormDirection(item.direction);
    setShowForm(true);
  }

  function openEditSubForm(entry: Entry) {
    const sub = subscriptions.find(s => s.id === entry.id);
    if (!sub) return;
    setSelectedSubEntry(null);
    setEditingSubscription(sub);
    setShowSubForm(true);
  }

  async function manejarToggleNotificaciones() {
    const resultado = await toggleNotifications();
    if (!resultado.ok && resultado.error) {
      Alert.alert('No se pudo activar', resultado.error);
    }
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={['top', 'bottom']}>
      <View style={estilos.hero}>
        <Text style={estilos.heroTitle}>tempo</Text>
        <Pressable
          style={[estilos.bellButton, notificationEnabled && estilos.bellButtonActive]}
          onPress={manejarToggleNotificaciones}>
          <Bell size={22} color={notificationEnabled ? '#fff' : colors.textMuted} />
        </Pressable>
      </View>

      {tab === 'inicio' && (
        <>
          <View style={estilos.nextPaymentCard}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nextPaymentLabel}>Próximo pago</Text>
              <Text style={estilos.nextPaymentValue}>
                {nextPayment ? formatLongWeekday(nextPayment.dueDate) : 'Sin pagos activos'}
              </Text>
              {nextPayment && (
                <Text style={estilos.nextPaymentDetail}>
                  {nextPayment.title} · {formatSignedMoney(nextPayment)}
                </Text>
              )}
            </View>
            <CalendarDays size={26} color="#fff" />
          </View>

          <View style={estilos.monthTotalBar}>
            <Text style={estilos.monthTotalLabel}>Total de pagos este mes</Text>
            <Text style={estilos.monthTotalValue}>S/ {formatMoney(monthTotal)}</Text>
          </View>
        </>
      )}

      <View style={estilos.content}>
        {tab === 'inicio' && (
          <InicioScreen
            payments={activePayments.map(toEntry)}
            incomes={activeIncomes.map(toEntry)}
            subscriptions={activeSubscriptions.map(subToEntry)}
            onOpen={openEntry}
          />
        )}
        {tab === 'calendario' && (
          <CalendarioScreen
            items={sortedItems}
            subscriptions={sortedSubscriptions}
            historyEntries={historyEntries}
            onSelectDate={(date, entries) => {
              setSelectedDate(date);
              setSelectedDateEntries(entries);
            }}
          />
        )}
        {tab === 'config' && (
          <AjustesScreen
            settings={notificationSettings}
            notificationEnabled={notificationEnabled}
            onChange={updateNotificationSettings}
            onToggleNotifications={manejarToggleNotificaciones}
          />
        )}
      </View>

      {tab === 'inicio' && (
        <Pressable style={estilos.addButton} onPress={() => setShowAddChoice(true)}>
          <Plus size={22} color="#fff" />
          <Text style={estilos.addButtonText}>Agregar</Text>
        </Pressable>
      )}

      <View style={estilos.bottomNav}>
        <NavButton active={tab === 'inicio'} label="Inicio" Icon={Home} onPress={() => setTab('inicio')} />
        <NavButton active={tab === 'calendario'} label="Calendario" Icon={CalendarDays} onPress={() => setTab('calendario')} />
        <NavButton active={tab === 'config'} label="Ajustes" Icon={Settings} onPress={() => setTab('config')} />
      </View>

      <AddChoiceModal
        visible={showAddChoice}
        onClose={() => setShowAddChoice(false)}
        onPago={() => { setShowAddChoice(false); openNewForm('expense'); }}
        onIngreso={() => { setShowAddChoice(false); openNewForm('income'); }}
        onSuscripcion={() => { setShowAddChoice(false); setEditingSubscription(null); setShowSubForm(true); }}
      />

      <PaymentFormModal
        visible={showForm}
        direction={formDirection}
        editingItem={editingItem}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        onSave={item => { saveItem(item); setShowForm(false); setEditingItem(null); }}
        onDelete={id => { deleteItem(id); setShowForm(false); setEditingItem(null); }}
      />

      <SubscriptionFormModal
        visible={showSubForm}
        editingSubscription={editingSubscription}
        onClose={() => { setShowSubForm(false); setEditingSubscription(null); }}
        onSave={sub => { saveSubscription(sub); setShowSubForm(false); setEditingSubscription(null); }}
        onDelete={id => { deleteSubscription(id); setShowSubForm(false); setEditingSubscription(null); }}
      />

      {selectedEntry && (
        <PaymentDetailModal
          item={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onPaid={selectedEntry.isHistory || selectedEntry.isProjected ? undefined : id => { markAsPaid(id); setSelectedEntry(null); }}
          onReactivate={selectedEntry.isHistory || selectedEntry.isProjected ? undefined : id => { reactivateItem(id); setSelectedEntry(null); }}
          onEdit={selectedEntry.isHistory || selectedEntry.isProjected ? undefined : openEditForm}
        />
      )}

      {selectedSubEntry && (
        <SubscriptionDetailModal
          subscription={selectedSubEntry}
          onClose={() => setSelectedSubEntry(null)}
          onPaid={selectedSubEntry.isProjected ? undefined : id => { markSubscriptionPaid(id); setSelectedSubEntry(null); }}
          onReactivate={selectedSubEntry.isProjected ? undefined : id => { reactivateSubscription(id); setSelectedSubEntry(null); }}
          onEdit={selectedSubEntry.isProjected ? undefined : openEditSubForm}
        />
      )}

      <DayPaymentsModal
        dateKey={selectedDate}
        items={selectedDateEntries}
        onClose={() => setSelectedDate(null)}
        onOpen={entry => { setSelectedDate(null); openEntry(entry); }}
      />
    </SafeAreaView>
  );
}

function NavButton({ active, label, Icon, onPress }: { active: boolean; label: string; Icon: typeof Home; onPress: () => void }) {
  return (
    <Pressable style={estilos.navButton} onPress={onPress}>
      <Icon size={22} color={active ? colors.accent : colors.textMuted} />
      <Text style={[estilos.navButtonLabel, active && estilos.navButtonLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.background },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textTransform: 'lowercase' },
  bellButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  bellButtonActive: { backgroundColor: colors.accent },
  nextPaymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
  },
  nextPaymentLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  nextPaymentValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  nextPaymentDetail: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  monthTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
  },
  monthTotalLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  monthTotalValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  content: { flex: 1, marginTop: 10 },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navButton: { flex: 1, alignItems: 'center', gap: 2 },
  navButtonLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  navButtonLabelActive: { color: colors.accent },
});
