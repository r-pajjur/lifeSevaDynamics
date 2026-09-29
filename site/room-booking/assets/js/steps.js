/* steps.js — panel navigation and per-step validation. */

import { MAX_OCCUPANTS } from './config.js';
import { state } from './state.js';
import { buildReview } from './review.js';
import { occupantCount, memberRows } from './party.js';
import { selectedMode } from './transport.js';
import { byId, val, $$ } from './utils.js';

export function initSteps(){
  $$('[data-action="next"]').forEach(b =>
    b.addEventListener('click', () => nextStep(Number(b.dataset.step))));
  $$('[data-action="prev"]').forEach(b =>
    b.addEventListener('click', () => showStep(Number(b.dataset.step) - 1)));

  byId('purpose').addEventListener('change', e => {
    byId('externalNotice').style.display = e.target.value === 'external' ? 'block' : 'none';
  });
}

export function showStep(n){
  state.step = n;
  $$('.step-panel').forEach(p => { p.hidden = Number(p.dataset.panel) !== n; });
  $$('#stepper .step').forEach(s => {
    const sn = Number(s.dataset.step);
    s.classList.toggle('current', sn === n);
    s.classList.toggle('done', sn < n);
    s.querySelector('.dot').textContent = sn < n ? '✓' : sn;
  });
  window.scrollTo({ top: byId('stepper').offsetTop - 90, behavior: 'smooth' });
}

function nextStep(n){
  if (!validateStep(n)) return;
  if (n === 4) buildReview();
  showStep(n + 1);
}

function markInvalid(id, bad){
  byId(id).classList.toggle('invalid', bad);
  return !bad;
}

function validateStep(n){
  switch (n){
    case 1: return validateDates();
    case 2: return validateGuest();
    case 3: return validateParty();
    case 4: return validateTransport();
    default: return true;
  }
}

function validateDates(){
  const purpose = byId('purpose').value;
  let ok = markInvalid('f-purpose', !purpose);
  // External group retreats are booked in bulk by the organizer, not here.
  if (purpose === 'external') ok = false;

  const datesOk = Boolean(state.checkIn && state.checkOut);
  byId('dateError').style.display = datesOk ? 'none' : 'block';
  return ok && datesOk;
}

function validateGuest(){
  let ok = markInvalid('f-fname', !val('fname'));
  ok = markInvalid('f-lname', !val('lname')) && ok;
  ok = markInvalid('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) && ok;
  ok = markInvalid('f-phone', val('phone').replace(/\D/g, '').length < 10) && ok;
  return ok;
}

function validateParty(){
  const o = Number(val('occupants'));
  let ok = markInvalid('f-occupants', !(o >= 1 && o <= MAX_OCCUPANTS));
  if (occupantCount() > 1){
    memberRows().forEach(row => {
      const bad = !row.querySelector('.m-name').value.trim();
      row.classList.toggle('invalid', bad);
      row.querySelector('.field-error').style.display = bad ? 'block' : 'none';
      if (bad) ok = false;
    });
  }
  return ok;
}

function validateTransport(){
  const mode = selectedMode();
  byId('transportError').style.display = mode ? 'none' : 'block';
  return Boolean(mode);
}
