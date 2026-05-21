// utils/pdf.js
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const printPDF = async (id) => {
  const el = document.getElementById(id);

  const canvas = await html2canvas(el);
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // thermal size
  });

  pdf.addImage(img, "PNG", 0, 0, 80, 200);
  pdf.save("invoice.pdf");
};