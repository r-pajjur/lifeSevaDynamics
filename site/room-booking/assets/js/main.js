/* main.js — entry point: wire the modules together and start the form. */

import { state, setBlocked } from './state.js';
import { fetchAvailability } from './api.js';
import { initCal, renderCal } from './calendar.js';
import { initParty } from './party.js';
import { initTransport } from './transport.js';
import { initSteps } from './steps.js';
import { initSubmit } from './submit.js';
import { byId } from './utils.js';

/* Which retreat is this registration for? e.g. index.html?retreat=summer-2026 */
state.retreatId = new URLSearchParams(location.search).get('retreat');

initCal();
initParty();
initTransport();
initSteps();
initSubmit();

/* Nothing here posts a form the browser way; keep Enter from reloading the page. */
byId('bookingForm').addEventListener('submit', e => e.preventDefault());

const logo = byId('brandLogo');
if (logo) logo.addEventListener('error', () => { logo.style.display = 'none'; });

/* Refresh blocked dates from the backend; the fallback list shows meanwhile. */
fetchAvailability(state.retreatId)
  .then(({ blocked }) => { setBlocked(blocked); renderCal(); })
  .catch(err => console.warn('Availability unavailable, using fallback dates', err));
