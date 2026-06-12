export const PAYMENT_MODES = {
  '01': 'Cash',
  '02': 'Cheque',
  '03': 'Bank Transfer',
  '04': 'Credit Card',
  '05': 'Debit Card',
  '06': 'e-Wallet / Digital Wallet',
  '07': 'Digital Bank',
  '08': 'Others',
} as const;

export type PaymentModeCode = keyof typeof PAYMENT_MODES;
