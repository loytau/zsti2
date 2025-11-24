const BACKEND_URL = "https://zsti2.onrender.com";

document.getElementById("addItem").addEventListener("click", function(){
  const tbody = document.querySelector("#itemsTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="item_name" required></td>
    <td><input type="text" class="item_unit" value="szt." required></td>
    <td><input type="number" class="item_qty" value="1" min="0" required></td>
    <td><input type="number" class="item_price" value="0" min="0" required></td>
    <td><input type="number" class="item_vat" value="23" min="0" required></td>
    <td><button type="button" class="btn removeItem">X</button></td>`;
  tbody.appendChild(row);
});

document.addEventListener("click", function(e){
  if(e.target.classList.contains("removeItem")){
    e.target.closest("tr").remove();
  }
});

document.getElementById("invoiceForm").addEventListener("submit", function(e){
  e.preventDefault();
  const token = localStorage.getItem('token');
  if(!token){ alert("Nie jesteś zalogowany!"); return; }

  const invoice = {
    number: document.getElementById("invoice_number").value,
    issue_date: document.getElementById("issue_date").value,
    sale_date: document.getElementById("sale_date").value,
    place: document.getElementById("place").value,
    seller: {
      company: document.getElementById("seller_company").value,
      nip: document.getElementById("seller_nip").value,
      street: document.getElementById("seller_street").value,
      postal: document.getElementById("seller_postal").value,
      city: document.getElementById("seller_city").value,
      person: document.getElementById("seller_person").value
    },
    buyer: {
      company: document.getElementById("buyer_company").value,
      nip: document.getElementById("buyer_nip").value,
      street: document.getElementById("buyer_street").value,
      postal: document.getElementById("buyer_postal").value,
      city: document.getElementById("buyer_city").value,
      person: document.getElementById("buyer_person").value
    },
    items: [],
    notes: document.getElementById("notes").value
  };

  const rows = document.querySelectorAll("#itemsTable tbody tr");
  rows.forEach(r => {
    invoice.items.push({
      name: r.querySelector(".item_name").value,
      unit: r.querySelector(".item_unit").value,
      quantity: parseFloat(r.querySelector(".item_qty").value),
      price_net: parseFloat(r.querySelector(".item_price").value),
      vat: parseFloat(r.querySelector(".item_vat").value)
    });
  });

  const body = invoice.items.map((i,index)=>[
    index+1, i.name, i.unit, i.quantity, i.price_net.toFixed(2), 
    (i.quantity*i.price_net).toFixed(2), i.vat+"%", 
    ((i.quantity*i.price_net)*(i.vat/100)).toFixed(2), 
    ((i.quantity*i.price_net)*(1+i.vat/100)).toFixed(2)
  ]);
  body.unshift(["Lp","Nazwa","Jm.","Ilość","Cena netto","Wartość netto","VAT","Kwota VAT","Wartość brutto"]);

  const docDefinition = {
    content:[
      {text:`FAKTURA ${invoice.number}`, style:"header"},
      `Data wystawienia: ${invoice.issue_date}`,
      `Data sprzedaży: ${invoice.sale_date}`,
      `Miejsce wystawienia: ${invoice.place}`,
      {text:" "},
      {text:"Sprzedawca:", bold:true},
      `${invoice.seller.company}, NIP: ${invoice.seller.nip}, ${invoice.seller.street}, ${invoice.seller.postal} ${invoice.seller.city}, Osoba: ${invoice.seller.person}`,
      {text:" "},
      {text:"Nabywca:", bold:true},
      `${invoice.buyer.company}, NIP: ${invoice.buyer.nip}, ${invoice.buyer.street}, ${invoice.buyer.postal} ${invoice.buyer.city}, Osoba: ${invoice.buyer.person}`,
      {text:" "},
      {table:{headerRows:1, widths:["auto","*","auto","auto","auto","auto","auto","auto","auto"], body:body}},
      {text:`Do zapłaty: ${invoice.items.reduce((sum,i)=>sum+i.quantity*i.price_net*(1+i.vat/100),0).toFixed(2)} zł`, bold:true},
      {text:`Uwagi: ${invoice.notes}`}
    ],
    styles:{header:{fontSize:18,bold:true}}
  };

  const pdf = pdfMake.createPdf(docDefinition);
  pdf.download(`faktura_${invoice.number}.pdf`);

  pdf.getBase64(async function(data){
    try {
      const res = await fetch(`${BACKEND_URL}/api/invoice`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({pdf_base64:data, invoice})
      });
      if(res.ok){
        alert("Faktura zapisana!");
        location.href = 'dashboard.html';
      } else {
        alert("Błąd zapisu faktury.");
      }
    } catch(err){
      console.error(err);
      alert("Nie udało się połączyć z serwerem.");
    }
  });
});
