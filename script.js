// script.js - AIMEES WD (single robust script)
// Config - change if needed
const OWNER_EMAIL = 'adelekealameen16@gmail.com';
const CALL_NUMBER = '+2349132252381';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjkzjdbd'; // your endpoint

// Helper short-hands
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const safe = (fn) => { try { return fn(); } catch (e) { console.warn('safe error', e); return null; } };

// Small escape for injecting text
function esc(s){ if(typeof s !== 'string') return s; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Local storage helpers
function read(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// CART helpers
function getCart(){ return read('cart'); }
function saveCart(arr){ write('cart', arr); renderCartCount(); }
function addToCart(item){ const c = getCart(); c.push(item); saveCart(c); }
function removeFromCart(i){ const c = getCart(); c.splice(i,1); saveCart(c); renderCartItems(); }
function updateCartItem(i, fields){ const c = getCart(); c[i] = Object.assign({}, c[i], fields); saveCart(c); renderCartItems(); }
function renderCartCount(){ const el = $('#cart-count'); if(el) el.innerText = getCart().length; }

// Render cart items into cart modal
function renderCartItems(){
  const container = $('#cart-items');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(!cart.length){ container.innerHTML = '<div class="muted">Cart is empty</div>'; return; }
  cart.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'card';
    row.style.padding = '8px';
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(it.service)}</strong>
        <button data-idx="${idx}" class="btn remove-item">Remove</button>
      </div>
      <div style="margin-top:8px">
        <label>Details</label>
        <input data-idx="${idx}" class="cart-detail" value="${esc(it.details||'')}" placeholder="Enter brief details" />
      </div>
      <div style="margin-top:8px">
        <label>Offered price</label>
        <input data-idx="${idx}" class="cart-price" value="${esc(it.offerPrice||'')}" placeholder="e.g. 50000" />
      </div>
    `;
    container.appendChild(row);
  });

  // Attach handlers (re-bind)
  $$('.remove-item').forEach(btn => btn.addEventListener('click', (e) => {
    const i = Number(btn.getAttribute('data-idx')); removeFromCart(i);
  }));
  $$('.cart-detail').forEach(inp => inp.addEventListener('change', (e) => {
    const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { details: inp.value });
  }));
  $$('.cart-price').forEach(inp => inp.addEventListener('change', (e) => {
    const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { offerPrice: inp.value });
  }));
}

// Dynamic options for service selection
function renderDynamicOptions(){
  const dyn = $('#dynamic-options');
  const sel = $('#service-select');
  if(!dyn || !sel) return;
  const s = sel.value;
  let html = '';
  if (s === 'Graphics') {
    html = `<div class="row"><div style="flex:1"><label>Type</label><select name="graphicType"><option>Poster</option><option>Flyer</option><option>Sticker</option></select></div><div style="width:160px"><label>Size</label><input name="graphicSize" placeholder="A4 / 4x6in" type="text"/></div></div>`;
  } else if (s === 'Websites') {
    html = `<div class="row"><div style="flex:1"><label>Site type</label><select name="siteType"><option>Portfolio</option><option>Business</option><option>E-commerce</option></select></div><div style="width:160px"><label>Pages</label><input name="sitePages" placeholder="e.g. Home,About,Blog,Shop"/></div></div>`;
  } else if (s === 'WebApps') {
    html = `<div class="row"><div style="flex:1"><label>App type</label><select name="appType"><option>Dashboard</option><option>SaaS</option><option>Internal tool</option></select></div><div style="width:160px"><label>Users</label><input name="appUsers" placeholder="small/medium/enterprise"/></div></div>`;
  } else if (s === 'Video Edit') {
    html = `<div class="row"><div style="flex:1"><label>Format</label><select name="videoFormat"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div style="width:160px"><label>Length</label><input name="videoLength" placeholder="seconds or minutes"/></div></div>`;
  } else if (s === 'UI/UX Design') {
    html = `<div class="row"><div style="flex:1"><label>Deliverable</label><select name="uiDeliverable"><option>Prototype</option><option>Design system</option><option>User testing</option></select></div><div style="width:160px"><label>Pages</label><input name="uiPages" placeholder="e.g. 5 screens"/></div></div>`;
  } else if (s === 'Data Analysis') {
    html = `<div class="row"><div style="flex:1"><label>Type</label><select name="dataType"><option>Report</option><option>Dashboard</option><option>Clean & Transform</option></select></div><div style="width:160px"><label>Rows</label><input name="dataRows" placeholder="e.g. 10k"/></div></div>`;
  } else if (s === 'Consulting') {
    html = `<div class="row"><div style="flex:1"><label>Focus</label><select name="consultFocus"><option>Architecture</option><option>Product</option><option>Security</option></select></div><div style="width:160px"><label>Hours</label><input name="consultHours" placeholder="e.g. 10"/></div></div>`;
  } else if (s === 'Tech Support') {
    html = `<div class="row"><div style="flex:1"><label>Level</label><select name="supportLevel"><option>Remote</option><option>Onsite</option><option>Maintenance plan</option></select></div><div style="width:160px"><label>Hours</label><input name="supportHours" placeholder="e.g. 2"/></div></div>`;
  } else if (s === 'Support') {
    html = `<div class="small muted">Support request — describe your issue in "Details" and we'll follow up.</div>`;
  }
  dyn.innerHTML = html;
}

// Save submission locally (admin demo)
function saveSubmissionLocal(obj){
  const arr = read('submissions'); arr.unshift(obj); write('submissions', arr);
}

// Send payload (Formspree + local backup). No mailto fallback.
async function sendOrder(payload){
  saveSubmissionLocal(payload);
  if (FORMSPREE_ENDPOINT && FORMSPREE_ENDPOINT.length > 5){
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) { console.warn('Formspree POST failed', err); }
  }
  alert('Order submitted — thank you! We will contact you soon.');
  const form = $('#order-form'); if(form) form.reset();
  $('#modal')?.classList.remove('open');
  localStorage.removeItem('cart'); renderCartCount();
}

// Safe wiring when DOM is ready
function wireUp(){
  // set contact details if present
  safe(() => { $('#owner-email').innerText = OWNER_EMAIL; $('#call-link').href = 'tel:' + CALL_NUMBER; $('#footer-call').href = 'tel:' + CALL_NUMBER; $('#year').innerText = new Date().getFullYear(); });

  // ensure default dark
  safe(() => { document.documentElement.setAttribute('data-theme','dark'); localStorage.setItem('site-dark','1'); });

  // nav smooth
  $$('.nav, [data-link]').forEach(()=>{}); // noop to avoid errors if nav selectors differ
  $$('[data-link]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); const t = a.getAttribute('href')?.replace('#',''); if(!t) return; const el = document.getElementById(t); if(el) el.scrollIntoView({behavior:'smooth'}); }));

  // UI buttons (defensive)
  $('#open-order')?.addEventListener('click', ()=> { $('#modal')?.classList.add('open'); renderDynamicOptions(); $('#modal-title') && ($('#modal-title').innerText = 'Create order'); });
  $('#open-order-cta')?.addEventListener('click', ()=> { $('#modal')?.classList.add('open'); renderDynamicOptions(); });
  $('#open-contract')?.addEventListener('click', ()=> $('#contract-modal')?.classList.add('open'));
  $('#close-contract')?.addEventListener('click', ()=> $('#contract-modal')?.classList.remove('open'));
  $('#close-modal')?.addEventListener('click', ()=> $('#modal')?.classList.remove('open'));
  $('#close-cart')?.addEventListener('click', ()=> $('#cart-modal')?.classList.remove('open'));

  // add-to-cart buttons (cards)
  $$('.add-to-cart').forEach(b => {
    b.addEventListener('click', () => {
      const svc = b.getAttribute('data-service') || 'Service';
      addToCart({ service: svc, details: '', offerPrice: '' });
      alert(svc + ' added to cart');
    });
  });

  // add to cart inside modal
  $('#add-to-cart-btn')?.addEventListener('click', () => {
    const form = $('#order-form'); if(!form) return alert('Order form not found');
    const fd = new FormData(form);
    const item = { service: fd.get('service'), details: fd.get('details')||'', offerPrice: fd.get('offerPrice')||'' };
    addToCart(item);
    alert('Added to cart');
  });

  // cart open
  $('#cart-btn')?.addEventListener('click', () => { renderCartItems(); $('#cart-modal')?.classList.add('open'); });

  // clear cart
  $('#clear-cart')?.addEventListener('click', ()=> { if(confirm('Clear cart?')){ localStorage.removeItem('cart'); renderCartItems(); renderCartCount(); } });

  // checkout from cart -> open modal prefilled
  $('#checkout-cart')?.addEventListener('click', ()=> {
    const cart = getCart(); if(!cart.length) return alert('Cart is empty');
    $('#modal')?.classList.add('open');
    $('#modal-title') && ($('#modal-title').innerText = 'Checkout — finalize order');
    const details = cart.map((c,i)=>`${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]'); if(area) area.value = details;
  });

  // service select dynamic options
  $('#service-select')?.addEventListener('change', renderDynamicOptions);
  renderDynamicOptions();

  // order form submit
  const orderForm = $('#order-form');
  if(orderForm){
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if($('#terms-check') && !$('#terms-check').checked){ alert('Please accept the Terms & Conditions before submitting'); return; }
      const fd = new FormData(orderForm); const payload = {};
      for(const [k,v] of fd.entries()) payload[k] = v;
      payload._submittedAt = new Date().toISOString();
      payload.cart = getCart();
      await sendOrder(payload);
    });
  }

  // contract form
  $('#contract-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); const obj = {};
    for(const [k,v] of fd.entries()) obj[k] = v;
    obj._requestedAt = new Date().toISOString();
    const arr = read('contracts'); arr.unshift(obj); write('contracts', arr);
    alert('Contract request saved locally. We will contact you.');
    $('#contract-modal')?.classList.remove('open');
  });

  // admin
  $('#admin-jobs')?.addEventListener('click', ()=> {
    const pass = prompt('Admin access — enter passphrase'); if(!pass) return; if(pass !== 'aimees-admin'){ alert('Wrong passphrase'); return; }
    openAdmin();
  });
  $('#apply-job')?.addEventListener('click', ()=> alert('To apply: open the Order form and include "Applying for job" in details.'));

  function openAdmin(){
    $('#modal')?.classList.add('open');
    const panel = $('#modal .panel'); if(!panel) return;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Admin — Jobs, Submissions & Contracts</strong>
        <button id="admin-close">Close</button>
      </div>
      <div style="display:flex;gap:10px;flex-direction:column">
        <div class="admin">
          <h4>Post a job / partnership</h4>
          <label>Title</label><input id="job-title" placeholder="e.g. UI Designer" />
          <label>Description</label><textarea id="job-desc" placeholder="Responsibilities and how to apply"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px"><button id="job-save" class="btn">Save job</button><button id="job-clear" class="btn">Clear all jobs</button></div>
          <div style="margin-top:12px"><h5>Current jobs</h5><div id="job-list"></div></div>
        </div>
        <div class="admin">
          <h4>Submissions</h4><div id="submissions-list"></div><div style="margin-top:8px"><button id="clear-submissions" class="btn">Clear submissions</button></div>
        </div>
        <div class="admin">
          <h4>Contract requests</h4><div id="contracts-list"></div><div style="margin-top:8px"><button id="clear-contracts" class="btn">Clear contract requests</button></div>
        </div>
      </div>
    `;
    $('#admin-close')?.addEventListener('click', ()=> { $('#modal')?.classList.remove('open'); location.reload(); });
    $('#job-save')?.addEventListener('click', ()=> {
      const t = $('#job-title').value.trim(); const d = $('#job-desc').value.trim(); if(!t||!d) return alert('Please fill title & description');
      const jobs = read('jobs'); jobs.unshift({ title:t, desc:d, created: new Date().toISOString() }); write('jobs', jobs);
      renderJobsAdmin(); renderJobsOnPage();
      $('#job-title').value=''; $('#job-desc').value='';
    });
    $('#job-clear')?.addEventListener('click', ()=> { if(confirm('Clear all jobs?')){ localStorage.removeItem('jobs'); renderJobsAdmin(); renderJobsOnPage(); }});
    $('#clear-submissions')?.addEventListener('click', ()=> { if(confirm('Clear submissions?')){ localStorage.removeItem('submissions'); renderSubmissions(); }});
    $('#clear-contracts')?.addEventListener('click', ()=> { if(confirm('Clear contract requests?')){ localStorage.removeItem('contracts'); renderContracts(); }});
    renderJobsAdmin(); renderSubmissions(); renderContracts();
  }

  function renderJobsOnPage(){
    const el = $('#jobs'); if(!el) return;
    el.innerHTML = '';
    const jobs = read('jobs');
    if(!jobs.length){ el.innerHTML = '<div class="muted">No open positions at the moment.</div>'; return; }
    for(const j of jobs){
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '12px';
      d.innerHTML = `<strong>${esc(j.title)}</strong><div class="muted">${esc(j.desc)}</div><div style="margin-top:8px"><button class="btn" data-apply>Apply</button></div>`;
      el.appendChild(d);
    }
    $$('[data-apply]').forEach(b => b.addEventListener('click', ()=> alert('To apply, open the Order form and include the job title in details.')));
  }
  function renderJobsAdmin(){ const el = $('#job-list'); if(!el) return; el.innerHTML = ''; const jobs = read('jobs'); if(!jobs.length){ el.innerHTML = '<div class="muted">No jobs</div>'; return; } for(const j of jobs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<strong>${esc(j.title)}</strong><div class="muted" style="font-size:13px">${esc(j.desc)}</div><div class="small">Posted: ${new Date(j.created).toLocaleString()}</div>`; el.appendChild(d); } }
  function renderSubmissions(){ const el = $('#submissions-list'); if(!el) return; el.innerHTML = ''; const subs = read('submissions'); if(!subs.length){ el.innerHTML = '<div class="muted">No submissions yet</div>'; return; } for(const s of subs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<div><strong>${esc(s.name||'—')}</strong> <span class="muted">(${esc(s.phone||'—')})</span></div><div class="small">Service: ${esc(s.service||'—')}</div><div class="muted">${esc(s.details||'')}</div><div class="small">Submitted: ${new Date(s._submittedAt).toLocaleString()}</div>`; el.appendChild(d); } }
  function renderContracts(){ const el = $('#contracts-list'); if(!el) return; el.innerHTML = ''; const reqs = read('contracts'); if(!reqs.length){ el.innerHTML = '<div class="muted">No contract requests</div>'; return; } for(const r of reqs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<div><strong>${esc(r.company||'—')}</strong> <span class="muted">(${esc(r.contactPerson||'—')})</span></div><div class="muted">${esc(r.scope||'')}</div><div class="small">Requested: ${new Date(r._requestedAt).toLocaleString()}</div>`; el.appendChild(d); } }

  // Initialize small UI bits
  renderJobsOnPage();
  renderCartCount();
  renderCartItems();
} // end wireUp()

// Run when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireUp);
} else {
  wireUp();
                   }getCart(); if(!cart.length) return alert('Cart is empty');
    $('#modal')?.classList.add('open');
    $('#modal-title') && ($('#modal-title').innerText = 'Checkout — finalize order');
    const details = cart.map((c,i)=>`${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]');
    if(area) area.value = details;
  });

  // dynamic options select
  $('#service-select')?.addEventListener('change', renderDynamicOptions);

  // order form submit (checkout)
  const orderForm = $('#order-form');
  if(orderForm){
    orderForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const terms = $('#terms-check');
      if(terms && !terms.checked){ alert('Please accept the Terms & Conditions before submitting'); return; }
      const fd = new FormData(orderForm);
      const payload = {};
      for(const [k,v] of fd.entries()) payload[k] = v;
      payload._submittedAt = new Date().toISOString();
      payload.cart = getCart();
      // save locally and send
      await submitOrderPayload(payload);
    });
  }

  // cart rendering helpers wired earlier
  // contract form
  $('#contract-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const obj = {};
    for(const [k,v] of fd.entries()) obj[k]=v;
    obj._requestedAt = new Date().toISOString();
    const arr = read('contracts'); arr.unshift(obj); write('contracts', arr);
    alert('Contract request saved locally. We will contact you.');
    $('#contract-modal')?.classList.remove('open');
  });

  // admin / jobs
  $('#admin-jobs')?.addEventListener('click', ()=> {
    const pass = prompt('Admin access — enter passphrase'); if(!pass) return; if(pass !== 'aimees-admin'){ alert('Wrong passphrase'); return; }
    openAdmin();
  });
  $('#apply-job')?.addEventListener('click', ()=> alert('To apply: open the Order form and include "Applying for job" in details.'));

  // admin open
  function openAdmin(){
    $('#modal')?.classList.add('open');
    const panel = $('#modal .panel');
    if(!panel) return;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Admin — Jobs, Submissions & Contracts</strong>
        <button id="admin-close">Close</button>
      </div>
      <div style="display:flex;gap:10px;flex-direction:column">
        <div class="admin">
          <h4>Post a job / partnership</h4>
          <label>Title</label><input id="job-title" placeholder="e.g. UI Designer" />
          <label>Description</label><textarea id="job-desc" placeholder="Responsibilities and how to apply"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px"><button id="job-save" class="btn">Save job</button><button id="job-clear" class="btn">Clear all jobs</button></div>
          <div style="margin-top:12px"><h5>Current jobs</h5><div id="job-list"></div></div>
        </div>
        <div class="admin">
          <h4>Submissions</h4><div id="submissions-list"></div><div style="margin-top:8px"><button id="clear-submissions" class="btn">Clear submissions</button></div>
        </div>
        <div class="admin">
          <h4>Contract requests</h4><div id="contracts-list"></div><div style="margin-top:8px"><button id="clear-contracts" class="btn">Clear contract requests</button></div>
        </div>
      </div>
    `;
    $('#admin-close')?.addEventListener('click', ()=> { $('#modal')?.classList.remove('open'); location.reload(); });
    $('#job-save')?.addEventListener('click', ()=> {
      const t = $('#job-title').value.trim(); const d = $('#job-desc').value.trim();
      if(!t||!d) return alert('Please fill title & description');
      const jobs = read('jobs'); jobs.unshift({ title: t, desc: d, created: new Date().toISOString() }); write('jobs', jobs);
      renderJobsAdmin(); renderJobsOnPage();
      $('#job-title').value=''; $('#job-desc').value='';
    });
    $('#job-clear')?.addEventListener('click', ()=> { if(confirm('Clear all jobs?')){ localStorage.removeItem('jobs'); renderJobsAdmin(); renderJobsOnPage(); }});
    $('#clear-submissions')?.addEventListener('click', ()=> { if(confirm('Clear submissions?')){ localStorage.removeItem('submissions'); renderSubmissions(); }});
    $('#clear-contracts')?.addEventListener('click', ()=> { if(confirm('Clear contract requests?')){ localStorage.removeItem('contracts'); renderContracts(); }});
    renderJobsAdmin(); renderSubmissions(); renderContracts();
  }

  // admin renderers
  function renderJobsOnPage(){ const el = $('#jobs'); if(!el) return; el.innerHTML=''; const jobs = read('jobs'); if(!jobs.length) return el.innerHTML = '<div class="muted">No open positions at the moment.</div>'; for(const j of jobs){ const d = document.createElement('div'); d.className='card'; d.style.padding='12px'; d.innerHTML = `<strong>${esc(j.title)}</strong><div class="muted">${esc(j.desc)}</div><div style="margin-top:8px"><button class="btn" data-apply>Apply</button></div>`; el.appendChild(d);} $$('[data-apply]').forEach(b=>b.addEventListener('click', ()=> alert('To apply, open the Order form and include the job title in details.'))); }
  function renderJobsAdmin(){ const el = $('#job-list'); if(!el) return; el.innerHTML=''; const jobs = read('jobs'); if(!jobs.length){ el.innerHTML = '<div class="muted">No jobs</div>'; return; } for(const j of jobs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<strong>${esc(j.title)}</strong><div class="muted" style="font-size:13px">${esc(j.desc)}</div><div class="small">Posted: ${new Date(j.created).toLocaleString()}</div>`; el.appendChild(d); } }
  function renderSubmissions(){ const el = $('#submissions-list'); if(!el) return; el.innerHTML=''; const subs = read('submissions'); if(!subs.length){ el.innerHTML = '<div class="muted">No submissions yet</div>'; return; } for(const s of subs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<div><strong>${esc(s.name||'—')}</strong> <span class="muted">(${esc(s.phone||'—')})</span></div><div class="small">Service: ${esc(s.service||'—')}</div><div class="muted">${esc(s.details||'')}</div><div class="small">Submitted: ${new Date(s._submittedAt).toLocaleString()}</div>`; el.appendChild(d);} }
  function renderContracts(){ const el = $('#contracts-list'); if(!el) return; el.innerHTML=''; const reqs = read('contracts'); if(!reqs.length){ el.innerHTML = '<div class="muted">No contract requests</div>'; return; } for(const r of reqs){ const d = document.createElement('div'); d.className='card'; d.style.padding='8px'; d.innerHTML = `<div><strong>${esc(r.company||'—')}</strong> <span class="muted">(${esc(r.contactPerson||'—')})</span></div><div class="muted">${esc(r.scope||'')}</div><div class="small">Requested: ${new Date(r._requestedAt).toLocaleString()}</div>`; el.appendChild(d);} }

  // initial render
  renderJobsOnPage();
  renderCartCount();
  // For safety, attach cart items rendering to ensure buttons work
  renderCartItems();
} // end wireUI

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireUI);
} else {
  wireUI();
    }      `;
      el.appendChild(div);
    });

    // attach handlers
    el.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', e => {
      const i = Number(btn.getAttribute('data-idx')); removeFromCart(i);
    }));
    el.querySelectorAll('.cart-detail').forEach(inp => inp.addEventListener('change', e => {
      const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { details: inp.value });
    }));
    el.querySelectorAll('.cart-price').forEach(inp => inp.addEventListener('change', e => {
      const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { offerPrice: inp.value });
    }));
  }

  // wire cart UI button
  if(cartBtn) cartBtn.addEventListener('click', () => { renderCartItems(); if(cartModal) cartModal.classList.add('open'); });

  document.getElementById('clear-cart')?.addEventListener('click', () => { if(confirm('Clear cart?')){ localStorage.removeItem('cart'); renderCartItems(); renderCartCount(); } });
  document.getElementById('checkout-cart')?.addEventListener('click', () => {
    const cart = getCart();
    if(!cart.length) return alert('Cart is empty');
    // prefill order modal details with cart summary
    if(document.getElementById('modal')) document.getElementById('modal').classList.add('open');
    const details = cart.map((c,i)=>`${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]');
    if(area) area.value = details;
  });

  // quick add-to-cart buttons
  document.querySelectorAll('.add-to-cart').forEach(b => {
    b.addEventListener('click', () => {
      const svc = b.dataset.service || 'Service';
      addToCart({ service: svc, details: '', offerPrice: '' });
      alert(`${svc} added to cart`);
      renderCartCount();
    });
  });

  // ---------------- MODAL + FORM ----------------
  function openOrderModal(service){
    document.getElementById('modal')?.classList.add('open');
    if(service && document.getElementById('service-select')) {
      document.getElementById('service-select').value = service;
      renderDynamicOptions();
    }
  }

  document.getElementById('open-order')?.addEventListener('click', () => openOrderModal());
  document.getElementById('open-order-cta')?.addEventListener('click', () => openOrderModal());
  document.querySelectorAll('[data-service]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const svc = btn.dataset.service || btn.getAttribute('data-service');
      if(svc && btn.classList.contains('btn')) openOrderModal(svc);
    });
  });

  document.getElementById('close-modal')?.addEventListener('click', () => modal?.classList.remove('open'));
  document.getElementById('close-cart')?.addEventListener('click', () => cartModal?.classList.remove('open'));
  document.getElementById('open-contract')?.addEventListener('click', () => contractModal?.classList.add('open'));
  document.getElementById('close-contract')?.addEventListener('click', () => contractModal?.classList.remove('open'));

  // dynamic options based on selected service
  const serviceSelect = document.getElementById('service-select');
  function renderDynamicOptions(){
    const dynamicOptions = document.getElementById('dynamic-options');
    if(!dynamicOptions || !serviceSelect) return;
    const s = serviceSelect.value;
    let html = '';
    if(s === 'Graphics'){
      html = `
      <div class="row">
        <div style="flex:1"><label>Type</label><select name="graphicType"><option>Poster</option><option>Flyer</option><option>Sticker</option></select></div>
        <div style="width:160px"><label>Size</label><input name="graphicSize" placeholder="A4 / 4x6in" type="text"/></div>
      </div>`;
    } else if(s === 'Websites'){
      html = `<div class="row"><div style="flex:1"><label>Site type</label><select name="siteType"><option>Portfolio</option><option>Business</option><option>E-commerce</option></select></div><div style="width:160px"><label>Pages</label><input name="sitePages" placeholder="e.g. Home,About,Blog,Shop"/></div></div>`;
    } else if(s === 'WebApps'){
      html = `<div class="row"><div style="flex:1"><label>App type</label><select name="appType"><option>Dashboard</option><option>SaaS</option><option>Internal tool</option></select></div><div style="width:160px"><label>Users</label><input name="appUsers" placeholder="small/medium/enterprise"/></div></div>`;
    } else if(s === 'Video Edit'){
      html = `<div class="row"><div style="flex:1"><label>Format</label><select name="videoFormat"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div style="width:160px"><label>Length</label><input name="videoLength" placeholder="seconds or minutes"/></div></div>`;
    } else if(s === 'UI/UX Design'){
      html = `<div class="row"><div style="flex:1"><label>Deliverable</label><select name="uiDeliverable"><option>Prototype</option><option>Design system</option><option>User testing</option></select></div><div style="width:160px"><label>Pages</label><input name="uiPages" placeholder="e.g. 5 screens"/></div></div>`;
    } else if(s === 'Data Analysis'){
      html = `<div class="row"><div style="flex:1"><label>Type</label><select name="dataType"><option>Report</option><option>Dashboard</option><option>Clean & Transform</option></select></div><div style="width:160px"><label>Rows</label><input name="dataRows" placeholder="e.g. 10k"/></div></div>`;
    } else if(s === 'Consulting'){
      html = `<div class="row"><div style="flex:1"><label>Focus</label><select name="consultFocus"><option>Architecture</option><option>Product</option><option>Security</option></select></div><div style="width:160px"><label>Hours</label><input name="consultHours" placeholder="e.g. 10"/></div></div>`;
    } else if(s === 'Tech Support'){
      html = `<div class="row"><div style="flex:1"><label>Level</label><select name="supportLevel"><option>Remote</option><option>Onsite</option><option>Maintenance plan</option></select></div><div style="width:160px"><label>Hours</label><input name="supportHours" placeholder="e.g. 2"/></div></div>`;
    } else if(s === 'Support'){
      html = `<div class="small muted">Support request — describe your issue in "Details" and we'll follow up.</div>`;
    }
    dynamicOptions.innerHTML = html;
  }
  serviceSelect?.addEventListener('change', renderDynamicOptions);
  renderDynamicOptions();

  // Order form submission (checkout)
  const orderForm = document.getElementById('order-form');
  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const terms = document.getElementById('terms-check');
    if(terms && !terms.checked){ alert('Please accept the Terms & Conditions before submitting'); return; }
    const fd = new FormData(orderForm);
    const payload = {};
    for(const [k, v] of fd.entries()) payload[k] = v;
    payload._submittedAt = new Date().toISOString();
    payload.cart = getCart();

    // Save locally for admin demo
    const subs = JSON.parse(localStorage.getItem('submissions') || '[]');
    subs.unshift(payload);
    localStorage.setItem('submissions', JSON.stringify(subs));

    // POST to Formspree if configured
    if(FORMSPREE_ENDPOINT && FORMSPREE_ENDPOINT.length > 5) {
      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch(err) { console.warn('Formspree post failed', err); }
    }

    // fallback: open mail client prefilled
    // REMOVE or comment out the mailto fallback
// try {
//   const subject = encodeURIComponent('New order — ' + (payload.service || 'Order'));
//   const body = encodeURIComponent(Object.entries(payload).map(([k,v])=>`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n'));
//   window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
// } catch(e) { console.warn('mailto failed', e); }

// Instead show success and clear cart
alert('Order submitted — thank you! We will contact you soon.');
orderForm.reset();
modal?.classList.remove('open');
localStorage.removeItem('cart');
renderCartCount();
    alert('Order prepared — your email client should open (if available). A local copy was saved for owner review.');
    orderForm.reset();
    modal?.classList.remove('open');
    localStorage.removeItem('cart');
    renderCartCount();
  });

  // add-to-cart from modal
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    const f = document.getElementById('order-form');
    if(!f) return alert('Order form not found');
    const fd = new FormData(f);
    const item = { service: fd.get('service'), details: fd.get('details') || '', offerPrice: fd.get('offerPrice') || '' };
    addToCart(item);
    alert('Added to cart');
  });

  // simple contract form
  document.getElementById('contract-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); const obj = {};
    for(const [k,v] of fd.entries()) obj[k] = v;
    obj._requestedAt = new Date().toISOString();
    const reqs = JSON.parse(localStorage.getItem('contracts') || '[]');
    reqs.unshift(obj); localStorage.setItem('contracts', JSON.stringify(reqs));
    alert('Contract request saved locally. We will contact you.');
    contractModal?.classList.remove('open');
  });

  // ADMIN (local-demo)
  document.getElementById('admin-jobs')?.addEventListener('click', () => {
    const pass = prompt('Admin access — enter passphrase');
    if(!pass) return;
    if(pass !== 'aimees-admin'){ alert('Wrong passphrase'); return; }
    // open admin modal (re-using order modal for convenience)
    if(!modal) return;
    modal.classList.add('open');
    const panel = modal.querySelector('.panel');
    if(!panel) return;
    panel.innerHTML = `
      <div class="panel-head"><strong>Admin — Jobs, Submissions & Contracts</strong><button id="admin-close">Close</button></div>
      <div style="display:flex;gap:10px;flex-direction:column">
        <div class="admin">
          <h4>Post a job</h4>
          <label>Title</label><input id="job-title" placeholder="e.g. UI Designer" />
          <label>Description</label><textarea id="job-desc" placeholder="Responsibilities and how to apply"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px"><button id="job-save" class="btn">Save job</button><button id="job-clear" class="btn">Clear all jobs</button></div>
          <div style="margin-top:12px"><h5>Current jobs</h5><div id="job-list"></div></div>
        </div>
        <div class="admin">
          <h4>Submissions</h4><div id="submissions-list"></div><div style="margin-top:8px"><button id="clear-submissions" class="btn">Clear submissions</button></div>
        </div>
        <div class="admin">
          <h4>Contract requests</h4><div id="contracts-list"></div><div style="margin-top:8px"><button id="clear-contracts" class="btn">Clear contract requests</button></div>
        </div>
      </div>
    `;
    // attach handlers
    document.getElementById('admin-close').addEventListener('click', () => location.reload());
    document.getElementById('job-save').addEventListener('click', () => {
      const t = document.getElementById('job-title').value.trim();
      const d = document.getElementById('job-desc').value.trim();
      if(!t || !d) return alert('Please fill title & description');
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      jobs.unshift({ title: t, desc: d, created: new Date().toISOString() }); localStorage.setItem('jobs', JSON.stringify(jobs));
      renderJobsAdmin(); renderJobsOnPage();
      document.getElementById('job-title').value=''; document.getElementById('job-desc').value='';
    });
    document.getElementById('job-clear').addEventListener('click', () => { if(confirm('Clear all jobs?')){ localStorage.removeItem('jobs'); renderJobsAdmin(); renderJobsOnPage(); }});
    document.getElementById('clear-submissions').addEventListener('click', () => { if(confirm('Clear submissions?')){ localStorage.removeItem('submissions'); renderSubmissions(); }});
    document.getElementById('clear-contracts').addEventListener('click', () => { if(confirm('Clear contract requests?')){ localStorage.removeItem('contracts'); renderContracts(); }});
    renderJobsAdmin(); renderSubmissions(); renderContracts();
  });

  // render helpers for admin
  function renderJobsOnPage(){
    const el = document.getElementById('jobs'); if(!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if(!jobs.length) return el.innerHTML = '<div class="muted">No open positions at the moment.</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '12px';
      d.innerHTML = `<strong>${j.title}</strong><div class="muted">${j.desc}</div><div style="margin-top:8px"><button class="btn" data-apply>Apply</button></div>`;
      el.appendChild(d);
    });
    document.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => alert('To apply, open the Order form and include the job title in details.')));
  }

  function renderJobsAdmin(){
    const el = document.getElementById('job-list'); if(!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if(!jobs.length) return el.innerHTML = '<div class="muted">No jobs</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<strong>${j.title}</strong><div class="muted" style="font-size:13px">${j.desc}</div><div class="small">Posted: ${new Date(j.created).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderSubmissions(){
    const el = document.getElementById('submissions-list'); if(!el) return;
    el.innerHTML = '';
    const subs = JSON.parse(localStorage.getItem('submissions') || '[]');
    if(!subs.length) return el.innerHTML = '<div class="muted">No submissions yet</div>';
    subs.forEach(s => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${s.name||'—'}</strong> <span class="muted">(${s.phone||'—'})</span></div><div class="small">Service: ${s.service||'—'}</div><div class="muted">${s.details||''}</div><div class="small">Submitted: ${new Date(s._submittedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderContracts(){
    const el = document.getElementById('contracts-list'); if(!el) return;
    el.innerHTML = '';
    const reqs = JSON.parse(localStorage.getItem('contracts') || '[]');
    if(!reqs.length) return el.innerHTML = '<div class="muted">No contract requests</div>';
    reqs.forEach(r => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${r.company||'—'}</strong> <span class="muted">(${r.contactPerson||'—'})</span></div><div class="muted">${r.scope||''}</div><div class="small">Requested: ${new Date(r._requestedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  // apply & job UI
  document.getElementById('apply-job')?.addEventListener('click', () => alert('To apply: open the Order form and include "Applying for job" in details.'));

  // init
  renderJobsOnPage();
  renderCartCount();
});    if (!el) return;
    const cart = getCart();
    el.innerHTML = '';
    if (!cart.length) { el.innerHTML = '<div class="muted">Cart is empty</div>'; return; }
    cart.forEach((it, idx) => {
      const d = document.createElement('div');
      d.className = 'card';
      d.style.padding = '8px';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${escapeHtml(it.service)}</strong>
          <button data-idx="${idx}" class="btn remove-item">Remove</button>
        </div>
        <div style="margin-top:8px">
          <label>Details</label>
          <input data-idx="${idx}" class="cart-detail" value="${escapeHtml(it.details||'')}" placeholder="Enter brief details" />
        </div>
        <div style="margin-top:8px">
          <label>Offered price</label>
          <input data-idx="${idx}" class="cart-price" value="${escapeHtml(it.offerPrice||'')}" placeholder="e.g. 50000" />
        </div>
      `;
      el.appendChild(d);
    });

    // attach handlers
    el.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', (e) => {
      const i = Number(btn.getAttribute('data-idx'));
      const cart = getCart(); cart.splice(i, 1); setCart(cart); renderCartItems();
    }));
    el.querySelectorAll('.cart-detail').forEach(inp => inp.addEventListener('change', (e) => {
      const i = Number(inp.getAttribute('data-idx'));
      const cart = getCart(); cart[i] = Object.assign({}, cart[i], { details: inp.value }); setCart(cart);
    }));
    el.querySelectorAll('.cart-price').forEach(inp => inp.addEventListener('change', (e) => {
      const i = Number(inp.getAttribute('data-idx'));
      const cart = getCart(); cart[i] = Object.assign({}, cart[i], { offerPrice: inp.value }); setCart(cart);
    }));
  }

  function addToCart(item) {
    const cart = getCart(); cart.push(item); setCart(cart);
  }

  // Safe query helper
  function q(selector) { return document.querySelector(selector); }
  function qAll(selector) { return Array.from(document.querySelectorAll(selector)); }

  // Escape helper for safe innerHTML usage
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Wire UI controls which may or may not exist
  qAll('[data-link]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); const t = a.getAttribute('href').replace('#', ''); const el = document.getElementById(t); if (el) el.scrollIntoView({ behavior: 'smooth' }); }));
  q('#cart-btn')?.addEventListener('click', () => { renderCartItems(); q('#cart-modal')?.classList.add('open'); });
  q('#clear-cart')?.addEventListener('click', () => { if (confirm('Clear cart?')) { localStorage.removeItem('cart'); renderCartItems(); renderCartCount(); } });
  q('#checkout-cart')?.addEventListener('click', () => {
    const cart = getCart(); if (!cart.length) return alert('Cart is empty');
    q('#modal')?.classList.add('open');
    q('#modal-title') && (q('#modal-title').innerText = 'Checkout — finalize order');
    const details = cart.map((c, i) => `${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]'); if (area) area.value = details;
  });

  // Quick add-to-cart buttons
  qAll('.add-to-cart').forEach(b => b.addEventListener('click', () => { addToCart({ service: b.getAttribute('data-service') || 'Service', details: '', offerPrice: '' }); alert((b.getAttribute('data-service')||'Service') + ' added to cart'); renderCartCount(); }));

  // Order modal openers
  function openOrderModal(service) {
    q('#modal')?.classList.add('open');
    if (service && q('#service-select')) { q('#service-select').value = service; renderDynamicOptions(); }
  }
  q('#open-order')?.addEventListener('click', () => openOrderModal());
  q('#open-order-cta')?.addEventListener('click', () => openOrderModal());
  // Also allow data-service btns to open modal with preselected service
  qAll('[data-service]').forEach(btn => {
    if (btn.classList.contains('btn')) btn.addEventListener('click', () => openOrderModal(btn.getAttribute('data-service')));
  });

  q('#close-modal')?.addEventListener('click', () => q('#modal')?.classList.remove('open'));
  q('#close-cart')?.addEventListener('click', () => q('#cart-modal')?.classList.remove('open'));
  q('#open-contract')?.addEventListener('click', () => q('#contract-modal')?.classList.add('open'));
  q('#close-contract')?.addEventListener('click', () => q('#contract-modal')?.classList.remove('open'));

  // Dynamic options rendering
  const serviceSelect = q('#service-select');
  function renderDynamicOptions() {
    const dyn = q('#dynamic-options'); if (!dyn || !serviceSelect) return;
    const s = serviceSelect.value; let html = '';
    if (s === 'Graphics') html = `<div class="row"><div style="flex:1"><label>Type</label><select name="graphicType"><option>Poster</option><option>Flyer</option><option>Sticker</option></select></div><div style="width:160px"><label>Size</label><input name="graphicSize" placeholder="A4 / 4x6in" type="text"/></div></div>`;
    else if (s === 'Websites') html = `<div class="row"><div style="flex:1"><label>Site type</label><select name="siteType"><option>Portfolio</option><option>Business</option><option>E-commerce</option></select></div><div style="width:160px"><label>Pages</label><input name="sitePages" placeholder="e.g. Home,About,Blog,Shop"/></div></div>`;
    else if (s === 'WebApps') html = `<div class="row"><div style="flex:1"><label>App type</label><select name="appType"><option>Dashboard</option><option>SaaS</option><option>Internal tool</option></select></div><div style="width:160px"><label>Users</label><input name="appUsers" placeholder="small/medium/enterprise"/></div></div>`;
    else if (s === 'Video Edit') html = `<div class="row"><div style="flex:1"><label>Format</label><select name="videoFormat"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div style="width:160px"><label>Length</label><input name="videoLength" placeholder="seconds or minutes"/></div></div>`;
    else if (s === 'UI/UX Design') html = `<div class="row"><div style="flex:1"><label>Deliverable</label><select name="uiDeliverable"><option>Prototype</option><option>Design system</option><option>User testing</option></select></div><div style="width:160px"><label>Pages</label><input name="uiPages" placeholder="e.g. 5 screens"/></div></div>`;
    else if (s === 'Data Analysis') html = `<div class="row"><div style="flex:1"><label>Type</label><select name="dataType"><option>Report</option><option>Dashboard</option><option>Clean & Transform</option></select></div><div style="width:160px"><label>Rows</label><input name="dataRows" placeholder="e.g. 10k"/></div></div>`;
    else if (s === 'Consulting') html = `<div class="row"><div style="flex:1"><label>Focus</label><select name="consultFocus"><option>Architecture</option><option>Product</option><option>Security</option></select></div><div style="width:160px"><label>Hours</label><input name="consultHours" placeholder="e.g. 10"/></div></div>`;
    else if (s === 'Tech Support') html = `<div class="row"><div style="flex:1"><label>Level</label><select name="supportLevel"><option>Remote</option><option>Onsite</option><option>Maintenance plan</option></select></div><div style="width:160px"><label>Hours</label><input name="supportHours" placeholder="e.g. 2"/></div></div>`;
    else if (s === 'Support') html = `<div class="small muted">Support request — describe your issue in "Details" and we'll follow up.</div>`;
    dyn.innerHTML = html;
  }
  serviceSelect?.addEventListener('change', renderDynamicOptions);
  renderDynamicOptions();

  // Order form submit -> POST to Formspree and save local backup
  const orderForm = q('#order-form');
  orderForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const terms = q('#terms-check');
    if (terms && !terms.checked) { alert('Please accept the Terms & Conditions before submitting'); return; }

    const fd = new FormData(orderForm);
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = v;
    payload._submittedAt = new Date().toISOString();
    payload.cart = getCart();

    // Save locally for admin demo
    saveSubmissionLocal(payload);

    // POST to Formspree (if configured)
    if (typeof FORMSPREE_ENDPOINT !== 'undefined' && FORMSPREE_ENDPOINT && FORMSPREE_ENDPOINT.length > 5) {
      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Formspree post failed', err);
      }
    }

    // NO mailto fallback here — we use Formspree + local backup
    alert('Order submitted — thank you! We will contact you soon.');
    orderForm.reset();
    q('#modal')?.classList.remove('open');
    localStorage.removeItem('cart');
    renderCartCount();
  });

  // "Add to cart" button inside modal
  q('#add-to-cart-btn')?.addEventListener('click', () => {
    const f = q('#order-form'); if (!f) return alert('Order form not found');
    const fd = new FormData(f);
    const item = { service: fd.get('service'), details: fd.get('details') || '', offerPrice: fd.get('offerPrice') || '' };
    addToCart(item);
    alert('Added to cart');
  });

  // Contract form
  q('#contract-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    obj._requestedAt = new Date().toISOString();
    saveContractLocal(obj);
    alert('Contract request saved locally. We will contact you.');
    q('#contract-modal')?.classList.remove('open');
  });

  // Admin: Manage Jobs (local demo)
  q('#admin-jobs')?.addEventListener('click', () => {
    const pass = prompt('Admin access — enter passphrase');
    if (!pass) return;
    if (pass !== 'aimees-admin') { alert('Wrong passphrase'); return; }
    const modalEl = q('#modal'); if (!modalEl) return;
    modalEl.classList.add('open');
    const panel = modalEl.querySelector('.panel');
    if (!panel) return;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Admin — Jobs, Submissions & Contracts</strong>
        <button id="admin-close">Close</button>
      </div>
      <div style="display:flex;gap:10px;flex-direction:column">
        <div class="admin">
          <h4>Post a job / partnership</h4>
          <label>Title</label>
          <input id="job-title" placeholder="e.g. UI Designer" />
          <label>Description</label>
          <textarea id="job-desc" placeholder="Responsibilities and how to apply"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button id="job-save" class="btn">Save job</button>
            <button id="job-clear" class="btn">Clear all jobs</button>
          </div>
          <div style="margin-top:12px">
            <h5>Current jobs</h5>
            <div id="job-list"></div>
          </div>
        </div>

        <div class="admin">
          <h4>Submissions</h4>
          <div id="submissions-list"></div>
          <div style="margin-top:8px"><button id="clear-submissions" class="btn">Clear submissions</button></div>
        </div>

        <div class="admin">
          <h4>Contract requests</h4>
          <div id="contracts-list"></div>
          <div style="margin-top:8px"><button id="clear-contracts" class="btn">Clear contract requests</button></div>
        </div>
      </div>
    `;

    q('#admin-close')?.addEventListener('click', () => { modalEl.classList.remove('open'); location.reload(); });
    q('#job-save')?.addEventListener('click', () => {
      const t = q('#job-title').value.trim(); const d = q('#job-desc').value.trim();
      if (!t || !d) return alert('Please fill title & description');
      saveJobLocal({ title: t, desc: d, created: new Date().toISOString() });
      renderJobsAdmin(); renderJobsOnPage();
      q('#job-title').value = ''; q('#job-desc').value = '';
    });
    q('#job-clear')?.addEventListener('click', () => { if (confirm('Clear all jobs?')) { localStorage.removeItem('jobs'); renderJobsAdmin(); renderJobsOnPage(); } });
    q('#clear-submissions')?.addEventListener('click', () => { if (confirm('Clear submissions?')) { localStorage.removeItem('submissions'); renderSubmissions(); } });
    q('#clear-contracts')?.addEventListener('click', () => { if (confirm('Clear contract requests?')) { localStorage.removeItem('contracts'); renderContracts(); } });

    renderJobsAdmin(); renderSubmissions(); renderContracts();
  });

  // Admin render helpers
  function renderJobsOnPage() {
    const el = q('#jobs'); if (!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if (!jobs.length) return el.innerHTML = '<div class="muted">No open positions at the moment.</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '12px';
      d.innerHTML = `<strong>${escapeHtml(j.title)}</strong><div class="muted">${escapeHtml(j.desc)}</div><div style="margin-top:8px"><button class="btn" data-apply>Apply</button></div>`;
      el.appendChild(d);
    });
    qAll('[data-apply]').forEach(b => b.addEventListener('click', () => alert('To apply, open the Order form and include the job title in details.')));
  }

  function renderJobsAdmin() {
    const el = q('#job-list'); if (!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if (!jobs.length) return el.innerHTML = '<div class="muted">No jobs</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<strong>${escapeHtml(j.title)}</strong><div class="muted" style="font-size:13px">${escapeHtml(j.desc)}</div><div class="small">Posted: ${new Date(j.created).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderSubmissions() {
    const el = q('#submissions-list'); if (!el) return;
    el.innerHTML = '';
    const subs = JSON.parse(localStorage.getItem('submissions') || '[]');
    if (!subs.length) return el.innerHTML = '<div class="muted">No submissions yet</div>';
    subs.forEach(s => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${escapeHtml(s.name || '—')}</strong> <span class="muted">(${escapeHtml(s.phone || '—')})</span></div><div class="small">Service: ${escapeHtml(s.service || '—')}</div><div class="muted">${escapeHtml(s.details || '')}</div><div class="small">Submitted: ${new Date(s._submittedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderContracts() {
    const el = q('#contracts-list'); if (!el) return;
    el.innerHTML = '';
    const reqs = JSON.parse(localStorage.getItem('contracts') || '[]');
    if (!reqs.length) return el.innerHTML = '<div class="muted">No contract requests</div>';
    reqs.forEach(r => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${escapeHtml(r.company || '—')}</strong> <span class="muted">(${escapeHtml(r.contactPerson || '—')})</span></div><div class="muted">${escapeHtml(r.scope || '')}</div><div class="small">Requested: ${new Date(r._requestedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  q('#apply-job')?.addEventListener('click', () => alert('To apply: open the Order form and include "Applying for job" in details.'));

  // Init UI
  renderJobsOnPage();
  renderCartCount();

})(); // end wrapper
// ----------------- END SCRIPT -----------------      `;
      el.appendChild(div);
    });

    // attach handlers
    el.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', e => {
      const i = Number(btn.getAttribute('data-idx')); removeFromCart(i);
    }));
    el.querySelectorAll('.cart-detail').forEach(inp => inp.addEventListener('change', e => {
      const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { details: inp.value });
    }));
    el.querySelectorAll('.cart-price').forEach(inp => inp.addEventListener('change', e => {
      const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { offerPrice: inp.value });
    }));
  }

  // wire cart UI button
  if(cartBtn) cartBtn.addEventListener('click', () => { renderCartItems(); if(cartModal) cartModal.classList.add('open'); });

  document.getElementById('clear-cart')?.addEventListener('click', () => { if(confirm('Clear cart?')){ localStorage.removeItem('cart'); renderCartItems(); renderCartCount(); } });
  document.getElementById('checkout-cart')?.addEventListener('click', () => {
    const cart = getCart();
    if(!cart.length) return alert('Cart is empty');
    // prefill order modal details with cart summary
    if(document.getElementById('modal')) document.getElementById('modal').classList.add('open');
    const details = cart.map((c,i)=>`${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]');
    if(area) area.value = details;
  });

  // quick add-to-cart buttons
  document.querySelectorAll('.add-to-cart').forEach(b => {
    b.addEventListener('click', () => {
      const svc = b.dataset.service || 'Service';
      addToCart({ service: svc, details: '', offerPrice: '' });
      alert(`${svc} added to cart`);
      renderCartCount();
    });
  });

  // ---------------- MODAL + FORM ----------------
  function openOrderModal(service){
    document.getElementById('modal')?.classList.add('open');
    if(service && document.getElementById('service-select')) {
      document.getElementById('service-select').value = service;
      renderDynamicOptions();
    }
  }

  document.getElementById('open-order')?.addEventListener('click', () => openOrderModal());
  document.getElementById('open-order-cta')?.addEventListener('click', () => openOrderModal());
  document.querySelectorAll('[data-service]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const svc = btn.dataset.service || btn.getAttribute('data-service');
      if(svc && btn.classList.contains('btn')) openOrderModal(svc);
    });
  });

  document.getElementById('close-modal')?.addEventListener('click', () => modal?.classList.remove('open'));
  document.getElementById('close-cart')?.addEventListener('click', () => cartModal?.classList.remove('open'));
  document.getElementById('open-contract')?.addEventListener('click', () => contractModal?.classList.add('open'));
  document.getElementById('close-contract')?.addEventListener('click', () => contractModal?.classList.remove('open'));

  // dynamic options based on selected service
  const serviceSelect = document.getElementById('service-select');
  function renderDynamicOptions(){
    const dynamicOptions = document.getElementById('dynamic-options');
    if(!dynamicOptions || !serviceSelect) return;
    const s = serviceSelect.value;
    let html = '';
    if(s === 'Graphics'){
      html = `
      <div class="row">
        <div style="flex:1"><label>Type</label><select name="graphicType"><option>Poster</option><option>Flyer</option><option>Sticker</option></select></div>
        <div style="width:160px"><label>Size</label><input name="graphicSize" placeholder="A4 / 4x6in" type="text"/></div>
      </div>`;
    } else if(s === 'Websites'){
      html = `<div class="row"><div style="flex:1"><label>Site type</label><select name="siteType"><option>Portfolio</option><option>Business</option><option>E-commerce</option></select></div><div style="width:160px"><label>Pages</label><input name="sitePages" placeholder="e.g. Home,About,Blog,Shop"/></div></div>`;
    } else if(s === 'WebApps'){
      html = `<div class="row"><div style="flex:1"><label>App type</label><select name="appType"><option>Dashboard</option><option>SaaS</option><option>Internal tool</option></select></div><div style="width:160px"><label>Users</label><input name="appUsers" placeholder="small/medium/enterprise"/></div></div>`;
    } else if(s === 'Video Edit'){
      html = `<div class="row"><div style="flex:1"><label>Format</label><select name="videoFormat"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div style="width:160px"><label>Length</label><input name="videoLength" placeholder="seconds or minutes"/></div></div>`;
    } else if(s === 'UI/UX Design'){
      html = `<div class="row"><div style="flex:1"><label>Deliverable</label><select name="uiDeliverable"><option>Prototype</option><option>Design system</option><option>User testing</option></select></div><div style="width:160px"><label>Pages</label><input name="uiPages" placeholder="e.g. 5 screens"/></div></div>`;
    } else if(s === 'Data Analysis'){
      html = `<div class="row"><div style="flex:1"><label>Type</label><select name="dataType"><option>Report</option><option>Dashboard</option><option>Clean & Transform</option></select></div><div style="width:160px"><label>Rows</label><input name="dataRows" placeholder="e.g. 10k"/></div></div>`;
    } else if(s === 'Consulting'){
      html = `<div class="row"><div style="flex:1"><label>Focus</label><select name="consultFocus"><option>Architecture</option><option>Product</option><option>Security</option></select></div><div style="width:160px"><label>Hours</label><input name="consultHours" placeholder="e.g. 10"/></div></div>`;
    } else if(s === 'Tech Support'){
      html = `<div class="row"><div style="flex:1"><label>Level</label><select name="supportLevel"><option>Remote</option><option>Onsite</option><option>Maintenance plan</option></select></div><div style="width:160px"><label>Hours</label><input name="supportHours" placeholder="e.g. 2"/></div></div>`;
    } else if(s === 'Support'){
      html = `<div class="small muted">Support request — describe your issue in "Details" and we'll follow up.</div>`;
    }
    dynamicOptions.innerHTML = html;
  }
  serviceSelect?.addEventListener('change', renderDynamicOptions);
  renderDynamicOptions();

  // Order form submission (checkout)
  const orderForm = document.getElementById('order-form');
  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const terms = document.getElementById('terms-check');
    if(terms && !terms.checked){ alert('Please accept the Terms & Conditions before submitting'); return; }
    const fd = new FormData(orderForm);
    const payload = {};
    for(const [k, v] of fd.entries()) payload[k] = v;
    payload._submittedAt = new Date().toISOString();
    payload.cart = getCart();

    // Save locally for admin demo
    const subs = JSON.parse(localStorage.getItem('submissions') || '[]');
    subs.unshift(payload);
    localStorage.setItem('submissions', JSON.stringify(subs));

    // POST to Formspree if configured
    if(FORMSPREE_ENDPOINT && FORMSPREE_ENDPOINT.length > 5) {
      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch(err) { console.warn('Formspree post failed', err); }
    }

    // fallback: open mail client prefilled
    try {
      const subject = encodeURIComponent('New order — ' + (payload.service || 'Order'));
      const body = encodeURIComponent(Object.entries(payload).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n'));
      window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
    } catch(e) { console.warn('mailto fallback failed', e); }

    alert('Order prepared — your email client should open (if available). A local copy was saved for owner review.');
    orderForm.reset();
    modal?.classList.remove('open');
    localStorage.removeItem('cart');
    renderCartCount();
  });

  // add-to-cart from modal
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    const f = document.getElementById('order-form');
    if(!f) return alert('Order form not found');
    const fd = new FormData(f);
    const item = { service: fd.get('service'), details: fd.get('details') || '', offerPrice: fd.get('offerPrice') || '' };
    addToCart(item);
    alert('Added to cart');
  });

  // simple contract form
  document.getElementById('contract-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); const obj = {};
    for(const [k,v] of fd.entries()) obj[k] = v;
    obj._requestedAt = new Date().toISOString();
    const reqs = JSON.parse(localStorage.getItem('contracts') || '[]');
    reqs.unshift(obj); localStorage.setItem('contracts', JSON.stringify(reqs));
    alert('Contract request saved locally. We will contact you.');
    contractModal?.classList.remove('open');
  });

  // ADMIN (local-demo)
  document.getElementById('admin-jobs')?.addEventListener('click', () => {
    const pass = prompt('Admin access — enter passphrase');
    if(!pass) return;
    if(pass !== 'aimees-admin'){ alert('Wrong passphrase'); return; }
    // open admin modal (re-using order modal for convenience)
    if(!modal) return;
    modal.classList.add('open');
    const panel = modal.querySelector('.panel');
    if(!panel) return;
    panel.innerHTML = `
      <div class="panel-head"><strong>Admin — Jobs, Submissions & Contracts</strong><button id="admin-close">Close</button></div>
      <div style="display:flex;gap:10px;flex-direction:column">
        <div class="admin">
          <h4>Post a job</h4>
          <label>Title</label><input id="job-title" placeholder="e.g. UI Designer" />
          <label>Description</label><textarea id="job-desc" placeholder="Responsibilities and how to apply"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px"><button id="job-save" class="btn">Save job</button><button id="job-clear" class="btn">Clear all jobs</button></div>
          <div style="margin-top:12px"><h5>Current jobs</h5><div id="job-list"></div></div>
        </div>
        <div class="admin">
          <h4>Submissions</h4><div id="submissions-list"></div><div style="margin-top:8px"><button id="clear-submissions" class="btn">Clear submissions</button></div>
        </div>
        <div class="admin">
          <h4>Contract requests</h4><div id="contracts-list"></div><div style="margin-top:8px"><button id="clear-contracts" class="btn">Clear contract requests</button></div>
        </div>
      </div>
    `;
    // attach handlers
    document.getElementById('admin-close').addEventListener('click', () => location.reload());
    document.getElementById('job-save').addEventListener('click', () => {
      const t = document.getElementById('job-title').value.trim();
      const d = document.getElementById('job-desc').value.trim();
      if(!t || !d) return alert('Please fill title & description');
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      jobs.unshift({ title: t, desc: d, created: new Date().toISOString() }); localStorage.setItem('jobs', JSON.stringify(jobs));
      renderJobsAdmin(); renderJobsOnPage();
      document.getElementById('job-title').value=''; document.getElementById('job-desc').value='';
    });
    document.getElementById('job-clear').addEventListener('click', () => { if(confirm('Clear all jobs?')){ localStorage.removeItem('jobs'); renderJobsAdmin(); renderJobsOnPage(); }});
    document.getElementById('clear-submissions').addEventListener('click', () => { if(confirm('Clear submissions?')){ localStorage.removeItem('submissions'); renderSubmissions(); }});
    document.getElementById('clear-contracts').addEventListener('click', () => { if(confirm('Clear contract requests?')){ localStorage.removeItem('contracts'); renderContracts(); }});
    renderJobsAdmin(); renderSubmissions(); renderContracts();
  });

  // render helpers for admin
  function renderJobsOnPage(){
    const el = document.getElementById('jobs'); if(!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if(!jobs.length) return el.innerHTML = '<div class="muted">No open positions at the moment.</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '12px';
      d.innerHTML = `<strong>${j.title}</strong><div class="muted">${j.desc}</div><div style="margin-top:8px"><button class="btn" data-apply>Apply</button></div>`;
      el.appendChild(d);
    });
    document.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => alert('To apply, open the Order form and include the job title in details.')));
  }

  function renderJobsAdmin(){
    const el = document.getElementById('job-list'); if(!el) return;
    el.innerHTML = '';
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    if(!jobs.length) return el.innerHTML = '<div class="muted">No jobs</div>';
    jobs.forEach(j => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<strong>${j.title}</strong><div class="muted" style="font-size:13px">${j.desc}</div><div class="small">Posted: ${new Date(j.created).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderSubmissions(){
    const el = document.getElementById('submissions-list'); if(!el) return;
    el.innerHTML = '';
    const subs = JSON.parse(localStorage.getItem('submissions') || '[]');
    if(!subs.length) return el.innerHTML = '<div class="muted">No submissions yet</div>';
    subs.forEach(s => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${s.name||'—'}</strong> <span class="muted">(${s.phone||'—'})</span></div><div class="small">Service: ${s.service||'—'}</div><div class="muted">${s.details||''}</div><div class="small">Submitted: ${new Date(s._submittedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  function renderContracts(){
    const el = document.getElementById('contracts-list'); if(!el) return;
    el.innerHTML = '';
    const reqs = JSON.parse(localStorage.getItem('contracts') || '[]');
    if(!reqs.length) return el.innerHTML = '<div class="muted">No contract requests</div>';
    reqs.forEach(r => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px';
      d.innerHTML = `<div><strong>${r.company||'—'}</strong> <span class="muted">(${r.contactPerson||'—'})</span></div><div class="muted">${r.scope||''}</div><div class="small">Requested: ${new Date(r._requestedAt).toLocaleString()}</div>`;
      el.appendChild(d);
    });
  }

  // apply & job UI
  document.getElementById('apply-job')?.addEventListener('click', () => alert('To apply: open the Order form and include "Applying for job" in details.'));

  // init
  renderJobsOnPage();
  renderCartCount();
});





