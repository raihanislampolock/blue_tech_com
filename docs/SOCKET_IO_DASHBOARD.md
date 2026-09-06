# Socket.IO Dashboard Real-time Updates

## Overview
This system now supports real-time dashboard updates using Socket.IO, allowing dashboards to update automatically without page refreshes.

## Features

### 1. Real-time Updates
- **Automatic Updates**: Dashboard data updates in real-time when changes occur
- **Role-based Broadcasting**: Updates are sent only to users with relevant roles
- **Chart Updates**: Charts automatically refresh with new data
- **Stat Updates**: Info boxes update with new statistics

### 2. Socket Events

#### Client to Server
- `join-dashboard`: Join dashboard room based on user role
- `dashboard-action`: Send dashboard actions to server

#### Server to Client
- `dashboard-update`: Receive dashboard updates from server
- `dashboard:update`: Legacy event for backward compatibility

### 3. Update Types
- `dashboard-data-update`: Full dashboard data update
- `test-update`: Test socket functionality

## How It Works

### 1. Connection Setup
```javascript
// Client connects to socket
const socket = io();

// Join dashboard room based on user role
socket.emit('join-dashboard', {
  userId: 'user123',
  roleName: 'medicalservice'
});
```

### 2. Receiving Updates
```javascript
socket.on('dashboard-update', function(data) {
  if (data.type === 'dashboard-data-update') {
    // Update dashboard stats
    updateDashboardStats(data.stats);
    
    // Update charts
    updateChart(data.confirmedData, data.pendingData);
  }
});
```

### 3. Server-side Emission
```typescript
// Emit to all users with specific role
emitDashboardUpdate(roleName, {
  type: 'dashboard-data-update',
  stats: newStats,
  confirmedData: newConfirmedData,
  pendingData: newPendingData
});
```

## Testing

### 1. Test Button
Each dashboard has a "Test Socket Update" button that:
- Sends a test update to all users with the same role
- Shows real-time status updates
- Demonstrates socket functionality

### 2. Console Logs
Check browser console for:
- Socket connection status
- Received updates
- Error messages

## Implementation Details

### 1. Socket Rooms
- `dashboard-{roleName}`: All users with specific role
- `user-{userId}`: Specific user updates

### 2. Update Functions
- `updateDashboardStats(stats)`: Updates info boxes
- `updateChart(confirmedData, pendingData)`: Refreshes charts
- `showNotification(message, type)`: Shows update notifications

### 3. Error Handling
- Automatic reconnection on disconnect
- Fallback to page reload if socket fails
- Console logging for debugging

## Benefits

1. **Real-time Experience**: No need to refresh page for updates
2. **Better Performance**: Only relevant data is transmitted
3. **Role-based Updates**: Users only receive updates relevant to their role
4. **Interactive Feedback**: Immediate visual feedback for actions
5. **Scalable**: Efficient broadcasting to multiple users

## Future Enhancements

1. **Live Notifications**: Toast notifications for updates
2. **Data Streaming**: Continuous data flow for real-time metrics
3. **User Presence**: Show who's currently viewing dashboards
4. **Action Broadcasting**: Real-time updates when users perform actions
5. **Mobile Support**: Optimized for mobile devices

## Troubleshooting

### Common Issues

1. **Socket not connecting**
   - Check if server is running
   - Verify socket.io client library is loaded
   - Check browser console for errors

2. **Updates not received**
   - Verify user role is correct
   - Check if user joined correct room
   - Ensure server is emitting to correct room

3. **Charts not updating**
   - Verify chart instance exists
   - Check if data format is correct
   - Ensure chart library is properly loaded

### Debug Mode
Enable debug logging by checking browser console for:
- Socket connection events
- Room join/leave events
- Data update events
- Error messages



