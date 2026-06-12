// Malaysia Standard Industrial Classification (MSIC) 2008 codes.
// Source: https://sdk.myinvois.hasil.gov.my/codes/msic-codes/
// Subset of the most commonly used MSIC codes. The MSIC catalogue has
// over 1,500 codes; consumers can pass any 5-digit MSIC code as a string.
export const MSIC_CODES = {
  '00000': 'Not Applicable',
  '01111': 'Growing of maize',
  '01120': 'Growing of rice',
  '01262': 'Growing of oil palm (estate)',
  '10110': 'Processing and preserving of meat',
  '10311': 'Manufacture of frozen fruit and vegetables',
  '14101': 'Manufacture of all types of garments and clothing accessories',
  '25111': 'Manufacture of metal frameworks or skeletons for construction',
  '41001': 'Construction of residential buildings',
  '41002': 'Construction of non-residential buildings',
  '45101': 'Wholesale of motor vehicles',
  '46900': 'Non-specialised wholesale trade',
  '47190': 'Other retail sale in non-specialised stores',
  '49231': 'Freight transport by road',
  '52211': 'Operation of railway terminals',
  '55101': 'Hotels and resort hotels',
  '56101': 'Restaurants',
  '58110': 'Book publishing',
  '61100': 'Wired telecommunications activities',
  '62010': 'Computer programming activities',
  '62020': 'Computer consultancy and computer facilities management activities',
  '63111': 'Data processing, hosting and related activities',
  '64191': 'Commercial banks',
  '65110': 'Life insurance',
  '68101': 'Buying and selling of own real estate',
  '69100': 'Legal activities',
  '69200': 'Accounting, bookkeeping and auditing activities; tax consultancy',
  '70200': 'Management consultancy activities',
  '71101': 'Architectural activities',
  '71102': 'Engineering activities and technical consultancy',
  '73100': 'Advertising',
  '74100': 'Specialised design activities',
  '78100': 'Activities of employment placement agencies',
  '82110': 'Combined office administrative service activities',
  '85100': 'Pre-primary and primary education',
  '85210': 'General secondary education',
  '86101': 'Activities of general hospitals',
  '86202': 'Dental practice activities',
  '94110': 'Activities of business and employers membership organizations',
} as const;

export type MsicCode = string;

export function isKnownMsic(code: string): code is keyof typeof MSIC_CODES {
  return code in MSIC_CODES;
}
