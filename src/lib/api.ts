import type {
  UserProfile,
  Category,
  MenuItem,
  PickupSlot,
  Order,
  PaymentRecord,
  CanteenSettings,
  AnalyticsSummary,
  AppNotification,
  AuditLog,
  OrderStatus,
} from '../types/canteen.ts';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cb_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(collegeEmail: string) {
    const res = await request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ collegeEmail }),
    });
    localStorage.setItem('cb_auth_token', res.token);
    return res;
  },

  async register(data: { fullName: string; collegeEmail: string; role?: string; collegeId?: string }) {
    const res = await request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('cb_auth_token', res.token);
    return res;
  },

  async getMe() {
    return request<{ user: UserProfile }>('/auth/me');
  },

  async quickSwitchRole(role: 'student' | 'staff' | 'admin') {
    const res = await request<{ user: UserProfile; token: string }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    localStorage.setItem('cb_auth_token', res.token);
    return res;
  },

  // Menu
  async getMenu() {
    return request<{ items: MenuItem[]; categories: Category[] }>('/menu');
  },

  async createMenuItem(item: Partial<MenuItem>) {
    return request<MenuItem>('/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    return request<MenuItem>(`/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteMenuItem(id: string) {
    return request<{ success: boolean }>(`/menu/${id}`, {
      method: 'DELETE',
    });
  },

  // Pickup Slots
  async getPickupSlots() {
    return request<PickupSlot[]>('/pickup-slots');
  },

  async updatePickupSlot(id: string, updates: Partial<PickupSlot>) {
    return request<PickupSlot>(`/pickup-slots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Orders
  async calculatePrepEstimate(items: { id: string; quantity: number }[]) {
    return request<{ estimatedMinutes: number }>('/orders/calculate-estimate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async createOrder(payload: {
    items: { menuItemId: string; quantity: number; customization?: string }[];
    pickupSlotId: string;
    paymentMethod: string;
    specialInstructions?: string;
  }) {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOrders(params?: { status?: string; studentId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<Order[]>(`/orders${query ? `?${query}` : ''}`);
  },

  async getOrderById(id: string) {
    return request<Order>(`/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string, preparationMinutes?: number) {
    return request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, preparationMinutes }),
    });
  },

  async verifyCollection(token: string) {
    return request<{ success: boolean; message: string; order?: Order }>('/orders/verify-collection', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Razorpay Payments
  async createRazorpayOrder(orderId: string) {
    return request<{
      id: string;
      amount: number;
      currency: string;
      orderId: string;
      orderNumber: string;
      key: string;
      customer: { name: string; email: string };
    }>('/payments/create-razorpay-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  async verifyRazorpayPayment(payload: {
    orderId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    simulatedSuccess?: boolean;
    methodDetails?: string;
  }) {
    return request<{ success: boolean; message: string; order: Order }>('/payments/verify-razorpay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async processRefund(orderId: string, amount?: number, reason?: string) {
    return request<{ success: boolean; message: string; refund: any }>('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, reason }),
    });
  },

  // Settings
  async getSettings() {
    return request<CanteenSettings>('/settings');
  },

  async updateSettings(updates: Partial<CanteenSettings>) {
    return request<CanteenSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Analytics
  async getAnalytics() {
    return request<AnalyticsSummary>('/analytics');
  },

  // Notifications
  async getNotifications() {
    return request<AppNotification[]>('/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  // Audit Logs
  async getAuditLogs() {
    return request<AuditLog[]>('/audit-logs');
  },

  // Automated Tests
  async runSystemTests() {
    return request<{
      summary: { total: number; passed: number; failed: number; allPassed: boolean };
      results: { name: string; passed: boolean; details: string }[];
    }>('/system/run-tests', {
      method: 'POST',
    });
  },
};
