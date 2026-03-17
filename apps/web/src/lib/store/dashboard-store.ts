import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface Agent {
  id: string;
  name: string;
  status: string;
  department: string;
  avatarUrl?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  agentId?: string;
}

interface Log {
  id: string;
  message: string;
  level: string;
  createdAt: string;
  agent?: any;
}

interface DashboardState {
  agents: Agent[];
  tasks: Task[];
  logs: Log[];
  socket: Socket | null;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  fetchAgents: () => Promise<void>;
  fetchTasks: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useDashboardStore = create<DashboardState>((set, get) => ({
  agents: [],
  tasks: [],
  logs: [],
  socket: null,

  connectSocket: (token: string) => {
    const socket = io(`${API_URL}/events`, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('WebSocket 已连接');
      socket.emit('join:user', useDashboardStore.getState().user?.id);
    });

    socket.on('task:created', (task) => {
      set((state) => ({ tasks: [task, ...state.tasks] }));
    });

    socket.on('task:running', (task) => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
    });

    socket.on('task:completed', (task) => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
    });

    socket.on('task:log', (log) => {
      set((state) => ({ logs: [log, ...state.logs].slice(0, 50) }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchAgents: async () => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${API_URL}/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const agents = await res.json();
      set({ agents });
    }
  },

  fetchTasks: async () => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const tasks = await res.json();
      set({ tasks });
    }
  },
}));
