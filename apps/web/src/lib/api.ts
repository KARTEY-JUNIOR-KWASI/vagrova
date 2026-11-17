/**
 * Typed HTTP client for Vagrova NestJS API (/api/v1).
 * Uses NEXT_PUBLIC_API_URL (defaults to http://localhost:4000/api/v1).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class VagrovaApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new VagrovaApiError(res.status, body.message || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const vagrovaApi = {
  getEquipmentCatalog() {
    return apiFetch<
      Array<{
        id: string;
        code: string;
        name: string;
        group: 'TRANSPORT' | 'MACHINERY';
        equipmentTypes: Array<{
          id: string;
          code: string;
          name: string;
          pricingModel: string;
          legacyVehicleType?: string | null;
          baseRateMinor: string;
          unitRateMinor: string;
          mobilisationMinor: string;
          isProvisional: boolean;
        }>;
      }>
    >('/equipment/categories');
  },

  requestOtp(phone: string) {
    return apiFetch<{ success: boolean; message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp(phone: string, otp: string, name?: string, role: 'CUSTOMER' | 'DRIVER' | 'OWNER' = 'CUSTOMER') {
    return apiFetch<{
      accessToken: string;
      isNewUser?: boolean;
      isReturningUser?: boolean;
      totalJobs?: number;
      user: {
        id: string;
        phone: string;
        name: string;
        role: string;
        companyName?: string | null;
      };
    }>(
      '/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone, otp, name, role }),
      },
    );
  },

  getMe(token: string) {
    return apiFetch<{
      isNewUser: boolean;
      isReturningUser: boolean;
      totalJobs: number;
      user: {
        id: string;
        phone: string;
        name: string;
        role: string;
        companyName?: string | null;
      };
    }>('/auth/me', { token });
  },

  updateProfile(
    token: string,
    payload: { name?: string; companyName?: string; email?: string },
  ) {
    return apiFetch<{
      isNewUser: boolean;
      isReturningUser: boolean;
      totalJobs: number;
      user: {
        id: string;
        phone: string;
        name: string;
        role: string;
        companyName?: string | null;
      };
    }>('/auth/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },

  requestCallback(phone: string, customerName?: string) {
    return apiFetch<{ success: boolean; message: string }>('/call-center/request-callback', {
      method: 'POST',
      body: JSON.stringify({ phone, customerName }),
    });
  },

  createJobRequest(token: string, payload: Record<string, unknown>) {
    return apiFetch<{ jobRequest: { id: string; jobNumber: string }; quote: { id: string; totalMinorUnits: string; depositMinorUnits: string } }>(
      '/quotes/requests',
      {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      },
    );
  },

  getMyJobs(token: string) {
    return apiFetch<any[]>('/dispatch/jobs/my', { token });
  },

  getMyInvoices(token: string) {
    return apiFetch<any[]>('/invoices/my', { token });
  },

  getDriverAssignments(token: string) {
    return apiFetch<any[]>('/dispatch/driver/assignments', { token });
  },

  cancelJob(token: string, jobId: string, reason: string) {
    return apiFetch<{ success: boolean; jobNumber: string; status: string }>(`/dispatch/jobs/${jobId}/cancel`, {
      method: 'POST',
      token,
      body: JSON.stringify({ reason }),
    });
  },

  // ── Provider / Driver & Truck Owner Endpoints ───────────────────────────
  registerProvider(
    token: string,
    payload: {
      kind: 'DRIVER_ONLY' | 'OWNER_ONLY' | 'OWNER_AND_DRIVER';
      homeTown: string;
      nextOfKinName: string;
      nextOfKinPhone: string;
    },
  ) {
    return apiFetch<{ id: string; kind: string }>('/providers/register', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  registerTruck(
    token: string,
    payload: {
      plate: string;
      type: string;
      make: string;
      model: string;
      year: number;
      capacityTonnes: number;
    },
  ) {
    return apiFetch<{ id: string; plate: string; status: string }>('/providers/trucks', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  updateTruckAvailability(token: string, truckId: string, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') {
    return apiFetch<{ id: string; status: string }>(`/providers/trucks/${truckId}/availability`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    });
  },

  submitDocument(
    token: string,
    payload: {
      type: string;
      fileKey: string;
      expiryDate?: string;
      truckId?: string;
    },
  ) {
    return apiFetch<{ id: string; status: string }>('/providers/documents', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  respondToOffer(token: string, offerId: string, action: 'ACCEPT' | 'DECLINE', declineReason?: string) {
    return apiFetch<{ success: boolean; jobId?: string; status?: string }>(`/dispatch/offers/${offerId}/respond`, {
      method: 'POST',
      token,
      body: JSON.stringify({ action, declineReason }),
    });
  },

  advanceTripStep(
    token: string,
    jobId: string,
    payload: {
      nextStatus: string;
      photoProofKey?: string;
      deliveryCode?: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
    },
  ) {
    return apiFetch<{ id: string; status: string }>(`/dispatch/jobs/${jobId}/advance-step`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async uploadFile(token: string, file: File, folder = 'avatars') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/storage/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new VagrovaApiError(res.status, body.message || `Upload error ${res.status}`);
    }
    return res.json() as Promise<{ fileKey: string; url: string; mimetype: string; size: number }>;
  },
};
