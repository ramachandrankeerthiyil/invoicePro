import { useState } from 'react';

export default function Import() {
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: reader.result }),
      });
      setResult(await res.json());
      setBusy(false);
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Import Invoices</h1>

      <div className="card mb-4">
        <p className="text-sm text-gray-500 mb-2">
          CSV columns required: invoice_number, customer_name, amount, invoice_date, due_date, status
        </p>
        <input type="file" accept=".csv" onChange={handleFile} disabled={busy} />
        {fileName && <p className="text-sm text-gray-500 mt-2">Selected: {fileName}</p>}
        {busy && <p className="text-sm text-gray-500 mt-2">Importing…</p>}
      </div>

      {result && !result.error && (
        <div className="card">
          <p className="font-semibold mb-2">Import summary</p>
          <p className="text-sm">Imported: {result.importedCount}</p>
          <p className="text-sm mb-2">Rejected: {result.rejectedCount}</p>
          {result.errors.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-1">Validation errors:</p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {result.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {result && result.error && <p className="text-red-600">{result.error}</p>}
    </div>
  );
}
