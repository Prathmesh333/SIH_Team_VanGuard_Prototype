import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Grid,
  Alert,
  Paper,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

interface AIVideoFeedProps {
  templeId: string;
  templeName: string;
}

interface CrowdDetection {
  totalPeople: number;
  zones: {
    name: string;
    count: number;
    density: 'low' | 'medium' | 'high' | 'critical';
    alert: boolean;
  }[];
  alerts: string[];
  timestamp: Date;
}

const AIVideoFeed: React.FC<AIVideoFeedProps> = ({ templeId, templeName }) => {
  const [isLive, setIsLive] = useState(true);
  const [crowdData, setCrowdData] = useState<CrowdDetection | null>(null);
  const [processing, setProcessing] = useState(true);

  // Simulate AI/ML crowd detection data
  useEffect(() => {
    const generateCrowdData = (): CrowdDetection => {
      const zones = [
        { name: 'Entry Gate', baseCount: Math.floor(Math.random() * 50) + 10 },
        { name: 'Main Hall', baseCount: Math.floor(Math.random() * 200) + 50 },
        { name: 'Darshan Queue', baseCount: Math.floor(Math.random() * 150) + 30 },
        { name: 'Exit Area', baseCount: Math.floor(Math.random() * 40) + 10 },
        { name: 'Prasad Counter', baseCount: Math.floor(Math.random() * 60) + 15 },
      ];

      const processedZones = zones.map(zone => {
        let density: 'low' | 'medium' | 'high' | 'critical';
        let alert = false;

        if (zone.baseCount < 30) density = 'low';
        else if (zone.baseCount < 80) density = 'medium';
        else if (zone.baseCount < 150) {
          density = 'high';
          alert = zone.name === 'Main Hall' || zone.name === 'Darshan Queue';
        } else {
          density = 'critical';
          alert = true;
        }

        return {
          name: zone.name,
          count: zone.baseCount,
          density,
          alert
        };
      });

      const alerts = processedZones
        .filter(zone => zone.alert)
        .map(zone => `High crowd density detected in ${zone.name} (${zone.count} people)`);

      return {
        totalPeople: processedZones.reduce((sum, zone) => sum + zone.count, 0),
        zones: processedZones,
        alerts,
        timestamp: new Date()
      };
    };

    const updateData = () => {
      if (isLive) {
        setProcessing(true);
        setTimeout(() => {
          setCrowdData(generateCrowdData());
          setProcessing(false);
        }, 1000);
      }
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            AI Crowd Monitoring - {templeName}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton onClick={toggleLive} color={isLive ? 'success' : 'default'}>
              {isLive ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Video Feed Simulation */}
        <Paper
          sx={{
            height: 250,
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            mb: 2,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="400" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23222"%3E%3C/rect%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="16" fill="%23888" text-anchor="middle" dy=".3em"%3ELIVE FEED - ' + templeName + '%3C/text%3E%3C/svg%3E")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {processing && (
            <Box
              position="absolute"
              top="50%"
              left="50%"
              sx={{ transform: 'translate(-50%, -50%)' }}
            >
              <CircularProgress size={40} sx={{ color: 'white' }} />
              <Typography variant="body2" sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                Processing AI Analysis...
              </Typography>
            </Box>
          )}

          <Chip
            label={isLive ? "LIVE" : "PAUSED"}
            color={isLive ? "error" : "default"}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8 }}
          />

          {/* Simulated detection boxes */}
          {crowdData && !processing && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: '20%',
                  left: '15%',
                  width: '25%',
                  height: '20%',
                  border: '2px solid #00ff00',
                  bgcolor: 'rgba(0, 255, 0, 0.1)'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '40%',
                  right: '20%',
                  width: '30%',
                  height: '35%',
                  border: '2px solid #ff9800',
                  bgcolor: 'rgba(255, 152, 0, 0.1)'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '25%',
                  width: '20%',
                  height: '15%',
                  border: '2px solid #f44336',
                  bgcolor: 'rgba(244, 67, 54, 0.1)'
                }}
              />
            </>
          )}
        </Paper>

        {/* AI Analysis Results */}
        {crowdData && (
          <>
            <Typography variant="h6" gutterBottom>
              Real-time AI Analysis
            </Typography>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <PersonIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h4" color="primary">
                    {crowdData.totalPeople}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total People Detected
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                  <Typography variant="h4" color="warning.main">
                    {crowdData.alerts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Zone Analysis */}
            <Typography variant="h6" gutterBottom>
              Zone-wise Analysis
            </Typography>
            <Grid container spacing={1} mb={2}>
              {crowdData.zones.map((zone, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ p: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="bold">
                        {zone.name}
                      </Typography>
                      <Chip
                        label={zone.density.toUpperCase()}
                        color={getDensityColor(zone.density) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" color="primary">
                      {zone.count} people
                    </Typography>
                    {zone.alert && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        High Density!
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Alerts */}
            {crowdData.alerts.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  AI Crowd Alerts
                </Typography>
                {crowdData.alerts.map((alert, index) => (
                  <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                    {alert}
                  </Alert>
                ))}
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Last updated: {crowdData.timestamp.toLocaleTimeString()}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIVideoFeed;