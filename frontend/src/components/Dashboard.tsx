import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Emergency as EmergencyIcon,
  Videocam as VideocamIcon,
  Settings as SettingsIcon,
  NotificationsActive as NotificationsIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  LocalHospital as MedicalIcon,
} from '@mui/icons-material';

import { Temple, CrowdData } from '../types';
import { templeAPI, analyticsAPI } from '../services/api';
import { socketService } from '../services/socket';
import CrowdHeatMap from './CrowdHeatMap';
import AIVideoFeed from './AIVideoFeed';

const Dashboard: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [crowdData, setCrowdData] = useState<{ [templeId: string]: any }>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // New state for enhanced functionality
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setupSocketListeners();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      socketService.off('temple-status-update');
      socketService.off('crowd-alert');
      socketService.off('emergency-alert');
    };
  }, [refreshInterval, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load temples
      const templesData = await templeAPI.getAllTemples();
      setTemples(templesData);

      // Load crowd data for each temple
      const crowdDataPromises = templesData.map(async (temple) => {
        const data = await templeAPI.getTempleCrowdData(temple._id, 24);
        return { templeId: temple._id, ...data };
      });

      const crowdResults = await Promise.all(crowdDataPromises);
      const crowdDataMap: { [key: string]: any } = {};
      crowdResults.forEach((result) => {
        crowdDataMap[result.templeId] = result;
      });
      setCrowdData(crowdDataMap);

      setLastUpdate(new Date());
      showSnackbar('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showSnackbar('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('temple-status-update', (data: any) => {
      setTemples(prev => prev.map(temple =>
        temple._id === data.templeId
          ? { ...temple, currentOccupancy: data.currentOccupancy, status: data.status }
          : temple
      ));
      setLastUpdate(new Date());
      showSnackbar(`Temple ${data.templeId} status updated`);
    });

    socketService.on('crowd-alert', (alert: any) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      showSnackbar(`New crowd alert: ${alert.message}`);
    });

    socketService.on('emergency-alert', (emergency: any) => {
      setAlerts(prev => [{
        ...emergency,
        type: 'emergency',
        alertLevel: 'critical'
      }, ...prev.slice(0, 9)]);
      showSnackbar(`EMERGENCY: ${emergency.description}`);
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleManualRefresh = () => {
    loadDashboardData();
  };

  const handleTempleClick = (temple: Temple) => {
    setSelectedTemple(temple);
    setVideoDialogOpen(true);
  };

  const handleEmergencyResponse = async (templeId: string) => {
    try {
      // Simulate emergency response action
      await templeAPI.updateTempleStatus(templeId, 'emergency', undefined);
      showSnackbar('Emergency response team notified');
    } catch (error) {
      showSnackbar('Failed to send emergency response');
    }
  };

  const handleCrowdControl = async (templeId: string) => {
    try {
      // Simulate crowd control action
      const temple = temples.find(t => t._id === templeId);
      if (temple) {
        const newOccupancy = Math.max(0, temple.currentOccupancy - 50);
        await templeAPI.updateTempleStatus(templeId, temple.status, newOccupancy);
        showSnackbar('Crowd control measures activated');
      }
    } catch (error) {
      showSnackbar('Failed to activate crowd control');
    }
  };

  const getAlertColor = (level: string): "success" | "info" | "warning" | "error" => {
    switch (level) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getOccupancyColor = (percentage: number): "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (percentage < 50) return 'success';
    if (percentage < 75) return 'warning';
    return 'error';
  };

  const stats = {
    totalPeople: temples.reduce((sum, temple) => sum + temple.currentOccupancy, 0),
    totalCapacity: temples.reduce((sum, temple) => sum + temple.capacity, 0),
    totalTemples: temples.length,
    openTemples: temples.filter(t => t.status === 'normal').length,
    emergencyTemples: temples.filter(t => t.status === 'emergency').length,
  };

  return (
    <Box>
      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Smart Crowd Management Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Manual Refresh">
            <IconButton onClick={handleManualRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dashboard Settings">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Badge badgeContent={alerts.length} color="error">
            <IconButton>
              <NotificationsIcon />
            </IconButton>
          </Badge>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.totalPeople.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Total Visitors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {Math.round((stats.totalPeople / stats.totalCapacity) * 100)}%
                  </Typography>
                  <Typography variant="body2">
                    Average Occupancy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocationIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.openTemples}/{stats.totalTemples}
                  </Typography>
                  <Typography variant="body2">
                    Open Temples
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: stats.emergencyTemples > 0 ? 'error.main' : 'success.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EmergencyIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.emergencyTemples}
                  </Typography>
                  <Typography variant="body2">
                    Active Emergencies
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Temple Status Cards with Enhanced Actions */}
      <Typography variant="h5" gutterBottom>
        Temple Status Overview
      </Typography>

      <Grid container spacing={3} mb={4}>
        {temples.map((temple) => {
          const data = crowdData[temple._id];
          const occupancyPercentage = temple.capacity > 0
            ? (temple.currentOccupancy / temple.capacity) * 100
            : 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={temple._id}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 8 } }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {temple.name}
                    </Typography>
                    <Chip
                      label={temple.status.toUpperCase()}
                      color={temple.status === 'normal' ? 'success' :
                             temple.status === 'emergency' ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {temple.location}
                  </Typography>

                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>
                      Occupancy: {temple.currentOccupancy} / {temple.capacity}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={occupancyPercentage}
                      color={getOccupancyColor(occupancyPercentage)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {occupancyPercentage.toFixed(1)}% full
                    </Typography>
                  </Box>

                  {data?.alertLevel && data.alertLevel !== 'low' && (
                    <Alert
                      severity={getAlertColor(data.alertLevel)}
                      sx={{ mt: 2 }}
                      icon={<WarningIcon />}
                    >
                      {data.alertLevel.toUpperCase()} crowd density detected
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VideocamIcon />}
                      onClick={() => handleTempleClick(temple)}
                    >
                      Live Feed
                    </Button>
                    {occupancyPercentage > 80 && (
                      <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        startIcon={<SecurityIcon />}
                        onClick={() => handleCrowdControl(temple._id)}
                      >
                        Control
                      </Button>
                    )}
                    {temple.status === 'emergency' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<MedicalIcon />}
                        onClick={() => handleEmergencyResponse(temple._id)}
                      >
                        Response
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Recent Alerts & Notifications
          </Typography>
          <Grid container spacing={2}>
            {alerts.slice(0, 5).map((alert, index) => (
              <Grid item xs={12} key={index}>
                <Alert
                  severity={getAlertColor(alert.alertLevel)}
                  action={
                    <Typography variant="caption">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Typography>
                  }
                >
                  <strong>{alert.templeName || 'System'}:</strong> {alert.message || alert.description}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Crowd Heat Map */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Live Crowd Heat Map
        </Typography>
        <CrowdHeatMap temples={temples} crowdData={crowdData} />
      </Box>

      {/* AI Video Feed Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          AI Crowd Monitoring - {selectedTemple?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTemple && (
            <AIVideoFeed
              templeId={selectedTemple._id}
              templeName={selectedTemple.name}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Refresh Interval</InputLabel>
              <Select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>1 minute</MenuItem>
                <MenuItem value={120}>2 minutes</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
              </Select>
            </FormControl>

            <Box mt={2}>
              <Button
                variant={autoRefresh ? "contained" : "outlined"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                fullWidth
              >
                Auto Refresh: {autoRefresh ? "ON" : "OFF"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleManualRefresh}
      >
        <RefreshIcon />
      </Fab>

      {/* Status Update */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          p: 2,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Dashboard;