export type UserRole = 'student' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  collegeEmail: string;
  role: UserRole;
  collegeId?: string;
  accountStatus: 'active' | 'suspended';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type DietaryLabel = 'veg' | 'non-veg' | 'vegan' | 'gluten-free' | 'beverage';

export interface Category {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  icon?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number; // in INR ₹
  dietaryLabels: DietaryLabel[];
  allergenInformation?: string;
  preparationTimeMinutes: number;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured?: boolean;
  isSpecialToday?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PickupSlot {
  id: string;
  startTime: string; // e.g. "12:10 PM"
  endTime: string;   // e.g. "12:20 PM"
  date: string;      // YYYY-MM-DD
  capacity: number;  // Max orders allowed in this slot
  reservedCount: number; // Current active confirmed/preparing orders
  active: boolean;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus =
  | 'pending'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'cash_on_pickup';

export type PaymentMethod =
  | 'razorpay_upi'
  | 'razorpay_card'
  | 'razorpay_netbanking'
  | 'cash_counter';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  customization?: string;
  lineTotal: number;
  imageUrl?: string;
  dietaryLabels?: DietaryLabel[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#CB-1082"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCollegeId?: string;
  pickupSlotId: string;
  slotLabel: string;
  subtotal: number;
  taxAmount: number; // 5% GST
  feeAmount: number; // Platform/Packaging fee ₹5
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  collectionToken: string; // 6-digit verification code e.g. "CB-782"
  estimatedReadyAt: string; // ISO string
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  collectedAt?: string;
  collectedByStaffId?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  items: OrderItem[];
  preparationMinutes: number;
  specialInstructions?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: 'razorpay' | 'cash';
  providerOrderId: string;
  providerPaymentId: string;
  amount: number; // in INR
  currency: string;
  paymentStatus: PaymentStatus;
  verifiedAt?: string;
  methodDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  providerRefundId: string;
  amount: number;
  reason: string;
  refundStatus: 'pending' | 'processed' | 'failed';
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  note?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  orderId?: string;
  notificationType: 'order_status' | 'payment' | 'announcement' | 'rush';
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface CanteenSettings {
  isOpen: boolean;
  emergencyPause: boolean;
  rushMode: boolean;
  rushMultiplier: number; // e.g. 1.3x prep time
  maxActiveKitchenOrders: number;
  allowCashCounter: boolean;
  announcementBanner: string;
  taxRatePercent: number; // 5%
  packagingFee: number;   // ₹5
  openingTime: string;    // "08:30"
  closingTime: string;    // "19:30"
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalGrossRevenue: number;
  totalCapturedRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  averageOrderValue: number;
  averagePrepTimeMinutes: number;
  averagePickupWaitMinutes: number;
  cancellationRate: number;
  rejectionRate: number;
  slotUtilizationPercent: number;
  hourlyOrders: { hour: string; count: number; revenue: number }[];
  bestSellers: { name: string; count: number; revenue: number }[];
  statusDistribution: { status: OrderStatus; count: number }[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customization?: string;
}
