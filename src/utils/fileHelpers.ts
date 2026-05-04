export function getFileCategory(fileName: string, mimeType: string): string {
  const name = fileName.toLowerCase();

  if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mimeType.includes('word') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) return 'docx';
  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) return 'xlsx';
  if (
    mimeType.includes('presentation') ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt')
  ) return 'pptx';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'text/plain' || name.endsWith('.txt')) return 'text';
  return 'unknown';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
