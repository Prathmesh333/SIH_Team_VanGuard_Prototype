import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Security as SecurityIcon,
  Emergency as EmergencyIcon,
  Visibility as VisibilityIcon,
  VolumeUp as VolumeUpIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  CameraAlt as CameraIcon,
  Sensors as SensorsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';

import { Temple } from '../types';
import { socketService } from '../services/socket';

interface CrowdData {
  templeId: string;
  templeName: string;
  currentOccupancy: number;
  capacity: number;
  density: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flowRate: number;
  exitBlockage: boolean;
  noiseLevel: number;
  movementSpeed: number;
  heatIndex: number;
  timestamp: string;
}

interface CrowdAlert {
  id: string;
  type: 'stampede_risk' | 'overcrowding' | 'exit_blocked' | 'slow_movement' | 'high_noise' | 'heat_stress';
  severity: 'low' | 'medium' | 'high' | 'critical';
  templeId: string;
  templeName: string;
  description: string;
  recommendations: string[];
  timestamp: string;
  resolved: boolean;
}

const CrowdMonitoring: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [crowdAlerts, setCrowdAlerts] = useState<CrowdAlert[]>([]);
  const [selectedTemple, setSelectedTemple] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alertDialog, setAlertDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<CrowdAlert | null>(null);
  const theme = useTheme();

  useEffect(() => {
    loadTemples();
    loadCrowdData();
    setupRealTimeUpdates();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const loadTemples = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/temples');
      const data = await response.json();
      setTemples(data);
    } catch (error) {
      console.error('Error loading temples:', error);
    }
  };

  const loadCrowdData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/crowd/data');
      const result = await response.json();

      if (result.success) {
        setCrowdData(result.data);
        loadCrowdAlerts();
      }
    } catch (error) {
      console.error('Error loading crowd data:', error);
    }
  };

  const loadCrowdAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/crowd/alerts');
      const result = await response.json();

      if (result.success) {
        setCrowdAlerts(result.alerts);
      }
    } catch (error) {
      console.error('Error loading crowd alerts:', error);
    }
  };

  const generateCrowdAlerts = (data: CrowdData[]) => {
    const alerts: CrowdAlert[] = [];

    data.forEach(crowd => {
      // Critical density alert
      if (crowd.density >= 90) {
        alerts.push({
          id: `stampede-${crowd.templeId}-${Date.now()}`,
          type: 'stampede_risk',
          severity: crowd.density >= 95 ? 'critical' : 'high',
          templeId: crowd.templeId,
          templeName: crowd.templeName,
          description: `Extremely high crowd density detected: ${crowd.density}%. Stampede risk imminent.`,
          recommendations: [
            'Stop new entries immediately',
            'Open all emergency exits',
            'Deploy crowd control personnel',
            'Make announcements to calm crowd',
            'Prepare medical emergency response'
          ],
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Exit blockage alert
      if (crowd.exitBlockage) {
        alerts.push({
          id: `exit-${crowd.templeId}-${Date.now()}`,
          type: 'exit_blocked',
          severity: 'critical',
          templeId: crowd.templeId,
          templeName: crowd.templeName,
          description: 'Emergency exit routes are blocked or congested.',
          recommendations: [
            'Clear exit pathways immediately',
            'Deploy security to manage exits',
            'Redirect crowd flow to alternate exits',
            'Make public announcements'
          ],
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // Slow movement alert
      if (crowd.movementSpeed < 0.5) {
        alerts.push({
          id: `movement-${crowd.templeId}-${Date.now()}`,
          type: 'slow_movement',
          severity: 'high',
          templeId: crowd.templeId,
          templeName: crowd.templeName,
          description: `Crowd movement dangerously slow: ${crowd.movementSpeed} m/s. Risk of crushing.`,
          recommendations: [
            'Guide crowd movement',
            'Create additional pathways',
            'Reduce new entries',
            'Monitor for panic signs'
          ],
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      // High noise level alert
      if (crowd.noiseLevel > 80) {
        alerts.push({
          id: `noise-${crowd.templeId}-${Date.now()}`,
          type: 'high_noise',
          severity: 'medium',
          templeId: crowd.templeId,
          templeName: crowd.templeName,
          description: `High noise levels detected: ${crowd.noiseLevel} dB. May indicate panic or distress.`,
          recommendations: [
            'Investigate noise source',
            'Make calming announcements',
            'Deploy personnel to assess situation',
            'Monitor for signs of distress'
          ],
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    });

    setCrowdAlerts(alerts);
  };

  const setupRealTimeUpdates = () => {
    // Real-time updates every 10 seconds
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadCrowdData();
      }
    }, 10000);

    return () => clearInterval(interval);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical': return '🚨';
      case 'high': return 'High';
      case 'medium': return '🟡';
      default: return 'Normal';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stampede_risk': return 'Stampede Risk';
      case 'exit_blocked': return '🚪';
      case 'slow_movement': return '🐌';
      case 'high_noise': return '🔊';
      case 'heat_stress': return 'Heat Stress';
      default: return 'Alert';
    }
  };

  const handleAlertClick = (alert: CrowdAlert) => {
    setSelectedAlert(alert);
    setAlertDialog(true);
  };

  const resolveAlert = (alertId: string) => {
    setCrowdAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    setAlertDialog(false);
  };

  return (
    <Box>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
          color: 'white',
          p: 4,
          mb: 4,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              👥 Crowd Monitoring & Stampede Detection
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Real-time crowd analysis and safety monitoring system
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={isMonitoring}
                  onChange={(e) => setIsMonitoring(e.target.checked)}
                  color="default"
                />
              }
              label="Live Monitoring"
              sx={{ color: 'white' }}
            />
            <IconButton
              onClick={() => loadCrowdData()}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" gap={4} mt={3}>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {crowdAlerts.filter(a => !a.resolved).length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Active Alerts
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {crowdData.filter(d => d.riskLevel === 'critical' || d.riskLevel === 'high').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              High Risk Areas
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {crowdData.reduce((acc, d) => acc + d.currentOccupancy, 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total Crowd
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Real-time Crowd Data Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {crowdData.map((crowd) => (
          <Grid item xs={12} md={4} key={crowd.templeId}>
            <Card
              sx={{
                borderLeft: `6px solid ${
                  crowd.riskLevel === 'critical' ? theme.palette.error.main :
                  crowd.riskLevel === 'high' ? theme.palette.warning.main :
                  crowd.riskLevel === 'medium' ? theme.palette.info.main :
                  theme.palette.success.main
                }`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {crowd.templeName}
                  </Typography>
                  <Chip
                    label={crowd.riskLevel.toUpperCase()}
                    color={getRiskColor(crowd.riskLevel)}
                    sx={{ fontWeight: 600 }}
                    icon={<span>{getRiskIcon(crowd.riskLevel)}</span>}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Occupancy: {crowd.currentOccupancy.toLocaleString()} / {crowd.capacity.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={crowd.density}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: crowd.density >= 90 ? theme.palette.error.main :
                               crowd.density >= 75 ? theme.palette.warning.main :
                               crowd.density >= 50 ? theme.palette.info.main :
                               theme.palette.success.main,
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Density: {crowd.density}%
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Flow Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {crowd.flowRate} people/min
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Movement Speed
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {crowd.movementSpeed} m/s
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Noise Level
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {crowd.noiseLevel} dB
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Heat Index
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {crowd.heatIndex}°C
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {crowd.exitBlockage && (
                  <Alert severity="error" sx={{ mt: 2, fontSize: '0.8rem' }}>
                    🚪 Exit pathways blocked!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Active Alerts Panel */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Box
          sx={{
            background: alpha(theme.palette.error.main, 0.05),
            p: 3,
            borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            🚨 Active Safety Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {crowdAlerts.filter(a => !a.resolved).length} critical situations requiring immediate attention
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {crowdAlerts.filter(a => !a.resolved).length === 0 ? (
            <Alert severity="success">
              <Typography variant="h6" gutterBottom>
                All Clear!
              </Typography>
              <Typography variant="body2">
                No active crowd safety alerts. All monitored areas are within safe parameters.
              </Typography>
            </Alert>
          ) : (
            <List>
              {crowdAlerts.filter(a => !a.resolved).map((alert, index) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 2,
                    mb: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.02),
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.05),
                    },
                  }}
                  onClick={() => handleAlertClick(alert)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getRiskColor(alert.severity) === 'error' ? theme.palette.error.main : theme.palette.warning.main,
                        animation: alert.severity === 'critical' ? 'pulse 2s infinite' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '1.2em' }}>{getAlertIcon(alert.type)}</span>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          color={getRiskColor(alert.severity)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          {alert.templeName}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Alert Detail Dialog */}
      <Dialog
        open={alertDialog}
        onClose={() => setAlertDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <span style={{ fontSize: '1.5em' }}>{getAlertIcon(selectedAlert.type)}</span>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedAlert.type.replace('_', ' ').toUpperCase()} Alert
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAlert.templeName}
                  </Typography>
                </Box>
                <Chip
                  label={selectedAlert.severity}
                  color={getRiskColor(selectedAlert.severity)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                {selectedAlert.description}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📋 Recommended Actions:
              </Typography>
              <List>
                {selectedAlert.recommendations.map((rec, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${index + 1}. ${rec}`}
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAlertDialog(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => resolveAlert(selectedAlert.id)}
                startIcon={<SecurityIcon />}
              >
                Mark as Resolved
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CrowdMonitoring;