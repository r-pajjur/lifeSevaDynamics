/* api.js — every call to the backend goes through here.
   Today these are stubs; swapping in real fetches touches no other file. */

import { API_BASE, FALLBACK_BLOCKED } from './config.js';

async function request(path, options = {}){
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/* Dates that cannot be booked for this retreat. */
export async function fetchAvailability(retreatId){
  // return request(`/api/retreats/${retreatId}/availability`);
  return { blocked: FALLBACK_BLOCKED };
}

/* Create the reservation. Returns { reference, checkoutUrl }. */
export async function createBooking(payload){
  // return request('/api/bookings', { method:'POST', body: JSON.stringify(payload) });
  const year = new Date().getFullYear();
  const seq  = String(Math.floor(1000 + Math.random() * 9000));
  return { reference: `LG-${year}-${seq}`, checkoutUrl: null };
}
