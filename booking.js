const q=new URLSearchParams(location.search);
const fallback={provider:'Amara’s Beauty Studio',service:'Silk Press',category:'Hair',price:'8,000 FCFA',serviceId:'',date:'',time:'9:00 AM',location:'Bonamoussadi, Douala',type:'At professional',initial:'A'};
const b={...fallback,...Object.fromEntries(q.entries())}; const $=s=>document.querySelector(s);
function set(id,value){const el=$(id);if(el)el.textContent=value||'—'}
set('#providerName',b.provider);set('#serviceName',b.service);set('#serviceCategory',b.category);set('#timeValue',b.time);set('#locationValue',b.location);set('#serviceType',b.type);set('#summaryProvider',b.provider);set('#summaryLocation',b.location);set('#summaryService',b.service);set('#summaryPrice',b.price);set('#summaryTime',b.time);set('#totalPrice',b.price);set('#initial',b.initial||b.provider.charAt(0));
const dateText=b.date?new Date(b.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):'Select date';set('#dateValue',dateText);set('#summaryDate',dateText);
const providerUrl='provider.html?'+(b.serviceId?`id=${encodeURIComponent(new URLSearchParams(location.search).get('professionalId')||'')}`:`name=${encodeURIComponent(b.provider)}`);$('#backLink').href=providerUrl;$('#changeLink').href=providerUrl;
$('#bookingForm').addEventListener('submit',async e=>{e.preventDefault();
 const data={...b,name:$('#fullName').value.trim(),phone:$('#phone').value.trim(),email:$('#email').value.trim(),contact:$('#contact').value,notes:$('#notes').value.trim(),date:b.date,time:b.time};
 try{
  const meRes=await fetch('/api/me',{credentials:'same-origin'}); const me=await meRes.json();
  if(!meRes.ok||me.user.type!=='customer'){alert('Please log in as a customer before confirming a booking.');location.href='login.html';return}
  if(!b.serviceId){alert('This demo provider does not yet have a database service attached. Use the seeded demo professional or create a professional account.');return}
  const res=await fetch('/api/bookings',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceId:Number(b.serviceId),date:b.date,time:b.time,notes:data.notes})});
  const out=await res.json(); if(!res.ok)throw new Error(out.error||'Booking could not be created.');
  sessionStorage.setItem('beautigoBooking',JSON.stringify({...data,bookingCode:out.booking.bookingCode}));
  window.location.href='confirmation.html?'+new URLSearchParams({provider:b.provider,service:b.service,price:b.price,date:b.date,time:b.time,location:b.location,name:data.name,bookingCode:out.booking.bookingCode}).toString();
 }catch(err){alert(err.message)}
});
