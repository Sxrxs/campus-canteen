import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type {
  UserProfile,
  Category,
  MenuItem,
  PickupSlot,
  Order,
  OrderItem,
  PaymentRecord,
  RefundRecord,
  OrderStatusHistory,
  AppNotification,
  AuditLog,
  CanteenSettings,
  AnalyticsSummary,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '../src/types/canteen.ts';

const DB_FILE = path.resolve(process.cwd(), 'canteen_db.json');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ahrtugavjgxjtpdmench.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_XIjowhluZNs2rfTCRXfaeQ_sKwezS5v';
export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export interface DatabaseSchema {
  profiles: UserProfile[];
  categories: Category[];
  menuItems: MenuItem[];
  pickupSlots: PickupSlot[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  orderStatusHistory: OrderStatusHistory[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: CanteenSettings;
}

// Generate realistic today pickup slots every 10 minutes between 11:30 AM and 03:00 PM and 04:00 PM to 06:30 PM
function generateDefaultPickupSlots(): PickupSlot[] {
  const today = new Date().toISOString().split('T')[0];
  const slots: PickupSlot[] = [];
  
  const timeBlocks = [
    { startH: 11, startM: 30, endH: 14, endM: 30, capacity: 12 },
    { startH: 15, startM: 0, endH: 18, endM: 0, capacity: 10 },
  ];

  let idCounter = 1;
  for (const block of timeBlocks) {
    let currentMin = block.startH * 60 + block.startM;
    const endMin = block.endH * 60 + block.endM;
    
    while (currentMin + 15 <= endMin) {
      const sH = Math.floor(currentMin / 60);
      const sM = currentMin % 60;
      const eH = Math.floor((currentMin + 15) / 60);
      const eM = (currentMin + 15) % 60;

      const formatTime = (h: number, m: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH}:${displayM} ${ampm}`;
      };

      slots.push({
        id: `slot_${idCounter++}`,
        startTime: formatTime(sH, sM),
        endTime: formatTime(eH, eM),
        date: today,
        capacity: block.capacity,
        reservedCount: 0,
        active: true,
      });

      currentMin += 15;
    }
  }

  return slots;
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();

  const defaultProfiles: UserProfile[] = [
    {
      id: 'usr_student_1',
      fullName: 'Aarav Sharma',
      collegeEmail: 'aarav.sharma@campus.edu.in',
      collegeId: '2023-CS-042',
      role: 'student',
      accountStatus: 'active',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_staff_1',
      fullName: 'Chef Rajesh Kumar',
      collegeEmail: 'rajesh.canteen@campus.edu.in',
      collegeId: 'STAFF-KITCHEN-08',
      role: 'staff',
      accountStatus: 'active',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_admin_1',
      fullName: 'Dean of Student Affairs / Admin',
      collegeEmail: 'admin.canteen@campus.edu.in',
      collegeId: 'ADMIN-DIR-01',
      role: 'admin',
      accountStatus: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const defaultCategories: Category[] = [
    { id: 'cat_combos', name: 'Meal Combos & Thalis', description: 'Complete hearty meals for hungry scholars', displayOrder: 1, active: true, icon: 'UtensilsCrossed' },
    { id: 'cat_breakfast', name: 'Breakfast & South Indian', description: 'Fresh dosas, idlis, and parathas made to order', displayOrder: 2, active: true, icon: 'Sunrise' },
    { id: 'cat_rolls_fastfood', name: 'Rolls & Fast Food', description: 'Kathi rolls, burgers, pav bhaji and quick bites', displayOrder: 3, active: true, icon: 'Sandwich' },
    { id: 'cat_snacks', name: 'Snacks & Chaat', description: 'Crispy samosas, puff patties, and street chaat', displayOrder: 4, active: true, icon: 'Cookie' },
    { id: 'cat_beverages', name: 'Chilled & Hot Beverages', description: 'Filter coffee, chai, thick shakes and lassi', displayOrder: 5, active: true, icon: 'Coffee' },
  ];

  const defaultMenuItems: MenuItem[] = [
    {
      id: 'item_1',
      categoryId: 'cat_combos',
      name: 'Deluxe North Indian Thali',
      description: 'Paneer butter masala, dal makhani, jeera rice, 2 butter rotis, gulab jamun, and salad.',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      price: 130,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Dairy (Paneer, Butter, Ghee), Gluten (Wheat)',
      preparationTimeMinutes: 12,
      stockQuantity: 40,
      isAvailable: true,
      isFeatured: true,
      isSpecialToday: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_2',
      categoryId: 'cat_rolls_fastfood',
      name: 'Paneer Tikka Kathi Roll',
      description: 'Char-grilled cottage cheese cubes with peppers and mint mayo wrapped in a flaky paratha.',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      price: 85,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Dairy, Gluten',
      preparationTimeMinutes: 8,
      stockQuantity: 55,
      isAvailable: true,
      isFeatured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_3',
      categoryId: 'cat_rolls_fastfood',
      name: 'Chicken Malai Tikka Roll',
      description: 'Tender chicken cubes marinated in rich cashew cream and mild spices, wrapped in crisp lachha paratha.',
      imageUrl: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=600&q=80',
      price: 110,
      dietaryLabels: ['non-veg'],
      allergenInformation: 'Contains Dairy, Gluten, Cashew Nuts',
      preparationTimeMinutes: 10,
      stockQuantity: 30,
      isAvailable: true,
      isFeatured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_4',
      categoryId: 'cat_breakfast',
      name: 'Mysore Masala Dosa',
      description: 'Crispy fermented crepe smeared with spicy red garlic chutney and spiced potato masala, served with coconut chutney & sambar.',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      price: 75,
      dietaryLabels: ['veg', 'gluten-free'],
      allergenInformation: 'Gluten-Free, Coconut, Mustard seeds',
      preparationTimeMinutes: 7,
      stockQuantity: 60,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_5',
      categoryId: 'cat_rolls_fastfood',
      name: 'Butter Pav Bhaji (2 Pavs)',
      description: 'Rich spiced mashed vegetable gravy topped with a melting cube of Amul butter, toasted buttery pavs, lemon and chopped onions.',
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
      price: 90,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Dairy, Gluten',
      preparationTimeMinutes: 6,
      stockQuantity: 50,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_6',
      categoryId: 'cat_combos',
      name: 'Chole Bhature Platter',
      description: 'Two fluffy golden puffed bhaturas served with slow-cooked Punjabi chole, spiced pickle, and mint chutney.',
      imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
      price: 95,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Wheat/Gluten',
      preparationTimeMinutes: 9,
      stockQuantity: 35,
      isAvailable: true,
      isSpecialToday: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_7',
      categoryId: 'cat_combos',
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Aromatic basmati rice layered with succulent chicken pieces cooked on dum with saffron, served with mirchi ka salan and burani raita.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      price: 140,
      dietaryLabels: ['non-veg', 'gluten-free'],
      allergenInformation: 'Contains Dairy (Yogurt/Raita)',
      preparationTimeMinutes: 10,
      stockQuantity: 45,
      isAvailable: true,
      isFeatured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_8',
      categoryId: 'cat_snacks',
      name: 'Samosa Chaat (2 Pcs)',
      description: 'Crushed crispy potato samosas ladled with warm ragda/chole, sweet date-tamarind chutney, spicy green chutney, sev, and pomegranate.',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      price: 50,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Gluten, Dairy (curd optional)',
      preparationTimeMinutes: 5,
      stockQuantity: 70,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_9',
      categoryId: 'cat_rolls_fastfood',
      name: 'Grilled Cheese Veg Burger & Fries',
      description: 'Crispy veggie patty with cheddar cheese slice, fresh lettuce, tomato, house secret sauce with a side of salted fries.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      price: 80,
      dietaryLabels: ['veg'],
      allergenInformation: 'Contains Gluten, Dairy',
      preparationTimeMinutes: 8,
      stockQuantity: 40,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_10',
      categoryId: 'cat_beverages',
      name: 'Cold Coffee with Vanilla Ice Cream',
      description: 'Creamy blended iced coffee topped with a thick scoop of gourmet vanilla ice cream and chocolate syrup drizzle.',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      price: 55,
      dietaryLabels: ['veg', 'beverage', 'gluten-free'],
      allergenInformation: 'Contains Milk / Dairy',
      preparationTimeMinutes: 4,
      stockQuantity: 80,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_11',
      categoryId: 'cat_beverages',
      name: 'Kulhad Masala Chai & Bun Maska',
      description: 'Freshly brewed ginger-cardamom tea served in an earthen kulhad paired with soft toasted bun generously layered with butter.',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      price: 45,
      dietaryLabels: ['veg', 'beverage'],
      allergenInformation: 'Contains Dairy, Gluten',
      preparationTimeMinutes: 4,
      stockQuantity: 90,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item_12',
      categoryId: 'cat_beverages',
      name: 'Fresh Alphonso Mango Lassi',
      description: 'Chilled thick sweet yogurt drink made with real Alphonso mango pulp, saffron strands, and crushed pistachios.',
      imageUrl: 'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=600&q=80',
      price: 60,
      dietaryLabels: ['veg', 'beverage', 'gluten-free'],
      allergenInformation: 'Contains Milk / Dairy, Tree Nuts (Pistachio)',
      preparationTimeMinutes: 3,
      stockQuantity: 60,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const defaultSlots = generateDefaultPickupSlots();

  const defaultSettings: CanteenSettings = {
    isOpen: true,
    emergencyPause: false,
    rushMode: false,
    rushMultiplier: 1.0,
    maxActiveKitchenOrders: 25,
    allowCashCounter: true,
    announcementBanner: '🚀 Special 15% discount on all Meal Combos during lunch break (12:30 PM - 2:00 PM)! Order ahead to skip the line.',
    taxRatePercent: 5,
    packagingFee: 5,
    openingTime: '08:30',
    closingTime: '19:30',
  };

  // Seed sample initial completed and in-progress orders for analytics and instant staff demo
  const sampleOrderId = 'ord_seed_101';
  const sampleOrder: Order = {
    id: sampleOrderId,
    orderNumber: '#CB-1042',
    studentId: 'usr_student_1',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav.sharma@campus.edu.in',
    studentCollegeId: '2023-CS-042',
    pickupSlotId: defaultSlots[1].id,
    slotLabel: `${defaultSlots[1].startTime} - ${defaultSlots[1].endTime}`,
    subtotal: 215,
    taxAmount: 11,
    feeAmount: 5,
    totalAmount: 231,
    orderStatus: 'preparing',
    paymentStatus: 'captured',
    paymentMethod: 'razorpay_upi',
    collectionToken: 'CB-429',
    estimatedReadyAt: new Date(Date.now() + 8 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60000).toISOString(),
    items: [
      {
        id: 'oi_seed_1',
        orderId: sampleOrderId,
        menuItemId: 'item_1',
        itemNameSnapshot: 'Deluxe North Indian Thali',
        unitPriceSnapshot: 130,
        quantity: 1,
        lineTotal: 130,
        imageUrl: defaultMenuItems[0].imageUrl,
        dietaryLabels: defaultMenuItems[0].dietaryLabels,
      },
      {
        id: 'oi_seed_2',
        orderId: sampleOrderId,
        menuItemId: 'item_2',
        itemNameSnapshot: 'Paneer Tikka Kathi Roll',
        unitPriceSnapshot: 85,
        quantity: 1,
        lineTotal: 85,
        customization: 'Extra spicy, no onions please',
        imageUrl: defaultMenuItems[1].imageUrl,
        dietaryLabels: defaultMenuItems[1].dietaryLabels,
      },
    ],
    preparationMinutes: 12,
    specialInstructions: 'Fast preparation requested between lecture breaks.',
  };

  // Update reserved count for that slot
  defaultSlots[1].reservedCount = 1;

  const samplePayment: PaymentRecord = {
    id: 'pay_seed_1',
    orderId: sampleOrderId,
    provider: 'razorpay',
    providerOrderId: 'order_rzp_seed_001',
    providerPaymentId: 'pay_rzp_test_success_991',
    amount: 231,
    currency: 'INR',
    paymentStatus: 'captured',
    verifiedAt: new Date(Date.now() - 9 * 60000).toISOString(),
    methodDetails: 'UPI / GPay (test@upi)',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 60000).toISOString(),
  };

  const sampleHistory: OrderStatusHistory[] = [
    {
      id: 'osh_1',
      orderId: sampleOrderId,
      previousStatus: 'placed',
      newStatus: 'accepted',
      changedBy: 'usr_staff_1',
      changedByName: 'Chef Rajesh Kumar',
      changedAt: new Date(Date.now() - 8 * 60000).toISOString(),
      note: 'Order accepted. Kitchen ticket sent to tandoor & thali station.',
    },
    {
      id: 'osh_2',
      orderId: sampleOrderId,
      previousStatus: 'accepted',
      newStatus: 'preparing',
      changedBy: 'usr_staff_1',
      changedByName: 'Chef Rajesh Kumar',
      changedAt: new Date(Date.now() - 4 * 60000).toISOString(),
      note: 'Thali items and paratha on grill.',
    },
  ];

  const sampleNotification: AppNotification = {
    id: 'notif_1',
    userId: 'usr_student_1',
    orderId: sampleOrderId,
    notificationType: 'order_status',
    title: 'Order Preparing! 🍳',
    message: 'Your order #CB-1042 is being freshly prepared. Ready in approx 8 mins.',
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  };

  const sampleAudit: AuditLog = {
    id: 'aud_1',
    actorId: 'usr_staff_1',
    actorName: 'Chef Rajesh Kumar',
    action: 'ORDER_PREPARATION_START',
    entityType: 'ORDER',
    entityId: sampleOrderId,
    details: 'Status changed to preparing for #CB-1042',
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  };

  return {
    profiles: defaultProfiles,
    categories: defaultCategories,
    menuItems: defaultMenuItems,
    pickupSlots: defaultSlots,
    orders: [sampleOrder],
    orderItems: sampleOrder.items,
    payments: [samplePayment],
    refunds: [],
    orderStatusHistory: sampleHistory,
    notifications: [sampleNotification],
    auditLogs: [sampleAudit],
    settings: defaultSettings,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.profiles && parsed.menuItems && parsed.orders) {
          // If pickup slots are from an older date, refresh today's pickup slots
          const today = new Date().toISOString().split('T')[0];
          if (!parsed.pickupSlots || parsed.pickupSlots.length === 0 || parsed.pickupSlots[0].date !== today) {
            parsed.pickupSlots = generateDefaultPickupSlots();
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read DB file, initializing fresh database:', e);
    }
    const fresh = getInitialData();
    this.persist(fresh);
    return fresh;
  }

  private persist(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write canteen database to disk:', err);
    }
  }

  public save() {
    // Debounced write
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persist(this.data);
    }, 150);
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  // --- Profile Operations ---
  public getProfiles(): UserProfile[] {
    return this.data.profiles;
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  public getProfileByEmail(email: string): UserProfile | undefined {
    return this.data.profiles.find(
      (p) => p.collegeEmail.toLowerCase() === email.toLowerCase()
    );
  }

  public createProfile(profile: UserProfile): UserProfile {
    this.data.profiles.push(profile);
    this.save();
    return profile;
  }

  public updateProfileRole(id: string, role: UserProfile['role']): UserProfile | null {
    const profile = this.data.profiles.find((p) => p.id === id);
    if (!profile) return null;
    profile.role = role;
    profile.updatedAt = new Date().toISOString();
    this.save();
    return profile;
  }

  // --- Menu and Categories ---
  public getCategories(): Category[] {
    return this.data.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getMenuItems(): MenuItem[] {
    return this.data.menuItems;
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.data.menuItems.find((item) => item.id === id);
  }

  public createMenuItem(item: MenuItem): MenuItem {
    this.data.menuItems.push(item);
    this.save();
    return item;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const item = this.data.menuItems.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return item;
  }

  public deleteMenuItem(id: string): boolean {
    const idx = this.data.menuItems.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.data.menuItems.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Pickup Slots and Peak-Hour Queue Reduction ---
  public getPickupSlots(): PickupSlot[] {
    // Recalculate reserved counts based on currently active orders
    const activeOrders = this.data.orders.filter(
      (o) => !['collected', 'cancelled', 'rejected'].includes(o.orderStatus)
    );
    const countMap: Record<string, number> = {};
    for (const ord of activeOrders) {
      countMap[ord.pickupSlotId] = (countMap[ord.pickupSlotId] || 0) + 1;
    }
    for (const slot of this.data.pickupSlots) {
      slot.reservedCount = countMap[slot.id] || 0;
    }
    return this.data.pickupSlots;
  }

  public getPickupSlotById(id: string): PickupSlot | undefined {
    return this.getPickupSlots().find((s) => s.id === id);
  }

  public updatePickupSlot(id: string, updates: Partial<PickupSlot>): PickupSlot | null {
    const slot = this.data.pickupSlots.find((s) => s.id === id);
    if (!slot) return null;
    Object.assign(slot, updates);
    this.save();
    return slot;
  }

  // --- Order Processing & Queue Reduction Engine ---
  public calculateEstimatedPrepTime(itemIds: { id: string; quantity: number }[]): number {
    const settings = this.data.settings;
    let basePrep = 0;
    for (const it of itemIds) {
      const menuItem = this.getMenuItemById(it.id);
      if (menuItem) {
        // Items prepared in parallel, but volume adds small incremental time
        basePrep = Math.max(basePrep, menuItem.preparationTimeMinutes) + (it.quantity - 1) * 1.5;
      }
    }
    if (basePrep === 0) basePrep = 8;

    // Kitchen Workload Factor:
    const activeKitchenOrders = this.data.orders.filter(
      (o) => o.orderStatus === 'accepted' || o.orderStatus === 'preparing'
    ).length;

    // Extra delay per 3 active orders
    const workloadDelay = Math.floor(activeKitchenOrders / 3) * 2;
    const rushMultiplier = settings.rushMode ? (settings.rushMultiplier || 1.3) : 1.0;

    return Math.round((basePrep + workloadDelay) * rushMultiplier);
  }

  private async syncOrderToSupabase(order: Order) {
    try {
      await supabaseServer.from('orders').upsert({
        id: order.id,
        order_number: order.orderNumber,
        student_id: order.studentId,
        student_name: order.studentName,
        student_email: order.studentEmail,
        total_amount: order.totalAmount,
        order_status: order.orderStatus,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        collection_token: order.collectionToken,
        slot_label: order.slotLabel,
        created_at: order.createdAt,
      });
    } catch (err) {
      console.warn('Supabase order sync warning (local fallback active):', err);
    }
  }

  public createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    for (const item of order.items) {
      this.data.orderItems.push(item);
      // Decrement stock if item has stockQuantity
      const mItem = this.getMenuItemById(item.menuItemId);
      if (mItem && mItem.stockQuantity > 0) {
        mItem.stockQuantity = Math.max(0, mItem.stockQuantity - item.quantity);
        if (mItem.stockQuantity === 0) {
          mItem.isAvailable = false;
        }
      }
    }
    this.save();
    this.syncOrderToSupabase(order);
    return order;
  }

  public getOrders(studentId?: string): Order[] {
    if (studentId) {
      return this.data.orders.filter((o) => o.studentId === studentId);
    }
    return this.data.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    changedBy: string,
    changedByName: string,
    note?: string
  ): Order | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;

    const prev = order.orderStatus;
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'collected') {
      order.collectedAt = new Date().toISOString();
      order.collectedByStaffId = changedBy;
    } else if (newStatus === 'cancelled') {
      order.cancelledAt = new Date().toISOString();
      order.cancellationReason = note || 'Cancelled by user';
    } else if (newStatus === 'rejected') {
      order.rejectionReason = note || 'Rejected by kitchen staff';
    }

    // Add status history entry
    const historyEntry: OrderStatusHistory = {
      id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: id,
      previousStatus: prev,
      newStatus,
      changedBy,
      changedByName,
      changedAt: new Date().toISOString(),
      note,
    };
    this.data.orderStatusHistory.push(historyEntry);

    // Add in-app notification for the student
    let notifTitle = `Order ${newStatus.toUpperCase()}`;
    let notifMsg = `Order ${order.orderNumber} status changed to ${newStatus}.`;
    if (newStatus === 'accepted') {
      notifTitle = 'Order Accepted! 👨‍🍳';
      notifMsg = `Canteen accepted ${order.orderNumber}. Preparation will begin shortly.`;
    } else if (newStatus === 'preparing') {
      notifTitle = 'Cooking in Progress 🍳';
      notifMsg = `Chef is preparing ${order.orderNumber}. Target ready: ${new Date(order.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    } else if (newStatus === 'ready') {
      notifTitle = 'Ready for Pickup! 🔔';
      notifMsg = `Your food is HOT & READY! Head to the pickup counter with token: ${order.collectionToken}`;
    } else if (newStatus === 'collected') {
      notifTitle = 'Order Collected ✅';
      notifMsg = `Order ${order.orderNumber} successfully collected. Enjoy your meal!`;
    } else if (newStatus === 'cancelled') {
      notifTitle = 'Order Cancelled ❌';
      notifMsg = `Order ${order.orderNumber} was cancelled. ${note || ''}`;
    } else if (newStatus === 'rejected') {
      notifTitle = 'Order Rejected ⚠️';
      notifMsg = `Canteen could not fulfill ${order.orderNumber}: ${note || 'Kitchen capacity exceeded'}.`;
    }

    this.data.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId: order.studentId,
      orderId: order.id,
      notificationType: 'order_status',
      title: notifTitle,
      message: notifMsg,
      createdAt: new Date().toISOString(),
    });

    this.save();
    this.syncOrderToSupabase(order);
    return order;
  }

  // --- Pickup Code Verification ---
  public verifyAndCollectOrder(
    token: string,
    staffId: string,
    staffName: string
  ): { success: boolean; message: string; order?: Order } {
    const cleanToken = token.trim().toUpperCase();
    const order = this.data.orders.find(
      (o) => o.collectionToken.toUpperCase() === cleanToken || o.orderNumber.toUpperCase() === cleanToken
    );

    if (!order) {
      return { success: false, message: 'Invalid collection token. No matching order found.' };
    }

    if (order.orderStatus === 'collected') {
      return {
        success: false,
        message: `Order ${order.orderNumber} was already collected at ${new Date(order.collectedAt || '').toLocaleTimeString()} by Staff #${order.collectedByStaffId || 'Counter'}.`,
        order,
      };
    }

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'rejected') {
      return {
        success: false,
        message: `Order ${order.orderNumber} is marked as ${order.orderStatus.toUpperCase()} and cannot be collected.`,
        order,
      };
    }

    // Mark as collected
    this.updateOrderStatus(order.id, 'collected', staffId, staffName, 'Verified at collection counter via secure token.');

    // Log audit
    this.addAuditLog({
      actorId: staffId,
      actorName: staffName,
      action: 'COLLECTION_VERIFIED',
      entityType: 'ORDER',
      entityId: order.id,
      details: `Order ${order.orderNumber} collected with verified token ${order.collectionToken}`,
    });

    return { success: true, message: `Order ${order.orderNumber} verified and collected successfully!`, order };
  }

  // --- Payments and Razorpay Processing ---
  public createPaymentRecord(payment: PaymentRecord): PaymentRecord {
    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  public updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    providerPaymentId?: string,
    methodDetails?: string
  ): PaymentRecord | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
    }
    const payment = this.data.payments.find((p) => p.orderId === orderId);
    if (payment) {
      payment.paymentStatus = paymentStatus;
      if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
      if (methodDetails) payment.methodDetails = methodDetails;
      payment.verifiedAt = new Date().toISOString();
      payment.updatedAt = new Date().toISOString();
      this.save();
      return payment;
    }
    return null;
  }

  public processRefund(
    orderId: string,
    amount: number,
    reason: string,
    actorId: string,
    actorName: string
  ): { success: boolean; refund?: RefundRecord; message?: string } {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const payment = this.data.payments.find((p) => p.orderId === orderId);
    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const refundRecord: RefundRecord = {
      id: refundId,
      paymentId: payment ? payment.id : 'cash_refund',
      orderId,
      providerRefundId: `rzp_rfnd_${Date.now()}`,
      amount,
      reason,
      refundStatus: 'processed',
      processedBy: actorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.refunds.push(refundRecord);
    order.paymentStatus = 'refunded';
    if (payment) {
      payment.paymentStatus = 'refunded';
    }

    this.addAuditLog({
      actorId,
      actorName,
      action: 'PAYMENT_REFUNDED',
      entityType: 'PAYMENT',
      entityId: refundId,
      details: `Refunded ₹${amount} for order ${order.orderNumber}. Reason: ${reason}`,
    });

    this.data.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: order.studentId,
      orderId: order.id,
      notificationType: 'payment',
      title: 'Refund Processed 💳',
      message: `₹${amount} refund processed for order ${order.orderNumber}. Reference: ${refundRecord.providerRefundId}`,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return { success: true, refund: refundRecord };
  }

  // --- Settings ---
  public getSettings(): CanteenSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<CanteenSettings>, actorId: string, actorName: string): CanteenSettings {
    Object.assign(this.data.settings, updates);
    this.addAuditLog({
      actorId,
      actorName,
      action: 'SETTINGS_UPDATE',
      entityType: 'CANTEEN_SETTINGS',
      entityId: 'global',
      details: `Updated canteen settings: ${Object.keys(updates).join(', ')}`,
    });
    this.save();
    return this.data.settings;
  }

  // --- Audit Logs ---
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Notifications ---
  public getNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationRead(id: string): boolean {
    const n = this.data.notifications.find((item) => item.id === id);
    if (n) {
      n.readAt = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string): void {
    const now = new Date().toISOString();
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.readAt) {
        n.readAt = now;
      }
    }
    this.save();
  }

  public addNotification(notification: AppNotification): AppNotification {
    this.data.notifications.unshift(notification);
    this.save();
    return notification;
  }

  // --- Analytics Engine ---
  public getAnalyticsSummary(): AnalyticsSummary {
    const orders = this.data.orders;
    const payments = this.data.payments;
    const refunds = this.data.refunds;

    const totalOrders = orders.length;
    const totalGrossRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const totalCapturedRevenue = payments
      .filter((p) => p.paymentStatus === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunds = refunds
      .filter((r) => r.refundStatus === 'processed')
      .reduce((sum, r) => sum + r.amount, 0);

    const netRevenue = Math.max(0, totalCapturedRevenue - totalRefunds);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalGrossRevenue / totalOrders) : 0;

    // Prep time calculation
    const completedOrdersWithPrep = orders.filter((o) => o.preparationMinutes);
    const averagePrepTimeMinutes =
      completedOrdersWithPrep.length > 0
        ? Math.round(
            completedOrdersWithPrep.reduce((s, o) => s + o.preparationMinutes, 0) /
              completedOrdersWithPrep.length
          )
        : 10;

    // Collection wait calculation
    const collectedOrders = orders.filter((o) => o.collectedAt && o.createdAt);
    let avgCollectionMinutes = 6;
    if (collectedOrders.length > 0) {
      const totalMins = collectedOrders.reduce((sum, o) => {
        const diff = (new Date(o.collectedAt!).getTime() - new Date(o.createdAt).getTime()) / 60000;
        return sum + Math.max(1, diff);
      }, 0);
      avgCollectionMinutes = Math.round(totalMins / collectedOrders.length);
    }

    const cancelledCount = orders.filter((o) => o.orderStatus === 'cancelled').length;
    const rejectedCount = orders.filter((o) => o.orderStatus === 'rejected').length;

    const cancellationRate = totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0;
    const rejectionRate = totalOrders > 0 ? Math.round((rejectedCount / totalOrders) * 100) : 0;

    // Slot capacity utilization
    const slots = this.getPickupSlots();
    const totalCapacity = slots.reduce((s, slot) => s + slot.capacity, 0);
    const totalReserved = slots.reduce((s, slot) => s + slot.reservedCount, 0);
    const slotUtilizationPercent =
      totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0;

    // Hourly orders (8 AM to 7 PM)
    const hours = ['08 AM', '09 AM', '10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM', '04 PM', '05 PM', '06 PM', '07 PM'];
    const hourlyOrders = hours.map((hour, idx) => {
      const hourNum = idx + 8;
      const count = orders.filter((o) => {
        const h = new Date(o.createdAt).getHours();
        return h === hourNum;
      }).length;
      const rev = orders
        .filter((o) => new Date(o.createdAt).getHours() === hourNum)
        .reduce((s, o) => s + o.totalAmount, 0);
      return { hour, count, revenue: rev };
    });

    // Best-sellers
    const itemSales: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const oi of this.data.orderItems) {
      if (!itemSales[oi.menuItemId]) {
        itemSales[oi.menuItemId] = {
          name: oi.itemNameSnapshot,
          count: 0,
          revenue: 0,
        };
      }
      itemSales[oi.menuItemId].count += oi.quantity;
      itemSales[oi.menuItemId].revenue += oi.lineTotal;
    }

    const bestSellers = Object.values(itemSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status distribution
    const statusCounts: Record<OrderStatus, number> = {
      placed: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      collected: 0,
      cancelled: 0,
      rejected: 0,
    };
    for (const o of orders) {
      statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
    }
    const statusDistribution = (Object.keys(statusCounts) as OrderStatus[]).map((status) => ({
      status,
      count: statusCounts[status],
    }));

    return {
      totalOrders,
      totalGrossRevenue,
      totalCapturedRevenue,
      totalRefunds,
      netRevenue,
      averageOrderValue,
      averagePrepTimeMinutes,
      averagePickupWaitMinutes: avgCollectionMinutes,
      cancellationRate,
      rejectionRate,
      slotUtilizationPercent,
      hourlyOrders,
      bestSellers,
      statusDistribution,
    };
  }
}

export const db = new DatabaseManager();
