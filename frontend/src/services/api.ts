import axios from 'axios';
import { Temple, CrowdData, QueueBooking, Emergency, AnalyticsData } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-api-domain.com/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Temple API calls
export const templeAPI = {
  getAllTemples: async (): Promise<Temple[]> => {
    const response = await api.get('/temples');
    return response.data;
  },

  getTempleById: async (id: string): Promise<Temple> => {
    const response = await api.get(`/temples/${id}`);
    return response.data;
  },

  getTempleCrowdData: async (id: string, hours: number = 24) => {
    const response = await api.get(`/temples/${id}/crowd?hours=${hours}`);
    return response.data;
  },

  updateTempleStatus: async (id: string, status: string, currentOccupancy: number) => {
    const response = await api.put(`/temples/${id}/status`, { status, currentOccupancy });
    return response.data;
  },

  createCrowdAlert: async (id: string, alertLevel: string, message: string, zones?: string[]) => {
    const response = await api.post(`/temples/${id}/alert`, { alertLevel, message, zones });
    return response.data;
  },

  getTemplesByLocation: async (lat: number, lng: number, radius: number = 50): Promise<Temple[]> => {
    const response = await api.get(`/temples/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  }
};

// Queue API calls
export const queueAPI = {
  bookDarshanSlot: async (booking: {
    templeId: string;
    pilgrimPhone: string;
    pilgrimName: string;
    scheduledTime: string;
    specialNeeds?: any;
    groupSize?: number;
  }) => {
    const response = await api.post('/queue/book', booking);
    return response.data;
  },

  getQueueStatus: async (templeId: string) => {
    const response = await api.get(`/queue/${templeId}/status`);
    return response.data;
  },

  getBookingByToken: async (tokenNumber: string) => {
    const response = await api.get(`/queue/token/${tokenNumber}`);
    return response.data;
  },

  updateQueuePosition: async (tokenNumber: string, status: string) => {
    const response = await api.put(`/queue/token/${tokenNumber}`, { status });
    return response.data;
  },

  cancelBooking: async (tokenNumber: string) => {
    const response = await api.delete(`/queue/token/${tokenNumber}`);
    return response.data;
  },

  callNext: async (templeId: string) => {
    const response = await api.post(`/queue/${templeId}/call-next`);
    return response.data;
  },

  updateQueueEntry: async (entryId: string, data: any) => {
    const response = await api.put(`/queue/entry/${entryId}`, data);
    return response.data;
  },

  getQueueByTemple: async (templeId: string, status: string = 'waiting') => {
    const response = await api.get(`/queue/${templeId}/entries?status=${status}`);
    return response.data;
  }
};

// Analytics API calls
export const analyticsAPI = {
  getCrowdPredictions: async (templeId?: string, days: number = 7): Promise<{ temples: AnalyticsData[] }> => {
    const params = new URLSearchParams();
    if (templeId) params.append('templeId', templeId);
    params.append('days', days.toString());

    const response = await api.get(`/analytics/predictions?${params}`);
    return response.data;
  },

  getHistoricalData: async (templeId: string, startDate?: string, endDate?: string, granularity: string = 'hour') => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('granularity', granularity);

    const response = await api.get(`/analytics/temple/${templeId}/history?${params}`);
    return response.data;
  },

  getDailyReport: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/analytics/daily-report${params}`);
    return response.data;
  }
};

// Emergency API calls
export const emergencyAPI = {
  reportEmergency: async (emergency: {
    templeId: string;
    type: string;
    location: { lat: number; lng: number; description?: string };
    severity: string;
    description: string;
    reportedBy?: any;
    affectedZones?: string[];
  }) => {
    const response = await api.post('/emergency/report', emergency);
    return response.data;
  },

  getActiveEmergencies: async (templeId?: string): Promise<{ emergencies: Emergency[] }> => {
    const params = templeId ? `?templeId=${templeId}` : '';
    const response = await api.get(`/emergency/active${params}`);
    return response.data;
  },

  updateEmergencyStatus: async (id: string, status: string, notes?: string, assignedTo?: any) => {
    const response = await api.put(`/emergency/${id}/update`, { status, notes, assignedTo });
    return response.data;
  },

  getEmergencyContacts: async (templeId: string) => {
    const response = await api.get(`/emergency/contacts/${templeId}`);
    return response.data;
  },

  getEmergencyHistory: async (templeId: string, days: number = 30, status?: string, type?: string) => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (status) params.append('status', status);
    if (type) params.append('type', type);

    const response = await api.get(`/emergency/temple/${templeId}/history?${params}`);
    return response.data;
  }
};

export default api;