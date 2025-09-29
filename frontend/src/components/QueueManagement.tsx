import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Badge,
  LinearProgress,
  CircularProgress,
  Snackbar,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  QrCode as QrCodeIcon,
  Search as SearchIcon,
  CallMade as CallIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { Temple, QueueBooking } from '../types';
import { templeAPI, queueAPI } from '../services/api';
import { socketService } from '../services/socket';

const QueueManagement: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [tokenDialog, setTokenDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState<string>('');
  const [queueData, setQueueData] = useState<any>({});
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [queueEntries, setQueueEntries] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    pilgrimName: '',
    pilgrimPhone: '',
    groupSize: 1,
    scheduledTime: '',
    specialNeeds: {
      wheelchair: false,
      elderly: false,
      pregnant: false,
      other: ''
    }
  });

  useEffect(() => {
    loadTemples();
    setupSocketListeners();

    return () => {
      socketService.off('queue-update');
      socketService.off('queue-call');
    };
  }, []);

  useEffect(() => {
    if (selectedTemple) {
      loadQueueData();
    }
  }, [selectedTemple]);

  const loadTemples = async () => {
    try {
      const templesData = await templeAPI.getAllTemples();
      setTemples(templesData);
      if (templesData.length > 0 && !selectedTemple) {
        setSelectedTemple(templesData[0]._id);
      }
    } catch (error) {
      showSnackbar('Failed to load temples');
    }
  };

  const loadQueueData = async () => {
    if (!selectedTemple) return;

    try {
      const [statusData, entriesData] = await Promise.all([
        queueAPI.getQueueStatus(selectedTemple),
        queueAPI.getQueueByTemple(selectedTemple, 'waiting')
      ]);

      setQueueData(statusData);
      setQueueEntries(entriesData);
    } catch (error) {
      showSnackbar('Failed to load queue data');
    }
  };

  const setupSocketListeners = () => {
    socketService.on('queue-update', (data: any) => {
      if (data.templeId === selectedTemple) {
        loadQueueData();
        showSnackbar('Queue updated in real-time');
      }
    });

    socketService.on('queue-call', (data: any) => {
      showSnackbar(`Token ${data.tokenNumber} is being called`);
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleBooking = async () => {
    if (!selectedTemple || !formData.pilgrimName || !formData.pilgrimPhone) {
      showSnackbar('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const booking = await queueAPI.bookDarshanSlot({
        templeId: selectedTemple,
        pilgrimName: formData.pilgrimName,
        pilgrimPhone: formData.pilgrimPhone,
        groupSize: formData.groupSize,
        scheduledTime: formData.scheduledTime || new Date().toISOString(),
        specialNeeds: formData.specialNeeds
      });

      setBookingResult(booking);
      setBookingDialog(false);
      setQrDialog(true);
      loadQueueData();
      showSnackbar('Booking created successfully!');

      // Reset form
      setFormData({
        pilgrimName: '',
        pilgrimPhone: '',
        groupSize: 1,
        scheduledTime: '',
        specialNeeds: {
          wheelchair: false,
          elderly: false,
          pregnant: false,
          other: ''
        }
      });
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSearch = async () => {
    if (!tokenSearch) return;

    setLoading(true);
    try {
      const data = await queueAPI.getBookingByToken(tokenSearch);
      setTokenData(data);
      showSnackbar('Token found');
    } catch (error) {
      setTokenData(null);
      showSnackbar('Token not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (!selectedTemple) return;

    setLoading(true);
    try {
      await queueAPI.callNext(selectedTemple);
      loadQueueData();
      showSnackbar('Next person called');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Failed to call next person');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (entryId: string, status: string) => {
    setLoading(true);
    try {
      await queueAPI.updateQueueEntry(entryId, { status });
      loadQueueData();
      showSnackbar(`Entry ${status}`);
    } catch (error) {
      showSnackbar('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'primary';
      case 'called': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getQueueStats = () => {
    const waiting = queueEntries.filter(e => e.status === 'waiting').length;
    const called = queueEntries.filter(e => e.status === 'called').length;
    const avgWaitTime = waiting * 10; // 10 minutes per person

    return { waiting, called, avgWaitTime };
  };

  const stats = getQueueStats();
  const selectedTempleData = temples.find(t => t._id === selectedTemple);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Queue Management System
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setBookingDialog(true)}
            disabled={!selectedTemple}
          >
            New Booking
          </Button>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => setTokenDialog(true)}
          >
            Find Token
          </Button>
          <IconButton onClick={loadQueueData}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Temple Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Temple</InputLabel>
                <Select
                  value={selectedTemple}
                  onChange={(e) => setSelectedTemple(e.target.value)}
                >
                  {temples.map((temple) => (
                    <MenuItem key={temple._id} value={temple._id}>
                      {temple.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedTempleData && (
              <>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6">{selectedTempleData.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTempleData.location}
                  </Typography>
                  <Chip
                    label={selectedTempleData.status.toUpperCase()}
                    color={selectedTempleData.status === 'normal' ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2">
                    Capacity: {selectedTempleData.capacity}
                  </Typography>
                  <Typography variant="body2">
                    Current: {selectedTempleData.currentOccupancy}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedTempleData.currentOccupancy / selectedTempleData.capacity) * 100}
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4">{stats.waiting}</Typography>
                  <Typography variant="body2">Waiting</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CallIcon sx={{ mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4">{stats.called}</Typography>
                  <Typography variant="body2">Called</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimeIcon sx={{ mr: 1, fontSize: 32 }} />
                <Box>
                  <Typography variant="h4">{stats.avgWaitTime}</Typography>
                  <Typography variant="body2">Avg Wait (min)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<CallIcon />}
                onClick={handleCallNext}
                disabled={loading || stats.waiting === 0}
              >
                Call Next
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Queue - {selectedTempleData?.name || 'Select Temple'}
          </Typography>

          {queueEntries.length === 0 ? (
            <Alert severity="info">No one in queue currently</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Wait Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueEntries.slice(0, 20).map((entry, index) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <Chip
                        label={entry.tokenNumber}
                        color={getStatusColor(entry.status) as any}
                        variant={entry.status === 'called' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{entry.visitorName}</TableCell>
                    <TableCell>{entry.visitorPhone}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status.toUpperCase()}
                        color={getStatusColor(entry.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{entry.estimatedWaitTime} min</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {entry.status === 'waiting' && (
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleUpdateStatus(entry._id, 'called')}
                          >
                            <CallIcon />
                          </IconButton>
                        )}
                        {entry.status === 'called' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleUpdateStatus(entry._id, 'completed')}
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        {(entry.status === 'waiting' || entry.status === 'called') && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleUpdateStatus(entry._id, 'cancelled')}
                          >
                            <CancelIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Booking Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Darshan Slot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Pilgrim Name"
                value={formData.pilgrimName}
                onChange={(e) => setFormData({ ...formData, pilgrimName: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                value={formData.pilgrimPhone}
                onChange={(e) => setFormData({ ...formData, pilgrimPhone: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Group Size"
                type="number"
                value={formData.groupSize}
                onChange={(e) => setFormData({ ...formData, groupSize: parseInt(e.target.value) })}
                fullWidth
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Preferred Time"
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Special Needs:</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.specialNeeds.wheelchair}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeeds: { ...formData.specialNeeds, wheelchair: e.target.checked }
                    })}
                  />
                }
                label="Wheelchair Access"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.specialNeeds.elderly}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeeds: { ...formData.specialNeeds, elderly: e.target.checked }
                    })}
                  />
                }
                label="Elderly Person"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.specialNeeds.pregnant}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeeds: { ...formData.specialNeeds, pregnant: e.target.checked }
                    })}
                  />
                }
                label="Pregnant Woman"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBooking}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Book Slot'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Token Search Dialog */}
      <Dialog open={tokenDialog} onClose={() => setTokenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Find Token</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              label="Token Number"
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleTokenSearch}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>

          {tokenData && (
            <Box mt={3}>
              <Alert severity="success">Token Found!</Alert>
              <Box mt={2}>
                <Typography><strong>Token:</strong> {tokenData.tokenNumber}</Typography>
                <Typography><strong>Temple:</strong> {tokenData.temple}</Typography>
                <Typography><strong>Status:</strong> {tokenData.status}</Typography>
                <Typography><strong>Position:</strong> {tokenData.currentPosition}</Typography>
                <Typography><strong>Wait Time:</strong> {tokenData.estimatedWaitTime} minutes</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTokenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => setQrDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Confirmation</DialogTitle>
        <DialogContent>
          {bookingResult && (
            <Box textAlign="center">
              <Alert severity="success" sx={{ mb: 2 }}>
                Booking Successful!
              </Alert>

              <Typography variant="h4" gutterBottom>
                Token: {bookingResult.booking.tokenNumber}
              </Typography>

              <Box display="flex" justifyContent="center" mb={2}>
                <QRCodeSVG
                  value={JSON.stringify({
                    token: bookingResult.booking.tokenNumber,
                    temple: bookingResult.booking.temple,
                    time: new Date().toISOString()
                  })}
                  size={200}
                />
              </Box>

              <Typography>Position in Queue: {bookingResult.booking.queuePosition}</Typography>
              <Typography>Estimated Wait: {bookingResult.booking.estimatedWaitTime} minutes</Typography>
              <Typography>Temple: {bookingResult.booking.temple}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setBookingDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default QueueManagement;