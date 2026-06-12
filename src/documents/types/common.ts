export type IdentificationType = 'BRN' | 'NRIC' | 'PASSPORT' | 'ARMY';

export interface Address {
  addressLines: string[];
  cityName: string;
  postalZone: string;
  countrySubentityCode: string;
  countryCode: string;
}

export interface Contact {
  telephone?: string;
  email?: string;
}

export interface Party {
  tin: string;
  identificationNumber: string;
  identificationType: IdentificationType;
  name: string;
  address: Address;
  contact?: Contact;
  sst?: string;
  ttx?: string;
  msicCode?: string;
  businessActivityDescription?: string;
}

export interface TaxCategory {
  taxType: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  exemptionReason?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  subtotal: number;
  taxCategory: TaxCategory;
  classificationCode?: string;
  itemCommodityClassification?: string;
  originCountry?: string;
  discountAmount?: number;
  discountReason?: string;
}

export interface TaxSubtotal {
  taxableAmount: number;
  taxAmount: number;
  taxCategory: Pick<TaxCategory, 'taxType' | 'taxRate'>;
}

export interface TaxTotal {
  taxAmount: number;
  taxSubtotals: TaxSubtotal[];
}

export interface MonetaryTotal {
  lineExtensionAmount: number;
  taxExclusiveAmount: number;
  taxInclusiveAmount: number;
  allowanceTotalAmount?: number;
  chargeTotalAmount?: number;
  payableAmount: number;
}

export interface BillingReference {
  invoiceDocumentReferenceId: string;
  uuid: string;
}

export interface PaymentMeans {
  paymentMeansCode: string;
  paymentDueDate?: string;
  payeeFinancialAccountId?: string;
  paymentId?: string;
}

export interface AdditionalDocumentReference {
  id: string;
  documentType?: string;
  documentDescription?: string;
}

export type DocumentTypeCode =
  | '01'
  | '02'
  | '03'
  | '04'
  | '11'
  | '12'
  | '13'
  | '14';

export interface BaseDocument {
  id: string;
  issueDate: string;
  issueTime: string;
  currencyCode: string;
  exchangeRate?: number;
  supplier: Party;
  buyer: Party;
  lines: InvoiceLine[];
  taxTotal: TaxTotal;
  legalMonetaryTotal: MonetaryTotal;
  invoiceTypeCode?: DocumentTypeCode;
  documentCurrencyCode?: string;
  taxCurrencyCode?: string;
  billingReference?: BillingReference;
  additionalDocumentReference?: AdditionalDocumentReference[];
  paymentMeans?: PaymentMeans;
  paymentTerms?: string;
  note?: string;
}
