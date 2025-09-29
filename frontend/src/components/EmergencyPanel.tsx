import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Paper,
  Divider,
  IconButton,
  Badge,
  alpha,
  useTheme,
  Fade,
  Pulse,
} from '@mui/material';
import {
  Emergency as EmergencyIcon,
  LocalHospital as MedicalIcon,
  Security as SecurityIcon,
  LocalFireDepartment as FireIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  Report as ReportIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { Temple, Emergency } from '../types';
import { templeAPI, emergencyAPI } from '../services/api';
import { socketService } from '../services/socket';

const EmergencyPanel: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [reportDialog, setReportDialog] = useState(false);
  const [contactsDialog, setContactsDialog] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState<string>('');
  const [contacts, setContacts] = useState<any>(null);

  const [reportForm, setReportForm] = useState({
    templeId: '',
    type: '',
    severity: '',
    description: '',
    location: { lat: 0, lng: 0, description: '' },
    reportedBy: { name: '', phone: '', userType: 'pilgrim' }
  });

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    loadTemples();
    loadActiveEmergencies();
    setupSocketListeners();

    return () => {
      socketService.off('emergency-alert');
      socketService.off('emergency-status-update');
      socketService.off('global-occupancy-update');
    };
  }, []);

  const loadTemples = async () => {
    try {
      const data = await templeAPI.getAllTemples();
      setTemples(data);
    } catch (error) {
      console.error('Error loading temples:', error);
    }
  };

  const loadActiveEmergencies = async () => {
    try {
      const data = await emergencyAPI.getActiveEmergencies();
      setEmergencies(data.emergencies);

      // Update the emergency count in the parent App component
      const event = new CustomEvent('emergencyCountUpdate', {
        detail: { count: data.count || data.emergencies.length }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error loading emergencies:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('emergency-alert', (emergency: any) => {
      setEmergencies(prev => [emergency, ...prev]);
    });

    socketService.on('emergency-status-update', (update: any) => {
      setEmergencies(prev => prev.map(e =>
        e._id === update.emergencyId ? { ...e, status: update.status } : e
      ));
    });

    // Listen for real-time occupancy updates
    socketService.on('global-occupancy-update', (update: any) => {
      setTemples(prev => prev.map(temple =>
        temple._id === update.templeId
          ? { ...temple, currentOccupancy: update.currentOccupancy }
          : temple
      ));
    });
  };

  const reportEmergency = async () => {
    try {
      await emergencyAPI.reportEmergency(reportForm);
      setReportDialog(false);
      setReportForm({
        templeId: '',
        type: '',
        severity: '',
        description: '',
        location: { lat: 0, lng: 0, description: '' },
        reportedBy: { name: '', phone: '', userType: 'pilgrim' }
      });
      loadActiveEmergencies();
    } catch (error: any) {
      console.error('Error reporting emergency:', error);
      alert(error.response?.data?.error || 'Failed to report emergency');
    }
  };

  const loadEmergencyContacts = async (templeId: string) => {
    try {
      const data = await emergencyAPI.getEmergencyContacts(templeId);
      setContacts(data);
      setContactsDialog(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const updateEmergencyStatus = async (id: string, status: string) => {
    try {
      await emergencyAPI.updateEmergencyStatus(id, status);
      loadActiveEmergencies();
    } catch (error) {
      console.error('Error updating emergency:', error);
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return <MedicalIcon />;
      case 'security': return <SecurityIcon />;
      case 'fire': return <FireIcon />;
      default: return <WarningIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in_progress': return 'info';
      case 'acknowledged': return 'warning';
      default: return 'error';
    }
  };

  const theme = useTheme();

  return (
    <Box>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          🆘 Emergency Response Center
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
          Real-time emergency management and rapid response coordination
        </Typography>
        <Box display="flex" gap={3} mt={3}>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {emergencies.filter(e => e.status !== 'resolved').length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Active Emergencies
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {temples.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Monitored Temples
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              24/7
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Response Time
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Action Panel */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: alpha(theme.palette.error.main, 0.02),
          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          ⚡ Emergency Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              size="large"
              startIcon={<EmergencyIcon />}
              onClick={() => setReportDialog(true)}
              sx={{
                borderRadius: 3,
                py: 2,
                fontWeight: 700,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 8px 30px rgba(254, 107, 139, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(254, 107, 139, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              🚨 Report Emergency
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              size="large"
              startIcon={<PhoneIcon />}
              onClick={() => {
                if (temples.length > 0) {
                  setSelectedTemple(temples[0]._id);
                  loadEmergencyContacts(temples[0]._id);
                } else {
                  alert('No temples available');
                }
              }}
              sx={{
                borderRadius: 3,
                py: 2,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              📞 View Emergency Contacts
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              size="large"
              startIcon={<SpeedIcon />}
              onClick={() => {
                if (temples.length > 0) {
                  const randomTemple = temples[Math.floor(Math.random() * temples.length)];
                  // Trigger an immediate emergency for testing
                  fetch('http://localhost:5000/api/emergency/generator/trigger', {
                    method: 'POST'
                  }).then(() => {
                    alert(`Test emergency generated for ${randomTemple.name}`);
                    loadActiveEmergencies();
                  }).catch(err => {
                    console.error('Failed to generate test emergency:', err);
                  });
                }
              }}
              sx={{
                borderRadius: 3,
                py: 2,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(156, 39, 176, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              ⚡ Generate Test Emergency
            </Button>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 600 }}>Select Temple for Emergency Contacts</InputLabel>
              <Select
                value={selectedTemple}
                onChange={(e) => {
                  setSelectedTemple(e.target.value);
                  loadEmergencyContacts(e.target.value);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    height: 56,
                  },
                }}
              >
                {temples.map((temple) => (
                  <MenuItem key={temple._id} value={temple._id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main, fontSize: 12 }}>
                        T
                      </Avatar>
                      {temple.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Active Emergencies */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: alpha(theme.palette.error.main, 0.05),
            p: 3,
            borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                🚨 Active Emergencies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {emergencies.length} active incidents requiring attention
              </Typography>
            </Box>
            <Badge badgeContent={emergencies.length} color="error">
              <Avatar
                sx={{
                  bgcolor: theme.palette.error.main,
                  width: 48,
                  height: 48,
                  animation: emergencies.length > 0 ? 'pulse 2s infinite' : 'none',
                }}
              >
                <EmergencyIcon />
              </Avatar>
            </Badge>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {emergencies.length === 0 ? (
            <Alert
              severity="success"
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                All Clear!
              </Typography>
              <Typography variant="body2">
                No active emergencies reported. All temple facilities are operating normally.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {emergencies.map((emergency, index) => (
                <Grid item xs={12} key={emergency._id}>
                  <Fade in timeout={300 + index * 100}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        border: `2px solid ${alpha(getSeverityColor(emergency.severity) === 'error' ? theme.palette.error.main : theme.palette.warning.main, 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" mb={2}>
                              <Avatar
                                sx={{
                                  mr: 2,
                                  bgcolor: getSeverityColor(emergency.severity) === 'error' ? theme.palette.error.main : theme.palette.warning.main,
                                  width: 56,
                                  height: 56,
                                  animation: emergency.severity === 'critical' ? 'pulse 2s infinite' : 'none',
                                }}
                              >
                                {getEmergencyIcon(emergency.type)}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)} Emergency
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {temples.find(t => t._id === emergency.templeId)?.name || 'Unknown Temple'}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <TimeIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(emergency.createdAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                              {emergency.description}
                            </Typography>

                            <Box display="flex" gap={1}>
                              <Chip
                                label={emergency.severity.toUpperCase()}
                                color={getSeverityColor(emergency.severity)}
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                label={emergency.status.replace('_', ' ').toUpperCase()}
                                color={getStatusColor(emergency.status)}
                                sx={{ fontWeight: 600 }}
                              />
                              {emergency.reportedBy?.name && (
                                <Chip
                                  label={`Reported by: ${emergency.reportedBy.name}`}
                                  variant="outlined"
                                  size="small"
                                />
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Box display="flex" flexDirection="column" gap={2}>
                              {emergency.status === 'reported' && (
                                <Button
                                  variant="contained"
                                  color="warning"
                                  fullWidth
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => updateEmergencyStatus(emergency._id, 'acknowledged')}
                                  sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              {emergency.status === 'acknowledged' && (
                                <Button
                                  variant="contained"
                                  color="info"
                                  fullWidth
                                  startIcon={<SpeedIcon />}
                                  onClick={() => updateEmergencyStatus(emergency._id, 'in_progress')}
                                  sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                  Start Response
                                </Button>
                              )}
                              {emergency.status === 'in_progress' && (
                                <Button
                                  variant="contained"
                                  color="success"
                                  fullWidth
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => updateEmergencyStatus(emergency._id, 'resolved')}
                                  sx={{
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    background: 'linear-gradient(45deg, #66bb6a 30%, #43a047 90%)',
                                  }}
                                >
                                  Mark Resolved
                                </Button>
                              )}
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PhoneIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Contact Team
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Enhanced Report Emergency Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            position: 'relative',
          }}
        >
          <IconButton
            onClick={() => setReportDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            🚨 Report Emergency
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Provide detailed information for rapid response coordination
          </Typography>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              📞 Emergency hotline: <strong>112</strong> | For immediate life-threatening situations, call emergency services first
            </Typography>
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Temple</InputLabel>
                <Select
                  value={reportForm.templeId}
                  onChange={(e) => setReportForm({ ...reportForm, templeId: e.target.value })}
                >
                  {temples.map((temple) => (
                    <MenuItem key={temple._id} value={temple._id}>
                      {temple.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Emergency Type</InputLabel>
                <Select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                >
                  <MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="crowd">Crowd Control</MenuItem>
                  <MenuItem value="fire">Fire</MenuItem>
                  <MenuItem value="structural">Structural</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={3}
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Reporter Name"
                value={reportForm.reportedBy.name}
                onChange={(e) => setReportForm({
                  ...reportForm,
                  reportedBy: { ...reportForm.reportedBy, name: e.target.value }
                })}
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Reporter Phone"
                value={reportForm.reportedBy.phone}
                onChange={(e) => setReportForm({
                  ...reportForm,
                  reportedBy: { ...reportForm.reportedBy, phone: e.target.value }
                })}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
          <Button
            onClick={() => setReportDialog(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={reportEmergency}
            variant="contained"
            color="error"
            disabled={!reportForm.templeId || !reportForm.type || !reportForm.severity || !reportForm.description}
            startIcon={<ReportIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            }}
          >
            Submit Emergency Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Contacts Dialog */}
      <Dialog open={contactsDialog} onClose={() => setContactsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Emergency Contacts</DialogTitle>
        <DialogContent>
          {contacts && (
            <Grid container spacing={3}>
              {Object.entries(contacts.emergencyContacts).map(([category, contactList]: [string, any]) => (
                <Grid item xs={12} md={6} key={category}>
                  <Typography variant="h6" gutterBottom>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
                  <List>
                    {contactList.map((contact: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar>
                            <PhoneIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={contact.name}
                          secondary={
                            <Box>
                              <Typography component="span">{contact.phone}</Typography>
                              {contact.available24x7 && (
                                <Chip label="24x7" color="success" size="small" sx={{ ml: 1 }} />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setContactsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyPanel;