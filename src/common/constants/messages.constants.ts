/**
 * Application Messages Constants
 * All user-facing messages should be in English
 */
export const MESSAGES = {
  // General
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  BAD_REQUEST: 'Bad request',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_SERVER_ERROR: 'Internal server error',

  // Auth
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account is locked',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    USER_NOT_FOUND: 'User not found or account is locked',
    LOGOUT_SUCCESS: 'Logged out successfully',
    USER_DOES_NOT_EXIST: 'User does not exist',
    ACCOUNT_IS_LOCKED: 'Account is locked',
  },

  // User
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  },

  // Category
  CATEGORY: {
    NOT_FOUND: 'Category not found',
    SLUG_ALREADY_EXISTS: 'Slug already exists',
    PARENT_NOT_FOUND: 'Parent category not found',
    CANNOT_DELETE_WITH_PRODUCTS: 'Cannot delete category with existing products',
    CANNOT_DELETE_WITH_CHILDREN: 'Cannot delete category with subcategories',
    CANNOT_BE_OWN_PARENT: 'Category cannot be its own parent',
  },

  // Store
  STORE: {
    NOT_FOUND: 'Store not found',
    ALREADY_EXISTS: 'You already have a store',
    SLUG_ALREADY_EXISTS: 'Slug already exists',
    CANNOT_DELETE_WITH_PRODUCTS: 'Cannot delete store with active products',
    CANNOT_UPDATE_VERIFICATION: 'Only admin can update verification status',
    NOT_OWNER: 'You do not own this store',
  },

  // Product
  PRODUCT: {
    NOT_FOUND: 'Product not found',
    NOT_OWNER: 'You do not own this product',
    SKU_ALREADY_EXISTS: 'SKU already exists',
    CATEGORY_NOT_FOUND: 'Category not found',
    STORE_NOT_FOUND: 'Store not found',
    NOT_STORE_OWNER: 'You do not own this store',
    INSUFFICIENT_STOCK: 'Insufficient stock',
    CANNOT_DELETE_WITH_ORDERS: 'Cannot delete product with pending orders',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    STOCK_BELOW_RESERVED: 'Stock cannot be less than reserved quantity',
    NOT_AVAILABLE: 'Product is not available',
    NOT_IN_STORE: 'Product does not belong to this store',
  },

  // Cart
  CART: {
    ITEM_NOT_FOUND: 'Cart item not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_NOT_AVAILABLE: 'Product is not available',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
  },

  // Order
  ORDER: {
    NOT_FOUND: 'Order not found',
    NOT_OWNER: 'You do not own this order',
    CANNOT_VIEW: 'You do not have permission to view this order',
    CANNOT_UPDATE: 'You do not have permission to update this order',
    CANNOT_CANCEL_COMPLETED: 'Cannot cancel completed order',
    ALREADY_CANCELLED: 'Order is already cancelled',
    CANNOT_UPDATE_PAYMENT: 'Only admin can update payment status',
    CANNOT_UPDATE_STATUS: 'You can only update order status and notes',
    BUYER_CAN_ONLY_UPDATE_NOTES: 'Buyer can only update notes',
    STORE_NOT_FOUND: 'Store not found',
    ADDRESS_NOT_FOUND: 'Address not found',
    CANNOT_VIEW_STORE_ORDERS: 'You do not have permission to view orders for this store',
    CANNOT_CANCEL: 'You do not have permission to cancel this order',
  },

  // Address
  ADDRESS: {
    NOT_FOUND: 'Address not found',
    NOT_OWNER: 'You do not own this address',
    CANNOT_UPDATE: 'You do not have permission to update this address',
    CANNOT_DELETE: 'You do not have permission to delete this address',
  },
} as const;

/**
 * Validation Messages
 */
export const VALIDATION_MESSAGES = {
  // General
  IS_STRING: 'Must be a string',
  IS_NUMBER: 'Must be a number',
  IS_BOOLEAN: 'Must be a boolean',
  IS_ARRAY: 'Must be an array',
  IS_EMAIL: 'Must be a valid email',
  IS_URL: 'Must be a valid URL',
  IS_UUID: 'Must be a valid UUID',
  IS_ENUM: 'Invalid enum value',
  IS_NOT_EMPTY: 'Is required',
  IS_OPTIONAL: 'Is optional',

  // String validations
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  LENGTH: (min: number, max: number) =>
    `Must be between ${min} and ${max} characters`,

  // Number validations
  MIN: (min: number) => `Must be greater than or equal to ${min}`,
  MAX: (max: number) => `Must be less than or equal to ${max}`,
  POSITIVE: 'Must be a positive number',
  NEGATIVE: 'Must be a negative number',

  // Array validations
  ARRAY_MIN_SIZE: (min: number) => `Must contain at least ${min} items`,
  ARRAY_MAX_SIZE: (max: number) => `Must not contain more than ${max} items`,

  // Pattern validations
  SLUG_PATTERN: 'Must contain only lowercase letters, numbers, and hyphens',
  PHONE_PATTERN: 'Invalid phone number format',

  // Field-specific validation messages
  TITLE: {
    IS_STRING: 'Title must be a string',
    IS_REQUIRED: 'Title is required',
    MAX_LENGTH_255: 'Title must not exceed 255 characters',
    MAX_LENGTH: (max: number) => `Title must not exceed ${max} characters`,
  },
  DESCRIPTION: {
    IS_STRING: 'Description must be a string',
  },
  PRICE: {
    IS_NUMBER: 'Price must be a number',
    IS_REQUIRED: 'Price is required',
    MIN: 'Price must be greater than or equal to 0',
  },
  ORIGINAL_PRICE: {
    IS_NUMBER: 'Original price must be a number',
    MIN: 'Original price must be greater than or equal to 0',
  },
  CATEGORY_ID: {
    IS_STRING: 'Category ID must be a string',
    IS_REQUIRED: 'Category ID is required',
  },
  STORE_ID: {
    IS_STRING: 'Store ID must be a string',
    IS_REQUIRED: 'Store ID is required',
  },
  PRODUCT_CONDITION: {
    IS_INVALID: 'Product condition is invalid',
    IS_REQUIRED: 'Product condition is required',
  },
  PRODUCT_STATUS: {
    IS_INVALID: 'Product status is invalid',
    IS_REQUIRED: 'Product status is required',
  },
  ORDER_STATUS: {
    IS_INVALID: 'Order status is invalid',
  },
  PAYMENT_STATUS: {
    IS_INVALID: 'Payment status is invalid',
  },
  PAYMENT_METHOD: {
    IS_INVALID: 'Payment method is invalid',
  },
  TAGS: {
    IS_ARRAY: 'Tags must be an array',
    EACH_IS_STRING: 'Each tag must be a string',
    MAX_SIZE_10: 'Must not exceed 10 tags',
    MAX_SIZE: (max: number) => `Must not exceed ${max} tags`,
  },
  LOCATION: {
    IS_STRING: 'Location must be a string',
    MAX_LENGTH_255: 'Location must not exceed 255 characters',
    MAX_LENGTH: (max: number) => `Location must not exceed ${max} characters`,
  },
  STOCK: {
    IS_NUMBER: 'Stock quantity must be a number',
    IS_REQUIRED: 'Stock quantity is required',
    MIN: 'Stock quantity must be greater than or equal to 0',
  },
  MIN_STOCK: {
    IS_NUMBER: 'Minimum stock must be a number',
    MIN: 'Minimum stock must be greater than or equal to 0',
  },
  MAX_STOCK: {
    IS_NUMBER: 'Maximum stock must be a number',
    MIN: 'Maximum stock must be greater than or equal to 0',
  },
  COST_PRICE: {
    IS_NUMBER: 'Cost price must be a number',
    MIN: 'Cost price must be greater than or equal to 0',
  },
  SKU: {
    IS_STRING: 'SKU must be a string',
    MAX_LENGTH_100: 'SKU must not exceed 100 characters',
    MAX_LENGTH: (max: number) => `SKU must not exceed ${max} characters`,
  },
  BARCODE: {
    IS_STRING: 'Barcode must be a string',
    MAX_LENGTH_100: 'Barcode must not exceed 100 characters',
    MAX_LENGTH: (max: number) => `Barcode must not exceed ${max} characters`,
  },
  WEIGHT: {
    IS_NUMBER: 'Weight must be a number',
    MIN: 'Weight must be greater than or equal to 0',
  },
  DIMENSIONS: {
    IS_STRING: 'Dimensions must be a string',
    MAX_LENGTH_100: 'Dimensions must not exceed 100 characters',
    MAX_LENGTH: (max: number) => `Dimensions must not exceed ${max} characters`,
  },
  SUPPLIER: {
    IS_STRING: 'Supplier must be a string',
    MAX_LENGTH_255: 'Supplier must not exceed 255 characters',
    MAX_LENGTH: (max: number) => `Supplier must not exceed ${max} characters`,
  },
  BADGES: {
    IS_ARRAY: 'Badges must be an array',
    IS_INVALID: 'Badge is invalid',
    MAX_SIZE_5: 'Must not exceed 5 badges',
    MAX_SIZE: (max: number) => `Must not exceed ${max} badges`,
  },
  IMAGES: {
    IS_ARRAY: 'Images must be an array',
    IS_REQUIRED: 'Images are required',
    EACH_IS_URL: 'Each image must be a valid URL',
    MAX_SIZE_10: 'Must not exceed 10 images',
    MAX_SIZE: (max: number) => `Must not exceed ${max} images`,
  },
  IS_ACTIVE: {
    IS_BOOLEAN: 'Active status must be a boolean',
  },
  IS_FEATURED: {
    IS_BOOLEAN: 'Featured status must be a boolean',
  },
  IS_PROMOTED: {
    IS_BOOLEAN: 'Promoted status must be a boolean',
  },
  PRODUCT_ID: {
    IS_STRING: 'Product ID must be a string',
    IS_REQUIRED: 'Product ID is required',
    IS_UUID: 'Product ID must be a valid UUID',
  },
  QUANTITY: {
    IS_NUMBER: 'Quantity must be a number',
    IS_REQUIRED: 'Quantity is required',
    MIN: 'Quantity must be greater than 0',
  },
  SHIPPING_ADDRESS_ID: {
    IS_STRING: 'Shipping address ID must be a string',
    IS_REQUIRED: 'Shipping address ID is required',
    IS_UUID: 'Shipping address ID must be a valid UUID',
  },
  BILLING_ADDRESS_ID: {
    IS_STRING: 'Billing address ID must be a string',
    IS_UUID: 'Billing address ID must be a valid UUID',
  },
  NOTES: {
    IS_STRING: 'Notes must be a string',
  },
  SELLER_NOTES: {
    IS_STRING: 'Seller notes must be a string',
  },
  ITEMS: {
    IS_ARRAY: 'Items must be an array',
    IS_REQUIRED: 'Items are required',
  },
  QUERY: {
    IS_STRING: 'Search query must be a string',
  },
  SELLER_ID: {
    IS_STRING: 'Seller ID must be a string',
  },
  MIN_PRICE: {
    IS_NUMBER: 'Minimum price must be a number',
    MIN: 'Minimum price must be greater than or equal to 0',
  },
  MAX_PRICE: {
    IS_NUMBER: 'Maximum price must be a number',
    MIN: 'Maximum price must be greater than or equal to 0',
  },
  RATING: {
    IS_NUMBER: 'Rating must be a number',
    MIN: 'Rating must be greater than or equal to 0',
    MAX: 'Rating must not exceed 5',
  },
  MIN_RATING: {
    IS_NUMBER: 'Minimum rating must be a number',
    MIN: 'Minimum rating must be greater than or equal to 0',
    MAX: 'Minimum rating must not exceed 5',
  },
  SORT_BY: {
    IS_STRING: 'Sort by must be a string',
  },
  SORT_ORDER: {
    IS_STRING: 'Sort order must be a string',
  },
  PAGE: {
    IS_INT: 'Page must be an integer',
    MIN: 'Page must be greater than 0',
  },
  LIMIT: {
    IS_INT: 'Limit must be an integer',
    MIN: 'Limit must be greater than 0',
    MAX: 'Limit must not exceed 100',
  },
  // Store fields
  STORE_NAME: {
    IS_STRING: 'Store name must be a string',
    IS_REQUIRED: 'Store name is required',
    MAX_LENGTH_255: 'Store name must not exceed 255 characters',
  },
  SLUG: {
    IS_STRING: 'Slug must be a string',
    MAX_LENGTH_255: 'Slug must not exceed 255 characters',
    PATTERN: 'Slug must contain only lowercase letters, numbers, and hyphens',
  },
  SHORT_DESCRIPTION: {
    IS_STRING: 'Short description must be a string',
    MAX_LENGTH_500: 'Short description must not exceed 500 characters',
  },
  LOGO: {
    IS_STRING: 'Logo must be a string',
    MAX_LENGTH_500: 'Logo URL must not exceed 500 characters',
    IS_URL: 'Logo must be a valid URL',
  },
  BANNER: {
    IS_STRING: 'Banner must be a string',
    MAX_LENGTH_500: 'Banner URL must not exceed 500 characters',
    IS_URL: 'Banner must be a valid URL',
  },
  CATEGORY: {
    IS_STRING: 'Category must be a string',
    MAX_LENGTH_100: 'Category must not exceed 100 characters',
  },
  SUBCATEGORY: {
    IS_STRING: 'Subcategory must be a string',
    MAX_LENGTH_100: 'Subcategory must not exceed 100 characters',
  },
  ESTABLISHED_YEAR: {
    IS_INT: 'Established year must be an integer',
    MIN: 'Established year must be from 1900 onwards',
    MAX: 'Established year must not exceed the current year',
  },
  BUSINESS_TYPE: {
    IS_STRING: 'Business type must be a string',
    MAX_LENGTH_50: 'Business type must not exceed 50 characters',
  },
  TAX_CODE: {
    IS_STRING: 'Tax code must be a string',
    MAX_LENGTH_50: 'Tax code must not exceed 50 characters',
  },
  BUSINESS_LICENSE: {
    IS_STRING: 'Business license must be a string',
    MAX_LENGTH_100: 'Business license must not exceed 100 characters',
  },
  ADDRESS_STREET: {
    IS_STRING: 'Street address must be a string',
    MAX_LENGTH_255: 'Street address must not exceed 255 characters',
  },
  ADDRESS_WARD: {
    IS_STRING: 'Ward must be a string',
    MAX_LENGTH_100: 'Ward must not exceed 100 characters',
  },
  ADDRESS_DISTRICT: {
    IS_STRING: 'District must be a string',
    MAX_LENGTH_100: 'District must not exceed 100 characters',
  },
  ADDRESS_CITY: {
    IS_STRING: 'City must be a string',
    MAX_LENGTH_100: 'City must not exceed 100 characters',
  },
  ADDRESS_POSTAL_CODE: {
    IS_STRING: 'Postal code must be a string',
    MAX_LENGTH_20: 'Postal code must not exceed 20 characters',
  },
  ADDRESS_LAT: {
    IS_NUMBER: 'Latitude must be a number',
  },
  ADDRESS_LNG: {
    IS_NUMBER: 'Longitude must be a number',
  },
  CONTACT_PHONE: {
    IS_STRING: 'Phone number must be a string',
    MAX_LENGTH_20: 'Phone number must not exceed 20 characters',
    PATTERN: 'Phone number is invalid',
  },
  CONTACT_EMAIL: {
    IS_STRING: 'Email must be a string',
    MAX_LENGTH_255: 'Email must not exceed 255 characters',
    IS_EMAIL: 'Email is invalid',
  },
  CONTACT_WEBSITE: {
    IS_STRING: 'Website must be a string',
    MAX_LENGTH_500: 'Website URL must not exceed 500 characters',
    IS_URL: 'Website must be a valid URL',
  },
  CONTACT_FACEBOOK: {
    IS_STRING: 'Facebook must be a string',
    MAX_LENGTH_500: 'Facebook URL must not exceed 500 characters',
    IS_URL: 'Facebook must be a valid URL',
  },
  CONTACT_INSTAGRAM: {
    IS_STRING: 'Instagram must be a string',
    MAX_LENGTH_500: 'Instagram URL must not exceed 500 characters',
    IS_URL: 'Instagram must be a valid URL',
  },
  CONTACT_TIKTOK: {
    IS_STRING: 'TikTok must be a string',
    MAX_LENGTH_500: 'TikTok URL must not exceed 500 characters',
    IS_URL: 'TikTok must be a valid URL',
  },
  CONTACT_YOUTUBE: {
    IS_STRING: 'YouTube must be a string',
    MAX_LENGTH_500: 'YouTube URL must not exceed 500 characters',
    IS_URL: 'YouTube must be a valid URL',
  },
  RETURN_POLICY: {
    IS_STRING: 'Return policy must be a string',
  },
  SHIPPING_POLICY: {
    IS_STRING: 'Shipping policy must be a string',
  },
  IS_VERIFIED: {
    IS_BOOLEAN: 'Verification status must be a boolean',
  },
  // Address fields
  RECIPIENT_NAME: {
    IS_STRING: 'Recipient name must be a string',
    IS_REQUIRED: 'Recipient name is required',
    MAX_LENGTH_255: 'Recipient name must not exceed 255 characters',
  },
  RECIPIENT_PHONE: {
    IS_STRING: 'Recipient phone must be a string',
    IS_REQUIRED: 'Recipient phone is required',
    MAX_LENGTH_20: 'Recipient phone must not exceed 20 characters',
    PATTERN: 'Recipient phone is invalid',
  },
  STREET: {
    IS_STRING: 'Street must be a string',
    IS_REQUIRED: 'Street is required',
    MAX_LENGTH_255: 'Street must not exceed 255 characters',
  },
  CITY: {
    IS_STRING: 'City must be a string',
    IS_REQUIRED: 'City is required',
    MAX_LENGTH_100: 'City must not exceed 100 characters',
  },
  STATE: {
    IS_STRING: 'State must be a string',
    IS_REQUIRED: 'State is required',
    MAX_LENGTH_100: 'State must not exceed 100 characters',
  },
  DISTRICT: {
    IS_STRING: 'District must be a string',
    MAX_LENGTH_100: 'District must not exceed 100 characters',
  },
  WARD: {
    IS_STRING: 'Ward must be a string',
    MAX_LENGTH_100: 'Ward must not exceed 100 characters',
  },
  ZIP_CODE: {
    IS_STRING: 'Zip code must be a string',
    MAX_LENGTH_20: 'Zip code must not exceed 20 characters',
  },
  COUNTRY: {
    IS_STRING: 'Country must be a string',
    IS_REQUIRED: 'Country is required',
    MAX_LENGTH_100: 'Country must not exceed 100 characters',
  },
  IS_DEFAULT: {
    IS_BOOLEAN: 'Default status must be a boolean',
  },
  PARENT_ID: {
    IS_STRING: 'Parent ID must be a string',
  },
} as const;

