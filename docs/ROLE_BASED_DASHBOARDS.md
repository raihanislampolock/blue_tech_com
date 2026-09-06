# Role-Based Dashboard System

## Overview
This system provides different dashboard views based on user roles, making the interface more relevant and less cluttered for different user types.

## Dashboard Types

### 1. Admin Dashboard (`/dashboard` or `/dashboard/admin`)
- **Access**: Superadmin only
- **Features**: Full dashboard with all metrics
- **Metrics**: Users, Imaging Reports, Prescriptions, HSC, Finance, etc.
- **Chart**: Monthly Report (Booking Confirmed vs Pending)

### 2. Medical Dashboard (`/dashboard/medical`)
- **Access**: Medical staff (medicalservice, nurse, doctor, medicaltranscriptionist)
- **Features**: Medical-focused metrics only
- **Metrics**: 
  - Total Patients
  - Total Imaging Reports
  - Today's Imaging Reports
  - Total Prescriptions
  - Today's Prescriptions
- **Chart**: Medical Reports Overview (Imaging Reports vs Prescriptions)

### 3. Finance Dashboard (`/dashboard/finance`)
- **Access**: Finance staff
- **Features**: Financial metrics only
- **Metrics**:
  - Total/Today's Invoice Amount
  - Total/Today's Discount Amount
  - Total/Today's Patient Payable
  - Total/Today's Collected Amount
  - Total/Today's Due Amount
  - Total/Today's Sponsor Amount
- **Chart**: Financial Overview (Invoice Amount vs Collected Amount)

### 4. HSC Dashboard (`/dashboard/hsc`)
- **Access**: Call center and FDE staff
- **Features**: Home Sample Collection metrics only
- **Metrics**:
  - Total/Today's Home Sample Collection
  - Total/Today's HSC Confirmed
  - Total/Today's HSC Unconfirmed
  - Total/Today's HSC Cancelled
- **Chart**: HSC Status Overview (Confirmed vs Pending)

### 5. User Dashboard (`/dashboard/user`)
- **Access**: Regular users, agents, customers
- **Features**: Basic user information and quick actions
- **Metrics**:
  - Welcome message
  - Current date/time
  - Quick action buttons (Profile, Settings, Messages, Help)

## How It Works

### Automatic Routing
When a user visits `/dashboard`, the system automatically determines their role and routes them to the appropriate dashboard:

```typescript
// Role-based dashboard routing
const userRole = (req.user?.roleName || '').toLowerCase().trim();
let dashboardView = 'dashboard/admin'; // Default view

if (['medicalservice', 'nurse', 'doctor', 'medicaltranscriptionist'].includes(userRole)) {
    dashboardView = 'dashboard/medical';
} else if (['finance'].includes(userRole)) {
    dashboardView = 'dashboard/finance';
} else if (['callcenter', 'fde'].includes(userRole)) {
    dashboardView = 'dashboard/hsc';
} else if (['user', 'agent', 'customer'].includes(userRole)) {
    dashboardView = 'dashboard/user';
} else if (userRole === 'superadmin') {
    dashboardView = 'dashboard/admin';
}
```

### Dashboard Selector
Superadmins and users with multiple role access can see a dashboard selector at the top of their dashboard, allowing them to switch between different views.

### Direct Access
Users can also directly access specific dashboards using these URLs:
- `/dashboard/medical` - Medical Dashboard
- `/dashboard/finance` - Finance Dashboard  
- `/dashboard/hsc` - HSC Dashboard
- `/dashboard/user` - User Dashboard

## Benefits

1. **Reduced Clutter**: Users only see metrics relevant to their role
2. **Better Performance**: Each dashboard loads only necessary data
3. **Improved UX**: Role-specific information and actions
4. **Flexibility**: Users can switch between dashboards if they have access
5. **Maintainability**: Each dashboard is a separate, focused component

## Implementation Details

### Files Created/Modified
- `views/dashboard/medical.pug` - Medical dashboard view
- `views/dashboard/finance.pug` - Finance dashboard view
- `views/dashboard/hsc.pug` - HSC dashboard view
- `views/dashboard/user.pug` - User dashboard view
- `views/partials/dashboard-selector.pug` - Dashboard selector component
- `src/modules/rbac/user/controllers/DashboardController.ts` - Controller with role-based routing

### Adding New Roles
To add a new role with a custom dashboard:

1. Create a new dashboard view in `views/dashboard/`
2. Add a new route in the controller
3. Add the role to the routing logic
4. Update the dashboard selector component

### Customizing Dashboards
Each dashboard can be customized by:
- Adding/removing metrics
- Changing chart types
- Adding role-specific actions
- Customizing colors and layouts

## Security
- All dashboard routes require authentication (`this.auth.private`)
- Role-based access control ensures users only see appropriate data
- Direct URL access is protected by the same authentication middleware



