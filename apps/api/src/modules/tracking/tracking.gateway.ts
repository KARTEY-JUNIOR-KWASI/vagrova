import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { getJwtSecret } from '@/common/config/security.config';
import { UserRole } from '@prisma/client';

const STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.DISPATCHER,
  UserRole.AGENT,
  UserRole.FINANCE,
];

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawAuth =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!rawAuth) {
        this.logger.warn(`[WS] Unauthenticated connection rejected: ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(rawAuth, {
        secret: getJwtSecret(),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user_${payload.sub}`);
      this.logger.log(`[WS] Authenticated client connected: ${client.id} (User: ${payload.sub})`);
    } catch {
      this.logger.warn(`[WS] Invalid token connection rejected: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[WS] Client disconnected: ${client.id}`);
  }

  /**
   * Customer, assigned Driver/Owner, or Staff subscribes to live updates for a specific trip.
   */
  @SubscribeMessage('joinJobRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    const userId = client.data.userId as string | undefined;
    const role = client.data.role as UserRole | undefined;

    if (!userId || !data?.jobId) {
      return { event: 'error', message: 'Unauthorized or missing jobId' };
    }

    const job = await this.prisma.job.findUnique({
      where: { id: data.jobId },
      include: {
        jobRequest: { include: { customer: true } },
        driver: true,
        truck: { include: { owner: true } },
      },
    });

    if (!job) {
      return { event: 'error', message: 'Job not found' };
    }

    const isAllowed =
      (role && STAFF_ROLES.includes(role)) ||
      job.jobRequest.customer.userId === userId ||
      job.driver?.userId === userId ||
      job.truck?.owner.userId === userId;

    if (!isAllowed) {
      this.logger.warn(`[WS] IDOR blocked: User ${userId} tried joining job_${data.jobId}`);
      return { event: 'error', message: 'Forbidden: not authorized for this job' };
    }

    const room = `job_${data.jobId}`;
    client.join(room);
    this.logger.log(`[WS] Client ${client.id} joined room ${room}`);
    return { event: 'joinedRoom', room };
  }

  /**
   * Broadcasts location updates to authorized subscribers listening to this specific job
   */
  broadcastTruckLocation(
    jobId: string,
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      updatedAt: Date;
    },
  ) {
    const room = `job_${jobId}`;
    this.server.to(room).emit('truckLocationUpdated', location);
  }

  /**
   * Streams live GPS coordinates from the assigned Driver's device to the job room.
   */
  @SubscribeMessage('driverPingLocation')
  async handleDriverPingLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string; latitude: number; longitude: number; speed?: number },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !data?.jobId) return;

    const job = await this.prisma.job.findUnique({
      where: { id: data.jobId },
      include: { driver: true, truck: { include: { owner: true } } },
    });

    if (!job) return;
    const isDriver = job.driver?.userId === userId || job.truck?.owner.userId === userId;
    if (!isDriver) return;

    if (job.truckId) {
      await this.prisma.truck.update({
        where: { id: job.truckId },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          lastLocationAt: new Date(),
        },
      });
    }

    this.broadcastTruckLocation(data.jobId, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      updatedAt: new Date(),
    });
  }

  emitJobOfferToUser(userId: string, offerPayload: Record<string, unknown>) {
    this.server.to(`user_${userId}`).emit('jobOffer', offerPayload);
  }

  emitJobStatusUpdate(jobId: string, statusPayload: Record<string, unknown>) {
    this.server.to(`job_${jobId}`).emit('jobStatusChanged', statusPayload);
  }
}
