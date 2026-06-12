import type { BaseDocument, Party, InvoiceLine } from '../types/common';
import { VALID_STATE_CODES } from '../../codes/state-codes';

export interface DocumentValidationFailure {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: DocumentValidationFailure[];
  warnings: DocumentValidationFailure[];
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}:\d{2}Z$/;
const POSTCODE_REGEX = /^\d{5}$/;
const MSIC_REGEX = /^\d{5}$/;

export class DocumentValidator {
  validate(doc: BaseDocument): ValidationResult {
    const errors: DocumentValidationFailure[] = [];
    const warnings: DocumentValidationFailure[] = [];

    if (!doc.id) errors.push({ path: 'id', message: 'Document id is required' });
    if (!DATE_REGEX.test(doc.issueDate)) {
      errors.push({ path: 'issueDate', message: 'issueDate must be YYYY-MM-DD' });
    }
    if (!TIME_REGEX.test(doc.issueTime)) {
      errors.push({ path: 'issueTime', message: 'issueTime must be HH:MM:SSZ (UTC)' });
    }
    if (!doc.currencyCode) {
      errors.push({ path: 'currencyCode', message: 'currencyCode is required' });
    }
    if (doc.currencyCode && doc.currencyCode !== 'MYR' && doc.exchangeRate == null) {
      errors.push({
        path: 'exchangeRate',
        message: 'exchangeRate is required when currencyCode is not MYR (effective 1 Sep 2025)',
      });
    }

    this.validateParty(doc.supplier, 'supplier', errors);
    this.validateParty(doc.buyer, 'buyer', errors);

    if (!doc.lines || doc.lines.length === 0) {
      errors.push({ path: 'lines', message: 'At least one invoice line is required' });
    } else {
      doc.lines.forEach((line, i) => this.validateLine(line, `lines[${i}]`, errors, warnings));
    }

    this.validateTotals(doc, errors);

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateParty(p: Party | undefined, path: string, errors: DocumentValidationFailure[]): void {
    if (!p) {
      errors.push({ path, message: `${path} is required` });
      return;
    }
    if (!p.tin) errors.push({ path: `${path}.tin`, message: 'TIN is required' });
    if (!p.name) errors.push({ path: `${path}.name`, message: 'Name is required' });
    if (!p.identificationNumber) {
      errors.push({ path: `${path}.identificationNumber`, message: 'Identification number is required' });
    }
    const a = p.address;
    if (!a) {
      errors.push({ path: `${path}.address`, message: 'Address is required' });
      return;
    }
    if (!a.addressLines || a.addressLines.length === 0) {
      errors.push({ path: `${path}.address.addressLines`, message: 'At least one address line is required' });
    } else if (a.addressLines.length > 3) {
      errors.push({ path: `${path}.address.addressLines`, message: 'Maximum 3 address lines' });
    }
    if (!a.cityName) errors.push({ path: `${path}.address.cityName`, message: 'cityName is required' });
    if (!POSTCODE_REGEX.test(a.postalZone || '')) {
      errors.push({ path: `${path}.address.postalZone`, message: 'postalZone must be 5 digits' });
    }
    if (a.countrySubentityCode === '00') {
      errors.push({
        path: `${path}.address.countrySubentityCode`,
        message: "State code '00' is no longer valid",
      });
    } else if (!(VALID_STATE_CODES as readonly string[]).includes(a.countrySubentityCode)) {
      errors.push({
        path: `${path}.address.countrySubentityCode`,
        message: `Unknown state code '${a.countrySubentityCode}'`,
      });
    }
    if (!a.countryCode) {
      errors.push({ path: `${path}.address.countryCode`, message: 'countryCode is required' });
    }
    if (p.msicCode && !MSIC_REGEX.test(p.msicCode)) {
      errors.push({ path: `${path}.msicCode`, message: 'msicCode must be 5 digits' });
    }
  }

  private validateLine(
    line: InvoiceLine,
    path: string,
    errors: DocumentValidationFailure[],
    _warnings: DocumentValidationFailure[],
  ): void {
    if (!line.id) errors.push({ path: `${path}.id`, message: 'Line id is required' });
    if (!line.description) errors.push({ path: `${path}.description`, message: 'description is required' });
    if (line.quantity == null || line.quantity <= 0) {
      errors.push({ path: `${path}.quantity`, message: 'quantity must be positive' });
    }
    if (line.unitPrice == null || line.unitPrice < 0) {
      errors.push({ path: `${path}.unitPrice`, message: 'unitPrice must be non-negative' });
    }
    const expectedSubtotal = round2(line.quantity * line.unitPrice);
    if (Math.abs(expectedSubtotal - line.subtotal) > 0.01) {
      errors.push({
        path: `${path}.subtotal`,
        message: `subtotal mismatch: expected ${expectedSubtotal} (quantity * unitPrice), got ${line.subtotal}`,
      });
    }
    if (line.taxCategory) {
      if (line.taxCategory.taxType === 'E' && !line.taxCategory.exemptionReason) {
        errors.push({
          path: `${path}.taxCategory.exemptionReason`,
          message: 'exemptionReason is required when taxType is E (Exempt)',
        });
      }
    } else {
      errors.push({ path: `${path}.taxCategory`, message: 'taxCategory is required' });
    }
  }

  private validateTotals(doc: BaseDocument, errors: DocumentValidationFailure[]): void {
    if (!doc.legalMonetaryTotal) {
      errors.push({ path: 'legalMonetaryTotal', message: 'legalMonetaryTotal is required' });
      return;
    }
    const lineSum = round2(doc.lines.reduce((sum, l) => sum + l.subtotal, 0));
    if (Math.abs(lineSum - doc.legalMonetaryTotal.lineExtensionAmount) > 0.01) {
      errors.push({
        path: 'legalMonetaryTotal.lineExtensionAmount',
        message: `lineExtensionAmount mismatch: expected sum of line subtotals (${lineSum}), got ${doc.legalMonetaryTotal.lineExtensionAmount}`,
      });
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
