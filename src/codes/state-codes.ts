export const STATE_CODES = {
  '01': 'Johor',
  '02': 'Kedah',
  '03': 'Kelantan',
  '04': 'Melaka',
  '05': 'Negeri Sembilan',
  '06': 'Pahang',
  '07': 'Pulau Pinang',
  '08': 'Perak',
  '09': 'Perlis',
  '10': 'Selangor',
  '11': 'Terengganu',
  '12': 'Sabah',
  '13': 'Sarawak',
  '14': 'Wilayah Persekutuan Kuala Lumpur',
  '15': 'Wilayah Persekutuan Labuan',
  '16': 'Wilayah Persekutuan Putrajaya',
  '17': 'Tidak Berkenaan',
} as const;

export type StateCode = keyof typeof STATE_CODES;

export const VALID_STATE_CODES = Object.keys(STATE_CODES) as StateCode[];
