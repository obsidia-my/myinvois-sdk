import type { InvoiceDocument } from '../../src/documents/types/invoice';

export const sampleInvoice: InvoiceDocument = {
  id: 'INV-2024-001',
  issueDate: '2024-01-15',
  issueTime: '08:30:00Z',
  currencyCode: 'MYR',
  supplier: {
    tin: 'C20830570210',
    identificationNumber: '202001234567',
    identificationType: 'BRN',
    name: 'Obsidia System Sdn Bhd',
    address: {
      addressLines: ['No. 1, Jalan Example'],
      cityName: 'Kuala Lumpur',
      postalZone: '50000',
      countrySubentityCode: '14',
      countryCode: 'MYS',
    },
    msicCode: '62010',
    businessActivityDescription: 'Computer programming activities',
  },
  buyer: {
    tin: 'C12345678901',
    identificationNumber: '202005987654',
    identificationType: 'BRN',
    name: 'Client Sdn Bhd',
    address: {
      addressLines: ['No. 5, Jalan Client'],
      cityName: 'Petaling Jaya',
      postalZone: '47500',
      countrySubentityCode: '10',
      countryCode: 'MYS',
    },
  },
  lines: [
    {
      id: '1',
      description: 'Software Development Services',
      quantity: 1,
      unitCode: 'HUR',
      unitPrice: 5000,
      subtotal: 5000,
      taxCategory: {
        taxType: '02',
        taxRate: 8,
        taxableAmount: 5000,
        taxAmount: 400,
      },
    },
  ],
  taxTotal: {
    taxAmount: 400,
    taxSubtotals: [
      { taxableAmount: 5000, taxAmount: 400, taxCategory: { taxType: '02', taxRate: 8 } },
    ],
  },
  legalMonetaryTotal: {
    lineExtensionAmount: 5000,
    taxExclusiveAmount: 5000,
    taxInclusiveAmount: 5400,
    payableAmount: 5400,
  },
};
