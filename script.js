// ----------------- SCRIPT: paste to replace existing script blocks -----------------
// ============ CONFIG ============
const OWNER_EMAIL = 'adelekealameen16@gmail.com';
const CALL_NUMBER = '+2349132252381';
// Your Formspree endpoint
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjkzjdbd';
// =================================

// Wrap to avoid polluting global scope
(function () {
  // Basic init
  try { document.documentElement.setAttribute('data-theme', 'dark'); } catch (e) { /* ignore */ }
  // Sync contact info in page
  const ownerEmailEl = document.getElementById('owner-email');
  const callLink = document.getElementById('call-link');
  if (ownerEmailEl) ownerEmailEl.innerText = OWNER_EMAIL;
  if (callLink) callLink.href = 'tel:' + CALL_NUMBER;
  document.getElementById('footer-call')?.setAttribute('href', 'tel:' + CALL_NUMBER);
  document.getElementById('year')?.innerText = new Date().getFullYear();

  // Helpers for localStorage-backed data
  function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
  function setCart(v) { localStorage.setItem('cart', JSON.stringify(v)); renderCartCount(); }
  function saveSubmissionLocal(obj) { const all = JSON.parse(localStorage.getItem('submissions') || '[]'); all.unshift(obj); localStorage.setItem('submissions', JSON.stringify(all)); }
  function saveContractLocal(obj) { const all = JSON.parse(localStorage.getItem('contracts') || '[]'); all.unshift(obj); localStorage.setItem('contracts', JSON.stringify(all)); }
  function saveJobLocal(obj) { const all = JSON.parse(localStorage.getItem('jobs') || '[]'); all.unshift(obj); localStorage.setItem('jobs', JSON.stringify(all)); }

  // Cart functions & UI
  function renderCartCount() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    el.innerText = getCart().length;
  }

  function renderCartItems() {
    const el = document.getElementById('cart-items');
    if (!el) return;
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


