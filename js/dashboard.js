const BACKEND_URL = "https://zsti2.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/invoice/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.querySelector("#invoiceTable tbody");
    tbody.innerHTML = '';

    data.forEach(inv => {
      const tr = document.createElement('tr');
      const total = inv.invoice.items.reduce(
        (sum, i) => sum + i.quantity * i.price_net * (1 + i.vat / 100),
        0
      ).toFixed(2);

      tr.innerHTML = `
        <td>${inv.invoice.number}</td>
        <td>${inv.invoice.issue_date}</td>
        <td>${inv.invoice.buyer.company}</td>
        <td>${total} zł</td>
        <td><button class="btn" onclick="downloadPDF('${inv.pdf_base64}','${inv.invoice.number}')">Pobierz PDF</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert('Nie udało się pobrać faktur.');
  }
});

// Funkcja pobierania PDF
function downloadPDF(base64, name) {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = `faktura_${name}.pdf`;
  link.click();
}
