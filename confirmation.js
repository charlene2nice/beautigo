const params=new URLSearchParams(location.search);
const saved=JSON.parse(sessionStorage.getItem('beautigoBooking')||'null')||{};
const fallback={provider:'Amara’s Beauty Studio',service:'Silk Press',category:'Hair',price:'8,000 FCFA',date:'',time:'9:00 AM',location:'Bonamoussadi, Douala',type:'At professional',name:'Guest'};
const b={...fallback,...saved,...Object.fromEntries(params.entries())};
const $=s=>document.querySelector(s);
const set=(s,v)=>{const el=$(s);if(el)el.textContent=v||'—'};
function formatDate(v){if(!v)return 'Date not specified';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function makeId(){if(b.bookingCode)return b.bookingCode;const stored=sessionStorage.getItem('beautigoBookingId');if(stored)return stored;const id='BG-DEMO-'+Math.floor(100000+Math.random()*900000);sessionStorage.setItem('beautigoBookingId',id);return id}
const id=makeId();
set('#bookingId',id);set('#bookingIdInline',id);set('#providerName',b.provider);set('#serviceName',b.service);set('#category',b.category);set('#dateValue',formatDate(b.date));set('#timeValue',b.time);set('#locationValue',b.location);set('#serviceType',b.type);set('#price',b.price);set('#customerName',b.name||'Guest');set('#customerEmail',b.email||'Booking details saved');set('#customerInitial',(b.name||'G').trim().charAt(0).toUpperCase());
const providerUrl='provider.html?name='+encodeURIComponent(b.provider);const link=$('#providerLink');if(link)link.href=providerUrl;
$('#copyId')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(id);$('#copyId').textContent='Copied!';setTimeout(()=>$('#copyId').textContent='Copy',1400)}catch(e){$('#copyId').textContent=id}});
$('#printBtn')?.addEventListener('click',()=>window.print());
