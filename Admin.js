// Mukhwas Admin App
(function(){
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'admin123';
  const LS_KEYS = {
    FOODS: 'mukhwas_foods',
    ORDERS: 'mukhwas_orders',
    USERS: 'mukhwas_users',
    ADMIN_AUTH: 'mukhwas_admin_auth'
  };

  const getJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }}
  const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const INR = n => `₹${Number(n).toFixed(0)}`;

  function polyfillDialog(dlg){
    if(typeof dlg.showModal !== 'function' && window.dialogPolyfill){
      dialogPolyfill.registerDialog(dlg);
    }
  }

  function ensureSeeds(){
    if(!getJSON(LS_KEYS.FOODS)){
      // seed from user app if not present
      localStorage.setItem(LS_KEYS.FOODS, localStorage.getItem(LS_KEYS.FOODS) || '[]');
    }
    if(!getJSON(LS_KEYS.ORDERS)) setJSON(LS_KEYS.ORDERS, []);
    if(!getJSON(LS_KEYS.USERS)) setJSON(LS_KEYS.USERS, []);
  }

  function setupTabs(){
    $$('.nav-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.nav-btn').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const tab = btn.dataset.tab;
        $$('.tab-content').forEach(el=>el.classList.add('hidden'));
        $(`#admin-${tab}`).classList.remove('hidden');
      })
    })
  }

  function setupLogin(){
    const isAuthed = localStorage.getItem(LS_KEYS.ADMIN_AUTH) === '1';
    if(isAuthed){
      $('#admin-login').classList.add('hidden');
      $('#admin-panel').classList.remove('hidden');
      renderAll();
    }
    $('#admin-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = $('#admin-email').value.trim().toLowerCase();
      const pass = $('#admin-pass').value;
      if(email===ADMIN_EMAIL && pass===ADMIN_PASSWORD){
        localStorage.setItem(LS_KEYS.ADMIN_AUTH, '1');
        $('#admin-login').classList.add('hidden');
        $('#admin-panel').classList.remove('hidden');
        renderAll();
      } else {
        alert('Invalid admin credentials');
      }
    })
    $('#btn-logout').addEventListener('click', ()=>{
      localStorage.removeItem(LS_KEYS.ADMIN_AUTH);
      location.reload();
    })
  }

  function renderAll(){
    renderUsers();
    renderOrders();
    setupSearch();
    renderFoodsManage();
  }

  // Users
  function renderUsers(){
    const users = getJSON(LS_KEYS.USERS, []);
    const wrap = $('#users-list');
    wrap.innerHTML = users.map(u => `
      <div class="mdl-card mdl-shadow--2dp profile-card">
        <div class="mdl-card__supporting-text">
          <div class="profile-row"><span class="key">Name</span><span class="val">${u.name}</span></div>
          <div class="profile-row"><span class="key">Email</span><span class="val">${u.email}</span></div>
          <div class="profile-row"><span class="key">Mobile</span><span class="val">${u.phone}</span></div>
        </div>
      </div>
    `).join('');
  }

  // Orders
  function renderOrders(){
    const orders = getJSON(LS_KEYS.ORDERS, []);
    const foods = getJSON(LS_KEYS.FOODS, []);
    const wrap = $('#admin-orders-list');
    wrap.innerHTML = orders.map(o=>{
      const f = foods.find(x=>x.id===o.foodId);
      const isPending = o.status==='pending';
      return `
        <div class="admin-order">
          <img class="order-thumb" src="${f?.img || ''}" alt="${f?.name || 'Food'}"/>
          <div class="meta">
            <div class="order-title">${f?.name || 'Item'} · <span class="food-price">${INR(f?.price||0)}</span> · <span class="badge ${isPending?'pending':'success'}">${isPending?'Pending (green)':'Successful (red)'}</span></div>
            <div class="order-sub">${o.user.name} · ${o.user.phone}</div>
            <div class="order-sub">${o.address}</div>
          </div>
          <div class="actions">
            <button class="mdl-button mdl-js-button mdl-button--raised toggle-status" data-id="${o.id}">${isPending?'Mark Successful (Red)':'Mark Pending (Green)'}</button>
            <button class="mdl-button mdl-js-button mdl-button--accent complete-order" data-id="${o.id}">Order Complete</button>
          </div>
        </div>
      `;
    }).join('');
    if(window.componentHandler) componentHandler.upgradeDom();

    $$('.toggle-status').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const orders = getJSON(LS_KEYS.ORDERS, []);
        const idx = orders.findIndex(o=>o.id===id);
        if(idx>-1){
          orders[idx].status = orders[idx].status==='pending' ? 'success' : 'pending';
          setJSON(LS_KEYS.ORDERS, orders);
          renderOrders();
          localStorage.setItem('mukhwas_ping', Date.now().toString());
        }
      })
    })

    $$('.complete-order').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const orders = getJSON(LS_KEYS.ORDERS, []);
        const idx = orders.findIndex(o=>o.id===id);
        if(idx>-1){
          // per spec, completed order shows red dot (success)
          orders[idx].status = 'success';
          setJSON(LS_KEYS.ORDERS, orders);
          renderOrders();
          localStorage.setItem('mukhwas_ping', Date.now().toString());
        }
      })
    })
  }

  // Search foods
  function setupSearch(){
    const input = $('#admin-search-input');
    const out = $('#admin-search-results');
    const foods = ()=> getJSON(LS_KEYS.FOODS, []);
    function foodCard(f){
      return `
      <div class="mdl-card mdl-shadow--2dp food-card">
        <div class="mdl-card__title" style="background-image:url('${f.img}')"></div>
        <div class="mdl-card__supporting-text">
          <div class="food-meta">
            <div class="food-name">${f.name}</div>
            <div class="food-price">${INR(f.price)}</div>
          </div>
        </div>
      </div>`
    }
    const render = ()=>{
      const q = input.value.trim().toLowerCase();
      const items = foods().filter(f => f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q));
      out.innerHTML = items.map(foodCard).join('');
      if(window.componentHandler) componentHandler.upgradeDom();
    }
    input.addEventListener('input', render);
    render();
  }

  // Add food
  function setupAddFood(){
    $('#food-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = $('#food-name').value.trim();
      const price = Number($('#food-price').value);
      const cat = $('#food-cat').value.trim();
      const img = $('#food-img').value.trim();
      if(!name || !price || !cat || !img) return;
      const foods = getJSON(LS_KEYS.FOODS, []);
      const id = 'f' + (Date.now());
      foods.unshift({id, name, price, img, cat});
      setJSON(LS_KEYS.FOODS, foods);
      $('#food-form').reset();
      renderAll();
      localStorage.setItem('mukhwas_ping', Date.now().toString());
      alert('Food added');
    })
  }

  // Manage foods (edit/delete)
  function renderFoodsManage(){
    const foods = getJSON(LS_KEYS.FOODS, []);
    const wrap = $('#foods-list');
    wrap.innerHTML = foods.map(f => `
      <div class="mdl-card mdl-shadow--2dp food-card">
        <div class="mdl-card__title" style="background-image:url('${f.img}')"></div>
        <div class="mdl-card__supporting-text">
          <div class="food-meta">
            <div class="food-name">${f.name}</div>
            <div class="food-price">${INR(f.price)}</div>
          </div>
          <div class="food-meta">
            <span class="mdl-typography--caption">${f.cat}</span>
            <div>
              <button class="mdl-button mdl-js-button mdl-button--raised" data-id="${f.id}" title="Edit" class="btn-edit-product">Edit</button>
              <button class="mdl-button mdl-js-button mdl-button--accent" data-id="${f.id}" title="Delete" class="btn-delete-product">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    if(window.componentHandler) componentHandler.upgradeDom();

    // Attach actions
    wrap.querySelectorAll('button[title="Edit"]').forEach(btn=>{
      btn.addEventListener('click', ()=> openEditDialog(btn.getAttribute('data-id')));
    });
    wrap.querySelectorAll('button[title="Delete"]').forEach(btn=>{
      btn.addEventListener('click', ()=> deleteFood(btn.getAttribute('data-id')));
    });
  }

  function deleteFood(id){
    if(!confirm('Delete this product?')) return;
    const foods = getJSON(LS_KEYS.FOODS, []);
    const idx = foods.findIndex(f=>f.id===id);
    if(idx>-1){
      foods.splice(idx,1);
      setJSON(LS_KEYS.FOODS, foods);
      renderFoodsManage();
      setupSearch();
      localStorage.setItem('mukhwas_ping', Date.now().toString());
    }
  }

  function openEditDialog(id){
    const dlg = $('#edit-food-dialog');
    polyfillDialog(dlg);
    const foods = getJSON(LS_KEYS.FOODS, []);
    const f = foods.find(x=>x.id===id);
    if(!f) return;
    $('#edit-food-id').value = f.id;
    $('#edit-food-name').value = f.name;
    $('#edit-food-price').value = f.price;
    $('#edit-food-cat').value = f.cat;
    $('#edit-food-img').value = f.img;
    dlg.showModal();
  }

  function setupEditDialog(){
    const dlg = $('#edit-food-dialog');
    polyfillDialog(dlg);
    dlg.querySelector('.close').addEventListener('click', ()=> dlg.close());
    $('#edit-food-save').addEventListener('click', ()=>{
      const id = $('#edit-food-id').value;
      const name = $('#edit-food-name').value.trim();
      const price = Number($('#edit-food-price').value);
      const cat = $('#edit-food-cat').value.trim();
      const img = $('#edit-food-img').value.trim();
      if(!id || !name || !price || !cat || !img) return;
      const foods = getJSON(LS_KEYS.FOODS, []);
      const idx = foods.findIndex(f=>f.id===id);
      if(idx>-1){
        foods[idx] = { id, name, price, img, cat };
        setJSON(LS_KEYS.FOODS, foods);
        dlg.close();
        renderFoodsManage();
        setupSearch();
        localStorage.setItem('mukhwas_ping', Date.now().toString());
      }
    })
  }

  function setupRealtime(){
    window.addEventListener('storage', (e)=>{
      if(['mukhwas_ping', LS_KEYS.ORDERS, LS_KEYS.FOODS, LS_KEYS.USERS].includes(e.key)){
        renderAll();
      }
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureSeeds();
    setupTabs();
    setupLogin();
    setupAddFood();
    setupEditDialog();
    setupRealtime();
  })
})();
