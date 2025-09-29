export interface Temple {
  _id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  zones: Zone[];
  currentOccupancy: number;
  status: 'open' | 'closed' | 'emergency' | 'maintenance';
  facilities: string[];
  darshanTimings: {
    morning: { start: string; end: string };
    evening: { start: string; end: string };
  };
  description: string;
  images?: string[];
  contact: {
    phone: string;
    email: string;
  };
}

export interface Zone {
  name: string;
  capacity: number;
  currentOccupancy?: number;
}

export interface CrowdData {
  _id: string;
  templeId: string;
  timestamp: Date;
  crowdCount: number;
  density: number;
  weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy';
  temperature?: number;
  specialEvent?: string;
  isHoliday: boolean;
  isFestival: boolean;
  predictions: {
    nextHour: number;
    next3Hours: number;
    nextDay: number;
  };
  zoneData: {
    zoneName: string;
    crowdCount: number;
    density: number;
  }[];
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueueBooking {
  _id: string;
  templeId: string;
  tokenNumber: string;
  pilgrimPhone: string;
  pilgrimName: string;
  bookingTime: Date;
  scheduledTime: Date;
  estimatedTime: Date;
  status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'no_show';
  queuePosition: number;
  qrCode?: string;
  specialNeeds: {
    wheelchair: boolean;
    elderly: boolean;
    pregnant: boolean;
    other?: string;
  };
  groupSize: number;
}

export interface Emergency {
  _id: string;
  templeId: string;
  type: 'medical' | 'security' | 'crowd' | 'fire' | 'structural' | 'other';
  location: {
    lat: number;
    lng: number;
    description?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_alarm';
  reportedBy: {
    name?: string;
    phone?: string;
    userType: 'pilgrim' | 'staff' | 'security' | 'admin' | 'anonymous';
  };
  description: string;
  images?: string[];
  assignedTo?: {
    name: string;
    department: string;
    phone: string;
  };
  responseTime: {
    acknowledged?: Date;
    resolved?: Date;
  };
  affectedZones?: string[];
  evacuationRequired: boolean;
  createdAt: Date;
}

export interface AnalyticsData {
  temple: {
    id: string;
    name: string;
    capacity: number;
  };
  data: CrowdData[];
  trends: {
    avgCrowdCount: number;
    peakTime: string;
    quietTime: string;
    busyDays: string[];
    alertFrequency: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  predictions?: {
    nextHour: number;
    next3Hours: number;
    nextDay: number;
  };
}