const API_BASE ="https://beautigo.onrender.com";
const notice=document.querySelector('#notice');
function showNotice(message,type='error'){if(!notice)return;notice.textContent=message;notice.className=`notice show ${type}`}
async function api(path,options={}){const res=await fetch('${API_BASE}${path}', {credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Something went wrong.');return data}

document.querySelectorAll('.password-toggle').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById(btn.dataset.target);input.type=input.type==='password'?'text':'password';btn.textContent=input.type==='password'?'Show':'Hide'}));

const signup=document.querySelector('#signupForm');
const accountType=document.querySelector('#accountType');
const proFields=document.querySelector('#professionalFields');
function toggleProFields(){if(proFields)proFields.style.display=accountType?.value==='professional'?'block':'none'}
accountType?.addEventListener('change',toggleProFields); toggleProFields();
if(signup)signup.addEventListener('submit',async e=>{e.preventDefault();const password=document.querySelector('#password').value,confirm=document.querySelector('#confirmPassword').value;if(password!==confirm)return showNotice('Passwords do not match. Please check them and try again.');
 const payload={firstName:document.querySelector('#firstName').value.trim(),lastName:document.querySelector('#lastName').value.trim(),email:document.querySelector('#email').value.trim().toLowerCase(),phone:document.querySelector('#phone').value.trim(),type:accountType.value,password};
 if(accountType.value==='professional'){payload.businessName=document.querySelector('#businessName')?.value.trim();payload.professionalType=document.querySelector('#professionalType')?.value}
 try{const data=await api('/api/auth/signup',{method:'POST',body:JSON.stringify(payload)});showNotice('Account created successfully! Redirecting...','success');setTimeout(()=>location.href=data.user.type==='professional'?'professional-dashboard.html':'customer-dashboard.html',500)}catch(err){showNotice(err.message)}});

const login=document.querySelector('#loginForm');
if(login)login.addEventListener('submit',async e=>{e.preventDefault();try{const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:document.querySelector('#email').value.trim().toLowerCase(),password:document.querySelector('#password').value})});if(document.querySelector('#remember')?.checked)localStorage.setItem('beautigoRemember','true');showNotice('Welcome back! Redirecting...','success');setTimeout(()=>location.href=data.user.type==='professional'?'professional-dashboard.html':'customer-dashboard.html',400)}catch(err){showNotice(err.message)}});

document.querySelector('#demoLogin')?.addEventListener('click',async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:'demo@beautigo.test',password:'Demo123!'})});showNotice('Demo customer account ready.','success');setTimeout(()=>location.href='customer-dashboard.html',400)}catch(err){showNotice('Demo customer account is not seeded yet. Create an account to continue.')}});
document.querySelector('#demoProfessional')?.addEventListener('click',async()=>{try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:'demo.pro@beautigo.test',password:'Demo123!'})});showNotice('Demo professional account ready.','success');setTimeout(()=>location.href='professional-dashboard.html',400)}catch(err){showNotice(err.message)}});
const forgot=document.querySelector('#forgot');if(forgot)forgot.addEventListener('click',e=>{e.preventDefault();showNotice('Password recovery will be connected to email delivery in the production version.','success')});
