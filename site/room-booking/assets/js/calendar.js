/* calendar.js — two-month date-range picker with blocked days. */

import { state } from './state.js';
import { iso, fmt, today, byId } from './utils.js';

export function initCal(){
  const t = today();
  state.calBase = new Date(t.getFullYear(), t.getMonth(), 1);
  renderCal();
  updateReadout();
}

export function nights(){
  if (!state.checkIn || !state.checkOut) return 0;
  return Math.round((state.checkOut - state.checkIn) / 86400000);
}

function shiftCal(n){
  const t = today();
  const min  = new Date(t.getFullYear(), t.getMonth(), 1);
  const next = new Date(state.calBase.getFullYear(), state.calBase.getMonth() + n, 1);
  if (next < min) return;
  state.calBase = next;
  renderCal();
}

export function renderCal(){
  const wrap = byId('calWrap');
  wrap.innerHTML = '';
  for (let m = 0; m < 2; m++){
    const first = new Date(state.calBase.getFullYear(), state.calBase.getMonth() + m, 1);
    wrap.appendChild(buildMonth(first, m));
  }
}

function buildMonth(first, idx){
  const cal = document.createElement('div');
  cal.className = 'cal';
  cal.appendChild(buildHead(first, idx));

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'dow'; el.textContent = d;
    grid.appendChild(el);
  });
  for (let i = 0; i < first.getDay(); i++){
    const pad = document.createElement('div');
    pad.className = 'day pad';
    grid.appendChild(pad);
  }

  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const t = today();
  for (let d = 1; d <= daysInMonth; d++){
    const date = new Date(first.getFullYear(), first.getMonth(), d);
    const key  = iso(date);
    const el   = document.createElement('div');
    el.className = 'day';
    el.textContent = d;
    el.setAttribute('role', 'button');

    if (date < t) el.classList.add('past');
    else if (state.blocked.has(key)) el.classList.add('blocked');
    else {
      el.tabIndex = 0;
      el.addEventListener('click', () => pickDate(date));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pickDate(date); }
      });
    }

    if (state.checkIn  && iso(state.checkIn)  === key) el.classList.add('sel');
    if (state.checkOut && iso(state.checkOut) === key) el.classList.add('sel');
    if (state.checkIn && state.checkOut && date > state.checkIn && date < state.checkOut){
      el.classList.add('in-range');
    }
    grid.appendChild(el);
  }
  cal.appendChild(grid);
  return cal;
}

function buildHead(first, idx){
  const head = document.createElement('div');
  head.className = 'cal-head';

  const left = navButton('‹', 'Previous month', -1, idx === 0);
  const mon  = document.createElement('span');
  mon.className = 'mon';
  mon.textContent = first.toLocaleDateString('en-US', { month:'long', year:'numeric' });
  const right = navButton('›', 'Next month', 1, idx === 1);

  head.append(left, mon, right);
  return head;
}

function navButton(glyph, label, delta, show){
  if (!show) return document.createElement('span');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cal-nav';
  b.setAttribute('aria-label', label);
  b.textContent = glyph;
  b.addEventListener('click', () => shiftCal(delta));
  return b;
}

/* A range is only selectable if no blocked night falls inside it. */
function rangeIsClear(a, b){
  const cur = new Date(a);
  while (cur < b){
    if (state.blocked.has(iso(cur))) return false;
    cur.setDate(cur.getDate() + 1);
  }
  return true;
}

function pickDate(date){
  if (!state.checkIn || (state.checkIn && state.checkOut)){
    state.checkIn = date; state.checkOut = null;
  } else if (date <= state.checkIn || !rangeIsClear(state.checkIn, date)){
    state.checkIn = date; state.checkOut = null;
  } else {
    state.checkOut = date;
  }
  renderCal();
  updateReadout();
}

function updateReadout(){
  byId('ciReadout').textContent     = state.checkIn  ? fmt(state.checkIn)  : '—';
  byId('coReadout').textContent     = state.checkOut ? fmt(state.checkOut) : '—';
  byId('nightsReadout').textContent = nights() || '—';
}
