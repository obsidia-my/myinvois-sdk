/**
 * Integration tests against the MyInvois sandbox.
 * Run with:  MYINVOIS_SANDBOX=true npm run test:integration
 *
 * Required env vars:
 *   MYINVOIS_CLIENT_ID      — your sandbox client ID
 *   MYINVOIS_CLIENT_SECRET  — your sandbox client secret
 *   MYINVOIS_TIN            — your taxpayer TIN (e.g. C20830570210)
 *   MYINVOIS_CERT_PATH      — path to PEM certificate file
 *   MYINVOIS_KEY_PATH       — path to PEM private key file
 */
import fs from 'node:fs';
import { MyInvoisClient } from '../../src';

const SANDBOX = process.env['MYINVOIS_SANDBOX'] === 'true';

function skipUnless(condition: boolean): jest.It {
  return condition ? it : it.skip;
}

function makeClient(): MyInvoisClient {
  const certPath = process.env['MYINVOIS_CERT_PATH'] ?? 'cert.pem';
  const keyPath = process.env['MYINVOIS_KEY_PATH'] ?? 'key.pem';
  return new MyInvoisClient({
    environment: 'sandbox',
    clientId: process.env['MYINVOIS_CLIENT_ID'] ?? '',
    clientSecret: process.env['MYINVOIS_CLIENT_SECRET'] ?? '',
    tin: process.env['MYINVOIS_TIN'] ?? '',
    certificate: {
      cert: fs.readFileSync(certPath, 'utf8'),
      privateKey: fs.readFileSync(keyPath, 'utf8'),
    },
    debug: true,
  });
}

describe('MyInvois Sandbox', () => {
  let client: MyInvoisClient;
  let submissionUid: string;
  let documentUuid: string;

  beforeAll(() => {
    if (SANDBOX) client = makeClient();
  });

  skipUnless(SANDBOX)('authenticates and gets document types', async () => {
    const { result } = await client.getDocumentTypes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  skipUnless(SANDBOX)('submits a valid invoice and receives submission UID', async () => {
    const invoice = client
      .invoice()
      .id(`INV-TEST-${Date.now()}`)
      .issueDate(new Date().toISOString().slice(0, 10))
      .issueTime('00:00:00Z')
      .currency('MYR')
      .supplier({
        tin: process.env['MYINVOIS_TIN'] ?? '',
        identificationNumber: process.env['MYINVOIS_BRN'] ?? '202001234567',
        identificationType: 'BRN',
        name: 'Test Supplier Sdn Bhd',
        address: {
          addressLines: ['No. 1, Jalan Test'],
          cityName: 'Kuala Lumpur',
          postalZone: '50000',
          countrySubentityCode: '14',
          countryCode: 'MYS',
        },
        msicCode: '62010',
        businessActivityDescription: 'Computer programming activities',
      })
      .buyer({
        tin: 'EI00000000010',
        identificationNumber: 'EI00000000010',
        identificationType: 'BRN',
        name: 'General Public',
        address: {
          addressLines: ['N/A'],
          cityName: 'Kuala Lumpur',
          postalZone: '50000',
          countrySubentityCode: '14',
          countryCode: 'MYS',
        },
      })
      .addLine({
        id: '1',
        description: 'Test Service',
        quantity: 1,
        unitCode: 'HUR',
        unitPrice: 100,
        subtotal: 100,
        taxCategory: {
          taxType: '06',
          taxRate: 0,
          taxableAmount: 100,
          taxAmount: 0,
        },
      })
      .totals({
        lineExtensionAmount: 100,
        taxExclusiveAmount: 100,
        taxInclusiveAmount: 100,
        payableAmount: 100,
      })
      .build();

    const result = await client.submit(invoice);
    submissionUid = result.submissionUid;
    expect(typeof submissionUid).toBe('string');
    expect(submissionUid.length).toBeGreaterThan(0);
    /* eslint-disable no-console */
    console.log('Submission UID:', submissionUid);
    console.log('Accepted:', result.acceptedDocuments);
    console.log('Rejected:', result.rejectedDocuments);
    /* eslint-enable no-console */
  });

  skipUnless(SANDBOX)('polls submission status until settled', async () => {
    // Give LHDN up to 30s to process.
    let status = await client.getSubmission(submissionUid);
    let attempts = 0;
    while (status.overallStatus === 'in progress' && attempts < 10) {
      await new Promise((r) => setTimeout(r, 3000));
      status = await client.getSubmission(submissionUid);
      attempts++;
    }
    // eslint-disable-next-line no-console
    console.log('Final status:', status.overallStatus);
    expect(['valid', 'partially valid', 'invalid']).toContain(status.overallStatus);
    if (status.documentSummary[0] !== undefined) {
      documentUuid = status.documentSummary[0].uuid;
    }
  });

  skipUnless(SANDBOX)('retrieves document details by UUID', async () => {
    if (!documentUuid) return;
    const details = await client.getDocumentDetails(documentUuid);
    expect(details.uuid).toBe(documentUuid);
  });

  skipUnless(SANDBOX)('lists recent documents', async () => {
    const list = await client.getRecentDocuments({ direction: 'sent', pageSize: 5 });
    expect(Array.isArray(list.result)).toBe(true);
  });

  skipUnless(SANDBOX)('cancels the submitted document', async () => {
    if (!documentUuid) return;
    await expect(client.cancelDocument(documentUuid, 'Integration test cleanup')).resolves.not.toThrow();
  });
});
