import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Normalizes a Ghanaian phone number to E.164 format (+233XXXXXXXXX)
   */
  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('0')) {
      return `+233${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('233')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Generates a 6-digit OTP, stores hashed secret with 5-minute expiry, and dispatches via SMS.
   */
  async requestOtp(rawPhone: string): Promise<{ success: boolean; message: string }> {
    const phone = this.normalizePhone(rawPhone);

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpSecret = await bcrypt.hash(otp, 8);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find or create pending user
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: 'New User',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          otpSecret,
          otpExpiresAt,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpSecret, otpExpiresAt },
      });
    }

    const smsText = `Your Vagrova verification code is ${otp}. Valid for 5 minutes.`;
    if (this.notificationsService) {
      await this.notificationsService.sendSms(phone, smsText);
    } else {
      this.logger.log(`[SMS-GATEWAY] Dispatched OTP to ${phone}`);
    }

    await this.auditService.log({
      actorId: user.id,
      action: 'OTP_REQUESTED',
      entityName: 'User',
      entityId: user.id,
    });

    return {
      success: true,
      message: 'A 6-digit verification code has been dispatched via SMS.',
    };
  }

  /**
   * Validates OTP and returns access token + user details.
   */
  async verifyOtp(
    rawPhone: string,
    otp: string,
    name?: string,
    requestedRole?: string,
  ): Promise<{
    accessToken: string;
    isNewUser: boolean;
    isReturningUser: boolean;
    totalJobs: number;
    user: any;
  }> {
    const phone = this.normalizePhone(rawPhone);

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });

    if (!user || !user.otpSecret || !user.otpExpiresAt) {
      throw new UnauthorizedException('No pending verification code found. Please request a new code.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    const isValid = await bcrypt.compare(otp, user.otpSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    const isReturningUser = Boolean(user.name && user.name !== 'New User');

    // Only allow self-service roles (CUSTOMER, OWNER, DRIVER) during OTP onboarding.
    // Staff roles (ADMIN, SUPER_ADMIN, FINANCE, DISPATCHER, AGENT) can never be self-assigned.
    const ALLOWED_SELF_ROLES: UserRole[] = [
      UserRole.CUSTOMER,
      UserRole.OWNER,
      UserRole.DRIVER,
    ];
    let targetRole = user.role;
    if (requestedRole) {
      if (!ALLOWED_SELF_ROLES.includes(requestedRole as UserRole)) {
        await this.auditService.log({
          actorId: user.id,
          action: 'SECURITY_ROLE_ESCALATION_BLOCKED',
          entityName: 'User',
          entityId: user.id,
          afterState: { attemptedRole: requestedRole },
        });
        throw new ForbiddenException('Requested role cannot be assigned via OTP verification.');
      }
      // Only allow assigning self-service role if user is not already a staff member
      if (ALLOWED_SELF_ROLES.includes(user.role)) {
        targetRole = requestedRole as UserRole;
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpSecret: null,
        otpExpiresAt: null,
        name: name ? name : user.name,
        role: targetRole,
      },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });

    // Auto-create role-specific profile if not present
    if (targetRole === UserRole.CUSTOMER && !updatedUser.customerProfile) {
      await this.prisma.customer.create({
        data: { userId: updatedUser.id },
      });
    } else if (
      (targetRole === UserRole.DRIVER || targetRole === UserRole.OWNER) &&
      !updatedUser.providerProfile
    ) {
      await this.prisma.provider.create({
        data: {
          userId: updatedUser.id,
          kind: targetRole === UserRole.OWNER ? 'OWNER' : 'DRIVER',
        },
      });
    }

    const payload = {
      sub: updatedUser.id,
      phone: updatedUser.phone,
      role: updatedUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      actorId: updatedUser.id,
      action: 'USER_LOGIN_OTP_VERIFIED',
      entityName: 'User',
      entityId: updatedUser.id,
    });

    const totalJobs = updatedUser.customerProfile
      ? await this.prisma.jobRequest.count({
          where: { customerId: updatedUser.customerProfile.id },
        })
      : 0;

    return {
      accessToken,
      isNewUser: !isReturningUser,
      isReturningUser,
      totalJobs,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        role: updatedUser.role,
        language: updatedUser.language,
        status: updatedUser.status,
        companyName: updatedUser.customerProfile?.companyName ?? null,
      },
    };
  }

  /**
   * Returns current authenticated user profile + returning-client metrics.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }
    const totalJobs = user.customerProfile
      ? await this.prisma.jobRequest.count({
          where: { customerId: user.customerProfile.id },
        })
      : 0;
    const isReturningUser = Boolean(user.name && user.name !== 'New User');

    return {
      isNewUser: !isReturningUser,
      isReturningUser,
      totalJobs,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
        status: user.status,
        companyName: user.customerProfile?.companyName ?? null,
      },
    };
  }

  /**
   * Persists first-time or updated customer profile (name, companyName, email) in DB.
   */
  async updateProfile(
    userId: string,
    payload: { name?: string; companyName?: string; email?: string },
  ) {
    const cleanName = payload.name?.trim();
    const cleanCompany = payload.companyName?.trim();
    const cleanEmail = payload.email?.trim();

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(cleanName ? { name: cleanName } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
      },
      include: { customerProfile: true },
    });

    if (cleanCompany !== undefined) {
      if (user.customerProfile) {
        await this.prisma.customer.update({
          where: { id: user.customerProfile.id },
          data: { companyName: cleanCompany || null },
        });
      } else {
        await this.prisma.customer.create({
          data: {
            userId: user.id,
            companyName: cleanCompany || null,
          },
        });
      }
    }

    return this.getProfile(userId);
  }

  /**
   * Logs an immutable data deletion / account anonymization request.
   */
  async requestDataDeletion(rawPhone: string, reason?: string, actorUserId?: string) {
    const phone = this.normalizePhone(rawPhone);
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (user) {
      await this.auditService.log({
        actorId: actorUserId || user.id,
        action: 'USER_DATA_DELETION_REQUESTED',
        entityName: 'User',
        entityId: user.id,
        afterState: { phone, reason: reason || 'User requested deletion' },
      });
    }

    return {
      success: true,
      message: 'Your data deletion request has been recorded and will be completed within 72 hours.',
    };
  }

  /**
   * Lists all registered customers for the Admin Console.
   */
  async listAdminCustomers() {
    return this.prisma.customer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { jobRequests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

