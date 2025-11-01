// Mukhwas User App
(function(){
  const LS_KEYS = {
    FOODS: 'mukhwas_foods',
    ORDERS: 'mukhwas_orders',
    USERS: 'mukhwas_users',
    CURRENT_USER: 'mukhwas_current_user'
  };

  // Seed foods if missing
  const seedFoods = () => ([
    {id:'f1', name:'Masala Khakhra', price:60, img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop', cat:'Snacks'},
    {id:'f2', name:'Jeera Khakhra', price:55, img:'https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=800&auto=format&fit=crop', cat:'Snacks'},
    {id:'f3', name:'Dry Fruit Mix', price:240, img:'https://images.unsplash.com/photo-1604908815117-927c5b0d1eea?q=80&w=800&auto=format&fit=crop', cat:'Mix'},
    {id:'f4', name:'Saunf Mukhwas', price:90, img:'https://images.unsplash.com/photo-1625944529658-4e833ca612e3?q=80&w=800&auto=format&fit=crop', cat:'Mukhwas'},
    {id:'f5', name:'Til Chikki', price:120, img:'https://images.unsplash.com/photo-1587049352867-66c9c804564e?q=80&w=800&auto=format&fit=crop', cat:'Sweets'},
    {id:'f6', name:'Roasted Chana', price:80, img:'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop', cat:'Snacks'},
    {id:'f7', name:'Paan Mukhwas', price:110, img:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop', cat:'Mukhwas'},
    {id:'f8', name:'Peppermint', price:70, img:'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop', cat:'Candy'},
    {id:'f9', name:'Amla Candy', price:150, img:'https://images.unsplash.com/photo-1615486364398-9ea6295e9c7e?q=80&w=800&auto=format&fit=crop', cat:'Candy'},
    {id:'f10', name:'Dry Kachori', price:200, img:'https://images.unsplash.com/photo-1567234669003-dce7a7a8882d?q=80&w=800&auto=format&fit=crop', cat:'Snacks'},
    {id:'f11', name:'Hasta Mukhwas', price:95, img:'https://images.unsplash.com/photo-1604908815117-927c5b0d1eea?q=80&w=800&auto=format&fit=crop', cat:'Mukhwas'},
    {id:'f12', name:'Gulab Jamun', price:180, img:'https://images.unsplash.com/photo-1625944529658-4e833ca612e3?q=80&w=800&auto=format&fit=crop', cat:'Sweets'},
    {id:'f13', name:'Kaju Katli', price:450, img:'https://images.unsplash.com/photo-1589308078053-15850001946b?q=80&w=800&auto=format&fit=crop', cat:'Sweets'},
    {id:'f14', name:'Chivda Mix', price:130, img:'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop', cat:'Mix'},
    {id:'f15', name:'Rasgulla', price:160, img:'https://images.unsplash.com/photo-1625944529658-4e833ca612e3?q=80&w=800&auto=format&fit=crop', cat:'Sweets'}
  ]);

  const getJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  }
  const setJSON = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); }

  function ensureSeeds(){
    if(!getJSON(LS_KEYS.FOODS)) setJSON(LS_KEYS.FOODS, seedFoods());
    if(!getJSON(LS_KEYS.ORDERS)) setJSON(LS_KEYS.ORDERS, []);
    if(!getJSON(LS_KEYS.USERS)) setJSON(LS_KEYS.USERS, []);
  }

  // UI helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function formatCurrency(n){ return `₹${Number(n).toFixed(0)}`; }

  // Tabs
  function setupTabs(){
    $$('.nav-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.nav-btn').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const tab = btn.dataset.tab;
        $$('.tab-content').forEach(el=>el.classList.add('hidden'));
        $(`#tab-${tab}`).classList.remove('hidden');
      })
    })
  }

  // Auth
  function setupAuth(){
    const user = getJSON(LS_KEYS.CURRENT_USER, null);
    if(user){
      showApp(user);
    } else {
      $('#auth-screen').classList.remove('hidden');
      $('#app-screen').classList.add('hidden');
    }

    $('#auth-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = $('#auth-name').value.trim();
      const phone = $('#auth-phone').value.trim();
      const email = $('#auth-email').value.trim().toLowerCase();
      const user = { id: `u_${email}` , name, phone, email };
      setJSON(LS_KEYS.CURRENT_USER, user);
      // Save in users registry
      const users = getJSON(LS_KEYS.USERS, []);
      if(!users.find(u=>u.id===user.id)){
        users.push(user);
        setJSON(LS_KEYS.USERS, users);
      }
      showApp(user);
      // broadcast
      localStorage.setItem('mukhwas_ping', Date.now().toString());
    })
  }

  function showApp(user){
    $('#auth-screen').classList.add('hidden');
    $('#app-screen').classList.remove('hidden');
    // Profile fill
    $('#profile-name').textContent = user.name;
    $('#profile-email').textContent = user.email;
    $('#profile-phone').textContent = user.phone;
    renderCategories();
    renderFoods();
    renderOrders();
  }

  // Categories
  function getCategories(){
    const foods = getJSON(LS_KEYS.FOODS, []);
    return ['All', ...Array.from(new Set(foods.map(f=>f.cat)))];
  }

  function renderCategories(){
    const cats = getCategories();
    const wrap = $('#categories');
    wrap.innerHTML = '';
    cats.forEach((c,i)=>{
      const chip = document.createElement('button');
      chip.className = `chip${i===0?' active':''}`;
      chip.textContent = c;
      chip.addEventListener('click', ()=>{
        $$('#categories .chip').forEach(el=>el.classList.remove('active'));
        chip.classList.add('active');
        renderFoods(c);
      })
      wrap.appendChild(chip);
    })
  }

  // Foods grid
  function renderFoods(activeCat='All'){
    const grid = $('#food-grid');
    const foods = getJSON(LS_KEYS.FOODS, []);
    const items = activeCat==='All' ? foods : foods.filter(f=>f.cat===activeCat);
    grid.innerHTML = items.map(food=>foodCard(food)).join('');
    upgradeMDL();
    // attach order buttons
    $$('.btn-order').forEach(btn=>{
      btn.addEventListener('click', ()=>openOrderDialog(btn.dataset.id));
    })
  }

  function foodCard(food){
    return `
    <div class="mdl-card mdl-shadow--2dp food-card rounded-2xl overflow-hidden bg-white shadow-md">
      <div class="mdl-card__title" style="background-image:url('${food.img}')"></div>
      <div class="mdl-card__supporting-text p-3">
        <div class="food-meta">
          <div class="food-name">${food.name}</div>
          <div class="food-price">${formatCurrency(food.price)}</div>
        </div>
        <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored btn-order !bg-indigo-600 !text-white mt-2" data-id="${food.id}">Order</button>
      </div>
    </div>`;
  }

  // Search
  function setupSearch(){
    const input = $('#search-input');
    const out = $('#search-results');
    const render = ()=>{
      const q = input.value.trim().toLowerCase();
      const foods = getJSON(LS_KEYS.FOODS, []);
      const items = foods.filter(f => f.name.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q));
      out.innerHTML = items.map(food=>foodCard(food)).join('');
      upgradeMDL();
      $$('.btn-order').forEach(btn=>{
        btn.addEventListener('click', ()=>openOrderDialog(btn.dataset.id));
      })
    };
    input.addEventListener('input', render);
    render();
  }

  // Orders
  function renderOrders(){
    const list = $('#orders-list');
    const me = getJSON(LS_KEYS.CURRENT_USER, null);
    const orders = getJSON(LS_KEYS.ORDERS, []).filter(o=>o.user.id===me.id);
    const foods = getJSON(LS_KEYS.FOODS, []);
    list.innerHTML = orders.map(o=>{
      const f = foods.find(x=>x.id===o.foodId);
      const dotClass = o.status==='pending' ? 'pending' : 'success';
      return `
      <div class="order-item bg-white rounded-xl shadow-md p-2">
        <img class="order-thumb" src="${f?.img || ''}" alt="${f?.name || 'Food'}"/>
        <div class="order-body">
          <div class="order-title">${f?.name || 'Item'} · <span class="food-price">${formatCurrency(f?.price||0)}</span></div>
          <div class="order-sub">${o.address}</div>
          <div class="order-sub">${o.user.name} · ${o.user.phone}</div>
        </div>
        <span class="dot ${dotClass} ring-2 ring-offset-2 ring-gray-100" title="${o.status}"></span>
      </div>`;
    }).join('');
  }

  // Order dialog
  function polyfillDialog(dlg){
    if(typeof dlg.showModal !== 'function'){
      dialogPolyfill && dialogPolyfill.registerDialog(dlg);
    }
  }

  function openOrderDialog(foodId){
    const me = getJSON(LS_KEYS.CURRENT_USER, null);
    if(!me){
      $$('.nav-btn').find(b=>b.dataset.tab==='profile').click();
      return;
    }
    const dlg = $('#order-dialog');
    polyfillDialog(dlg);
    $('#order-food-id').value = foodId;
    $('#order-name').value = me.name;
    $('#order-phone').value = me.phone;
    $('#order-address').value = '';
    dlg.showModal();
  }

  function setupDialog(){
    const dlg = $('#order-dialog');
    polyfillDialog(dlg);
    dlg.querySelector('.close').addEventListener('click', ()=>dlg.close());
    $('#order-submit').addEventListener('click', ()=>{
      const me = getJSON(LS_KEYS.CURRENT_USER, null);
      const foodId = $('#order-food-id').value;
      const name = $('#order-name').value.trim();
      const phone = $('#order-phone').value.trim();
      const address = $('#order-address').value.trim();
      if(!name || !phone || !address){
        return;
      }
      const order = {
        id: 'o_' + Date.now(),
        foodId,
        user: { ...me, name, phone },
        address,
        status: 'pending', // green dot per spec
        createdAt: Date.now()
      };
      const orders = getJSON(LS_KEYS.ORDERS, []);
      orders.unshift(order);
      setJSON(LS_KEYS.ORDERS, orders);
      dlg.close();
      renderOrders();
      // broadcast
      localStorage.setItem('mukhwas_ping', Date.now().toString());
    })
  }

  function upgradeMDL(){
    if(window.componentHandler){
      // upgrade newly added MDL elements
      componentHandler.upgradeDom();
    }
  }

  function setupRealtime(){
    window.addEventListener('storage', (e)=>{
      if([LS_KEYS.FOODS, LS_KEYS.ORDERS, LS_KEYS.USERS, 'mukhwas_ping'].includes(e.key)){
        renderCategories();
        renderFoods();
        renderOrders();
      }
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureSeeds();
    setupTabs();
    setupAuth();
    setupSearch();
    setupDialog();
    setupRealtime();
  });
})();
