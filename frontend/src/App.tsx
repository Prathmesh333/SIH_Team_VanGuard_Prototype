import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Avatar,
  Divider,
  Badge,
  useTheme,
  alpha,
  ThemeProvider,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import customTheme from './theme';
import './styles/global.css';
import {
  Dashboard as DashboardIcon,
  Queue as QueueIcon,
  Analytics as AnalyticsIcon,
  Emergency as EmergencyIcon,
  AccountBalance as TempleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Groups as CrowdIcon,
} from '@mui/icons-material';

import Dashboard from './components/Dashboard';
import TempleList from './components/TempleList';
import QueueManagement from './components/QueueManagement';
import Analytics from './components/Analytics';
import EmergencyPanel from './components/EmergencyPanel';
import CrowdMonitoring from './components/CrowdMonitoring';
import { socketService } from './services/socket';

const drawerWidth = 280;

const navigationItems = [
  { label: 'Dashboard', icon: DashboardIcon, component: Dashboard },
  { label: 'Temple Directory', icon: TempleIcon, component: TempleList },
  { label: 'Queue Management', icon: QueueIcon, component: QueueManagement },
  { label: 'Analytics & Reports', icon: AnalyticsIcon, component: Analytics },
  { label: 'Crowd Monitoring', icon: CrowdIcon, component: CrowdMonitoring },
  { label: 'Emergency Response', icon: EmergencyIcon, component: EmergencyPanel },
];

function App() {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = localStorage.getItem('selectedNavigationIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [recentEmergencies, setRecentEmergencies] = useState<any[]>([]);
  const theme = useTheme();

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();

    // Fetch initial emergency count
    fetchEmergencyCount();

    // Listen for emergency updates
    socketService.on('emergency-alert', () => {
      setEmergencyCount(prev => prev + 1);
    });

    socketService.on('emergency-status-update', (update: any) => {
      if (update.status === 'resolved') {
        setEmergencyCount(prev => Math.max(0, prev - 1));
      }
    });

    // Listen for emergency count updates from EmergencyPanel
    const handleEmergencyCountUpdate = (event: any) => {
      setEmergencyCount(event.detail.count);
    };

    window.addEventListener('emergencyCountUpdate', handleEmergencyCountUpdate);

    return () => {
      socketService.disconnect();
      window.removeEventListener('emergencyCountUpdate', handleEmergencyCountUpdate);
    };
  }, []);

  const fetchEmergencyCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/emergency/active');
      const data = await response.json();
      setEmergencyCount(data.count || 0);
      setRecentEmergencies(data.emergencies?.slice(0, 5) || []); // Keep only 5 most recent
    } catch (error) {
      console.error('Failed to fetch emergency count:', error);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    fetchEmergencyCount(); // Refresh data when opening notifications
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return 'Medical';
      case 'security': return 'Security';
      case 'fire': return 'Fire';
      case 'crowd': return 'Crowd';
      case 'structural': return 'Structural';
      default: return 'Alert';
    }
  };

  const handleNavigation = (index: number) => {
    setSelectedIndex(index);
    localStorage.setItem('selectedNavigationIndex', index.toString());
  };

  const ActiveComponent = navigationItems[selectedIndex].component;

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
          borderRadius: 0,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {navigationItems[selectedIndex].label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Badge badgeContent={emergencyCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
            color: 'white',
            borderRight: 'none',
            borderRadius: 0,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {/* Logo Section */}
        <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <TempleIcon sx={{ fontSize: 40, mb: 1, color: '#f39c12' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Temple Management
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
            Gujarat Heritage Sites
          </Typography>
        </Box>

        {/* Navigation Menu */}
        <List sx={{ pt: 2 }}>
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = selectedIndex === index;
            const isEmergency = item.label.includes('Emergency');

            return (
              <ListItem key={item.label} disablePadding sx={{ px: 2, mb: 1 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigation(index)}
                  sx={{
                    borderRadius: 0,
                    minHeight: 48,
                    backgroundColor: isSelected
                      ? alpha(theme.palette.primary.main, 0.3)
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.3),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.4),
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {isEmergency ? (
                      <Badge badgeContent={emergencyCount} color="error">
                        <Icon />
                      </Badge>
                    ) : (
                      <Icon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ mt: 'auto', borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Status Indicator */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#2ecc71'
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#2ecc71',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="caption">
              System Online
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8fafc',
          minHeight: '100vh',
          pt: 8,
        }}
      >
        <Box sx={{ p: 3 }}>
          <ActiveComponent />
        </Box>
      </Box>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            🚨 Emergency Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {emergencyCount} active emergencies
          </Typography>
        </Box>

        {recentEmergencies.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No active emergencies
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {recentEmergencies.map((emergency, index) => (
              <MenuItem
                key={emergency._id}
                onClick={() => {
                  setSelectedIndex(5); // Navigate to Emergency Response
                  handleNotificationClose();
                }}
                sx={{
                  alignItems: 'flex-start',
                  py: 2,
                  px: 2,
                  borderBottom: index < recentEmergencies.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '1.2em', mr: 1 }}>
                      {getEmergencyIcon(emergency.type)}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                      {emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)} Emergency
                    </Typography>
                    <Chip
                      label={emergency.severity}
                      color={getSeverityColor(emergency.severity)}
                      size="small"
                      sx={{ fontSize: '0.75rem', height: 20 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {emergency.temple?.name || 'Unknown Temple'}
                  </Typography>
                  <Typography variant="body2" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 1
                  }}>
                    {emergency.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(emergency.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}

        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setSelectedIndex(5); // Navigate to Emergency Response
              handleNotificationClose();
            }}
            sx={{ borderRadius: 2 }}
          >
            View All Emergencies
          </Button>
        </Box>
      </Menu>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      </Box>
    </ThemeProvider>
  );
}

export default App;