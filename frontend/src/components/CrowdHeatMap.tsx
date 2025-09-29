import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip } from '@mui/material';
import { Temple } from '../types';

interface CrowdHeatMapProps {
  temples: Temple[];
  crowdData: { [templeId: string]: any };
}

const CrowdHeatMap: React.FC<CrowdHeatMapProps> = ({ temples, crowdData }) => {
  const getHeatColor = (occupancyPercentage: number) => {
    if (occupancyPercentage >= 90) return '#D32F2F'; // Critical - Deep Red
    if (occupancyPercentage >= 75) return '#F57C00'; // High - Orange
    if (occupancyPercentage >= 50) return '#FF6B35'; // Medium - Primary Orange
    if (occupancyPercentage >= 25) return '#138808'; // Low - Primary Green
    return '#4CAF50'; // Very Low - Light Green
  };

  const getIntensityLabel = (occupancyPercentage: number) => {
    if (occupancyPercentage >= 90) return 'Critical';
    if (occupancyPercentage >= 75) return 'High';
    if (occupancyPercentage >= 50) return 'Medium';
    if (occupancyPercentage >= 25) return 'Low';
    return 'Very Low';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Temple Crowd Intensity Map
        </Typography>

        <Grid container spacing={2}>
          {temples.map((temple) => {
            const occupancyPercentage = temple.capacity > 0
              ? (temple.currentOccupancy / temple.capacity) * 100
              : 0;

            const heatColor = getHeatColor(occupancyPercentage);
            const intensity = getIntensityLabel(occupancyPercentage);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={temple._id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: heatColor,
                    color: 'white',
                    textAlign: 'center',
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: 2,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {temple.name}
                  </Typography>

                  <Typography variant="h4" fontWeight="bold">
                    {occupancyPercentage.toFixed(0)}%
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {temple.currentOccupancy} / {temple.capacity}
                  </Typography>

                  <Chip
                    label={intensity}
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                    }}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Legend */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Crowd Intensity Legend:
          </Typography>
          <Grid container spacing={1}>
            {[
              { label: 'Very Low (0-25%)', color: '#4CAF50' },
              { label: 'Low (25-50%)', color: '#138808' },
              { label: 'Medium (50-75%)', color: '#FF6B35' },
              { label: 'High (75-90%)', color: '#F57C00' },
              { label: 'Critical (90%+)', color: '#D32F2F' },
            ].map((item, index) => (
              <Grid item key={index}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                    }}
                  />
                  <Typography variant="caption">
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CrowdHeatMap;