import React, { createContext, ReactNode, useCallback, useMemo, useState } from 'react';

type Role = 'admin' | 'agent' | 'guest';

export type User = { username: string; password: string; role: Role };
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  createdBy: string;
  createdAt: string;
  assignedTo?: string | null;
};

export type TicketContextType = {
  currentUser: User | null;
  tickets: Ticket[];
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createTicket: (title: string, description: string) => boolean;
  assignTicket: (ticketId: number, agentUsername: string) => void;
  updateTicketStatus: (ticketId: number, nextStatus: TicketStatus) => void;
};

const defaultUsers: User[] = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'agent1', password: 'agent1', role: 'agent' },
  { username: 'agent2', password: 'agent2', role: 'agent' },
  { username: 'guest', password: 'guest', role: 'guest' },
];

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nextTicketId, setNextTicketId] = useState(1);

  const login = useCallback((username: string, password: string) => {
    const found = defaultUsers.find(u => u.username === username && u.password === password);
    if (!found) return false;
    setCurrentUser(found);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const createTicket = useCallback(
    (title: string, description: string) => {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      if (!trimmedTitle || !trimmedDescription) return false;

      const author = currentUser?.username || 'guest';
      const newTicket: Ticket = {
        id: nextTicketId,
        title: trimmedTitle,
        description: trimmedDescription,
        status: 'Open',
        createdBy: author,
        createdAt: new Date().toISOString(),
        assignedTo: null,
      };

      setTickets(prev => [newTicket, ...prev]);
      setNextTicketId(prev => prev + 1);
      return true;
    },
    [currentUser, nextTicketId],
  );

  const assignTicket = useCallback((ticketId: number, agentUsername: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, assignedTo: agentUsername } : t)),
    );
  }, []);

  const updateTicketStatus = useCallback((ticketId: number, nextStatus: TicketStatus) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: nextStatus } : t)),
    );
  }, []);

  const value = useMemo(
    () => ({ currentUser, tickets, users: defaultUsers, login, logout, createTicket, assignTicket, updateTicketStatus }),
    [currentUser, tickets, login, logout, createTicket, assignTicket, updateTicketStatus],
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTicketContext() {
  const ctx = React.useContext(TicketContext);
  if (!ctx) {
    throw new Error('useTicketContext must be used within TicketProvider');
  }
  return ctx;
}
