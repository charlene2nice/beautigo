async function api(path,options={}){const res=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Request failed');return data}
const $=s=>document.querySelector(s);
let profile=null, bookings=[];
function money(v){return `FCFA ${Number(v||0).toLocaleString()}`}
function escapeHtml(v=''){return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function load(){
  try{const me=await api('/api/me'); if(me.user.type!=='professional') throw new Error('Please log in with a professional account.');
    const [pr,bo]=await Promise.all([api('/api/professionals/me'),api('/api/bookings')]); profile=pr.professional; bookings=bo.bookings; render();
  }catch(e){alert(e.message);location.href='login.html'}
}
function render(){
 const name=profile.businessName||'Your Beauty Business'; $('#welcomeName').textContent=profile.businessName?.split(' ')[0]||'Professional'; $('#sideName').textContent=name; $('#businessName').textContent=name; $('#avatar').textContent=(name[0]||'B').toUpperCase();
 $('#statBookings').textContent=bookings.filter(b=>['Pending','Confirmed'].includes(b.status)).length; $('#bookingBadge').textContent=bookings.length;
 $('#bookingList').innerHTML=bookings.length?bookings.map(b=>`<div class="booking"><div class="datebox"><b>${escapeHtml((b.date||'').slice(-2)||'—')}</b><span>${escapeHtml((b.date||'').slice(5,7)||'DATE')}</span></div><div><strong>${escapeHtml(b.service)}</strong><p>${escapeHtml(b.customer||'Customer')} · ${escapeHtml(b.time)} · ${money(b.price)}</p><div class="booking-actions"><button onclick="manageBooking(${b.id})">${b.status==='Pending'?'Confirm booking →':'Manage booking →'}</button></div></div><span class="status ${b.status==='Pending'?'pending':''}">${escapeHtml(b.status)}</span></div>`).join(''):'<p>No bookings yet. New customer bookings will appear here.</p>';
 $('#serviceList').innerHTML=profile.services.length?profile.services.map(s=>`<article class="service-card"><div class="service-icon">✦</div><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.category)}</p><span class="price">${money(s.price)}</span><button class="text-btn" onclick="deleteService(${s.id})">Remove</button></article>`).join(''):'<p>Add your first service to start receiving bookings.</p>';
 $('#portfolioGrid').innerHTML=profile.portfolio.length?profile.portfolio.map(x=>`<div class="portfolio-item" style="background-image:url('${x.image}');background-size:cover;background-position:center"><span>${escapeHtml(x.caption||'My work')}</span><button class="text-btn" onclick="deletePhoto(${x.id})">Remove</button></div>`).join(''):'<p>Upload photos of your work so customers can see your portfolio.</p>';
 const details=document.querySelectorAll('.profile-details strong'); if(details.length>=5){details[0].textContent=profile.businessName;details[1].textContent=profile.location||'Add your location';details[2].textContent=profile.categories.join(' · ')||'Add categories';details[3].textContent=profile.serviceType;details[4].textContent=profile.hours}
 $('#publicProfile').href=`provider.html?id=${profile.id}`;
}
window.manageBooking=async id=>{const b=bookings.find(x=>x.id===id);if(!b)return;const status=b.status==='Pending'?'Confirmed':(b.status==='Confirmed'?'Completed':'Confirmed');try{await api(`/api/bookings/${id}`,{method:'PATCH',body:JSON.stringify({status})});await load()}catch(e){alert(e.message)}};
window.deleteService=async id=>{if(!confirm('Remove this service?'))return;try{await api(`/api/professionals/me/services/${id}`,{method:'DELETE'});await load()}catch(e){alert(e.message)}};
window.deletePhoto=async id=>{if(!confirm('Remove this portfolio photo?'))return;try{await api(`/api/professionals/me/portfolio/${id}`,{method:'DELETE'});await load()}catch(e){alert(e.message)}};
$('#addService').onclick=async()=>{const name=prompt('Service name (e.g. Gel Manicure)');if(!name)return;const category=prompt('Category (Hair, Nails, Makeup, Barbering, Lashes & Brows, Spa & Skincare)')||'Beauty';const price=prompt('Price in FCFA');if(!price)return;try{await api('/api/professionals/me/services',{method:'POST',body:JSON.stringify({name,category,price,duration:60})});await load()}catch(e){alert(e.message)}};
$('#addPhoto').onclick=()=>$('#photoInput').click();
$('#photoInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;const fd=new FormData();fd.append('image',file);fd.append('caption',prompt('Caption for this photo (optional)')||'My work');try{await api('/api/professionals/me/portfolio',{method:'POST',body:fd});e.target.value='';await load()}catch(err){alert(err.message)}};
$('#editProfile').onclick=async()=>{const businessName=prompt('Business/professional name',profile.businessName);if(!businessName)return;const location=prompt('Location',profile.location);const serviceType=prompt('Service type (At professional / Mobile / Both)',profile.serviceType);const cats=prompt('Categories separated by commas',profile.categories.join(', '));const bio=prompt('Short bio',profile.bio);try{await api('/api/professionals/me',{method:'PUT',body:JSON.stringify({businessName,location,serviceType,categories:cats.split(',').map(x=>x.trim()).filter(Boolean),bio})});await load()}catch(e){alert(e.message)}};
$('#replyBtn').onclick=()=>alert('Messaging can be connected to the same database using a messages table in the next production phase.');
$('#markRead').onclick=e=>{e.target.textContent='All read ✓';e.target.style.color='#39794a'};
$('#logoutBtn').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.href='login.html'};
load();
