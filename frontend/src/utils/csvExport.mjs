const columns = [
  ['Visitor', (log) => log.visitor?.name],
  ['Email', (log) => log.visitor?.email],
  ['Pass Token', (log) => log.pass?.qrToken],
  ['Action', (log) => log.action],
  ['Location', (log) => log.location],
  ['Scanned By', (log) => log.scannedBy?.name],
  ['Date', (log) => formatDate(log.createdAt)]
];

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function escapeCsvValue(value) {
  let text = String(value ?? '');

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function createCheckLogsCsv(logs) {
  const rows = [
    columns.map(([heading]) => heading),
    ...logs.map((log) => columns.map(([, getValue]) => getValue(log)))
  ];

  return rows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n');
}

export function downloadCsv(csv, filename) {
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
