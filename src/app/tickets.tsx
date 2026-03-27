import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTicketContext, TicketStatus } from '@/app/ticket-context';

const statusOrder: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

function getNextStatus(currentStatus: TicketStatus, role: 'admin' | 'agent' | 'guest') {
  if (currentStatus === 'Closed') return null;
  const index = statusOrder.indexOf(currentStatus);
  if (index < 0 || index >= statusOrder.length - 1) return null;

  const candidate = statusOrder[index + 1];
  if (candidate === 'Closed' && role !== 'admin') return null;
  return candidate;
}

export default function TicketsScreen() {
  const { currentUser, tickets, users, assignTicket, updateTicketStatus } = useTicketContext();

  if (!currentUser) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Tickets</ThemedText>
          <ThemedText type="body">Please login on Home to view tickets.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (currentUser.role === 'guest') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Tickets</ThemedText>
          <ThemedText type="body">Guest users cannot view the ticket queue.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const visibleTickets =
    currentUser.role === 'agent'
      ? tickets.filter(t => t.assignedTo === currentUser.username)
      : tickets;

  const agents = users.filter(u => u.role === 'agent');

  if (visibleTickets.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Tickets</ThemedText>
          <ThemedText type="body">No tickets available for your role yet.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Tickets</ThemedText>
        <ScrollView style={styles.ticketList}>
          {visibleTickets.map(ticket => {
            const nextStatus = getNextStatus(ticket.status, currentUser.role);
            const canProgress = nextStatus !== null && (currentUser.role === 'admin' || currentUser.role === 'agent');

            return (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={styles.ticketTitle}>
                    #{ticket.id} {ticket.title}
                  </ThemedText>
                  <ThemedText type="small">{ticket.status}</ThemedText>
                </View>
                <ThemedText type="small">Reported by {ticket.createdBy}</ThemedText>
                <ThemedText type="small">Assigned to {ticket.assignedTo || 'not assigned'}</ThemedText>
                <ThemedText type="small">{new Date(ticket.createdAt).toLocaleString()}</ThemedText>
                <ThemedText type="small">{ticket.description}</ThemedText>

                {currentUser.role === 'admin' && (
                  <View style={styles.actionRow}>
                    {agents.map(agent => (
                      <View key={agent.username} style={styles.actionButton}>
                        <Button
                          title={`Assign ${agent.username}`}
                          onPress={() => assignTicket(ticket.id, agent.username)}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {canProgress && (
                  <View style={styles.actionRow}>
                    <View style={styles.actionButton}>
                      <Button
                        title={`Move to ${nextStatus}`}
                        onPress={() => updateTicketStatus(ticket.id, nextStatus!)}
                      />
                    </View>
                  </View>
                )}

                {!canProgress && ticket.status !== 'Closed' && currentUser.role === 'agent' && (
                  <ThemedText type="small" style={styles.note}>
                    To progress this ticket, it must be assigned to you and be in a valid status.
                  </ThemedText>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: { textAlign: 'center', marginBottom: Spacing.two },
  ticketList: { flex: 1 },
  ticketCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: '#fff',
    marginBottom: Spacing.two,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  ticketTitle: { fontWeight: '700' },
  actionRow: { flexDirection: 'row', marginTop: Spacing.two, gap: Spacing.two },
  actionButton: { flex: 1, marginRight: Spacing.one },
  note: { marginTop: Spacing.two, color: '#666' },
});
