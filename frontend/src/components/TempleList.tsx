import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  IconButton,
  Fade,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';

import { Temple } from '../types';
import { templeAPI } from '../services/api';
import { socketService } from '../services/socket';
import { templeEnhancedData } from '../utils/templeData';

const TempleList: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [crowdData, setCrowdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    loadTemples();
    setupSocketListeners();

    return () => {
      socketService.off('global-occupancy-update');
    };
  }, []);

  const setupSocketListeners = () => {
    // Listen for real-time occupancy updates
    socketService.on('global-occupancy-update', (update: any) => {
      setTemples(prev => prev.map(temple =>
        temple._id === update.templeId
          ? { ...temple, currentOccupancy: update.currentOccupancy }
          : temple
      ));

      // Update selected temple if it's the one being updated
      setSelectedTemple(prev =>
        prev && prev._id === update.templeId
          ? { ...prev, currentOccupancy: update.currentOccupancy }
          : prev
      );
    });
  };

  const loadTemples = async () => {
    try {
      const data = await templeAPI.getAllTemples();
      setTemples(data);
    } catch (error) {
      console.error('Error loading temples:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTempleClick = async (temple: Temple) => {
    setSelectedTemple(temple);
    setDetailsOpen(true);

    try {
      const data = await templeAPI.getTempleCrowdData(temple._id);
      setCrowdData(data);
    } catch (error) {
      console.error('Error loading crowd data:', error);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTemple(null);
    setCrowdData(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'default';
      case 'emergency': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon color="success" />;
      case 'closed': return <CloseIcon color="disabled" />;
      case 'emergency': return <WarningIcon color="error" />;
      case 'maintenance': return <WarningIcon color="warning" />;
      default: return <CheckCircleIcon color="success" />;
    }
  };

  const getOccupancyStatus = (percentage: number) => {
    if (percentage >= 90) return { color: '#e74c3c', label: 'Critical', icon: '🔴' };
    if (percentage >= 75) return { color: '#f39c12', label: 'High', icon: '🟡' };
    if (percentage >= 50) return { color: '#3498db', label: 'Moderate', icon: '🔵' };
    return { color: '#2ecc71', label: 'Low', icon: '🟢' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #138808 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Temple Directory
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Real-time monitoring of {temples.length} heritage temples across Gujarat
        </Typography>
        <Box display="flex" gap={3} mt={3}>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {temples.filter(t => t.status === 'open').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Open Temples
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {temples.reduce((sum, t) => sum + t.currentOccupancy, 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total Visitors
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {Math.round(temples.reduce((sum, t) => sum + (t.currentOccupancy / t.capacity * 100), 0) / temples.length)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Avg Occupancy
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Temple Cards Grid */}
      <Grid container spacing={3}>
        {temples.map((temple) => {
          const occupancyPercentage = temple.capacity > 0
            ? (temple.currentOccupancy / temple.capacity) * 100
            : 0;
          const occupancyStatus = getOccupancyStatus(occupancyPercentage);

          return (
            <Grid item xs={12} sm={6} lg={4} key={temple._id}>
              <Fade in timeout={300}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid',
                    borderColor: 'transparent',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      borderColor: theme.palette.primary.main,
                    },
                    position: 'relative',
                    overflow: 'visible',
                  }}
                  onClick={() => handleTempleClick(temple)}
                >
                  {/* Status Indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: 16,
                      bgcolor: 'white',
                      borderRadius: '50%',
                      p: 1,
                      boxShadow: 2,
                      zIndex: 1,
                    }}
                  >
                    {getStatusIcon(temple.status)}
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {/* Temple Name and Rating */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {temple.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} sx={{ fontSize: 16, color: '#ffc107' }} />
                          ))}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            {templeEnhancedData[temple.id]?.rating ?
                              `${templeEnhancedData[temple.id].rating.stars} (${(templeEnhancedData[temple.id].rating.reviews / 1000).toFixed(1)}k reviews)` :
                              '4.5 (8.2k reviews)'
                            }
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={temple.status.toUpperCase()}
                        color={getStatusColor(temple.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    {/* Location */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        {temple.location || 'Gujarat, India'}
                      </Typography>
                    </Box>

                    {/* Capacity Info */}
                    <Box
                      sx={{
                        background: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Live Occupancy
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="caption">{occupancyStatus.icon}</Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: occupancyStatus.color, fontWeight: 600 }}
                          >
                            {occupancyStatus.label}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          {temple.currentOccupancy.toLocaleString()} / {temple.capacity.toLocaleString()}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: occupancyStatus.color }}>
                          {occupancyPercentage.toFixed(0)}%
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={occupancyPercentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(occupancyStatus.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: occupancyStatus.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    {/* Action Button */}
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ViewIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Enhanced Temple Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {selectedTemple && (
          <>
            {/* Dialog Header with Gradient */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #FF6B35 0%, #138808 100%)',
                color: 'white',
                p: 3,
                position: 'relative',
              }}
            >
              <IconButton
                onClick={handleCloseDetails}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                }}
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {selectedTemple.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={selectedTemple.status.toUpperCase()}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
                <Box display="flex" alignItems="center" gap={0.5}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} sx={{ fontSize: 18, color: '#ffc107' }} />
                  ))}
                  <Typography variant="body2" sx={{ ml: 0.5, opacity: 0.9 }}>
                    {templeEnhancedData[selectedTemple.id]?.rating?.stars || '4.5'} Rating
                  </Typography>
                </Box>
              </Box>
            </Box>

            <DialogContent sx={{ p: 0 }}>
              <Grid container>
                <Grid item xs={12} md={6} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    📍 Temple Information
                  </Typography>

                  <List>
                    <ListItem>
                      <LocationIcon sx={{ mr: 2 }} />
                      <ListItemText
                        primary="Location"
                        secondary={selectedTemple.location || 'Gujarat, India'}
                      />
                    </ListItem>

                    <ListItem>
                      <PhoneIcon sx={{ mr: 2 }} />
                      <ListItemText
                        primary="Phone"
                        secondary={templeEnhancedData[selectedTemple.id]?.contact?.phone || '+91-79-23250526'}
                      />
                    </ListItem>

                    <ListItem>
                      <EmailIcon sx={{ mr: 2 }} />
                      <ListItemText
                        primary="Email"
                        secondary={templeEnhancedData[selectedTemple.id]?.contact?.email || 'info@gujarattourism.com'}
                      />
                    </ListItem>

                    <ListItem>
                      <TimeIcon sx={{ mr: 2 }} />
                      <ListItemText
                        primary="Darshan Timings"
                        secondary={
                          templeEnhancedData[selectedTemple.id]?.darshanTimings
                            ? `Morning: ${templeEnhancedData[selectedTemple.id].darshanTimings.morning.start} - ${templeEnhancedData[selectedTemple.id].darshanTimings.morning.end} | Evening: ${templeEnhancedData[selectedTemple.id].darshanTimings.evening.start} - ${templeEnhancedData[selectedTemple.id].darshanTimings.evening.end}`
                            : 'Daily: 6:00 AM - 12:00 PM, 6:00 PM - 9:00 PM'
                        }
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Facilities & Amenities
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {templeEnhancedData[selectedTemple.id]?.facilities?.length > 0 ? (
                      templeEnhancedData[selectedTemple.id].facilities.map((facility, index) => (
                        <Chip
                          key={index}
                          label={facility}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#FF6B35',
                            color: '#FF6B35',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 107, 53, 0.08)',
                            }
                          }}
                        />
                      ))
                    ) : (
                      ['Parking Available', 'Security', 'Prasad Counter', 'Drinking Water', 'Rest Room'].map((facility, index) => (
                        <Chip
                          key={index}
                          label={facility}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#FF6B35',
                            color: '#FF6B35',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 107, 53, 0.08)',
                            }
                          }}
                        />
                      ))
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Live Status & Analytics
                  </Typography>

                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Current Occupancy
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {Math.round((selectedTemple.currentOccupancy / selectedTemple.capacity) * 100)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {selectedTemple.currentOccupancy.toLocaleString()} of {selectedTemple.capacity.toLocaleString()} capacity
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedTemple.currentOccupancy / selectedTemple.capacity) * 100}
                      color={getOccupancyColor((selectedTemple.currentOccupancy / selectedTemple.capacity) * 100)}
                      sx={{ height: 12, borderRadius: 6 }}
                    />
                  </Paper>

                  {selectedTemple.zones?.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Zone Breakdown
                      </Typography>
                      {selectedTemple.zones.map((zone, index) => (
                        <Box key={index} mb={2}>
                          <Typography variant="body2" gutterBottom>
                            {zone.name}: {zone.currentOccupancy || 0} / {zone.capacity}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={zone.capacity > 0 ? ((zone.currentOccupancy || 0) / zone.capacity) * 100 : 0}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      ))}
                    </>
                  )}

                  {crowdData && (
                    <>
                      <Typography variant="h6" gutterBottom mt={2}>
                        Live Analytics
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Alert Level: <Chip label={crowdData.alertLevel?.toUpperCase()} color={getStatusColor(crowdData.alertLevel)} size="small" />
                      </Typography>
                      <Typography variant="body2">
                        Occupancy Rate: {crowdData.occupancyPercentage}%
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ p: 3, bgcolor: alpha(theme.palette.grey[500], 0.05), borderTop: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button variant="outlined" onClick={handleCloseDetails}>
                      Close
                    </Button>
                    <Button variant="contained" startIcon={<TrendingUpIcon />}>
                      View Analytics
                    </Button>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TempleList;