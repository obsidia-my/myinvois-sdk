import type { BaseDocument, Party, InvoiceLine } from '../types/common';

const NS_INVOICE = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
const NS_CAC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
const NS_CBC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

function escape(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function el(tag: string, content: string, attrs: Record<string, string> = {}): string {
  const a = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${escape(v)}"`)
    .join('');
  return `<${tag}${a}>${content}</${tag}>`;
}

function cbc(tag: string, value: string | number, attrs: Record<string, string> = {}): string {
  return el(`cbc:${tag}`, escape(value), attrs);
}

function cac(tag: string, content: string): string {
  return el(`cac:${tag}`, content);
}

export class XmlSerialiser {
  // Serialise without signature (for use as input to the signer).
  serialise(doc: BaseDocument): string {
    return this.serialiseWithSignature(doc, undefined);
  }

  // Serialise with UBLExtensions and cac:Signature blocks embedded.
  serialiseWithSignature(doc: BaseDocument, ublExtensionsXml: string | undefined): string {
    const currency = doc.currencyCode;
    const inner =
      (ublExtensionsXml ?? '') +
      cbc('ID', doc.id) +
      cbc('IssueDate', doc.issueDate) +
      cbc('IssueTime', doc.issueTime) +
      cbc('InvoiceTypeCode', doc.invoiceTypeCode ?? '01', { listVersionID: '1.1' }) +
      cbc('DocumentCurrencyCode', currency) +
      (doc.taxCurrencyCode ? cbc('TaxCurrencyCode', doc.taxCurrencyCode) : '') +
      (doc.note ? cbc('Note', doc.note) : '') +
      (doc.billingReference
        ? cac(
            'BillingReference',
            cac(
              'InvoiceDocumentReference',
              cbc('ID', doc.billingReference.invoiceDocumentReferenceId) +
                cbc('UUID', doc.billingReference.uuid),
            ),
          )
        : '') +
      (ublExtensionsXml !== undefined
        ? '<cac:Signature>' +
          '<cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>' +
          '<cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>' +
          '</cac:Signature>'
        : '') +
      cac('AccountingSupplierParty', cac('Party', this.party(doc.supplier))) +
      cac('AccountingCustomerParty', cac('Party', this.party(doc.buyer))) +
      (doc.paymentMeans
        ? cac(
            'PaymentMeans',
            cbc('PaymentMeansCode', doc.paymentMeans.paymentMeansCode) +
              (doc.paymentMeans.paymentDueDate
                ? cbc('PaymentDueDate', doc.paymentMeans.paymentDueDate)
                : '') +
              (doc.paymentMeans.payeeFinancialAccountId
                ? cac(
                    'PayeeFinancialAccount',
                    cbc('ID', doc.paymentMeans.payeeFinancialAccountId),
                  )
                : ''),
          )
        : '') +
      (doc.paymentTerms ? cac('PaymentTerms', cbc('Note', doc.paymentTerms)) : '') +
      cac(
        'TaxTotal',
        cbc('TaxAmount', doc.taxTotal.taxAmount, { currencyID: currency }) +
          doc.taxTotal.taxSubtotals
            .map((s) =>
              cac(
                'TaxSubtotal',
                cbc('TaxableAmount', s.taxableAmount, { currencyID: currency }) +
                  cbc('TaxAmount', s.taxAmount, { currencyID: currency }) +
                  cac(
                    'TaxCategory',
                    cbc('ID', s.taxCategory.taxType) +
                      cbc('Percent', s.taxCategory.taxRate) +
                      cac('TaxScheme', cbc('ID', 'OTH', { schemeID: 'UN/ECE 5153' })),
                  ),
              ),
            )
            .join(''),
      ) +
      cac(
        'LegalMonetaryTotal',
        cbc('LineExtensionAmount', doc.legalMonetaryTotal.lineExtensionAmount, {
          currencyID: currency,
        }) +
          cbc('TaxExclusiveAmount', doc.legalMonetaryTotal.taxExclusiveAmount, {
            currencyID: currency,
          }) +
          cbc('TaxInclusiveAmount', doc.legalMonetaryTotal.taxInclusiveAmount, {
            currencyID: currency,
          }) +
          cbc('PayableAmount', doc.legalMonetaryTotal.payableAmount, {
            currencyID: currency,
          }),
      ) +
      doc.lines.map((l) => cac('InvoiceLine', this.line(l, currency))).join('');

    const attrs = `xmlns="${NS_INVOICE}" xmlns:cac="${NS_CAC}" xmlns:cbc="${NS_CBC}"`;
    return `<?xml version="1.0" encoding="UTF-8"?><Invoice ${attrs}>${inner}</Invoice>`;
  }

  private party(p: Party): string {
    const ids = [
      cac('PartyIdentification', cbc('ID', p.tin, { schemeID: 'TIN' })),
      cac(
        'PartyIdentification',
        cbc('ID', p.identificationNumber, { schemeID: p.identificationType }),
      ),
      ...(p.sst ? [cac('PartyIdentification', cbc('ID', p.sst, { schemeID: 'SST' }))] : []),
      ...(p.ttx ? [cac('PartyIdentification', cbc('ID', p.ttx, { schemeID: 'TTX' }))] : []),
    ].join('');

    const address = cac(
      'PostalAddress',
      p.address.addressLines.map((line) => cac('AddressLine', cbc('Line', line))).join('') +
        cbc('CityName', p.address.cityName) +
        cbc('PostalZone', p.address.postalZone) +
        cbc('CountrySubentityCode', p.address.countrySubentityCode) +
        cac(
          'Country',
          cbc('IdentificationCode', p.address.countryCode, {
            listID: 'ISO3166-1',
            listAgencyID: '6',
          }),
        ),
    );

    const legalEntity = cac('PartyLegalEntity', cbc('RegistrationName', p.name));

    const industry = p.msicCode
      ? cbc('IndustryClassificationCode', p.msicCode, {
          name: p.businessActivityDescription ?? '',
        })
      : '';

    const contact = p.contact
      ? cac(
          'Contact',
          (p.contact.telephone ? cbc('Telephone', p.contact.telephone) : '') +
            (p.contact.email ? cbc('ElectronicMail', p.contact.email) : ''),
        )
      : '';

    return ids + address + legalEntity + industry + contact;
  }

  private line(l: InvoiceLine, currency: string): string {
    return (
      cbc('ID', l.id) +
      cbc('InvoicedQuantity', l.quantity, { unitCode: l.unitCode }) +
      cbc('LineExtensionAmount', l.subtotal, { currencyID: currency }) +
      cac(
        'TaxTotal',
        cbc('TaxAmount', l.taxCategory.taxAmount, { currencyID: currency }) +
          cac(
            'TaxSubtotal',
            cbc('TaxableAmount', l.taxCategory.taxableAmount, { currencyID: currency }) +
              cbc('TaxAmount', l.taxCategory.taxAmount, { currencyID: currency }) +
              cac(
                'TaxCategory',
                cbc('ID', l.taxCategory.taxType) +
                  cbc('Percent', l.taxCategory.taxRate) +
                  (l.taxCategory.exemptionReason
                    ? cbc('TaxExemptionReason', l.taxCategory.exemptionReason)
                    : '') +
                  cac('TaxScheme', cbc('ID', 'OTH', { schemeID: 'UN/ECE 5153' })),
              ),
          ),
      ) +
      cac(
        'Item',
        cbc('Description', l.description) +
          (l.classificationCode
            ? cac(
                'CommodityClassification',
                cbc('ItemClassificationCode', l.classificationCode, { listID: 'CLASS' }),
              )
            : '') +
          (l.originCountry
            ? cac(
                'OriginCountry',
                cbc('IdentificationCode', l.originCountry, { listID: 'ISO3166-1' }),
              )
            : ''),
      ) +
      cac('Price', cbc('PriceAmount', l.unitPrice, { currencyID: currency }))
    );
  }
}
