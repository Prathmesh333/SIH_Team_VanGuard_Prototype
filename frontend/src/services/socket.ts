import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  connect(url: string = 'http://localhost:5000') {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Re-attach all listeners
    Object.keys(this.listeners).forEach(event => {
      this.listeners[event].forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTemple(templeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-temple', templeId);
    }
  }

  on(event: string, callback: Function) {
    // Store the listener for reconnection
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Attach to socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function) {
    if (callback && this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  get connected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;