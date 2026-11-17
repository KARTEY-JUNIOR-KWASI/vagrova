import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService — Security & OTP Verification', () => {
  it('blocks privilege escalation to SUPER_ADMIN or staff roles during verifyOtp', async () => {
    const otpHash = await bcrypt.hash('123456', 4);
    const auditLogs: any[] = [];

    const mockPrisma: any = {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          phone: '+233244123456',
          name: 'Attacker',
          role: UserRole.CUSTOMER,
          otpSecret: otpHash,
          otpExpiresAt: new Date(Date.now() + 60_000),
          customerProfile: { id: 'cust-1' },
          providerProfile: null,
        }),
      },
    };
    const mockJwt: any = { sign: () => 'jwt-token' };
    const mockAudit: any = {
      log: async (entry: any) => {
        auditLogs.push(entry);
      },
    };

    const service = new AuthService(mockPrisma, mockJwt, mockAudit);

    for (const staffRole of ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'DISPATCHER', 'AGENT']) {
      await assert.rejects(
        () => service.verifyOtp('0244123456', '123456', 'Attacker', staffRole),
        ForbiddenException,
      );
    }

    assert.equal(auditLogs.length, 5);
    assert.equal(auditLogs[0].action, 'SECURITY_ROLE_ESCALATION_BLOCKED');
  });

  it('rejects expired OTP codes', async () => {
    const otpHash = await bcrypt.hash('123456', 4);
    const mockPrisma: any = {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          phone: '+233244123456',
          role: UserRole.CUSTOMER,
          otpSecret: otpHash,
          otpExpiresAt: new Date(Date.now() - 1000),
        }),
      },
    };
    const service = new AuthService(mockPrisma, { sign: () => '' } as any, { log: async () => {} } as any);

    await assert.rejects(
      () => service.verifyOtp('0244123456', '123456'),
      BadRequestException,
    );
  });
});
