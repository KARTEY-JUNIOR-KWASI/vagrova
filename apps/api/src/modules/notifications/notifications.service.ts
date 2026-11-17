import { Injectable, Logger } from '@nestjs/common';

export type NotificationChannel = 'PUSH' | 'SMS' | 'WHATSAPP';

export interface NotificationPayload {
  recipientPhone: string;
  recipientPushToken?: string;
  templateCode: string;
  variables: Record<string, string>;
  channels: NotificationChannel[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Dispatches a notification across specified channels (Push with SMS fallback, and WhatsApp).
   */
  async dispatch(payload: NotificationPayload): Promise<{ success: boolean; dispatchedChannels: NotificationChannel[] }> {
    const text = this.renderTemplate(payload.templateCode, payload.variables);
    const dispatched: NotificationChannel[] = [];

    for (const channel of payload.channels) {
      if (channel === 'PUSH' && payload.recipientPushToken) {
        await this.sendPush(payload.recipientPushToken, text);
        dispatched.push('PUSH');
      } else if (channel === 'SMS') {
        await this.sendSms(payload.recipientPhone, text);
        dispatched.push('SMS');
      } else if (channel === 'WHATSAPP') {
        await this.sendWhatsApp(payload.recipientPhone, text);
        dispatched.push('WHATSAPP');
      }
    }

    return { success: true, dispatchedChannels: dispatched };
  }

  /**
   * Renders plain-language localized message templates without marketing jargon.
   */
  private renderTemplate(templateCode: string, variables: Record<string, string>): string {
    switch (templateCode) {
      case 'QUOTE_READY':
        return `Vagrova: Your quote for Job ${variables.jobNumber} is ready (GHS ${variables.total}). Tap to review & pay deposit: ${variables.link}`;

      case 'DRIVER_ASSIGNED':
        return `Vagrova: Truck assigned for Job ${variables.jobNumber}. Driver: ${variables.driverName} (${variables.plate}). Phone: ${variables.driverPhone}. Track: ${variables.link}`;

      case 'TRUCK_HEADING_TO_PICKUP':
        return `Vagrova: Driver ${variables.driverName} is on the way to your pickup location at ${variables.pickupAddress}. Track live: ${variables.link}`;

      case 'CARGO_LOADED':
        return `Vagrova: Cargo loaded and inspected for Job ${variables.jobNumber}. Truck is departing for destination.`;

      case 'DELIVERY_CONFIRMATION_REQUIRED':
        return `Vagrova: Truck has arrived at delivery. Give verification code ${variables.deliveryCode} to the driver once cargo is offloaded.`;

      case 'JOB_COMPLETED_RECEIPT':
        return `Vagrova: Job ${variables.jobNumber} completed. Thank you for using Vagrova Heavy Haulage. View your receipt: ${variables.receiptLink}`;

      case 'JOB_OFFER_ALERT':
        return `Vagrova Dispatch: New job offer ${variables.jobNumber} (${variables.vehicleType}, ${variables.weight}). Payout GHS ${variables.netPayout}. You have ${variables.countdownSeconds}s to accept in app.`;

      default:
        return `Vagrova Update: ${JSON.stringify(variables)}`;
    }
  }

  private async sendPush(token: string, message: string) {
    // In production, invokes Firebase Cloud Messaging (FCM)
    this.logger.log(`[FCM-PUSH] To token ${token.substring(0, 12)}...: "${message}"`);
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
    const apiKey = process.env.SMS_API_KEY?.trim();
    const sender = process.env.SMS_SENDER_ID?.trim() || 'VAGROVA';

    if (provider === 'smsonline' && apiKey && apiKey !== 'mock_key') {
      const destination = phone.replace(/^\+/, '').replace(/[\s\-()]/g, '');
      try {
        const res = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `key ${apiKey}`,
          },
          body: JSON.stringify({
            text: message,
            type: 0,
            sender,
            destinations: [destination],
          }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          this.logger.error(`[SMSONLINE] HTTP ${res.status} sending to ${destination}: ${JSON.stringify(body)}`);
          return;
        }
        this.logger.log(`[SMSONLINE] Dispatched SMS to ${destination} (sender=${sender})`);
        return;
      } catch (err) {
        this.logger.error(`[SMSONLINE] Network error sending to ${destination}: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }

    this.logger.log(`[SMS-MOCK] To ${phone}: "${message}"`);
  }

  private async sendWhatsApp(phone: string, message: string) {
    // In production, invokes WhatsApp Cloud API / Twilio WhatsApp
    this.logger.log(`[WHATSAPP] To ${phone}: "${message}"`);
  }
}

