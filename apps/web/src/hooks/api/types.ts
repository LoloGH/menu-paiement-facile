import type {
  ArticleType,
  FulfillmentStatus,
  PaymentStatus,
  UserRole,
} from "@menu/shared";

/** Shapes returned by the API. Mirrors the server's response payloads. */

export interface Article {
  id: string;
  name: string;
  description: string | null;
  type: ArticleType;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  menuItemId: string;
  articleId: string;
  name: string;
  description: string | null;
  type: ArticleType;
  imageUrl: string | null;
  isAvailable: boolean;
  price: number;
  position: number;
}

export interface Menu {
  id: string;
  serviceDate: string;
  isPublished: boolean;
  items: MenuItem[];
}

export interface OrderLine {
  id: string;
  orderId: string;
  articleId: string | null;
  articleName: string;
  articleType: ArticleType;
  unitPrice: number;
  quantity: number;
  serviceDate: string | null;
}

export interface Order {
  id: string;
  receiptId: string;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  tableNumber: string | null;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderLine[];
  customerEmail?: string | null;
  customerName?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  loyaltyNumber: string | null;
  disabledAt: string | null;
  createdAt: string;
  roles: UserRole[];
}

export interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: unknown;
  createdAt: string;
  actorEmail: string | null;
}

export interface Paginated<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}
