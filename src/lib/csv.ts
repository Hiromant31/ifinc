export function csvJoin(rows: string[][]): string {
  let out = '\uFEFF';
  for (let i = 0; i < rows.length; i++) {
    const cells = [];
    for (let j = 0; j < rows[i].length; j++) {
      const c = String(rows[i][j] === null || rows[i][j] === undefined ? '' : rows[i][j]);
      cells.push('"' + c.replace(/"/g, '""') + '"');
    }
    out += cells.join(';');
    if (i < rows.length - 1) out += '\r\n';
  }
  return out;
}

export function downloadCSV(name: string, text: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}