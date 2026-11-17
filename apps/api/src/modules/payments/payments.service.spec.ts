import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';
import { LedgerEntryType, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService — Webhook HMAC & Idempotent Ledger', () => {
  it('verifies valid HMAC-SHA512 webhook signatures and rejects tampered payloads', () => {
    process.env.PAYSTACK_SECRET_KEY = 'test_paystack_secret_key';
    const service = new PaymentsService({} as any, { log: async () => {} } as any);

    const rawBody = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'VG-DEP-1' } }));
    const validSig = crypto
      .createHmac('sha512', 'test_paystack_secret_key')
      .update(rawBody)
      .digest('hex');

    assert.equal(service.verifyWebhookSignature(rawBody, validSig), true);
    assert.equal(service.verifyWebhookSignature(Buffer.from('{"tampered":true}'), validSig), false);
    assert.equal(service.verifyWebhookSignature(rawBody, 'invalid-signature'), false);
  });

  it('prevents duplicate ledger postings on duplicate webhook callbacks', async () => {
    let status: PaymentStatus = PaymentStatus.PROCESSING;
    const ledgerEntries: any[] = [];

    const mockPrisma: any = {
      payment: {
        findUnique: async () => ({
          id: 'pay-1',
          jobId: 'job-1',
          amountMinorUnits: 342500n,
          currency: 'GHS',
          status,
          job: { jobNumber: 'VGJ-004829' },
        }),
      },
      $transaction: async (cb: any) => {
        const tx = {
          payment: {
            update: async () => {
              status = PaymentStatus.CONFIRMED;
            },
          },
          ledgerEntry: {
            create: async ({ data }: any) => {
              ledgerEntries.push(data);
            },
          },
          job: { update: async () => ({}) },
        };
        return cb(tx);
      },
    };

    const service = new PaymentsService(mockPrisma, { log: async () => {} } as any);

    const first = await service.processPaymentConfirmation('VG-DEP-1', 'tx-1');
    assert.equal(first.success, true);
    assert.equal(ledgerEntries.length, 2);
    assert.equal(ledgerEntries[0].entryType, LedgerEntryType.DEBIT);
    assert.equal(ledgerEntries[1].entryType, LedgerEntryType.CREDIT);
    assert.equal(ledgerEntries[0].amountMinorUnits, 342500n);
    assert.equal(ledgerEntries[1].amountMinorUnits, 342500n);

    // Duplicate callback must NOT create more ledger entries
    const second = await service.processPaymentConfirmation('VG-DEP-1', 'tx-1');
    assert.equal(second.message, 'Already processed');
    assert.equal(ledgerEntries.length, 2);
  });
});
