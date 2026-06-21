import jsPDF from 'jspdf';

export function bookingToPdf(booking: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 40;
  let y = 40;

  doc.setFontSize(18);
  doc.text(`Reserva ${booking.reference || booking.id || ''}`, left, y);
  y += 24;

  doc.setFontSize(12);
  doc.text(`Cliente: ${booking.contact?.email || booking.customer_email || ''}`, left, y);
  y += 18;
  doc.text(`Total: ${booking.total || booking.price || ''} ${booking.currency || 'EUR'}`, left, y);
  y += 18;

  doc.text('Detalles:', left, y);
  y += 16;

  const items = booking.items || [];
  if (items.length) {
    items.forEach((it: any) => {
      doc.text(`- ${it.description} x${it.quantity}  ${it.unit_price}`, left + 10, y);
      y += 14;
      if (y > 740) { doc.addPage(); y = 40; }
    });
  } else if (booking.selected_offer) {
    const offer = booking.selected_offer;
    doc.text(`Oferta: ${offer.id || ''}`, left + 10, y); y += 14;
    if (offer.itineraries) {
      offer.itineraries.forEach((it: any, idx: number) => {
        doc.text(`Itinerario ${idx + 1}: ${JSON.stringify(it).slice(0, 150)}...`, left + 10, y);
        y += 14;
      });
    }
  }

  // Footer
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, left, 780);

  return doc;
}
