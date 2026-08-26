import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Entry } from '../types';
import { AccordionSection, EmptyState, MonthGroup } from '../components/AccordionSection';
import { DebtCard } from '../components/EntryCard';
import { groupByMonth } from '../lib/tempoLogic';

interface Props {
  payments: Entry[];
  incomes: Entry[];
  subscriptions: Entry[];
  onOpen: (entry: Entry) => void;
}

export function InicioScreen({ payments, incomes, subscriptions, onOpen }: Props) {
  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.content}>
      <AccordionSection title="Pagos" count={payments.length}>
        {payments.length > 0 ? (
          groupByMonth(payments).map(group => (
            <MonthGroup key={group.key} label={group.label}>
              {group.entries.map(entry => (
                <DebtCard key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </MonthGroup>
          ))
        ) : (
          <EmptyState text="Agrega un pago para empezar." />
        )}
      </AccordionSection>

      <AccordionSection title="Ingresos" count={incomes.length}>
        {incomes.length > 0 ? (
          groupByMonth(incomes).map(group => (
            <MonthGroup key={group.key} label={group.label}>
              {group.entries.map(entry => (
                <DebtCard key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </MonthGroup>
          ))
        ) : (
          <EmptyState text="Agrega un ingreso para empezar." />
        )}
      </AccordionSection>

      <AccordionSection title="Suscripciones" count={subscriptions.length}>
        {subscriptions.length > 0 ? (
          groupByMonth(subscriptions).map(group => (
            <MonthGroup key={group.key} label={group.label}>
              {group.entries.map(entry => (
                <DebtCard key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </MonthGroup>
          ))
        ) : (
          <EmptyState text="Agrega una suscripción para empezar." />
        )}
      </AccordionSection>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 100 },
});
