/* submit.js — assemble the booking payload, hand it to the API, show confirmation. */

import { state } from './state.js';
import { createBooking } from './api.js';
import { nights } from './calendar.js';
import { occupantCount, roomCount } from './party.js';
import { partyMembers, transportSummary } from './review.js';
import { selectedMode } from './transport.js';
import { byId, val, iso, $$ } from './utils.js';

export function initSubmit(){
  byId('submitBtn').addEventListener('click', submitBooking);
}

export function buildPayload(){
  const mode = selectedMode();
  return {
    retreatId: state.retreatId,
    stay: {
      checkIn:  iso(state.checkIn),
      checkOut: iso(state.checkOut),
      nights:   nights(),
      purpose:  byId('purpose').value
    },
    guest: {
      firstName: val('fname'),
      lastName:  val('lname'),
      email:     val('email'),
      phone:     val('phone'),
      notes:     val('notes')
    },
    party: {
      occupants:     occupantCount(),
      estimatedRooms: roomCount(),
      members:       partyMembers()
    },
    meals: {
      preference: byId('dietPref').value,
      allergies:  val('allergies')
    },
    arrival: {
      mode:    mode ? mode.value : null,
      summary: transportSummary(),
      flightNo:     val('flightNo'),
      arrivalTime:  val('arrivalTime'),
      station:      val('stationName'),
      trainArrival: val('trainArrival'),
      parkingSpot:    byId('parkingSpot').checked,
      airportPickup:  byId('airportPickup').checked,
      stationPickup:  byId('stationPickup').checked
    },
    policyAcceptedAt: new Date().toISOString()
  };
}

async function submitBooking(){
  const agreed = byId('policyAgree').checked;
  byId('policyError').style.display = agreed ? 'none' : 'block';
  if (!agreed) return;

  const btn = byId('submitBtn');
  btn.disabled = true;
  try {
    const { reference, checkoutUrl } = await createBooking(buildPayload());
    if (checkoutUrl){ window.location.href = checkoutUrl; return; }
    showConfirmation(reference);
  } catch (err) {
    console.error('Booking failed', err);
    btn.disabled = false;
    alert('We could not complete your reservation. Please try again, or write to info@lifegurukula.org.');
  }
}

function showConfirmation(reference){
  byId('refCode').textContent = reference;
  byId('confirmEmail').textContent = val('email');
  $$('#stepper .step').forEach(s => {
    s.classList.remove('current');
    s.classList.add('done');
    s.querySelector('.dot').textContent = '✓';
  });
  $$('.step-panel').forEach(p => { p.hidden = p.dataset.panel !== '6'; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
