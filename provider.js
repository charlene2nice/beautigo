const providers={
 'Amara’s Beauty Studio':{id:null,name:'Amara’s Beauty Studio',initial:'A',rating:4.9,reviews:128,location:'Bonamoussadi, Douala',type:'At professional',address:'Bonamoussadi, Douala',hours:'Mon–Sat · 8:00 AM–6:00 PM',categories:['Hair','Nails'],about:'A warm, modern beauty studio focused on polished everyday looks and special-occasion glam. Amara’s team combines personalised consultations with careful, professional service so every client leaves feeling confident.',services:[['Silk Press','Hair','8,000 FCFA'],['Knotless Braids','Hair','15,000 FCFA'],['Classic Manicure','Nails','5,000 FCFA'],['Gel Manicure','Nails','8,000 FCFA']],photos:['Silk press','Braids','Manicure','Studio glam','Nail art','Client look'],reviewsList:[['Mireille','★★★★★','The service was lovely and professional.'],['Diana','★★★★★','Beautiful work and a very welcoming studio.'],['Sarah','★★★★☆','I loved the final result.']]}
};
const params=new URLSearchParams(location.search); const apiId=params.get('id');
const $=s=>document.querySelector(s);
async function getApiProfile(id){const r=await fetch('/api/professionals/'+encodeURIComponent(id));if(!r.ok)throw new Error('Profile not found');return (await r.json()).professional}
async function init(){
 let p;
 if(apiId){try{const x=await getApiProfile(apiId);p={id:x.id,name:x.businessName,initial:(x.businessName||'B')[0],rating:x.rating,reviews:x.reviewCount,location:x.location,type:x.serviceType,address:x.location,hours:x.hours,categories:x.categories,about:x.bio||'Beauty professional on BeautiGo.',services:x.services.map(s=>[s.name,s.category,`${Number(s.price).toLocaleString()} FCFA`,s.id]),photos:x.portfolio,reviewsList:x.reviews.map(r=>[r.customer,'★'.repeat(r.rating)+'☆'.repeat(5-r.rating),r.comment])};}catch(e){p=providers['Amara’s Beauty Studio']}} else {const key=params.get('name')||'Amara’s Beauty Studio';p=providers[key]||providers['Amara’s Beauty Studio']}
 $('#avatar').textContent=p.initial;$('#name').textContent=p.name;$('#rating').textContent='★ '+(p.rating||'New');$('#reviews').textContent=(p.reviews||0)+' reviews';$('#location').textContent=p.location;$('#about').textContent=p.about;$('#serviceType').textContent=p.type;$('#hours').textContent=p.hours;$('#address').textContent=p.address;$('#bookProvider').textContent=p.name.split(' ')[0]+'’s';$('#reviewSummary').textContent=p.reviews?`★ ${p.rating} average from ${p.reviews} reviews`:'New on BeautiGo';
 $('#chips').innerHTML=p.categories.map(x=>`<span>${x}</span>`).join('');
 $('#services').innerHTML=p.services.map(x=>`<div class="service-row"><div><h4>${x[0]}</h4><small>${x[1]}</small></div><span class="price">${x[2]}</span></div>`).join('');
 $('#portfolioCount').textContent=`${p.photos.length} photo${p.photos.length===1?'':'s'}`;
 $('#portfolio').innerHTML=p.photos.map(x=>{const label=typeof x==='string'?x:(x.caption||'My work');const bg=typeof x==='string'?'':` style="background-image:url('${x.image}');background-size:cover;background-position:center"`;return `<div class="portfolio-item"${bg}><span>${label}</span></div>`}).join('');
 $('#reviewList').innerHTML=p.reviewsList.map(r=>`<article class="review"><div class="review-head"><span class="reviewer">${r[0]}</span><span class="stars">${r[1]}</span></div><p>${r[2]}</p></article>`).join('');
 $('#serviceSelect').innerHTML=p.services.map(x=>`<option value="${x[0]}" data-service-id="${x[3]||''}">${x[0]} — ${x[2]}</option>`).join('');
 const date=$('#dateSelect');const today=new Date();date.min=today.toISOString().split('T')[0];date.value=date.min;
 const times=['9:00 AM','10:30 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM'];let selected=times[0];
 function renderSlots(){ $('#slots').innerHTML=times.map(t=>`<button class="slot ${t===selected?'selected':''}" data-time="${t}">${t}</button>`).join('');document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{selected=b.dataset.time;renderSlots()}) } renderSlots();
 $('#bookTop').onclick=()=>$('#bookingCard').scrollIntoView({behavior:'smooth',block:'center'});
 $('#messageBtn').onclick=()=>alert(`Messaging ${p.name} will be available after you log in.`);
 $('#continueBtn').onclick=()=>{const chosen=p.services.find(x=>x[0]===$('#serviceSelect').value)||p.services[0];const opt=$('#serviceSelect').selectedOptions[0];const url='booking.html?'+new URLSearchParams({provider:p.name,service:chosen[0],category:chosen[1],price:chosen[2],serviceId:opt?.dataset.serviceId||'',professionalId:p.id||'',date:date.value,time:selected,location:p.location,type:p.type,initial:p.initial}).toString();window.location.href=url;};
 $('#moreReviews').onclick=()=>alert('More customer reviews will load here when additional reviews are available.');
}
init();
