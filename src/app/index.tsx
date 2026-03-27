import React, { useMemo, useState } from 'react';
import { Alert, Button, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type Role = 'admin' | 'agent' | 'user';
type User = { username: string; password: string; role: Role };
type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  createdBy: string;
  createdAt: string;
};

const users: User[] = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'agent', password: 'agent', role: 'agent' },
  { username: 'user', password: 'user', role: 'user' },
];

const statusOrder: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

function getNextStatuses(status: TicketStatus, role: Role): TicketStatus[] {
  if (status === 'Closed') return [];

  const currentIndex = statusOrder.indexOf(status);
  if (currentIndex < 0 || currentIndex === statusOrder.length - 1) return [];

  const next = statusOrder[currentIndex + 1];
  if (next === 'Closed' && role !== 'admin') return [];

  return [next];
}

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [ticketIdCounter, setTicketIdCounter] = useState(1);

  const roleLabel = currentUser ? currentUser.role.toUpperCase() : 'GUEST';

  const handleLogin = () => {
    const found = users.find(u => u.username === loginName && u.password === loginPassword);
    if (!found) {
      Alert.alert('Login Failed', 'Invalid credentials. Use admin/agent/user');
      return;
    }
    setCurrentUser(found);
    setLoginName('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateTicket = () => {
    if (!currentUser) {
      Alert.alert('Authentication required', 'Login to create tickets');
      return;
    }
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Title and description cannot be empty');
      return;
    }

    const newTicket: Ticket = {
      id: ticketIdCounter,
      title: title.trim(),
      description: description.trim(),
      status: 'Open',
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    setTickets(prev => [newTicket, ...prev]);
    setTicketIdCounter(prev => prev + 1);
    setTitle('');
    setDescription('');
  };

  const moveTicketStatus = (id: number, newStatus: TicketStatus) => {
    setTickets(prev =>
      prev.map(ticket => (ticket.id === id ? { ...ticket, status: newStatus } : ticket)),
    );
  };

  const canCreate = useMemo(() => !!currentUser, [currentUser]);
  const canUpdate = useMemo(() => currentUser?.role !== 'user', [currentUser]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Ticketing App (RBAC demo)
        </ThemedText>

        <ThemedText type="body" style={styles.infoText}>
          Current role: {roleLabel}
        </ThemedText>

        {!currentUser ? (
          <View style={styles.authCard}>
            <ThemedText type="headline" style={styles.authTitle}>
              Login
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={loginName}
              onChangeText={setLoginName}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <Button title="Login" onPress={handleLogin} />
            <ThemedText type="small" style={styles.hint}>
              Test accounts: admin/admin, agent/agent, user/user
            </ThemedText>
          </View>
        ) : (
          <View style={styles.authCard}>
            <ThemedText type="body">Logged in as {currentUser.username}</ThemedText>
            <ThemedText type="body">Role: {currentUser.role}</ThemedText>
            <Button title="Logout" onPress={handleLogout} />
          </View>
        )}

        {canCreate && (
          <View style={styles.formCard}>
            <ThemedText type="headline" style={styles.authTitle}>
              Create New Ticket
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <Button title="Create Ticket" onPress={handleCreateTicket} />
          </View>
        )}

        <ThemedText type="headline" style={styles.listTitle}>
          Tickets ({tickets.length})
        </ThemedText>

        {tickets.length === 0 ? (
          <ThemedText type="body">No tickets yet. Create one above.</ThemedText>
        ) : (
          <ScrollView style={styles.ticketList}>
            {tickets.map(ticket => {
              const nextStatuses = currentUser ? getNextStatuses(ticket.status, currentUser.role) : [];
              return (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeading}>
                    <ThemedText type="body" style={styles.ticketTitle}>
                      #{ticket.id} - {ticket.title}
                    </ThemedText>
                    <ThemedText type="small">{ticket.status}</ThemedText>
                  </View>
                  <ThemedText type="small">Reporter: {ticket.createdBy}</ThemedText>
                  <ThemedText type="small">{ticket.description}</ThemedText>
                  <ThemedText type="small">{new Date(ticket.createdAt).toLocaleString()}</ThemedText>

                  {canUpdate && nextStatuses.length > 0 && (
                    <View style={styles.actionRow}>
                      {nextStatuses.map(next => (
                        <View key={next} style={styles.actionButton}>
                          <Button
                            title={`Move to ${next}`}
                            onPress={() => moveTicketStatus(ticket.id, next)}
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {canUpdate && nextStatuses.length === 0 && ticket.status !== 'Closed' && (
                    <ThemedText type="small" style={styles.noActionText}>
                      No transitions available for role {currentUser?.role}
                    </ThemedText>
                  )}

                  {ticket.status === 'Closed' && (
                    <ThemedText type="small" style={styles.noActionText}>
                      Ticket is closed
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
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
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: { textAlign: 'center', marginBottom: Spacing.two },
  infoText: { textAlign: 'center', marginBottom: Spacing.two },
  authCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: '#fff',
    marginBottom: Spacing.three,
  },
  formCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: '#fff',
    marginBottom: Spacing.three,
  },
  authTitle: { marginBottom: Spacing.two, fontWeight: '600' },
  input: {
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  hint: { marginTop: Spacing.two, color: '#666' },
  listTitle: { marginTop: Spacing.two, marginBottom: Spacing.two, fontWeight: '600' },
  ticketList: { flex: 1 },
  ticketCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: '#fff',
    marginBottom: Spacing.two,
  },
  ticketHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one },
  ticketTitle: { fontWeight: '700' },
  actionRow: { flexDirection: 'row', marginTop: Spacing.two, gap: Spacing.two },
  actionButton: { flex: 1, marginRight: Spacing.one },
  noActionText: { marginTop: Spacing.one, color: '#777' },
});
