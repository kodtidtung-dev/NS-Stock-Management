// src/lib/constants.ts

export const API_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    TOKEN_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    UNAUTHORIZED: 'ไม่มีสิทธิ์เข้าถึง',
    LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
    LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ',
  },
  PRODUCTS: {
    NOT_FOUND: 'ไม่พบสินค้า',
    CREATED_SUCCESS: 'สร้างสินค้าสำเร็จ',
    UPDATED_SUCCESS: 'อัพเดทสินค้าสำเร็จ',
    DELETED_SUCCESS: 'ลบสินค้าสำเร็จ',
    DUPLICATE_NAME: 'ชื่อสินค้านี้มีอยู่แล้ว',
  },
  STOCK: {
    LOG_CREATED: 'บันทึก stock สำเร็จ',
    DUPLICATE_LOG: 'มีการบันทึก stock วันนี้แล้ว',
    INVALID_DATE: 'วันที่ไม่ถูกต้อง',
    INVALID_QUANTITY: 'จำนวนต้องมากกว่า 0',
  },
  GENERAL: {
    INTERNAL_ERROR: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    INVALID_REQUEST: 'คำขอไม่ถูกต้อง',
    METHOD_NOT_ALLOWED: 'Method ไม่ได้รับอนุญาต',
  },
} as const

export const ROLES = {
  STAFF: 'STAFF',
  OWNER: 'OWNER',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const