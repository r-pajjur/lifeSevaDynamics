/* config.js — tunable values and API endpoints.
   Anything a retreat organizer might change lives here, not in the logic. */

export const NIGHTLY_RATE = 95;   // suggested contribution per room per night
export const DEPOSIT_PCT  = 0.25;
export const MAX_OCCUPANTS = 10;
export const OCCUPANTS_PER_ROOM = 2;

/* Base URL of the booking API. Empty string = same origin. */
export const API_BASE = '';

/* Fallback unavailable dates, used until the availability API answers.
   Replace with api.fetchAvailability() once the backend is live. */
export const FALLBACK_BLOCKED = [
  '2026-07-17','2026-07-18','2026-07-19',
  '2026-08-01','2026-08-02','2026-08-08','2026-08-09','2026-08-10','2026-08-11',
  '2026-08-28','2026-08-29','2026-08-30',
  '2026-09-12','2026-09-13','2026-09-25','2026-09-26','2026-09-27',
  '2026-10-09','2026-10-10','2026-10-11'
];
