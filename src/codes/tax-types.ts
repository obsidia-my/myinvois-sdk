export const TAX_TYPES = {
  '01': 'Sales Tax',
  '02': 'Service Tax',
  '03': 'Tourism Tax',
  '04': 'High-Value Goods Tax',
  '05': 'Sales Tax on Low Value Goods',
  '06': 'Not Applicable',
  E: 'Tax Exemption',
} as const;

export type TaxTypeCode = keyof typeof TAX_TYPES;
