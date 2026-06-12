// UN/ECE Recommendation 20 unit of measure codes.
// Source: https://sdk.myinvois.hasil.gov.my/codes/unit-types/
// Common subset; extend as needed.
export const UNIT_CODES = {
  EA: 'Each',
  PCE: 'Piece',
  C62: 'One (dimensionless count)',
  KGM: 'Kilogram',
  GRM: 'Gram',
  TNE: 'Metric tonne',
  LTR: 'Litre',
  MLT: 'Millilitre',
  MTR: 'Metre',
  CMT: 'Centimetre',
  MMT: 'Millimetre',
  MTK: 'Square metre',
  MTQ: 'Cubic metre',
  HUR: 'Hour',
  DAY: 'Day',
  MON: 'Month',
  ANN: 'Year',
  MIN: 'Minute',
  SEC: 'Second',
  KWH: 'Kilowatt hour',
  GT: 'Gross tonnage',
  SET: 'Set',
  BX: 'Box',
  CT: 'Carton',
  PK: 'Pack',
  ROL: 'Roll',
  BG: 'Bag',
  BO: 'Bottle',
  CA: 'Can',
  DR: 'Drum',
  PR: 'Pair',
} as const;

export type UnitCode = keyof typeof UNIT_CODES;
