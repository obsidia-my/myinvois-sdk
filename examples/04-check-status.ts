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

  const submissionUid = process.argv[2];
  if (!submissionUid) throw new Error('Usage: tsx examples/04-check-status.ts <submissionUid>');

  const status = await client.getSubmission(submissionUid);
  console.log('Overall status:', status.overallStatus);
  for (const d of status.documentSummary) {
    console.log(`- ${d.internalId} ${d.uuid} → ${d.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
