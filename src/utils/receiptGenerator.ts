
import { jsPDF } from 'jspdf';
import { Transaction, TransactionType } from '../types';
import { StorageService } from '../services/storage';

export const getSymbols = (pair: string) => {
  if (!pair) return { src: 'USD', tgt: 'DOP', tgtSym: 'RD$' };
  const [src, tgt] = pair.split('_');
  const tgtSym = tgt === 'DOP' ? 'RD$' : '$';
  return { src, tgt, tgtSym };
};

export const generateReceiptPDF = (tx: Transaction) => {
    const { src, tgtSym } = getSymbols(tx.pair);
    const prefs = StorageService.getPreferences();
    
    // Configuración optimizada para POS 80mm - Altura COMPACTA
    const estimatedHeight = 110; 

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, estimatedHeight]
    });

    const pageWidth = 80;
    const margin = 3; 
    const printableWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;
    let y = 6; 

    // Helper para texto con estilos
    const text = (str: string, x: number, style: { align?: "left" | "center" | "right", size?: number, weight?: "normal" | "bold" } = {}) => {
        const { align = "left", size = 9, weight = "normal" } = style;
        doc.setFont("helvetica", weight);
        doc.setFontSize(size);
        doc.text(str, x, y, { align });
    };

    // Helper para líneas separadoras
    const divider = (style: 'solid' | 'dashed' = 'solid') => {
        y += 2;
        doc.setLineWidth(0.1);
        if (style === 'dashed') {
            doc.setLineDashPattern([1, 1], 0); // Punteado fino
        } else {
            doc.setLineDashPattern([], 0);
        }
        doc.line(margin, y, pageWidth - margin, y);
        doc.setLineDashPattern([], 0); // Reset
        y += 4;
    };

    // --- 1. ENCABEZADO (PERSONALIZADO) ---
    // Usamos el nombre del negocio configurado o el default
    const businessName = (prefs.businessName || "DIVISAS PRO").toUpperCase();
    const slogan = prefs.slogan || "Servicios Financieros";

    text(businessName, centerX, { align: "center", size: 12, weight: "bold" });
    y += 5;
    text(slogan, centerX, { align: "center", size: 8 });
    y += 4;
    // Si quisieras agregar dirección o teléfono configurables, se haría aquí
    
    divider('dashed');

    // --- 2. DATOS DEL TICKET ---
    const dateStr = new Date(tx.timestamp).toLocaleDateString();
    const timeStr = new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    text(`${dateStr} - ${timeStr}`, centerX, { align: "center", size: 8 });
    y += 4;
    text(`TICKET NO: ${tx.id.slice(0, 8).toUpperCase()}`, centerX, { align: "center", size: 9, weight: "bold" });
    
    divider('dashed');

    // --- 3. CLIENTE ---
    text("CLIENTE:", margin, { size: 8, weight: "bold" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitName = doc.splitTextToSize(tx.clientName, printableWidth - 15);
    doc.text(splitName, margin + 14, y);
    y += (splitName.length * 4);

    divider('dashed');

    // --- 4. DETALLES DE LA OPERACIÓN ---
    const opType = tx.type === TransactionType.BUY ? "COMPRA" : "VENTA";
    
    text(`${opType} ${src}`, margin, { size: 10, weight: "bold" });
    text(`${tx.amount.toFixed(2)}`, pageWidth - margin, { align: "right", size: 11, weight: "bold" });
    y += 6;

    text("TASA CAMBIO", margin, { size: 9 });
    text(`${tx.rate.toFixed(2)}`, pageWidth - margin, { align: "right", size: 9 });
    y += 8;

    // --- 5. TOTALES (Diseño en Caja) ---
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y - 3, printableWidth, 12, 1, 1, "S");
    
    y += 5; 
    text("TOTAL PAGAR", margin + 3, { size: 10, weight: "bold" });
    text(`${tgtSym} ${tx.total.toLocaleString('es-DO', {minimumFractionDigits: 0, maximumFractionDigits: 2})}`, pageWidth - margin - 3, { align: "right", size: 14, weight: "bold" });
    y += 10;

    // --- 6. PIE DE PÁGINA ---
    y += 4;
    text("Gracias por su preferencia", centerX, { align: "center", size: 9, weight: "bold" });
    y += 4;
    text("*** COPIA CLIENTE ***", centerX, { align: "center", size: 7 });

    doc.save(`Ticket_${tx.id.slice(0,6)}.pdf`);
};

export const shareOnWhatsApp = (tx: Transaction) => {
    const prefs = StorageService.getPreferences();
    const businessName = prefs.businessName || "DIVISAS PRO";
    const { src, tgtSym } = getSymbols(tx.pair);
    
    const text = `*RECIBO - ${businessName}*%0A` +
      `--------------------------------%0A` +
      `📅 Fecha: ${new Date(tx.timestamp).toLocaleDateString()}%0A` +
      `🕒 Hora: ${new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}%0A` +
      `👤 Cliente: ${tx.clientName}%0A` +
      `--------------------------------%0A` +
      `Operación: *${tx.type} ${src}*%0A` +
      `Monto: ${tx.amount} ${src}%0A` +
      `Tasa: ${tx.rate}%0A` +
      `*TOTAL: ${tgtSym} ${tx.total.toLocaleString()}*%0A` +
      `--------------------------------%0A` +
      `Gracias por su preferencia.`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
};
