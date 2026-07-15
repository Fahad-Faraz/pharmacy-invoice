/**
 * printReceipt — thermal receipt print (80mm) for POS
 * Browser ka native print dialog use karta hai
 * Printer connect ho to print dialog mein bas Print/Enter press karo
 */
export function printReceipt(elementId) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn("printReceipt: element not found:", elementId);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Print</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
    }
    @media print {
      @page { size: 80mm auto; margin: 3mm 2mm; }
      body { width: 74mm; }
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .lg     { font-size: 14px; }
    .xl     { font-size: 16px; }
    .sm     { font-size: 10px; }
    .divider { border-top: 1px dashed #000; margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { border-bottom: 1px solid #000; padding: 2px 1px; font-weight: bold; }
    td { padding: 1px 1px; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Print error:", e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 3000);
  };
}

/**
 * printA4 — full page invoice / demand list print (A4 size)
 * Existing Tailwind styles use karta hai, page ka sirf target element dikhega
 */
export function printA4(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const style = document.createElement("style");
  style.id = "__print_a4_style";
  style.innerHTML = `
    @media print {
      body * { visibility: hidden; }
      #${elementId}, #${elementId} * { visibility: visible; }
      #${elementId} {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print { display: none !important; }
      @page { size: A4; margin: 12mm; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    const s = document.getElementById("__print_a4_style");
    if (s) document.head.removeChild(s);
  }, 1000);
}

// Legacy alias — purane code mein printPDF import hota hai
export const printPDF = printA4;