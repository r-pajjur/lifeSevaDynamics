/* utils.js — small DOM and date helpers shared across modules. */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const byId = id => document.getElementById(id);
export const val  = id => byId(id).value.trim();

/* "Fri, Aug 14, 2026" */
export const fmt = d => d.toLocaleDateString('en-US',
  { weekday:'short', month:'short', day:'numeric', year:'numeric' });

/* "2026-08-14" — local date, not UTC, so it matches what the user clicked. */
export const iso = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const today = () => { const t = new Date(); t.setHours(0,0,0,0); return t; };

export const escapeHtml = s => String(s).replace(/[&<>"']/g,
  c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
