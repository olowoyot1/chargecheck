"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { analyseRows, rowsFromObjects, type Transaction } from "@/lib/analyzer";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const flagged = useMemo(() => transactions.filter(tx => tx.flags.length), [transactions]);
  const totalDebits = useMemo(() => transactions.reduce((sum, tx) => sum + tx.debit, 0), [transactions]);

  async function handleFile(file?: File) {
    if (!file) return;
    setError(""); setBusy(true); setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let rows: Record<string, unknown>[] = [];
      if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
        if (result.errors.length) throw new Error(result.errors[0].message);
        rows = result.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
        const first = workbook.SheetNames[0];
        if (!first) throw new Error("The workbook has no worksheets.");
        rows = rowsFromObjects(XLSX.utils.sheet_to_json(workbook.Sheets[first], { defval: "" }));
      } else if (ext === "pdf") {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        const lines: string[] = [];
        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
          const page = await pdf.getPage(pageNo);
          const content = await page.getTextContent();
          const parts = content.items.map((item: unknown) => "str" in (item as object) ? String((item as {str:string}).str) : "").filter(Boolean);
          lines.push(...parts);
        }
        throw new Error(lines.length ? "This PDF contains text, but its bank-specific layout needs a matching parser. Please export the statement as CSV or Excel for this first release." : "This appears to be a scanned PDF. Please export it as CSV or Excel; scanned PDF/OCR is not supported yet.");
      } else {
        throw new Error("Supported formats are CSV, XLS and XLSX. PDF text extraction is being added bank by bank.");
      }
      const result = analyseRows(rows);
      if (!result.length) throw new Error("No transactions were detected. Check that the file has columns for date, description/narration, debit and/or credit.");
      setTransactions(result);
    } catch (e) {
      setTransactions([]);
      setError(e instanceof Error ? e.message : "Could not read this file.");
    } finally { setBusy(false); }
  }

  function downloadReport() {
    const content = [
      "OAATZ CHARGECHECK — TRANSACTION REVIEW",
      "This report identifies items for customer review; it does not establish fraud or prove an incorrect debit.",
      "",
      ...transactions.map(tx => [tx.date, tx.description, tx.debit.toFixed(2), tx.credit.toFixed(2), tx.flags.join("; ") || "No automated flag"].join("\t"))
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "chargecheck-review.txt"; a.click(); URL.revokeObjectURL(url);
  }

  return <main>
    <header className="topbar"><a className="brand" href="#"><span className="brandMark">O</span> OAATZ <b>CHARGECHECK</b></a><span className="tag">YOUR MONEY. YOUR RECORDS.</span></header>
    <section className="hero">
      <div className="eyebrow">A clearer view of your bank statement</div>
      <h1>Know what left<br/><em>your account.</em></h1>
      <p>Review transactions, spot possible duplicate debits and organise the details you need to question a charge.</p>
      <label className="upload" htmlFor="statement"><span className="uploadIcon">↑</span><span><strong>{busy ? "Reading your statement…" : "Upload a bank statement"}</strong><small>CSV, Excel or text-based PDF · Processed in this browser</small></span><span className="uploadArrow">→</span></label>
      <input id="statement" type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={e => handleFile(e.target.files?.[0])} hidden/>
      {fileName && <p className="fileName">Selected: {fileName}</p>}
      {error && <p className="error">{error}</p>}
      <div className="privacy"><span>●</span> Your statement is analysed locally in this browser. It is not uploaded to a server.</div>
    </section>
    {transactions.length > 0 && <section className="results">
      <div className="sectionHead"><div><div className="eyebrow">YOUR STATEMENT REVIEW</div><h2>Review findings</h2></div><button onClick={downloadReport}>Export review ↓</button></div>
      <div className="stats"><article><small>Transactions read</small><strong>{transactions.length}</strong></article><article><small>Items to review</small><strong>{flagged.length}</strong></article><article><small>Total debits read</small><strong>₦{totalDebits.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</strong></article></div>
      <div className="tableWrap"><table><thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Review notes</th></tr></thead><tbody>{transactions.map(tx => <tr key={tx.id}><td>{tx.date || "—"}</td><td>{tx.description || "—"}</td><td>{tx.debit ? tx.debit.toLocaleString() : "—"}</td><td>{tx.credit ? tx.credit.toLocaleString() : "—"}</td><td>{tx.flags.length ? tx.flags.map((flag, i) => <span className="flag" key={i}>{flag}</span>) : <span className="clear">No automated flag</span>}</td></tr>)}</tbody></table></div>
    </section>}
    <section className="how"><div className="eyebrow">BUILT FOR CLARITY</div><h2>From confusing debit<br/>to organised evidence.</h2><div className="steps"><article><b>01</b><h3>Import</h3><p>Choose a statement file from your device.</p></article><article><b>02</b><h3>Review</h3><p>See possible duplicates, repeated payments and fee descriptions.</p></article><article><b>03</b><h3>Prepare</h3><p>Export a review summary to support your own bank enquiry.</p></article></div></section>
    <footer><span>OAATZ COSULT LTD</span><span>ChargeCheck is an aid to reviewing records, not a fraud determination or guarantee of recovery.</span></footer>
  </main>;
}