const API_BASE_URL = 'https://beautigo.onrender.com'; // Put your actual Render service URL here

async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate=v=>{if(!v)return 'Date not selected';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',
                                                                                                                           month:'short',year:'numeric'})};
async function load() {
  try {
    const me = JSON.parse(localStorage.getItem('beautigoUser') || 'null');
    if (!me) throw new Error('Please log in with a customer account');

    // Handle case whether me is the user object directly or { user: ... }
    const current = me.user || me;
    if (current.type !== 'customer') throw new Error('Please log in with a customer account');

    const bo = await api(`/api/bookings?user_id=${current.id}`);
    const full = `${current.firstName || ''} ${current.lastName || ''}`.trim();
                          $('#profileName').textContent=full;$('#profileEmail').textContent=current.email||'—';
                          $('#profilePhone').textContent=current.phone||'Add phone number';
                          const initial=(current.firstName||full||'C').charAt(0).toUpperCase();$('#profileAvatar').textContent=initial;$('#profileBtn').textContent=initial;
 const upcoming=bo.bookings.filter(b=>['Pending','Confirmed'].includes(b.status));
                          const past=bo.bookings.filter(b=>['Completed','Cancelled'].includes(b.status));
 $('#upcomingCard').innerHTML=upcoming.length?upcoming.map((b,i)=>`<div class="booking-top">
 <div class="provider-mini"><span class="provider-avatar">${esc((b.provider||'B')[0])}</span>
 <div><strong>${esc(b.provider)}</strong><span>${esc(b.category)} · ${esc(b.service)}</span>
 </div></div><span class="status">${esc(b.status.toUpperCase())}</span></div>
 <div class="booking-details"><div class="detail"><span>Service</span><strong>${esc(b.service)}</strong></div>
 <div class="detail"><span>Date</span><strong>${esc(formatDate(b.date))}</strong></div><div class="detail"><span>Time</span>
 <strong>${esc(b.time)}</strong></div><div class="detail"><span>Total</span><strong>FCFA ${Number(b.price).toLocaleString()}</strong></div></div>
 <div class="booking-actions"><a class="primary-btn" href="confirmation.html?${new URLSearchParams
                                                                               ({provider:b.provider,service:b.service,price:b.price,date:b.date,time:b.time,bookingCode:b.bookingCode}).toString()}">View confirmation</a></div>`).join(''):
  '<div class="empty-state"><h3>No upcoming bookings yet.</h3><p>Find a professional and book your next beauty appointment.</p><a class="primary-btn" href="explore.html">Explore professionals</a></div>';
 const pastEl=document.querySelector('.past-list'); if(pastEl)pastEl.innerHTML=past.length?past.map(b=>`<article class="past-card"><div class="past-date">
 <b>${esc((b.date||'').slice(-2)||'—')}</b><span>${esc((b.date||'').slice(5,7)||'—')}</span></div><div class="past-info">
 <strong>${esc(b.provider)}</strong><span>${esc(b.service)} · ${esc(b.category)}</span><small>${esc(b.status)} · FCFA ${Number(b.price).toLocaleString()}</small></div>${b.status==='Completed'?`<button class="review-btn" data-id="${b.id}" data-provider="${esc(b.provider)}">★ Review</button>`:''}</article>`).join(''):'<p>No booking history yet.</p>';
 document.querySelectorAll('.review-btn').forEach(btn=>btn.addEventListener('click',()=>openReview(btn.dataset.id,btn.dataset.provider)));
 $('#profileBtn').addEventListener('click',()=>$('#profileDropdown').classList.toggle('open'));document.addEventListener('click',e=>{if(!e.target.closest('.profile-menu'))$('#profileDropdown').classList.remove('open')});$('#logoutBtn').addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST'});location.href='login.html'});$('#editProfile').addEventListener('click',()=>alert('Customer profile editing can be connected to PUT /api/me in the next iteration.'));
 }catch(e){alert(e.message);location.href='login.html'}}
let selected=0;
async function openReview(id,provider){selected=0;$('#reviewProvider').textContent=provider;$('#reviewText').value='';document.querySelectorAll('.stars button').forEach(s=>s.classList.remove('active'));document.querySelector('#reviewModal').classList.add('open');$('#submitReview').onclick=async()=>{if(!selected)return alert('Please select a star rating.');try{await api('/api/reviews',{method:'POST',body:JSON.stringify({bookingId:Number(id),rating:selected,comment:$('#reviewText').value.trim()})});$('#reviewModal').classList.remove('open');load()}catch(e){alert(e.message)}}}
$('#closeReview').addEventListener('click',()=>$('#reviewModal').classList.remove('open'));document.querySelector('#reviewModal').addEventListener('click',e=>{if(e.target===document.querySelector('#reviewModal'))document.querySelector('#reviewModal').classList.remove('open')});document.querySelectorAll('.stars button').forEach((s,i)=>s.addEventListener('click',()=>{selected=i+1;document.querySelectorAll('.stars button').forEach((x,j)=>x.classList.toggle('active',j<=i))}));
load();
