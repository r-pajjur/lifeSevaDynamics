/* state.js — the single mutable record of what the guest has entered. */

import { FALLBACK_BLOCKED } from './config.js';

export const state = {
  step: 1,
  checkIn: null,    // Date
  checkOut: null,   // Date
  calBase: null,    // first visible month
  members: [],      // additional party members
  blocked: new Set(FALLBACK_BLOCKED),  // ISO date strings that cannot be booked
  retreatId: null   // set from ?retreat= once bookings are scoped to a retreat
};

export function setBlocked(dates){ state.blocked = new Set(dates); }
