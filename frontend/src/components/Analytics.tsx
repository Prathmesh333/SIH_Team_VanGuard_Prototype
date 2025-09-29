import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  Avatar,
  Divider,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import { Temple } from '../types';
import { templeAPI, analyticsAPI } from '../services/api';
import { socketService } from '../services/socket';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const Analytics: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [selectedTemple, setSelectedTemple] = useState<string>('');
  const [timeRange, setTimeRange] = useState(7);
  const [crowdTrends, setCrowdTrends] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadTemples();
    setupSocketListeners();
    setupAutoRefresh();

    return () => {
      socketService.off('occupancy-update');
      socketService.off('global-occupancy-update');
      socketService.off('emergency-alert');
    };
  }, []);

  useEffect(() => {
    if (selectedTemple) {
      loadAnalytics();
    }
  }, [selectedTemple, timeRange]);

  const setupSocketListeners = () => {
    // Listen for real-time occupancy updates
    socketService.on('global-occupancy-update', (update: any) => {
      if (autoRefresh) {
        setLastUpdate(new Date());
        // Refresh analytics if the updated temple is currently selected
        if (selectedTemple === update.templeId) {
          setTimeout(() => loadAnalytics(), 1000); // Small delay to ensure data is updated
        }
      }
    });

    // Listen for emergency alerts that might affect analytics
    socketService.on('emergency-alert', () => {
      if (autoRefresh) {
        setLastUpdate(new Date());
      }
    });
  };

  const setupAutoRefresh = () => {
    // Auto-refresh analytics every 30 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh && selectedTemple) {
        loadAnalytics();
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  const loadTemples = async () => {
    try {
      const data = await templeAPI.getAllTemples();
      setTemples(data);
      if (data.length > 0) {
        setSelectedTemple(data[0]._id);
      }
    } catch (error) {
      console.error('Error loading temples:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load crowd predictions
      const predictionsData = await analyticsAPI.getCrowdPredictions(selectedTemple, timeRange);
      setPredictions(predictionsData);

      // Load historical data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const historicalData = await analyticsAPI.getHistoricalData(
        selectedTemple,
        startDate.toISOString(),
        endDate.toISOString(),
        'hour'
      );
      setCrowdTrends(historicalData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyReport = async () => {
    setReportLoading(true);
    try {
      const report = await analyticsAPI.getDailyReport(selectedDate);
      setReportData(report);
      setReportDialogOpen(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Crowd Analytics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const crowdTrendData = crowdTrends?.data ? {
    labels: crowdTrends.data.map((item: any) =>
      new Date(item.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Average Crowd Count',
        data: crowdTrends.data.map((item: any) => item.avgCrowdCount),
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Temple Capacity',
        data: crowdTrends.data.map(() => crowdTrends.temple.capacity),
        borderColor: '#138808',
        backgroundColor: 'rgba(19, 136, 8, 0.1)',
        borderDash: [5, 5],
      },
    ],
  } : null;

  const densityData = crowdTrends?.data ? {
    labels: crowdTrends.data.map((item: any) =>
      new Date(item.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Crowd Density %',
        data: crowdTrends.data.map((item: any) => item.avgDensity),
        backgroundColor: '#FF6B35',
        borderColor: '#E64A19',
        borderWidth: 1,
      },
    ],
  } : null;

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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              📈 Analytics & Insights
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Real-time crowd analysis and predictive insights for optimal temple management
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="default"
                />
              }
              label="Auto Refresh"
              sx={{ color: 'white' }}
            />
            <Tooltip title="Manual Refresh">
              <IconButton
                onClick={() => {
                  loadAnalytics();
                  setLastUpdate(new Date());
                }}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 2, display: 'block' }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Paper>

      {/* Control Panel */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: alpha(theme.palette.primary.main, 0.02),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Control Panel
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Select Temple</InputLabel>
              <Select
                value={selectedTemple}
                onChange={(e) => setSelectedTemple(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                {temples.map((temple) => (
                  <MenuItem key={temple._id} value={temple._id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main, fontSize: 12 }}>
                        Temple
                      </Avatar>
                      {temple.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem value={1}>Last 24 Hours</MenuItem>
                <MenuItem value={7}>📅 Last 7 Days</MenuItem>
                <MenuItem value={30}>📆 Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Report Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={generateDailyReport}
              disabled={reportLoading}
              sx={{
                height: '56px',
                borderRadius: 2,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                },
              }}
            >
              {reportLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                <>
                  Generate Report
                </>
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Summary Statistics */}
      {crowdTrends?.summary && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                      Average Crowd
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {crowdTrends.summary.avgCrowdCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    👥
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                      Peak Crowd
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {crowdTrends.summary.peakCrowdCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    📈
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                      Average Density
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {crowdTrends.summary.avgDensity}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    Chart
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                      Data Points
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {crowdTrends.summary.totalDataPoints.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                    📝
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Enhanced Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                background: alpha(theme.palette.primary.main, 0.05),
                p: 3,
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                📈 Crowd Trends Over Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time visitor flow analysis
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {crowdTrendData ? (
                <Line data={crowdTrendData} options={chartOptions} />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                background: alpha(theme.palette.secondary.main, 0.05),
                p: 3,
                borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                📉 Crowd Density Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Peak hours and capacity utilization
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {densityData ? (
                <Bar data={densityData} options={chartOptions} />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Predictions Section */}
        {predictions?.temples?.[0]?.predictions && (
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  AI-Powered Crowd Predictions
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
                  Advanced machine learning algorithms predict future crowd patterns
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={4}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        ⏰ Next Hour
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {predictions.temples[0].predictions.nextHour.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Expected visitors
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={4}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        🕑 Next 3 Hours
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {predictions.temples[0].predictions.next3Hours.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Peak period forecast
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={4}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        🌅 Next Day
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {predictions.temples[0].predictions.nextDay.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Daily visitor estimate
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Daily Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="lg"
        fullWidth
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
            onClick={() => setReportDialogOpen(false)}
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
            Daily Analytics Report
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {reportData?.date ? new Date(reportData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : selectedDate}
          </Typography>
        </Box>
        <DialogContent>
          {reportData && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Temples
                      </Typography>
                      <Typography variant="h4">
                        {reportData.summary?.totalTemples || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Avg Occupancy Rate
                      </Typography>
                      <Typography variant="h4">
                        {reportData.summary?.avgOccupancyRate || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Alerts
                      </Typography>
                      <Typography variant="h4">
                        {reportData.summary?.totalAlerts || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Temple Details Table */}
              <Typography variant="h6" gutterBottom>
                Temple Details
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Temple Name</TableCell>
                      <TableCell align="right">Capacity</TableCell>
                      <TableCell align="right">Peak Crowd</TableCell>
                      <TableCell align="right">Avg Crowd</TableCell>
                      <TableCell align="right">Occupancy Rate</TableCell>
                      <TableCell align="right">Alerts</TableCell>
                      <TableCell align="right">Data Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.temples?.map((temple: any) => (
                      <TableRow key={temple.temple.id}>
                        <TableCell component="th" scope="row">
                          {temple.temple.name}
                        </TableCell>
                        <TableCell align="right">{temple.temple.capacity.toLocaleString()}</TableCell>
                        <TableCell align="right">{temple.metrics.peakCrowd.toLocaleString()}</TableCell>
                        <TableCell align="right">{temple.metrics.avgCrowd.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${temple.metrics.occupancyRate}%`}
                            color={
                              temple.metrics.occupancyRate >= 90 ? 'error' :
                              temple.metrics.occupancyRate >= 75 ? 'warning' :
                              temple.metrics.occupancyRate >= 50 ? 'info' : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={temple.metrics.alertCount}
                            color={temple.metrics.alertCount > 0 ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{temple.metrics.dataPoints}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)} color="primary">
            Close
          </Button>
          <Button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `daily-report-${selectedDate}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            color="primary"
            variant="contained"
          >
            Export JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Analytics;