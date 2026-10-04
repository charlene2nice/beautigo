const data = [ ["Amara's Beauty Studio", ['Hair', 'Nails'], 'Bonamoussadi, Douala', 'At provider', 4.9, 5000, 'nails.jpeg'],
              ["Glow by Nella", ['Makeup', 'Lashes & Brows'], 'Molyko, Buea', 'Both', 4.8, 7000, 'Makeup.jpeg'], 
              ["Gentleman's Cut", ['Barbering'], 'Akwa, Douala', 'At provider', 4.9, 4000, "Gentleman's Cut.jpeg"],
              ['The Nail Room', ['Nails'], 'Buea Town, Buea', 'Home service', 4.7, 6000, 'nails.jpeg'], 
              ['Luxe Face Studio', ['Makeup', 'Lashes & Brows'], 'Bonapriso, Douala', 'Both', 4.9, 10000, 'Makeup.jpeg'],
              ['Crown & Coils', ['Hair'], 'Molyko, Buea', 'Home service', 4.6, 5500, 'nails.jpeg'], 
              ['Serenity Spa', ['Spa & Skincare'], 'Bonanjo, Douala', 'At provider', 4.8, 12000, 'Makeup.jpeg'], 
              ['Fresh Fade Studio', ['Barbering'], 'Molyko, Buea', 'Both', 4.5, 3500, 'gentlemans-cut.jpeg'],
              ['Soft Glow Beauty', ['Hair', 'Makeup'], 'Bepanda, Douala', 'At provider', 4.7, 8000, 'Makeup.jpeg'] ];
const grid = document.querySelector('#grid');
function render() { let q = document.querySelector('#q').value.toLowerCase(); let loc = document.querySelector('#loc').value.toLowerCase(); let cats = [...document.querySelectorAll('.cat:checked')].map(x => x.value); let types = [...document.querySelectorAll('.type:checked')].map(x => x.value); let r = +document.querySelector('input[name=rating]:checked')?.value || 0;
let a = data.filter(x => (!q  (x[0] + ' ' + x[1].join(' ')).toLowerCase().includes(q)) && (!loc  x[2].toLowerCase().includes(loc)) && (!cats.length  cats.some(c => x[1].includes(c))) && (!types.length  types.includes(x[3])) && (x[4] >= r) );
const sortVal = document.querySelector('#sort').value;
if (sortVal === 'rating') { a.sort((x, y) => y[4] - x[4]); }
if (sortVal === 'low') { a.sort((x, y) => x[5] - y[5]); }
if (sortVal === 'high') { a.sort((x, y) => y[5] - x[5]); }
grid.innerHTML = a.map(x => ` <article class="card"> <div class="card-img"> <img src="${x[6]}" alt="" onerror="this.style.display='none'" /> </div>
  <div class="card-body">
    <h3>${x[0]}</h3>
    <p>${x[2]}</p>

    <div class="tags">
      ￼{t}</span>`).join('')}
      <span>${x[3]}</span>
    </div>

    <div class="meta">
      <span>
        From ${x[5].toLocaleString()} FCFA<br>
        <b class="rating">★ ${x[4]}</b>
      </span>

      <a href="provider.html?name=${encodeURIComponent(x[0])}">
        View profile →
      </a>
    </div>
  </div>
</article>
`).join(''); }
document.querySelector('#searchForm').onsubmit = (e) => { e.preventDefault(); render(); };
document.querySelector('#sort').onchange = render;
document.querySelector('#clear').onclick = () => { document.querySelectorAll('input').forEach(x => x.checked = false); document.querySelector('#q').value = ''; 
document.querySelector('#loc').value = ''; render(); };
render();
