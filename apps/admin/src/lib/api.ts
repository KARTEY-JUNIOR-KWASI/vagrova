const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function adminFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const authToken =
    token ??
    (typeof window !== 'undefined' ? localStorage.getItem('vagrova_admin_token') || undefined : undefined);

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body.message || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  requestOtp(phone: string) {
    return adminFetch<{ success: boolean; message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp(phone: string, otp: string) {
    return adminFetch<{ accessToken: string; user: { id: string; phone: string; name: string; role: string } }>(
      '/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      },
    );
  },

  getVerificationQueue() {
    return adminFetch<any[]>('/providers/admin/verification-queue');
  },

  reviewDocument(documentId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    return adminFetch<any>(`/providers/admin/documents/${documentId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    });
  },

  listAdminJobs() {
    return adminFetch<any[]>('/dispatch/admin/jobs');
  },

  getMatchingTrucks(jobId: string) {
    return adminFetch<any[]>(`/dispatch/jobs/${jobId}/matching-trucks`);
  },

  broadcastOffers(jobId: string, truckIds: string[], netPayoutMinorUnits: string) {
    return adminFetch<any>('/dispatch/offers/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        truckIds,
        netPayoutMinorUnits,
        expiresInSeconds: 60,
      }),
    });
  },

  getEquipmentAdminAll() {
    return adminFetch<any[]>('/equipment/admin/all');
  },

  createEquipmentType(payload: {
    categoryId: string;
    code: string;
    name: string;
    pricingModel: string;
    baseRateMinor?: string | number;
    unitRateMinor?: string | number;
    mobilisationMinor?: string | number;
    description?: string;
    isProvisional?: boolean;
  }) {
    return adminFetch<any>('/equipment/admin/types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateEquipmentType(
    id: string,
    payload: {
      name?: string;
      pricingModel?: string;
      baseRateMinor?: string | number;
      unitRateMinor?: string | number;
      mobilisationMinor?: string | number;
      isActive?: boolean;
    },
  ) {
    return adminFetch<any>(`/equipment/admin/types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getQuotesQueue() {
    return adminFetch<any[]>('/quotes/admin/queue');
  },

  assignBookingOfficer(jobRequestId: string, internalNotes?: string) {
    return adminFetch<any>(`/quotes/admin/requests/${jobRequestId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ internalNotes }),
    });
  },

  logCommunication(jobRequestId: string, channel: string, summary: string) {
    return adminFetch<any>(`/quotes/admin/requests/${jobRequestId}/communication`, {
      method: 'POST',
      body: JSON.stringify({ channel, summary }),
    });
  },

  recordNegotiationRevision(
    jobRequestId: string,
    payload: {
      transportChargeMinor?: string | number;
      rentalChargeMinor?: string | number;
      loadingChargeMinor?: string | number;
      mobilisationChargeMinor?: string | number;
      operationalChargeMinor?: string | number;
      negotiationNotes?: string;
    },
  ) {
    return adminFetch<any>(`/quotes/admin/requests/${jobRequestId}/negotiate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  sendOfficialQuote(
    jobRequestId: string,
    payload: {
      totalMinorUnits: string;
      depositMinorUnits: string;
      breakdown: Record<string, any>;
      validityHours?: number;
    },
  ) {
    return adminFetch<any>(`/quotes/admin/requests/${jobRequestId}/send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateProFormaInvoice(quoteId: string, notes?: string) {
    return adminFetch<any>(`/invoices/admin/quotes/${quoteId}/pro-forma`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  listAdminInvoices() {
    return adminFetch<any[]>('/invoices/admin/all');
  },

  assignEquipmentAndOperator(
    jobId: string,
    payload: {
      truckId: string;
      driverId: string;
      scheduledStart?: string;
      operationalNotes?: string;
      allowUnpaidException?: boolean;
    },
  ) {
    return adminFetch<any>(`/dispatch/admin/jobs/${jobId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listAdminCustomers() {
    return adminFetch<any[]>('/auth/admin/customers');
  },

  listAdminPayments() {
    return adminFetch<any[]>('/payments/admin/all');
  },

  listAdminTrucks() {
    return adminFetch<any[]>('/providers/admin/trucks');
  },
};
