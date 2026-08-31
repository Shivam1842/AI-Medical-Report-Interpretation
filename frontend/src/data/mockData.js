export const mockSummaryStats = [
  { label: 'Total Parameters', value: 24, type: 'normal' },
  { label: 'Normal', value: 18, type: 'normal' },
  { label: 'Abnormal', value: 4, type: 'abnormal' },
  { label: 'Borderline', value: 2, type: 'borderline' },
];

export const mockParameterRows = [
  { name: 'Hemoglobin (Hb)', result: '13.2', unit: 'g/dL', range: '12.0 - 15.5', status: 'Normal' },
  { name: 'WBC Count', result: '11,200', unit: '/µL', range: '4,000 - 10,000', status: 'High' },
  { name: 'Platelet Count', result: '2.45', unit: 'Lakh/µL', range: '1.50 - 4.00', status: 'Normal' },
  { name: 'Blood Sugar (Fasting)', result: '110', unit: 'mg/dL', range: '70 - 100', status: 'High' },
  { name: 'Vitamin D', result: '22', unit: 'ng/mL', range: '30 - 100', status: 'Low' },
];

export const mockExplanations = [
  {
    title: 'WBC Count (High)',
    status: 'High',
    variant: 'high',
    description:
      'Your White Blood Cell count is higher than normal. This may indicate an infection, inflammation, or stress. Consult your doctor for confirmation.',
  },
  {
    title: 'Blood Sugar (High)',
    status: 'High',
    variant: 'warning',
    description:
      'Your fasting blood sugar is slightly above normal range. It could be due to diet, stress, or prediabetes. Maintain a healthy lifestyle and monitor regularly.',
  },
  {
    title: 'Hemoglobin (Normal)',
    status: 'Normal',
    variant: 'normal',
    description:
      'Your hemoglobin level is normal. Good job! Maintain a balanced diet rich in iron.',
  },
];

export const mockReportHistoryRows = [
  { name: 'Blood Test Report', date: '29 Aug 2025', summary: '24 Parameters', status: 'Completed' },
  { name: 'X-Ray Chest', date: '25 Aug 2025', summary: '1 File', status: 'Completed' },
  { name: 'MRI Brain', date: '20 Aug 2025', summary: '1 File', status: 'Completed' },
  { name: 'Lipid Profile', date: '18 Aug 2025', summary: '12 Parameters', status: 'Completed' },
  { name: 'Thyroid Profile', date: '15 Aug 2025', summary: '8 Parameters', status: 'Completed' },
];

export const mockProcessingSteps = [
  { id: 'upload', label: 'Upload', status: 'Completed' },
  { id: 'processing', label: 'Processing', status: 'In Progress' },
  { id: 'analysis', label: 'Analysis', status: 'Pending' },
];

export const mockReportSummary = {
  title: 'Blood Test Report',
  dateLabel: '29 Aug 2025',
  summaryStats: mockSummaryStats,
  parameterRows: mockParameterRows,
};
