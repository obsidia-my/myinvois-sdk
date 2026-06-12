import type { BaseDocument, Party, InvoiceLine } from '../types/common';

// Produces a UBL 2.1 JSON-alternative document compatible with MyInvois.
// Each field is wrapped in an array per UBL JSON convention.
export class JsonSerialiser {
  serialise(doc: BaseDocument): string {
    return JSON.stringify(this.toObject(doc));
  }

  toObject(doc: BaseDocument): Record<string, unknown> {
    const root = {
      _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents',
      _B: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents',
      Invoice: [this.invoice(doc)],
    } as Record<string, unknown>;
    return root;
  }

  private invoice(doc: BaseDocument): Record<string, unknown> {
    return {
      ID: [{ _: doc.id }],
      IssueDate: [{ _: doc.issueDate }],
      IssueTime: [{ _: doc.issueTime }],
      InvoiceTypeCode: [{ _: doc.invoiceTypeCode ?? '01', listVersionID: '1.1' }],
      DocumentCurrencyCode: [{ _: doc.currencyCode }],
      ...(doc.taxCurrencyCode ? { TaxCurrencyCode: [{ _: doc.taxCurrencyCode }] } : {}),
      ...(doc.note ? { Note: [{ _: doc.note }] } : {}),
      ...(doc.billingReference
        ? {
            BillingReference: [
              {
                InvoiceDocumentReference: [
                  {
                    ID: [{ _: doc.billingReference.invoiceDocumentReferenceId }],
                    UUID: [{ _: doc.billingReference.uuid }],
                  },
                ],
              },
            ],
          }
        : {}),
      AccountingSupplierParty: [{ Party: [this.party(doc.supplier)] }],
      AccountingCustomerParty: [{ Party: [this.party(doc.buyer)] }],
      ...(doc.paymentMeans
        ? {
            PaymentMeans: [
              {
                PaymentMeansCode: [{ _: doc.paymentMeans.paymentMeansCode }],
                ...(doc.paymentMeans.paymentDueDate
                  ? { PaymentDueDate: [{ _: doc.paymentMeans.paymentDueDate }] }
                  : {}),
                ...(doc.paymentMeans.payeeFinancialAccountId
                  ? {
                      PayeeFinancialAccount: [
                        { ID: [{ _: doc.paymentMeans.payeeFinancialAccountId }] },
                      ],
                    }
                  : {}),
              },
            ],
          }
        : {}),
      ...(doc.paymentTerms
        ? { PaymentTerms: [{ Note: [{ _: doc.paymentTerms }] }] }
        : {}),
      TaxTotal: [
        {
          TaxAmount: [{ _: doc.taxTotal.taxAmount, currencyID: doc.currencyCode }],
          TaxSubtotal: doc.taxTotal.taxSubtotals.map((s) => ({
            TaxableAmount: [{ _: s.taxableAmount, currencyID: doc.currencyCode }],
            TaxAmount: [{ _: s.taxAmount, currencyID: doc.currencyCode }],
            TaxCategory: [
              {
                ID: [{ _: s.taxCategory.taxType }],
                Percent: [{ _: s.taxCategory.taxRate }],
                TaxScheme: [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153' }] }],
              },
            ],
          })),
        },
      ],
      LegalMonetaryTotal: [
        {
          LineExtensionAmount: [
            { _: doc.legalMonetaryTotal.lineExtensionAmount, currencyID: doc.currencyCode },
          ],
          TaxExclusiveAmount: [
            { _: doc.legalMonetaryTotal.taxExclusiveAmount, currencyID: doc.currencyCode },
          ],
          TaxInclusiveAmount: [
            { _: doc.legalMonetaryTotal.taxInclusiveAmount, currencyID: doc.currencyCode },
          ],
          PayableAmount: [
            { _: doc.legalMonetaryTotal.payableAmount, currencyID: doc.currencyCode },
          ],
        },
      ],
      InvoiceLine: doc.lines.map((l) => this.line(l, doc.currencyCode)),
    };
  }

  private party(p: Party): Record<string, unknown> {
    return {
      PartyIdentification: [
        { ID: [{ _: p.tin, schemeID: 'TIN' }] },
        { ID: [{ _: p.identificationNumber, schemeID: p.identificationType }] },
        ...(p.sst ? [{ ID: [{ _: p.sst, schemeID: 'SST' }] }] : []),
        ...(p.ttx ? [{ ID: [{ _: p.ttx, schemeID: 'TTX' }] }] : []),
      ],
      PostalAddress: [
        {
          AddressLine: p.address.addressLines.map((l) => ({ Line: [{ _: l }] })),
          CityName: [{ _: p.address.cityName }],
          PostalZone: [{ _: p.address.postalZone }],
          CountrySubentityCode: [{ _: p.address.countrySubentityCode }],
          Country: [
            {
              IdentificationCode: [
                { _: p.address.countryCode, listID: 'ISO3166-1', listAgencyID: '6' },
              ],
            },
          ],
        },
      ],
      PartyLegalEntity: [{ RegistrationName: [{ _: p.name }] }],
      ...(p.msicCode
        ? {
            IndustryClassificationCode: [
              { _: p.msicCode, name: p.businessActivityDescription ?? '' },
            ],
          }
        : {}),
      ...(p.contact
        ? {
            Contact: [
              {
                ...(p.contact.telephone ? { Telephone: [{ _: p.contact.telephone }] } : {}),
                ...(p.contact.email ? { ElectronicMail: [{ _: p.contact.email }] } : {}),
              },
            ],
          }
        : {}),
    };
  }

  private line(l: InvoiceLine, currency: string): Record<string, unknown> {
    return {
      ID: [{ _: l.id }],
      InvoicedQuantity: [{ _: l.quantity, unitCode: l.unitCode }],
      LineExtensionAmount: [{ _: l.subtotal, currencyID: currency }],
      TaxTotal: [
        {
          TaxAmount: [{ _: l.taxCategory.taxAmount, currencyID: currency }],
          TaxSubtotal: [
            {
              TaxableAmount: [{ _: l.taxCategory.taxableAmount, currencyID: currency }],
              TaxAmount: [{ _: l.taxCategory.taxAmount, currencyID: currency }],
              TaxCategory: [
                {
                  ID: [{ _: l.taxCategory.taxType }],
                  Percent: [{ _: l.taxCategory.taxRate }],
                  ...(l.taxCategory.exemptionReason
                    ? { TaxExemptionReason: [{ _: l.taxCategory.exemptionReason }] }
                    : {}),
                  TaxScheme: [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153' }] }],
                },
              ],
            },
          ],
        },
      ],
      Item: [
        {
          Description: [{ _: l.description }],
          ...(l.classificationCode
            ? {
                CommodityClassification: [
                  { ItemClassificationCode: [{ _: l.classificationCode, listID: 'CLASS' }] },
                ],
              }
            : {}),
          ...(l.originCountry
            ? {
                OriginCountry: [
                  { IdentificationCode: [{ _: l.originCountry, listID: 'ISO3166-1' }] },
                ],
              }
            : {}),
        },
      ],
      Price: [{ PriceAmount: [{ _: l.unitPrice, currencyID: currency }] }],
    };
  }
}
