/**
 * Numeric Enum Constants
 * Single source of truth for all enum values in the database
 * All enum fields in database are stored as integers
 */

// ==================== USER ROLE ====================
export const USER_ROLE = {
  USER: 0,
  ADMIN: 1,
} as const;

export type UserRoleType = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export const USER_ROLE_VALUES = Object.values(USER_ROLE) as number[];

// ==================== LANGUAGE ====================
export const LANGUAGE = {
  VI: 0,
  EN: 1,
} as const;

export type LanguageType = (typeof LANGUAGE)[keyof typeof LANGUAGE];
export const LANGUAGE_VALUES = Object.values(LANGUAGE) as number[];

// ==================== PRODUCT CONDITION ====================
export const PRODUCT_CONDITION = {
  NEW: 0,
  LIKE_NEW: 1,
  GOOD: 2,
  FAIR: 3,
  POOR: 4,
} as const;

export type ProductConditionType = (typeof PRODUCT_CONDITION)[keyof typeof PRODUCT_CONDITION];
export const PRODUCT_CONDITION_VALUES = Object.values(PRODUCT_CONDITION) as number[];

// ==================== PRODUCT STATUS ====================
export const PRODUCT_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  OUT_OF_STOCK: 2,
} as const;

export type ProductStatusType = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
export const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS) as number[];

// ==================== PRODUCT BADGE ====================
export const PRODUCT_BADGE = {
  NEW: 0,
  FEATURED: 1,
  PROMO: 2,
  HOT: 3,
  SALE: 4,
} as const;

export type ProductBadgeType = (typeof PRODUCT_BADGE)[keyof typeof PRODUCT_BADGE];
export const PRODUCT_BADGE_VALUES = Object.values(PRODUCT_BADGE) as number[];

// ==================== ORDER STATUS ====================
export const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  REFUNDED: 6,
} as const;

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS) as number[];

// ==================== PAYMENT STATUS ====================
export const PAYMENT_STATUS = {
  PENDING: 0,
  COMPLETED: 1,
  FAILED: 2,
  REFUNDED: 3,
} as const;

export type PaymentStatusType = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS) as number[];

// ==================== PAYMENT METHOD ====================
export const PAYMENT_METHOD = {
  BANK_TRANSFER: 0,
} as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD) as number[];

// ==================== TRANSACTION TYPE ====================
export const TRANSACTION_TYPE = {
  DEPOSIT: 0,
  SALE: 1,
  REFUND: 2,
  COMMISSION: 3,
  BONUS: 4,
  SUBSCRIPTION_PURCHASE: 5,
  BOOST: 6,
} as const;

export type TransactionTypeValue = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPE) as number[];

// ==================== CONVERSATION TYPE ====================
export const CONVERSATION_TYPE = {
  DIRECT: 0,
  GROUP: 1,
} as const;

export type ConversationTypeValue = (typeof CONVERSATION_TYPE)[keyof typeof CONVERSATION_TYPE];
export const CONVERSATION_TYPE_VALUES = Object.values(CONVERSATION_TYPE) as number[];

// ==================== MESSAGE TYPE ====================
export const MESSAGE_TYPE = {
  TEXT: 0,
  IMAGE: 1,
  FILE: 2,
} as const;

export type MessageTypeValue = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
export const MESSAGE_TYPE_VALUES = Object.values(MESSAGE_TYPE) as number[];

// ==================== NOTIFICATION TYPE ====================
export const NOTIFICATION_TYPE = {
  ORDER: 0,
  PRODUCT: 1,
  PAYMENT: 2,
  SYSTEM: 3,
  PROMOTION: 4,
  MESSAGE: 5,
} as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE) as number[];

// ==================== TICKET STATUS ====================
export const TICKET_STATUS = {
  OPEN: 0,
  IN_PROGRESS: 1,
  PENDING: 2,
  RESOLVED: 3,
  CLOSED: 4,
} as const;

export type TicketStatusType = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];
export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUS) as number[];

// ==================== TICKET PRIORITY ====================
export const TICKET_PRIORITY = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
} as const;

export type TicketPriorityType = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];
export const TICKET_PRIORITY_VALUES = Object.values(TICKET_PRIORITY) as number[];

// ==================== TICKET CATEGORY ====================
export const TICKET_CATEGORY = {
  ACCOUNT: 0,
  PRODUCT: 1,
  PAYMENT: 2,
  TECHNICAL: 3,
  REPORT: 4,
  QUESTION: 5,
  OTHER: 6,
} as const;

export type TicketCategoryType = (typeof TICKET_CATEGORY)[keyof typeof TICKET_CATEGORY];
export const TICKET_CATEGORY_VALUES = Object.values(TICKET_CATEGORY) as number[];

// ==================== SETTING TYPE ====================
export const SETTING_TYPE = {
  STRING: 0,
  NUMBER: 1,
  BOOLEAN: 2,
  JSON: 3,
  TEXT: 4,
} as const;

export type SettingTypeValue = (typeof SETTING_TYPE)[keyof typeof SETTING_TYPE];
export const SETTING_TYPE_VALUES = Object.values(SETTING_TYPE) as number[];

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a value is valid for a given enum
 */
export function isValidEnumValue(values: readonly number[], value: unknown): value is number {
  return typeof value === 'number' && values.includes(value);
}
