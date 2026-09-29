/* party.js — additional guests and the room-count estimate. */

import { MAX_OCCUPANTS, OCCUPANTS_PER_ROOM } from './config.js';
import { byId, val, $$ } from './utils.js';

export function initParty(){
  byId('occupants').addEventListener('input', renderMembers);
  renderMembers();
}

export function occupantCount(){
  return Math.min(MAX_OCCUPANTS, Math.max(1, Number(val('occupants')) || 1));
}

export function roomCount(){
  return Math.ceil(occupantCount() / OCCUPANTS_PER_ROOM);
}

export function memberRows(){
  return $$('#memberList .member-row');
}

function renderMembers(){
  const count  = occupantCount();
  const list   = byId('memberList');
  const needed = count - 1;

  byId('partySection').style.display = count > 1 ? 'block' : 'none';

  for (let i = memberRows().length; i < needed; i++){
    list.appendChild(buildMemberCard(i));
  }
  while (memberRows().length > needed){
    list.lastElementChild.remove();
  }

  byId('roomCount').textContent = roomCount();
}

function buildMemberCard(i){
  const card = document.createElement('div');
  card.className = 'occupant-card member-row';
  card.innerHTML = `
    <h4>Guest ${i + 2}</h4>
    <div class="grid three">
      <div><label>Full Name <span class="req">*</span></label><input type="text" class="m-name" placeholder="Full name"></div>
      <div><label>Gender</label>
        <select class="m-gender">
          <option value="">Prefer not to say</option>
          <option>Female</option><option>Male</option><option>Non-binary</option>
        </select></div>
      <div><label>Relationship to You</label>
        <select class="m-rel">
          <option>Spouse</option><option>Child</option><option>Parent</option>
          <option>Sibling</option><option>Extended family</option>
          <option>Friend</option><option>Fellow seeker</option>
        </select></div>
    </div>
    <div class="field-error" style="display:none">Please enter this guest's name.</div>`;
  return card;
}
