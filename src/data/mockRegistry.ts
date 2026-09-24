import gstRecords from '../../MOCK-API-main/data/gst.json';
import panRecords from '../../MOCK-API-main/data/pan.json';
import udyamRecords from '../../MOCK-API-main/data/udyam.json';
import mcaRecords from '../../MOCK-API-main/data/mca.json';

export interface MockCompanyRecord {
  gstin?: string;
  pan?: string;
  udyamNumber?: string;
  cin?: string;
  name?: string;
}

export const MOCK_COMPANY_RECORDS: MockCompanyRecord[] = gstRecords.map((gstRecord, index) => ({
  gstin: gstRecord.gstin,
  pan: panRecords[index]?.pan,
  udyamNumber: udyamRecords[index]?.udyam_number,
  cin: mcaRecords[index]?.cin,
  name: gstRecord.legal_name,
}));

const normalizeIdentifier = (value: string | undefined) => value?.trim().toUpperCase() || '';

export const findMockCompanyByIdentifier = (identifier: string, field: keyof MockCompanyRecord) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  return MOCK_COMPANY_RECORDS.find(record => normalizeIdentifier(record[field]) === normalizedIdentifier);
};

export const findMockCompanyConflict = (company: MockCompanyRecord) => {
  const fields: Array<keyof MockCompanyRecord> = ['gstin', 'pan', 'udyamNumber', 'cin'];
  return fields
    .map(field => ({ field, value: company[field] }))
    .find(({ field, value }) => Boolean(value && findMockCompanyByIdentifier(value, field)));
};