/**
 * Input Validation & Sanitization for Production
 * Prevents XSS, data corruption, and invalid entries
 */

// Strip HTML tags from input strings
export function sanitizeString(input: unknown): string | null {
  if (input === null || input === undefined || input === '') return null;
  return String(input)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Enforce maximum length
export function truncate(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

// Sanitize + truncate
export function cleanString(input: unknown, maxLength: number = 500): string | null {
  const sanitized = sanitizeString(input);
  return truncate(sanitized, maxLength);
}

// Parse numeric values safely
export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value));
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
}

// Parse non-negative numbers (for amounts, capacities)
export function parsePositiveNumber(value: unknown): number | null {
  const num = parseNumber(value);
  if (num !== null && num < 0) return 0;
  return num;
}

// Parse date strings safely
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  return date;
}

// Valid ProjectStage enum values
const VALID_STAGES = [
  'LEAD_CAPTURED', 'SURVEY_SCHEDULED', 'SURVEY_COMPLETED',
  'PO_SIGNED', 'INVOICED', 'INC_IN_PROGRESS',
  'PLANT_INSTALLED', 'DOC_SUBMITTED', 'DOC_VERIFIED',
  'METER_SEALING', 'DCR_FILED', 'INST_DETAIL_SUBMITTED',
  'PCR_FILED', 'SUBSIDY_REDEEMED', 'CLOSED',
] as const;

export function isValidStage(stage: string): boolean {
  return VALID_STAGES.includes(stage as any);
}

export function validateStage(stage: unknown, fallback: string = 'LEAD_CAPTURED'): string {
  if (!stage || !isValidStage(String(stage))) return fallback;
  return String(stage);
}

// Validate phone numbers (digits, spaces, +, -, max 20 chars)
export function cleanPhone(input: unknown): string | null {
  const str = sanitizeString(input);
  if (!str) return null;
  // Keep only digits, spaces, +, -, ()
  const cleaned = str.replace(/[^0-9+\-() ]/g, '');
  return truncate(cleaned, 20);
}

// Field-specific limits
export const FIELD_LIMITS = {
  name: 200,
  callingNo: 20,
  mobile: 20,
  caNumber: 30,
  division: 20,
  location: 200,
  sourceOfLead: 100,
  brandModel: 100,
  referral: 200,
  surveyStatus: 50,
  poSigned: 20,
  incStage: 50,
  plantStatus: 100,
  status: 50,
  docSubmitted: 100,
  documentStatus: 100,
  meterTypeSl: 50,
  sealingIndent: 100,
  dcr: 200,
  instDetailSub: 200,
  pcr: 200,
  subsidyRedeem: 200,
} as const;

/**
 * Validate and sanitize a complete project/customer form body.
 * Returns a cleaned object safe for database insertion.
 */
export function validateProjectBody(body: any): {
  customer: {
    name: string | null;
    callingNo: string | null;
    mobile: string | null;
    caNumber: string | null;
    division: string | null;
    location: string | null;
  };
  project: {
    capacity: number | null;
    sourceOfLead: string | null;
    brandModel: string | null;
    referral: string | null;
    amount: number | null;
    balance: number | null;
    stage: string;
    surveyStatus: string | null;
    poSigned: string | null;
    invoiceDate: Date | null;
    incStage: string | null;
    plantStatus: string | null;
    status: string | null;
    docSubmitted: string | null;
    documentStatus: string | null;
    meterTypeSl: string | null;
    sealingIndent: string | null;
    dcr: string | null;
    instDetailSub: string | null;
    pcr: string | null;
    subsidyRedeem: string | null;
  };
  errors: string[];
} {
  const errors: string[] = [];

  const customerName = cleanString(body.name || body.customerName, FIELD_LIMITS.name);
  if (!customerName) {
    errors.push('Customer name is required');
  }

  return {
    customer: {
      name: customerName,
      callingNo: cleanPhone(body.callingNo),
      mobile: cleanPhone(body.mobile),
      caNumber: cleanString(body.caNumber, FIELD_LIMITS.caNumber),
      division: cleanString(body.division, FIELD_LIMITS.division),
      location: cleanString(body.location, FIELD_LIMITS.location),
    },
    project: {
      capacity: parsePositiveNumber(body.capacity),
      sourceOfLead: cleanString(body.sourceOfLead, FIELD_LIMITS.sourceOfLead),
      brandModel: cleanString(body.brandModel, FIELD_LIMITS.brandModel),
      referral: cleanString(body.referral, FIELD_LIMITS.referral),
      amount: parsePositiveNumber(body.amount),
      balance: parsePositiveNumber(body.balance),
      stage: validateStage(body.stage),
      surveyStatus: cleanString(body.surveyStatus, FIELD_LIMITS.surveyStatus),
      poSigned: cleanString(body.poSigned, FIELD_LIMITS.poSigned),
      invoiceDate: parseDate(body.invoiceDate),
      incStage: cleanString(body.incStage, FIELD_LIMITS.incStage),
      plantStatus: cleanString(body.plantStatus, FIELD_LIMITS.plantStatus),
      status: cleanString(body.status, FIELD_LIMITS.status),
      docSubmitted: cleanString(body.docSubmitted, FIELD_LIMITS.docSubmitted),
      documentStatus: cleanString(body.documentStatus, FIELD_LIMITS.documentStatus),
      meterTypeSl: cleanString(body.meterTypeSl, FIELD_LIMITS.meterTypeSl),
      sealingIndent: cleanString(body.sealingIndent, FIELD_LIMITS.sealingIndent),
      dcr: cleanString(body.dcr, FIELD_LIMITS.dcr),
      instDetailSub: cleanString(body.instDetailSub, FIELD_LIMITS.instDetailSub),
      pcr: cleanString(body.pcr, FIELD_LIMITS.pcr),
      subsidyRedeem: cleanString(body.subsidyRedeem, FIELD_LIMITS.subsidyRedeem),
    },
    errors,
  };
}
