import { emitDashboardUpdate, emitToUser } from '../socket';

/**
 * Socket Helper Utility
 * Provides easy-to-use functions for triggering dashboard updates
 */

export class SocketHelper {

    /**
     * Trigger a dashboard update for all users with a specific role
     * @param roleName - The role to update (e.g., 'medicalservice', 'finance')
     * @param data - The data to send
     */
    static updateRoleDashboard(roleName: string, data: any) {
        emitDashboardUpdate(roleName, {
            type: 'dashboard-data-update',
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send a notification to a specific user
     * @param userId - The user ID to notify
     * @param event - The event name
     * @param data - The data to send
     */
    static notifyUser(userId: string, event: string, data: any) {
        emitToUser(userId, event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Trigger a medical dashboard update
     * @param stats - Medical statistics
     * @param chartData - Chart data
     */
    static updateMedicalDashboard(stats: any, chartData?: any) {
        this.updateRoleDashboard('medicalservice', {
            stats,
            confirmedData: chartData?.confirmedData || [],
            pendingData: chartData?.pendingData || [],
            source: 'medical-service'
        });
    }

    /**
     * Trigger a finance dashboard update
     * @param stats - Financial statistics
     * @param chartData - Chart data
     */
    static updateFinanceDashboard(stats: any, chartData?: any) {
        this.updateRoleDashboard('finance', {
            stats,
            confirmedData: chartData?.confirmedData || [],
            pendingData: chartData?.pendingData || [],
            source: 'finance-service'
        });
    }

    /**
     * Trigger an HSC dashboard update
     * @param stats - HSC statistics
     * @param chartData - Chart data
     */
    static updateHscDashboard(stats: any, chartData?: any) {
        this.updateRoleDashboard('callcenter', {
            stats,
            confirmedData: chartData?.confirmedData || [],
            pendingData: chartData?.pendingData || [],
            source: 'hsc-service'
        });
    }

    /**
     * Send a system-wide notification
     * @param message - The notification message
     * @param type - The notification type (info, success, warning, error)
     * @param roles - Array of roles to notify (empty for all)
     */
    static sendSystemNotification(message: string, type: string = 'info', roles: string[] = []) {
        if (roles.length === 0) {
            // Send to all roles
            const allRoles = ['medicalservice', 'finance', 'callcenter', 'fde', 'user', 'agent', 'customer'];
            allRoles.forEach(role => {
                this.updateRoleDashboard(role, {
                    type: 'system-notification',
                    message,
                    notificationType: type,
                    source: 'system'
                });
            });
        } else {
            // Send to specific roles
            roles.forEach(role => {
                this.updateRoleDashboard(role, {
                    type: 'system-notification',
                    message,
                    notificationType: type,
                    source: 'system'
                });
            });
        }
    }

    /**
     * Trigger a real-time data refresh for a specific dashboard
     * @param dashboardType - The type of dashboard
     * @param data - The data to refresh
     */
    static refreshDashboard(dashboardType: string, data: any) {
        this.updateRoleDashboard(dashboardType, {
            type: 'dashboard-refresh',
            dashboardType,
            ...data,
            source: 'auto-refresh'
        });
    }
}

// Export individual functions for easier use
export const {
    updateRoleDashboard,
    notifyUser,
    updateMedicalDashboard,
    updateFinanceDashboard,
    updateHscDashboard,
    sendSystemNotification,
    refreshDashboard
} = SocketHelper;



