import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";

let io: SocketIOServer;

export function initSocket(server: Server): SocketIOServer {
    io = new SocketIOServer(server, {
        cors: { origin: "*" }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join dashboard room for real-time updates
        socket.on('join-dashboard', (data) => {
            const { userId, roleName } = data;
            socket.join(`dashboard-${roleName}`);
            socket.join(`user-${userId}`);
            console.log(`User ${userId} with role ${roleName} joined dashboard`);
        });

        // Handle dashboard-specific events
        socket.on('dashboard-action', (data) => {
            const { action, userId, roleName, data: actionData } = data;
            console.log(`Dashboard action: ${action} by user ${userId}`);

            // Broadcast to all users with the same role
            io.to(`dashboard-${roleName}`).emit('dashboard-update', {
                action,
                userId,
                data: actionData,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

// Function to emit dashboard updates from anywhere in the application
export function emitDashboardUpdate(roleName: string, data: any) {
    if (io) {
        io.to(`dashboard-${roleName}`).emit('dashboard-update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

// Function to emit to specific user
export function emitToUser(userId: string, event: string, data: any) {
    if (io) {
        io.to(`user-${userId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

export { io };
