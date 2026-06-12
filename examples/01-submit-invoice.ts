import fs from 'node:fs';
import { MyInvoisClient } from '../src';

async function main(): Promise<void> {
  const client = new MyInvoisClient({
    environment: 'sandbox',
    clientId: process.env.MYINVOIS_CLIENT_ID!,
    clientSecret: process.env.MYINVOIS_CLIENT_SECRET!,
    tin: process.env.MYINVOIS_TIN!,
    certificate: {
      cert: fs.readFileSync('cert.pem', 'utf8'),
      privateKey: fs.readFileSync('key.pem', 'utf8'),
    },
  });

  const invoice = client.invoice()
    .id('INV-2024-001')
    .issueDate('2024-01-15')
    .issueTime('08:30:00Z')
    .currency('MYR')
    .supplier({
      tin: 'C20830570210',
      identificationNumber: '202001234567',
      identificationType: 'BRN',
      name: 'My Company Sdn Bhd',
      address: {
        addressLines: ['No. 1, Jalan Example'],
        cityName: 'Kuala Lumpur',
        postalZone: '50000',
        countrySubentityCode: '14',
        countryCode: 'MYS',
      },
    })
    .buyer({
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
    })
    .addLine({
      id: '1',
      description: 'Software Development Services',
      quantity: 1,
      unitCode: 'HUR',
      unitPrice: 5000,
      subtotal: 5000,
      taxCategory: { taxType: '02', taxRate: 8, taxableAmount: 5000, taxAmount: 400 },
    })
    .totals({
      lineExtensionAmount: 5000,
      taxExclusiveAmount: 5000,
      taxInclusiveAmount: 5400,
      payableAmount: 5400,
    })
    .build();

  const result = await client.submit(invoice);
  console.log('Submission UID:', result.submissionUid);
  console.log('Document UUID:', result.acceptedDocuments[0]?.uuid);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
