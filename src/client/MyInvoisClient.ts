import { TokenManager } from './auth/TokenManager';
import { HttpClient } from './http/HttpClient';
import {
  SubmitDocumentsApi,
  DocumentStateApi,
  DocumentsApi,
  TaxpayerApi,
  type SubmissionResult,
  type SubmissionStatus,
  type DocumentSource,
  type DocumentDetails,
  type DocumentList,
  type SearchDocumentsParams,
  type GetRecentDocumentsParams,
  type IdType,
  type SearchTinParams,
  type TaxpayerInfo,
} from '../api/einvoice';
import {
  DocumentTypesApi,
  NotificationsApi,
  type DocumentType,
  type Notification,
  type NotificationsParams,
} from '../api/platform';
import { InvoiceBuilder } from '../documents/builder/InvoiceBuilder';
import { CreditNoteBuilder } from '../documents/builder/CreditNoteBuilder';
import { DebitNoteBuilder } from '../documents/builder/DebitNoteBuilder';
import { RefundNoteBuilder } from '../documents/builder/RefundNoteBuilder';
import { SelfBilledInvoiceBuilder } from '../documents/builder/SelfBilledInvoiceBuilder';
import { JsonSerialiser } from '../documents/serialiser/JsonSerialiser';
import { XmlSerialiser } from '../documents/serialiser/XmlSerialiser';
import { XadesSigner } from '../documents/signer/XadesSigner';
import { DocumentValidator, type ValidationResult } from '../documents/validator/DocumentValidator';
import { minifyJson } from '../utils/minify';
import { sha256Hex } from '../utils/hash';
import type { BaseDocument } from '../documents/types/common';

export interface MyInvoisClientConfig {
  environment: 'sandbox' | 'production';
  clientId: string;
  clientSecret: string;
  tin: string;
  intermediary?: { tin: string; onBehalfOfTin: string };
  certificate: { cert: string; privateKey: string };
  timeout?: number;
  retries?: number;
  debug?: boolean;
  fetchImpl?: typeof fetch;
}

const SANDBOX = {
  tokenUrl: 'https://preprod.myinvois.hasil.gov.my/connect/token',
  apiBase: 'https://preprod.myinvois.hasil.gov.my',
};
const PRODUCTION = {
  tokenUrl: 'https://myinvois.hasil.gov.my/connect/token',
  apiBase: 'https://myinvois.hasil.gov.my',
};

const MAX_BATCH = 100;

export class MyInvoisClient {
  private readonly tokenManager: TokenManager;
  private readonly http: HttpClient;
  private readonly signer: XadesSigner;
  private readonly jsonSerialiser = new JsonSerialiser();
  private readonly xmlSerialiser = new XmlSerialiser();

  private readonly submitApi: SubmitDocumentsApi;
  private readonly stateApi: DocumentStateApi;
  private readonly docsApi: DocumentsApi;
  private readonly taxpayerApi: TaxpayerApi;
  private readonly documentTypesApi: DocumentTypesApi;
  private readonly notificationsApi: NotificationsApi;

  constructor(private readonly config: MyInvoisClientConfig) {
    const env = config.environment === 'production' ? PRODUCTION : SANDBOX;

    this.tokenManager = new TokenManager({
      tokenUrl: env.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tin: config.intermediary?.tin ?? config.tin,
      ...(config.intermediary ? { onBehalfOfTin: config.intermediary.onBehalfOfTin } : {}),
      ...(config.fetchImpl ? { fetchImpl: config.fetchImpl } : {}),
    });

    this.http = new HttpClient({
      baseUrl: env.apiBase,
      getToken: (): Promise<string> => this.tokenManager.getValidToken(),
      ...(config.timeout !== undefined ? { timeout: config.timeout } : {}),
      ...(config.retries !== undefined ? { retries: config.retries } : {}),
      ...(config.debug !== undefined ? { debug: config.debug } : {}),
      ...(config.fetchImpl ? { fetchImpl: config.fetchImpl } : {}),
      onUnauthorized: (): void => this.tokenManager.invalidate(),
    });

    this.signer = new XadesSigner(config.certificate.cert, config.certificate.privateKey);

    this.submitApi = new SubmitDocumentsApi(this.http);
    this.stateApi = new DocumentStateApi(this.http);
    this.docsApi = new DocumentsApi(this.http);
    this.taxpayerApi = new TaxpayerApi(this.http);
    this.documentTypesApi = new DocumentTypesApi(this.http);
    this.notificationsApi = new NotificationsApi(this.http);
  }

  // Builders
  invoice(): InvoiceBuilder { return new InvoiceBuilder(); }
  creditNote(): CreditNoteBuilder { return new CreditNoteBuilder(); }
  debitNote(): DebitNoteBuilder { return new DebitNoteBuilder(); }
  refundNote(): RefundNoteBuilder { return new RefundNoteBuilder(); }
  selfBilledInvoice(): SelfBilledInvoiceBuilder { return new SelfBilledInvoiceBuilder(); }

  validate(doc: BaseDocument): ValidationResult {
    return new DocumentValidator().validate(doc);
  }

  serialise(doc: BaseDocument, format: 'json' | 'xml' = 'json'): string {
    return format === 'json'
      ? this.jsonSerialiser.serialise(doc)
      : this.xmlSerialiser.serialise(doc);
  }

  // Submission
  async submit(documents: BaseDocument | BaseDocument[]): Promise<SubmissionResult> {
    const docs = Array.isArray(documents) ? documents : [documents];
    if (docs.length > MAX_BATCH) {
      throw new Error(`submit() accepts up to ${MAX_BATCH} documents. Use submitBatch() for larger sets.`);
    }
    const payloads = docs.map((d) => this.encodeDocument(d));
    return this.submitApi.submit({ documents: payloads });
  }

  async submitBatch(documents: BaseDocument[]): Promise<SubmissionResult[]> {
    const results: SubmissionResult[] = [];
    for (let i = 0; i < documents.length; i += MAX_BATCH) {
      const chunk = documents.slice(i, i + MAX_BATCH);
      const r = await this.submit(chunk);
      results.push(r);
    }
    return results;
  }

  cancelDocument(uuid: string, reason: string): Promise<void> {
    return this.stateApi.cancel(uuid, reason);
  }

  rejectDocument(uuid: string, reason: string): Promise<void> {
    return this.stateApi.reject(uuid, reason);
  }

  getSubmission(uid: string): Promise<SubmissionStatus> {
    return this.docsApi.getSubmission(uid);
  }

  getDocument(uuid: string): Promise<DocumentSource> {
    return this.docsApi.getDocument(uuid);
  }

  getDocumentDetails(uuid: string): Promise<DocumentDetails> {
    return this.docsApi.getDocumentDetails(uuid);
  }

  getRecentDocuments(params?: GetRecentDocumentsParams): Promise<DocumentList> {
    return this.docsApi.getRecent(params ?? {});
  }

  searchDocuments(params: SearchDocumentsParams): Promise<DocumentList> {
    return this.docsApi.search(params);
  }

  validateTin(tin: string, idType: IdType, idValue: string): Promise<boolean> {
    return this.taxpayerApi.validateTin(tin, idType, idValue);
  }

  searchTin(params: SearchTinParams): Promise<TaxpayerInfo[]> {
    return this.taxpayerApi.searchTin(params);
  }

  getQrCodeInfo(token: string): Promise<TaxpayerInfo> {
    return this.taxpayerApi.getQrCodeInfo(token);
  }

  getDocumentTypes(): Promise<{ result: DocumentType[] }> {
    return this.documentTypesApi.list();
  }

  getNotifications(params?: NotificationsParams): Promise<{ result: Notification[] }> {
    return this.notificationsApi.list(params ?? {});
  }

  private encodeDocument(doc: BaseDocument): {
    format: 'JSON';
    document: string;
    documentHash: string;
    codeNumber: string;
  } {
    // Two-pass signing:
    // Pass 1 — produce unsigned JSON, sign it.
    const unsignedJson = this.jsonSerialiser.toObject(doc);
    const unsigned = minifyJson(unsignedJson);
    const signed = this.signer.sign({ document: unsigned, format: 'json' });

    // Pass 2 — embed signature into the UBL JSON UBLExtensions structure.
    const ublExtensions = [
      {
        UBLExtension: [
          {
            ExtensionURI: [{ _: 'urn:oasis:names:specification:ubl:dsig:enveloped:xades' }],
            ExtensionContent: [
              {
                'sig:UBLDocumentSignatures': [
                  {
                    _xmlns: {
                      sig: 'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2',
                      sac: 'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2',
                      sbc: 'urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2',
                    },
                    'sac:SignatureInformation': [
                      {
                        'cbc:ID': [{ _: 'urn:oasis:names:specification:ubl:signature:1' }],
                        'sbc:ReferencedSignatureID': [
                          { _: 'urn:oasis:names:specification:ubl:signature:Invoice' },
                        ],
                        // Embed the raw signature XML block as-is (per LHDN SDK reference).
                        Signature: [{ _: signed.signatureXml }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const invoiceArr = unsignedJson['Invoice'] as Array<Record<string, unknown>> | undefined;
    const invoiceEntry = invoiceArr?.[0] ?? {};
    const withSig = {
      ...unsignedJson,
      Invoice: [
        {
          UBLExtensions: ublExtensions,
          ...invoiceEntry,
        },
      ],
    };

    const minified = minifyJson(withSig);
    return {
      format: 'JSON',
      document: Buffer.from(minified, 'utf8').toString('base64'),
      documentHash: sha256Hex(minified),
      codeNumber: doc.id,
    };
  }
}
