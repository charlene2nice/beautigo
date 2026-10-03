from flask import Flask, request, jsonify, session, send_from_directory, redirect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3, os, uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'beautigo.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXT = {'png','jpg','jpeg','webp','gif'}
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__, static_folder=None)
# Configure session cookies for cross-site requests between Netlify and Render
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
CORS(
    app,
    origins=["https://beautigo.vercel.app", "https://tourmaline-pastelio-f50db5.netlify.app"],
    supports_credentials=True
)
app.secret_key = os.environ.get('BEAUTIGO_SECRET', 'change-this-secret-before-production')
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def now(): return datetime.utcnow().isoformat(timespec='seconds') + 'Z'


def init_db():
    conn = db()
    conn.executescript('''
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('customer','professional')),
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS professional_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL, professional_type TEXT DEFAULT 'Beauty Professional',
      bio TEXT DEFAULT '', location TEXT DEFAULT '', service_type TEXT DEFAULT 'At professional',
      profile_image TEXT DEFAULT '', hours TEXT DEFAULT 'Mon–Sat · 8:00 AM–6:00 PM',
      categories TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professional_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
      category TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '',
      price INTEGER NOT NULL, duration INTEGER DEFAULT 60
    );
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professional_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL, caption TEXT DEFAULT '', uploaded_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL REFERENCES users(id),
      professional_id INTEGER NOT NULL REFERENCES professional_profiles(id),
      service_id INTEGER NOT NULL REFERENCES services(id), date TEXT NOT NULL, time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending', total_price INTEGER NOT NULL,
      notes TEXT DEFAULT '', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES users(id), professional_id INTEGER NOT NULL REFERENCES professional_profiles(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT DEFAULT '', created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_services_prof ON services(professional_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_prof ON portfolio(professional_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_prof ON bookings(professional_id);
    ''')
    # Seed demo customer and professional accounts for testing.
    if not conn.execute("SELECT 1 FROM users WHERE email=?", ('demo@beautigo.test',)).fetchone():
        conn.execute("INSERT INTO users(first_name,last_name,email,phone,role,password_hash,created_at) VALUES(?,?,?,?,?,?,?)",
            ('Demo','Customer','demo@beautigo.test','677000001','customer',generate_password_hash('Demo123!'),now()))
    # Seed one professional account for testing if absent.
    if not conn.execute("SELECT 1 FROM users WHERE email=?", ('demo.pro@beautigo.test',)).fetchone():
        cur = conn.execute("INSERT INTO users(first_name,last_name,email,phone,role,password_hash,created_at) VALUES(?,?,?,?,?,?,?)",
            ('Amara','Nfor','demo.pro@beautigo.test','677000000','professional',generate_password_hash('Demo123!'),now()))
        uid = cur.lastrowid
        cur = conn.execute("INSERT INTO professional_profiles(user_id,business_name,professional_type,bio,location,service_type,categories) VALUES(?,?,?,?,?,?,?)",
            (uid,"Amara’s Beauty Studio",'Beauty Studio','A warm, modern beauty studio focused on polished everyday looks and special-occasion glam.','Bonamoussadi, Douala','At professional','Hair,Nails'))
        pid = cur.lastrowid
        for cat,name,price,dur in [('Hair','Silk Press',8000,90),('Hair','Knotless Braids',15000,180),('Nails','Classic Manicure',5000,60),('Nails','Gel Manicure',8000,75)]:
            conn.execute('INSERT INTO services(professional_id,category,name,price,duration) VALUES(?,?,?,?,?)',(pid,cat,name,price,dur))
    conn.commit(); conn.close()


def user_dict(r):
    return {'id':r['id'],'firstName':r['first_name'],'lastName':r['last_name'],'email':r['email'],'phone':r['phone'] or '','type':r['role']}

def require_user(role=None):
    uid=session.get('user_id') or request.args.get('user_id') or request.headers.get('X-User-ID')
    if not uid: return None, (jsonify({'error':'Authentication required'}),401)
    conn=db(); u=conn.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone(); conn.close()
    if not u: session.clear(); return None,(jsonify({'error':'Account not found'}),401)
    if role and u['role']!=role: return None,(jsonify({'error':'This action is not available for your account type'}),403)
    return u,None

def professional_for_user(conn, uid):
    return conn.execute('SELECT * FROM professional_profiles WHERE user_id=?',(uid,)).fetchone()

def profile_json(conn,p):
    services=conn.execute('SELECT * FROM services WHERE professional_id=? ORDER BY id DESC',(p['id'],)).fetchall()
    photos=conn.execute('SELECT * FROM portfolio WHERE professional_id=? ORDER BY id DESC',(p['id'],)).fetchall()
    reviews=conn.execute('''SELECT r.*, u.first_name,u.last_name,s.name service_name FROM reviews r
      JOIN users u ON u.id=r.customer_id JOIN bookings b ON b.id=r.booking_id JOIN services s ON s.id=b.service_id
      WHERE r.professional_id=? ORDER BY r.id DESC''',(p['id'],)).fetchall()
    avg=conn.execute('SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE professional_id=?',(p['id'],)).fetchone()
    return {'id':p['id'],'userId':p['user_id'],'businessName':p['business_name'],'professionalType':p['professional_type'],
     'profileImage': {"Amara's Beauty Studio": "/nails.jpeg", "Glow by Nella": "/Makeup.jpeg", "Gentleman's Cut": "/Gentleman's Cut.jpeg"}.get(p['business_name'], p['profile_image']),
      'hours':p['hours'],'categories':[x for x in (p['categories'] or '').split(',') if x],
      'rating':round(avg['a'] or 0,1),'reviewCount':avg['n'],
      'services':[{'id':x['id'],'category':x['category'],'name':x['name'],'description':x['description'],'price':x['price'],'duration':x['duration']} for x in services],
      'portfolio':[{'id':x['id'],'image':x['image_path'],'caption':x['caption']} for x in photos],
      'reviews':[{'rating':x['rating'],'comment':x['comment'],'customer':f"{x['first_name']} {x['last_name'][0]}." if x['last_name'] else x['first_name'],'service':x['service_name']} for x in reviews]}

@app.get('/')
def home(): return send_from_directory(BASE_DIR,'index.html')
@app.get('/<path:path>')
def static_files(path):
    full=os.path.join(BASE_DIR,path)
    if os.path.isfile(full): return send_from_directory(BASE_DIR,path)
    return ('Not found',404)

@app.get('/uploads/<path:name>')
def uploads(name): return send_from_directory(UPLOAD_DIR,name)

@app.post('/api/auth/signup')
def signup():
    data=request.get_json(force=True)
    required=['firstName','lastName','email','password','type']
    if any(not str(data.get(k,'')).strip() for k in required): return jsonify(error='Please complete all required fields'),400
    if len(data['password'])<6: return jsonify(error='Password must be at least 6 characters'),400
    role=data['type'] if data['type'] in ('customer','professional') else 'customer'
    conn=db()
    try:
        cur=conn.execute('INSERT INTO users(first_name,last_name,email,phone,role,password_hash,created_at) VALUES(?,?,?,?,?,?,?)',
          (data['firstName'].strip(),data['lastName'].strip(),data['email'].strip().lower(),data.get('phone','').strip(),role,generate_password_hash(data['password']),now()))
        uid=cur.lastrowid
        if role=='professional':
            business=data.get('businessName') or f"{data['firstName'].strip()} Beauty Studio"
            conn.execute('INSERT INTO professional_profiles(user_id,business_name,professional_type) VALUES(?,?,?)',(uid,business,data.get('professionalType','Beauty Professional')))
        conn.commit()
    except sqlite3.IntegrityError: conn.close(); return jsonify(error='An account with this email already exists.'),409
    u=conn.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone(); conn.close(); session['user_id']=uid
    return jsonify(user=user_dict(u)),201

@app.post('/api/auth/login')
def login():
    data=request.get_json(force=True); email=data.get('email','').strip().lower(); password=data.get('password','')
    conn=db(); u=conn.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone(); conn.close()
    if not u or not check_password_hash(u['password_hash'],password): return jsonify(error='Email or password is incorrect.'),401
    session['user_id']=u['id']; return jsonify(user=user_dict(u))

@app.post('/api/auth/logout')
def logout(): session.clear(); return jsonify(ok=True)

@app.get('/api/me')
def me():
    u,e=require_user();
    if e:return e
    return jsonify(user=user_dict(u))

@app.get('/api/professionals')
def professionals():
    q=request.args.get('q','').strip().lower(); category=request.args.get('category','').strip().lower()
    conn=db(); rows=conn.execute('SELECT * FROM professional_profiles ORDER BY id DESC').fetchall(); out=[]
    for p in rows:
        if q and q not in (p['business_name']+' '+p['location']+' '+p['categories']).lower(): continue
        if category and category not in (p['categories'] or '').lower(): continue
        out.append(profile_json(conn,p))
    conn.close(); return jsonify(professionals=out)

@app.get('/api/professionals/<int:pid>')
def professional(pid):
    conn=db(); p=conn.execute('SELECT * FROM professional_profiles WHERE id=?',(pid,)).fetchone()
    if not p: conn.close(); return jsonify(error='Professional not found'),404
    out=profile_json(conn,p); conn.close(); return jsonify(professional=out)

@app.get('/api/professionals/me')
def my_professional():
    u,e=require_user('professional');
    if e:return e
    conn=db(); p=professional_for_user(conn,u['id']); out=profile_json(conn,p) if p else None; conn.close()
    return jsonify(professional=out)

@app.put('/api/professionals/me')
def update_professional():
    u,e=require_user('professional');
    if e:return e
    data=request.get_json(force=True); conn=db(); p=professional_for_user(conn,u['id'])
    if not p: conn.close(); return jsonify(error='Professional profile not found'),404
    fields=['businessName','professionalType','bio','location','serviceType','hours']
    vals={f:data.get(f) for f in fields}
    cats=data.get('categories',p['categories'])
    if isinstance(cats,list): cats=','.join(cats)
    conn.execute('''UPDATE professional_profiles SET business_name=?,professional_type=?,bio=?,location=?,service_type=?,hours=?,categories=? WHERE id=?''',
      (vals['businessName'] or p['business_name'],vals['professionalType'] or p['professional_type'],vals['bio'] or '',vals['location'] or '',vals['serviceType'] or p['service_type'],vals['hours'] or p['hours'],cats,p['id']))
    conn.commit(); p=conn.execute('SELECT * FROM professional_profiles WHERE id=?',(p['id'],)).fetchone(); out=profile_json(conn,p); conn.close(); return jsonify(professional=out)

@app.post('/api/professionals/me/services')
def add_service():
    u,e=require_user('professional');
    if e:return e
    data=request.get_json(force=True)
    try: price=int(data.get('price',0)); duration=int(data.get('duration',60))
    except: return jsonify(error='Price and duration must be numbers'),400
    if not data.get('name') or not data.get('category') or price<0:return jsonify(error='Name, category and price are required'),400
    conn=db(); p=professional_for_user(conn,u['id']);
    cur=conn.execute('INSERT INTO services(professional_id,category,name,description,price,duration) VALUES(?,?,?,?,?,?)',(p['id'],data['category'],data['name'],data.get('description',''),price,duration)); conn.commit(); s=conn.execute('SELECT * FROM services WHERE id=?',(cur.lastrowid,)).fetchone(); conn.close()
    return jsonify(service=dict(s)),201

@app.delete('/api/professionals/me/services/<int:sid>')
def delete_service(sid):
    u,e=require_user('professional');
    if e:return e
    conn=db(); p=professional_for_user(conn,u['id']); cur=conn.execute('DELETE FROM services WHERE id=? AND professional_id=?',(sid,p['id'])); conn.commit(); conn.close()
    return jsonify(ok=cur.rowcount>0)

@app.post('/api/professionals/me/portfolio')
def upload_portfolio():
    u,e=require_user('professional');
    if e:return e
    f=request.files.get('image'); caption=request.form.get('caption','').strip()
    if not f or not f.filename:return jsonify(error='Choose an image first'),400
    ext=f.filename.rsplit('.',1)[-1].lower() if '.' in f.filename else ''
    if ext not in ALLOWED_EXT:return jsonify(error='Allowed image types: PNG, JPG, JPEG, WEBP, GIF'),400
    conn=db(); p=professional_for_user(conn,u['id']); filename=f"{uuid.uuid4().hex}.{ext}"; safe=secure_filename(filename); f.save(os.path.join(UPLOAD_DIR,safe))
    cur=conn.execute('INSERT INTO portfolio(professional_id,image_path,caption,uploaded_at) VALUES(?,?,?,?)',(p['id'],f'/uploads/{safe}',caption,now())); conn.commit(); photo=conn.execute('SELECT * FROM portfolio WHERE id=?',(cur.lastrowid,)).fetchone(); conn.close()
    return jsonify(photo={'id':photo['id'],'image':photo['image_path'],'caption':photo['caption']}),201

@app.delete('/api/professionals/me/portfolio/<int:photo_id>')
def delete_photo(photo_id):
    u,e=require_user('professional');
    if e:return e
    conn=db(); p=professional_for_user(conn,u['id']); photo=conn.execute('SELECT * FROM portfolio WHERE id=? AND professional_id=?',(photo_id,p['id'])).fetchone()
    if not photo: conn.close(); return jsonify(error='Photo not found'),404
    filename=os.path.basename(photo['image_path']); path=os.path.join(UPLOAD_DIR,filename)
    conn.execute('DELETE FROM portfolio WHERE id=?',(photo_id,)); conn.commit(); conn.close()
    if os.path.exists(path): os.remove(path)
    return jsonify(ok=True)

@app.post('/api/bookings')
def create_booking():
    u,e=require_user('customer');
    if e:return e
    data=request.get_json(force=True)
    conn=db(); s=conn.execute('SELECT s.*,p.id pid,p.business_name FROM services s JOIN professional_profiles p ON p.id=s.professional_id WHERE s.id=?',(data.get('serviceId'),)).fetchone()
    if not s: conn.close(); return jsonify(error='Service not found'),404
    code='BG-'+uuid.uuid4().hex[:8].upper(); cur=conn.execute('INSERT INTO bookings(booking_code,customer_id,professional_id,service_id,date,time,status,total_price,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      (code,u['id'],s['pid'],s['id'],data.get('date',''),data.get('time',''), 'Confirmed',s['price'],data.get('notes',''),now())); conn.commit(); bid=cur.lastrowid; conn.close()
    return jsonify(booking={'id':bid,'bookingCode':code,'status':'Confirmed','provider':s['business_name'],'service':s['name'],'price':s['price'],'date':data.get('date'),'time':data.get('time')}),201

@app.get('/api/bookings')
def get_bookings():
    u,e=require_user();
    if e:return e
    conn=db();
    if u['role']=='customer':
        rows=conn.execute('''SELECT b.*,p.business_name,s.name service_name,s.category FROM bookings b JOIN professional_profiles p ON p.id=b.professional_id JOIN services s ON s.id=b.service_id WHERE b.customer_id=? ORDER BY b.date,b.time''',(u['id'],)).fetchall()
    else:
        p=professional_for_user(conn,u['id']); rows=conn.execute('''SELECT b.*,u.first_name,u.last_name,s.name service_name,s.category FROM bookings b JOIN users u ON u.id=b.customer_id JOIN services s ON s.id=b.service_id WHERE b.professional_id=? ORDER BY b.date,b.time''',(p['id'],)).fetchall()
    out=[]
    for r in rows:
        out.append({'id':r['id'],'bookingCode':r['booking_code'],'date':r['date'],'time':r['time'],'status':r['status'],'price':r['total_price'],'service':r['service_name'],'category':r['category'],'provider':r['business_name'] if 'business_name' in r.keys() else '', 'customer':(r['first_name']+' '+r['last_name']) if 'first_name' in r.keys() else ''})
    conn.close(); return jsonify(bookings=out)

@app.patch('/api/bookings/<int:bid>')
def update_booking(bid):
    u,e=require_user();
    if e:return e
    data=request.get_json(force=True); status=data.get('status')
    if status not in ('Pending','Confirmed','Completed','Cancelled'): return jsonify(error='Invalid booking status'),400
    conn=db(); row=conn.execute('SELECT * FROM bookings WHERE id=?',(bid,)).fetchone()
    if not row: conn.close(); return jsonify(error='Booking not found'),404
    allowed=(u['id']==row['customer_id'] or (u['role']=='professional' and professional_for_user(conn,u['id'])['id']==row['professional_id']))
    if not allowed: conn.close(); return jsonify(error='Not allowed'),403
    conn.execute('UPDATE bookings SET status=? WHERE id=?',(status,bid)); conn.commit(); conn.close(); return jsonify(ok=True)

@app.post('/api/reviews')
def review():
    u,e=require_user('customer');
    if e:return e
    data=request.get_json(force=True); rating=int(data.get('rating',0)); bid=int(data.get('bookingId',0))
    if rating<1 or rating>5:return jsonify(error='Rating must be 1–5'),400
    conn=db(); b=conn.execute('SELECT * FROM bookings WHERE id=? AND customer_id=?',(bid,u['id'])).fetchone()
    if not b or b['status']!='Completed': conn.close(); return jsonify(error='You can review a booking after it is completed.'),400
    try: conn.execute('INSERT INTO reviews(booking_id,customer_id,professional_id,rating,comment,created_at) VALUES(?,?,?,?,?,?)',(bid,u['id'],b['professional_id'],rating,data.get('comment',''),now())); conn.commit()
    except sqlite3.IntegrityError: conn.close(); return jsonify(error='This booking has already been reviewed.'),409
    conn.close(); return jsonify(ok=True),201
    
init_db()

if __name__=='__main__':
    app.run(host='127.0.0.1',port=5000, debug=True)
