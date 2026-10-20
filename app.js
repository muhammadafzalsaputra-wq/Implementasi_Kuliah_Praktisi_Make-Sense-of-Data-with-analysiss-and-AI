const money = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const compact = n => 'Rp ' + new Intl.NumberFormat('id-ID',{notation:'compact',maximumFractionDigits:1}).format(n);
const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
// Dataset simulasi: penjualan naik, tetapi biaya/piutang ikut naik sehingga laba dan kas tertekan.
const monthly = Array.from({length:24},(_,i)=>{
  const m=i%12, year=Math.floor(i/12), t=i;
  const sales=Math.round((820000000 + m*65000000 + year*650000000 + Math.sin(i*1.7)*65000000));
  const operatingCost=Math.round(sales*(0.68 + t*0.0035));
  const discounts=Math.round(sales*(0.035+t*0.0008));
  const otherCost=Math.round(sales*(0.10+t*0.0012));
  const profit=sales-operatingCost-discounts-otherCost;
  const receivables=Math.round(380000000 + t*38000000 + Math.sin(i)*25000000);
  const cash=Math.round(profit - (receivables*.18) + 80000000 - t*5000000);
  return {month:months[m]+' '+(2023+year),sales,profit,receivables,cash,operatingCost,discounts,otherCost};
});
const customers=['Toko Sentosa','CV Berkah Jaya','UD Sumber Rezeki','PT Andalan Niaga','Mitra Sejahtera','Toko Makmur'];
const invoices=Array.from({length:120},(_,i)=>{
  const date=new Date(2024,0,1+i*3);
  const terms=[14,30,45,60][i%4];
  const delay=(i*7 + (i%5)*11)%76 - 8;
  return {id:'INV-'+String(i+1).padStart(4,'0'),customer:customers[i%customers.length],amount:Math.round(1500000+((i*7919)%28000000)),discount:[0,2.5,5,8,null][i%5],terms,daysLate:Math.max(0,delay),valid:i!==22, duplicate:i===35, missing:i%5===4};
});
// Insert a duplicate invoice ID and an invalid negative invoice amount as deliberate quality issues.
invoices[35].id=invoices[34].id;
invoices[22].amount=-250000;
invoices[22].valid=false;
invoices[7].customer='  toko sentosa  ';
function pct(a,b){return b?((a-b)/b*100):0}
function fmtPct(n){return (n>=0?'+':'')+n.toFixed(1).replace('.',',')+'%'}
function fillKpis(){
 const totalSales=monthly.slice(12).reduce((s,d)=>s+d.sales,0), prevSales=monthly.slice(0,12).reduce((s,d)=>s+d.sales,0);
 const profit=monthly.slice(12).reduce((s,d)=>s+d.profit,0), prevProfit=monthly.slice(0,12).reduce((s,d)=>s+d.profit,0);
 const rec=monthly[23].receivables, prevRec=monthly[11].receivables, cash=monthly.slice(12).reduce((s,d)=>s+d.cash,0),prevCash=monthly.slice(0,12).reduce((s,d)=>s+d.cash,0);
 document.querySelector('#sales-kpi').textContent=compact(totalSales);
 document.querySelector('#profit-kpi').textContent=compact(profit);
 document.querySelector('#receivable-kpi').textContent=compact(rec);
 document.querySelector('#cash-kpi').textContent=compact(cash);
 const sets=[['sales-change',pct(totalSales,prevSales)],['profit-change',pct(profit,prevProfit)],['receivable-change',pct(rec,prevRec)],['cash-change',pct(cash,prevCash)]];
 sets.forEach(([id,v])=>{const el=document.getElementById(id);el.textContent=fmtPct(v)+' dibanding periode sebelumnya';el.style.color=v>=0?'#15945b':'#df4753'});
}
let trendChart,yearChart,termsChart;
function buildCharts(){
 const labels=monthly.map(d=>d.month);
 trendChart=new Chart(document.getElementById('trend-chart'),{type:'line',data:{labels,datasets:[
 {label:'Penjualan',data:monthly.map(d=>d.sales/1e9),borderColor:'#2d7ff9',backgroundColor:'#2d7ff9',tension:.3},
 {label:'Laba Bersih',data:monthly.map(d=>d.profit/1e9),borderColor:'#21a66b',backgroundColor:'#21a66b',tension:.3},
 {label:'Piutang',data:monthly.map(d=>d.receivables/1e9),borderColor:'#f59a23',backgroundColor:'#f59a23',tension:.3},
 {label:'Arus Kas',data:monthly.map(d=>d.cash/1e9),borderColor:'#8654d8',backgroundColor:'#8654d8',tension:.3}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{labels:{boxWidth:8,font:{size:10}}}},scales:{y:{ticks:{callback:v=>v+' M'}}}}});
 const sums=[['Penjualan',monthly.slice(0,12).reduce((s,d)=>s+d.sales,0),monthly.slice(12).reduce((s,d)=>s+d.sales,0)],['Laba Bersih',monthly.slice(0,12).reduce((s,d)=>s+d.profit,0),monthly.slice(12).reduce((s,d)=>s+d.profit,0)],['Piutang',monthly[11].receivables,monthly[23].receivables],['Arus Kas',monthly.slice(0,12).reduce((s,d)=>s+d.cash,0),monthly.slice(12).reduce((s,d)=>s+d.cash,0)]];
 yearChart=new Chart(document.getElementById('year-chart'),{type:'bar',data:{labels:sums.map(x=>x[0]),datasets:[{label:'2023',data:sums.map(x=>x[1]/1e9),backgroundColor:'#8db8ff'},{label:'2024',data:sums.map(x=>x[2]/1e9),backgroundColor:'#214fa8'}]},options:{responsive:true,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{ticks:{callback:v=>v+' M'}}}}});
 const terms=[14,30,45,60].map(t=>{const group=invoices.filter(i=>i.terms===t&&i.valid);return {term:t,rate:group.filter(i=>i.daysLate>30).length/Math.max(group.length,1)*100}});
 termsChart=new Chart(document.getElementById('terms-chart'),{type:'bar',data:{labels:terms.map(t=>t.term+' hari'),datasets:[{label:'Faktur terlambat >30 hari (%)',data:terms.map(t=>t.rate),backgroundColor:'#2d7ff9'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}}}});
}
function renderMonthlyTable(){document.querySelector('#monthly-table tbody').innerHTML=monthly.map(d=>`<tr><td>${d.month}</td><td>${money(d.sales)}</td><td>${money(d.profit)}</td><td>${money(d.receivables)}</td><td>${money(d.cash)}</td></tr>`).join('')}
function renderFindings(){
 const salesChange=pct(monthly.slice(12).reduce((s,d)=>s+d.sales,0),monthly.slice(0,12).reduce((s,d)=>s+d.sales,0));
 const profitChange=pct(monthly.slice(12).reduce((s,d)=>s+d.profit,0),monthly.slice(0,12).reduce((s,d)=>s+d.profit,0));
 const recChange=pct(monthly[23].receivables,monthly[11].receivables);
 const cashChange=pct(monthly.slice(12).reduce((s,d)=>s+d.cash,0),monthly.slice(0,12).reduce((s,d)=>s+d.cash,0));
 const items=[['#2d7ff9','Penjualan',`Perubahan tahunan ${fmtPct(salesChange)}. Periksa apakah pertumbuhan menghasilkan margin yang sehat.`],['#e94b5a','Laba bersih',`Perubahan tahunan ${fmtPct(profitChange)}. Tinjau tren biaya dan diskon.`],['#f59a23','Piutang usaha',`Saldo akhir periode berubah ${fmtPct(recChange)}. Periksa umur piutang dan tindak lanjut pembayaran.`],['#8654d8','Arus kas',`Perubahan total tahunan ${fmtPct(cashChange)}. Cocokkan laba dengan penerimaan kas.`]];
 document.querySelector('#findings').innerHTML=items.map(([color,title,desc])=>`<div class="finding"><span class="dot" style="background:${color}"></span><div><b>${title}</b><p>${desc}</p></div></div>`).join('');
 document.querySelector('#insight-text').textContent='Data simulasi menunjukkan bahwa kenaikan penjualan tidak otomatis berarti kondisi keuangan membaik. Perhatikan bersama-sama tren laba, piutang, dan arus kas sebelum mengambil keputusan.';
 document.querySelector('#recommendations').innerHTML=['Evaluasi margin produk dan kebijakan diskon.','Buat daftar umur piutang dan jadwal follow-up.','Tinjau biaya operasional per kategori.','Pantau arus kas secara rutin dan dokumentasikan asumsi.'].map(x=>`<li>${x}</li>`).join('');
}
function renderQuality(){
 const duplicates=invoices.length-new Set(invoices.map(i=>i.id)).size;
 const invalid=invoices.filter(i=>i.amount<=0).length;
 const missing=invoices.filter(i=>i.discount===null).length;
 document.getElementById('raw-count').textContent=invoices.length;
 document.getElementById('duplicate-count').textContent=duplicates;
 document.getElementById('invalid-count').textContent=invalid;
 document.getElementById('missing-count').textContent=missing;
 document.getElementById('quality-notes').innerHTML=[
 `<div class="quality-item"><b>ID duplikat</b>Ditemukan ${duplicates} ID faktur duplikat. Verifikasi ke sumber data sebelum menghapus baris.</div>`,
 `<div class="quality-item"><b>Nilai tidak valid</b>Ditemukan ${invalid} faktur dengan nilai nol/negatif. Perlu pemeriksaan sumber.</div>`,
 `<div class="quality-item"><b>Nilai diskon kosong</b>Ditemukan ${missing} nilai diskon kosong. Jangan otomatis menganggap kosong berarti 0% tanpa konfirmasi.</div>`,
 `<div class="quality-item"><b>Format nama pelanggan</b>Contoh variasi: “Toko Sentosa” dan “ toko sentosa ”. Normalisasi spasi/huruf bisa membantu, tetapi cek identitas pelanggan dulu.</div>`
 ].join('');
}
function renderInvoices(){
 const valid=invoices.filter(i=>i.valid&&i.amount>0);
 const late=valid.filter(i=>i.daysLate>30);
 document.getElementById('invoice-total').textContent=valid.length;
 document.getElementById('late-total').textContent=late.length;
 document.getElementById('late-rate').textContent=(late.length/valid.length*100).toFixed(1).replace('.',',')+'%';
 document.getElementById('invoice-summary').innerHTML=`<p><b>${valid.length}</b> faktur valid pada contoh data.</p><p><b>${late.length}</b> faktur valid terlambat lebih dari 30 hari.</p><p>Persentase ini hanya berlaku pada data simulasi dan tidak dapat digeneralisasi ke perusahaan nyata.</p>`;
 document.querySelector('#invoice-table tbody').innerHTML=valid.slice(0,12).map(i=>`<tr><td>${i.id}</td><td>${i.customer.trim()}</td><td>${money(i.amount)}</td><td>${i.terms}</td><td>${i.daysLate}</td><td><span class="status ${i.daysLate>30?'late':''}">${i.daysLate>30?'Terlambat':'Pantau'}</span></td></tr>`).join('');
}
document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===btn));
 document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===btn.dataset.tab));
 const labels={ringkasan:'Ringkasan Kinerja',analisis:'Analisis Data',kualitas:'Kualitas Data',faktur:'Analisis Faktur',prediksi:'Prediksi & AI'};
 document.getElementById('page-title').textContent=labels[btn.dataset.tab];
}));
document.getElementById('risk-form').addEventListener('submit',e=>{
 e.preventDefault();
 const amount=Number(document.getElementById('amount').value),discount=Number(document.getElementById('discount').value),terms=Number(document.getElementById('terms').value);
 let score=10+(terms-14)*.65+discount*1.7+(amount>=20000000?15:amount>=10000000?8:0);
 score=Math.max(0,Math.min(100,Math.round(score)));
 const level=score>=60?'Tinggi':score>=35?'Sedang':'Rendah';
 const box=document.getElementById('risk-result');box.className='risk-result '+(score>=60?'high':score>=35?'medium':'low');
 box.innerHTML=`<b>Skor prioritas: ${score}/100 — ${level}</b><p>Faktur ini ${score>=60?'sebaiknya dipantau lebih dekat':score>=35?'layak ditinjau dalam pemeriksaan rutin':'dapat mengikuti pemantauan standar'} berdasarkan aturan demonstrasi.</p><p>Skor ini bukan probabilitas gagal bayar dan tidak dilatih dari data historis.</p>`;
});
fillKpis();buildCharts();renderMonthlyTable();renderFindings();renderQuality();renderInvoices();
