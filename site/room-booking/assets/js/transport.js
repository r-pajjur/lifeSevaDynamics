/* transport.js — arrival-mode cards and the follow-up fields each one reveals. */

import { byId, $$ } from './utils.js';

const EXTRAS = { driving:'drivingExtras', flight:'flightExtras', train:'trainExtras' };

export function initTransport(){
  $$('#transportCards .radio-card').forEach(card => {
    card.addEventListener('click', () => selectMode(card));
  });
}

export function selectedMode(){
  return document.querySelector('input[name=transport]:checked');
}

function selectMode(card){
  $$('#transportCards .radio-card').forEach(c => c.classList.remove('sel'));
  card.classList.add('sel');
  card.querySelector('input').checked = true;

  const mode = card.dataset.mode;
  Object.entries(EXTRAS).forEach(([m, id]) => {
    byId(id).style.display = m === mode ? 'block' : 'none';
  });
  byId('transportError').style.display = 'none';
}
