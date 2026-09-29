/* review.js — the step 5 summary table and cost breakdown. */

import { NIGHTLY_RATE, DEPOSIT_PCT } from './config.js';
import { state } from './state.js';
import { nights } from './calendar.js';
import { occupantCount, roomCount, memberRows } from './party.js';
import { selectedMode } from './transport.js';
import { byId, val, fmt, escapeHtml } from './utils.js';

export function buildReview(){
  const occ   = occupantCount();
  const rooms = roomCount();
  const n     = nights();

  const rows = [
    ['Guest',   `${val('fname')} ${val('lname')} · ${val('email')} · ${val('phone')}`],
    ['Stay',    `${fmt(state.checkIn)} → ${fmt(state.checkOut)} · ${n} night${n > 1 ? 's' : ''}`],
    ['Purpose', byId('purpose').selectedOptions[0].text],
    ['Party',   partySummary(occ)],
    ['Rooms',   `${rooms} room${rooms > 1 ? 's' : ''} (estimated — confirmed by the Events team)`],
    ['Meals',   dietSummary()],
    ['Arrival', transportSummary() || '—']
  ];

  byId('reviewGrid').innerHTML = rows.map(([k, v]) =>
    `<div class="review-row"><div class="k">${k}</div><div class="v">${escapeHtml(v)}</div></div>`
  ).join('');

  byId('costBox').innerHTML = costBreakdown(rooms, n);
}

export function costBreakdown(rooms, n){
  const total   = rooms * n * NIGHTLY_RATE;
  const deposit = Math.round(total * DEPOSIT_PCT);
  const pct     = Math.round(DEPOSIT_PCT * 100);
  return `
    <div class="row"><span>Suggested contribution — ${rooms} room${rooms > 1 ? 's' : ''} × ${n} night${n > 1 ? 's' : ''} × $${NIGHTLY_RATE}</span><span>$${total.toLocaleString()}</span></div>
    <div class="row deposit"><span>Deposit due today (${pct}%)</span><span>$${deposit.toLocaleString()}</span></div>
    <div class="row"><span>Balance at check-out</span><span>$${(total - deposit).toLocaleString()}</span></div>
    <div class="row total"><span>Total for your stay</span><span>$${total.toLocaleString()}</span></div>`;
}

export function partyMembers(){
  return memberRows().map(r => ({
    name:         r.querySelector('.m-name').value.trim(),
    gender:       r.querySelector('.m-gender').value,
    relationship: r.querySelector('.m-rel').value
  })).filter(m => m.name);
}

function partySummary(occ){
  const names = partyMembers().map(m => `${m.name} (${m.relationship.toLowerCase()})`);
  return `${occ} guest${occ > 1 ? 's' : ''}` + (names.length ? ` — with ${names.join(', ')}` : '');
}

function dietSummary(){
  return byId('dietPref').selectedOptions[0].text +
         (val('allergies') ? ` · allergies: ${val('allergies')}` : '');
}

export function transportSummary(){
  const mode = selectedMode();
  if (!mode) return '';
  if (mode.value === 'driving'){
    return 'Driving' + (byId('parkingSpot').checked ? ' · parking spot reserved' : '');
  }
  if (mode.value === 'flight'){
    return 'Flying' +
      (val('flightNo') ? ` · ${val('flightNo')}` : '') +
      (byId('airportPickup').checked ? ' · airport pickup requested' : '');
  }
  return 'Train / Bus' +
    (val('stationName') ? ` · ${val('stationName')}` : '') +
    (byId('stationPickup').checked ? ' · station pickup requested' : '');
}
