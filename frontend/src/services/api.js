export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeoutMs: 30000,
  appName: 'MedAI',
  mockMode: true,
};

export const MAX_REPORT_FILE_SIZE = 10 * 1024 * 1024;

export function formatFileSize(bytes) {
  if (!bytes) {
    return '0 KB';
  }

  const units = ['bytes', 'KB', 'MB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function buildUploadPayload(file) {
  if (!file) {
    return null;
  }

  return {
    fileName: file.name,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    extension: file.name.split('.').pop()?.toLowerCase() || '',
    sizeBytes: file.size,
    sizeLabel: formatFileSize(file.size),
    lastModified: file.lastModified,
    uploadedAt: new Date().toISOString(),
  };
}

export function validateMedicalReportFile(file, maxSize = MAX_REPORT_FILE_SIZE) {
  if (!file) {
    return 'Please select a file to continue.';
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const isAllowedType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');

  if (!isAllowedType) {
    return 'Unsupported file type. Please upload a PDF, JPG, or PNG file.';
  }

  if (file.size > maxSize) {
    return 'File is too large. Maximum size is 10MB.';
  }

  return '';
}

export async function fetchMockReportResult() {
  return Promise.resolve({
    summary: 'Blood Test Report',
    generatedAt: '2025-08-29',
    status: 'Completed',
  });
}

export async function fetchMockAiInsights() {
  return Promise.resolve({
    disclaimer: 'AI-generated explanation for informational purposes only. Consult a qualified healthcare professional.',
  });
}

export async function fetchMockHistory() {
  return Promise.resolve({
    items: [],
  });
}
