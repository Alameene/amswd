// script.js - single reliable script for AIMEES WD
// Config - set these
const OWNER_EMAIL = 'adelekealameen16@gmail.com';
const CALL_NUMBER = '+2349132252381';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjkzjdbd'; // your endpoint

// Small helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const safe = (fn) => { try { return fn(); } catch (e) { console.warn('safe() error', e); return null; } };
function esc(s){ if(typeof s !== 'string') return s; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Local storage helpers
function read(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Cart helpers
function getCart(){ return read('cart'); }
function saveCart(arr){ write('cart', arr); renderCartCount(); }
function addToCart(item){ const arr = getCart(); arr.push(item); saveCart(arr); }
function removeFromCart(i){ const arr = getCart(); arr.splice(i,1); saveCart(arr); renderCartItems(); }
function updateCartItem(i, fields){ const arr = getCart(); arr[i] = Object.assign({}, arr[i], fields); saveCart(arr); renderCartItems(); }

function renderCartCount(){
  const el = $('#cart-count');
  if(el) el.innerText = getCart().length;
}

function renderCartItems(){
  const container = $('#cart-items');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(!cart.length){ container.innerHTML = '<div class="muted">Cart is empty</div>'; return; }

  cart.forEach((it, idx) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.padding = '8px';
    div.innerHTML = `
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
        <input data-idx="${idx}" class="cart-price" value="${esc(it.offerPrice||'')}" placeholder="e.g. 50000 NGN" />
      </div>
    `;
    container.appendChild(div);
  });

  // handlers
  $$('.remove-item').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.getAttribute('data-idx')); removeFromCart(i);
  }));
  $$('.cart-detail').forEach(inp => inp.addEventListener('change', () => {
    const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { details: inp.value });
  }));
  $$('.cart-price').forEach(inp => inp.addEventListener('change', () => {
    const i = Number(inp.getAttribute('data-idx')); updateCartItem(i, { offerPrice: inp.value });
  }));
}

// dynamic options for service types
function renderDynamicOptions(){
  const dyn = $('#dynamic-options');
  const sel = $('#service-select');
  if(!dyn || !sel) return;
  const s = sel.value;
  let html = '';
  if (s === 'Graphics') {
    html = `<div class="row"><div style="flex:1"><label>Type</label><select name="graphicType"><option>Poster</option><option>Flyer</option><option>Sticker</option></select></div><div style="width:160px"><label>Size</label><input name="graphicSize" placeholder="A4 / 4x6in" /></div></div>`;
  } else if (s === 'Websites') {
    html = `<div class="row"><div style="flex:1"><label>Site type</label><select name="siteType"><option>Portfolio</option><option>Business</option><option>E-commerce</option></select></div><div style="width:160px"><label>Pages</label><input name="sitePages" placeholder="e.g. Home,About,Blog,Shop" /></div></div>`;
  } else if (s === 'WebApps') {
    html = `<div class="row"><div style="flex:1"><label>App type</label><select name="appType"><option>Dashboard</option><option>SaaS</option><option>Internal tool</option></select></div><div style="width:160px"><label>Users</label><input name="appUsers" placeholder="small/medium/enterprise" /></div></div>`;
  } else if (s === 'Video Edit') {
    html = `<div class="row"><div style="flex:1"><label>Format</label><select name="videoFormat"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div style="width:160px"><label>Length</label><input name="videoLength" placeholder="seconds or minutes" /></div></div>`;
  } else if (s === 'UI/UX Design') {
    html = `<div class="row"><div style="flex:1"><label>Deliverable</label><select name="uiDeliverable"><option>Prototype</option><option>Design system</option><option>User testing</option></select></div><div style="width:160px"><label>Pages</label><input name="uiPages" placeholder="e.g. 5 screens" /></div></div>`;
  } else if (s === 'Data Analysis') {
    html = `<div class="row"><div style="flex:1"><label>Type</label><select name="dataType"><option>Report</option><option>Dashboard</option><option>Clean & Transform</option></select></div><div style="width:160px"><label>Rows</label><input name="dataRows" placeholder="e.g. 10k" /></div></div>`;
  } else if (s === 'Consulting') {
    html = `<div class="row"><div style="flex:1"><label>Focus</label><select name="consultFocus"><option>Architecture</option><option>Product</option><option>Security</option></select></div><div style="width:160px"><label>Hours</label><input name="consultHours" placeholder="e.g. 10" /></div></div>`;
  } else if (s === 'Tech Support') {
    html = `<div class="row"><div style="flex:1"><label>Level</label><select name="supportLevel"><option>Remote</option><option>Onsite</option><option>Maintenance plan</option></select></div><div style="width:160px"><label>Hours</label><input name="supportHours" placeholder="e.g. 2" /></div></div>`;
  } else if (s === 'Support') {
    html = `<div class="small muted">Support request — describe your issue in "Details" and we'll follow up.</div>`;
  }
  dyn.innerHTML = html;
}

// local admin backups
function saveSubmissionLocal(obj){
  const arr = read('submissions'); arr.unshift(obj); write('submissions', arr);
}

// send order (Formspree + local save) - no mailto fallback
async function submitOrder(payload){
  saveSubmissionLocal(payload);
  if (FORMSPREE_ENDPOINT && FORMSPREE_ENDPOINT.length > 5){
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.info('Formspree POST attempted');
    } catch(err){
      console.warn('Formspree POST failed', err);
    }
  }
  // success
  alert('Order submitted — thank you! We will contact you soon.');
  const f = $('#order-form'); if(f) f.reset();
  $('#modal')?.classList.remove('open');
  localStorage.removeItem('cart');
  renderCartCount();
}

// main wiring executed on DOM ready
function wireUp(){
  console.info('script.js initializing...');

  // populate contact info
  safe(()=>{ if($('#owner-email')) $('#owner-email').innerText = OWNER_EMAIL; if($('#call-link')) $('#call-link').href = 'tel:' + CALL_NUMBER; if($('#footer-call')) $('#footer-call').href = 'tel:' + CALL_NUMBER; if($('#year')) $('#year').innerText = new Date().getFullYear(); });

  // default dark theme if you want
  safe(()=>{ document.documentElement.setAttribute('data-theme','dark'); localStorage.setItem('site-dark','1'); });

  // nav links smooth scroll
  $$('[data-link]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault(); const tgt = a.getAttribute('href')?.replace('#',''); if(!tgt) return; const el = document.getElementById(tgt); if(el) el.scrollIntoView({behavior:'smooth'});
  }));

  // open modals
  $('#open-order')?.addEventListener('click', ()=>{ $('#modal')?.classList.add('open'); renderDynamicOptions(); });
  $('#open-order-cta')?.addEventListener('click', ()=>{ $('#modal')?.classList.add('open'); renderDynamicOptions(); });
  $('#open-contract')?.addEventListener('click', ()=>{ $('#contract-modal')?.classList.add('open'); });
  $('#close-contract')?.addEventListener('click', ()=>{ $('#contract-modal')?.classList.remove('open'); });
  $('#close-modal')?.addEventListener('click', ()=>{ $('#modal')?.classList.remove('open'); });
  $('#close-cart')?.addEventListener('click', ()=>{ $('#cart-modal')?.classList.remove('open'); });

  // add-to-cart buttons on cards
  $$('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const svc = btn.getAttribute('data-service') || 'Service';
      addToCart({ service: svc, details: '', offerPrice: '' });
      alert(svc + ' added to cart');
    });
  });

  // add to cart inside order modal
  $('#add-to-cart-btn')?.addEventListener('click', () => {
    const form = $('#order-form'); if(!form) return alert('Order form not found');
    const fd = new FormData(form);
    const item = { service: fd.get('service'), details: fd.get('details')||'', offerPrice: fd.get('offerPrice')||'' };
    addToCart(item);
    alert('Added to cart');
  });

  // cart button open
  $('#cart-btn')?.addEventListener('click', () => { renderCartItems(); $('#cart-modal')?.classList.add('open'); });

  // clear cart
  $('#clear-cart')?.addEventListener('click', ()=>{ if(confirm('Clear cart?')){ localStorage.removeItem('cart'); renderCartItems(); renderCartCount(); }});

  // checkout from cart -> open order modal and prefill
  $('#checkout-cart')?.addEventListener('click', ()=> {
    const cart = getCart(); if(!cart.length) return alert('Cart is empty');
    $('#modal')?.classList.add('open');
    $('#modal-title') && ($('#modal-title').innerText = 'Checkout — finalize order');
    const details = cart.map((c,i)=>`${i+1}. ${c.service} — details: ${c.details||'-'} — offer: ${c.offerPrice||'-'}`).join('\n');
    const area = document.querySelector('#order-form textarea[name="details"]');
    if(area) area.value = details;
  });

  // dynamic options
  $('#service-select')?.addEventListener('change', renderDynamicOptions);
  renderDynamicOptions();

  // order submission
  const orderForm = $('#order-form');
  if(orderForm){
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if($('#terms-check') && !$('#terms-check').checked){ alert('Please accept the Terms & Conditions before submitting'); return; }
      const fd = new FormData(orderForm);
      const payload = {};
      for(const [k,v] of fd.entries()) payload[k] = v;
      payload._submittedAt = new Date().toISOString();
      payload.cart = getCart();
      await submitOrder(payload);
    });
  }

  // contract form submission
  $('#contract-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); const obj = {};
    for(const [k,v] of fd.entries()) obj[k] = v;
    obj._requestedAt = new Date().toISOString();
    const arr = read('contracts'); arr.unshift(obj); write('contracts', arr);
    alert('Contract request saved locally. We will contact you.');
    $('#contract-modal')?.classList.remove('open');
  });

  // admin/manage jobs (local)
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
      const t = $('#job-title').value.trim(); const d = $('#job-desc').value.trim();
      if(!t||!d) return alert('Please fill title & description');
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

  // initial renders
  renderJobsOnPage();
  renderCartCount();
  renderCartItems();

  console.info('script.js loaded and wired.');
} // wireUp end

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
else wireUp();
