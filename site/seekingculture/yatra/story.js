/*
  story.js — ALL of the game's words live here. No logic.
  Edit freely: titles, text, options, results, and "grace" (Bhagavan's view) lines.

  Scene fields
    title, place, text        what the group reads
    art                       which pixel picture to draw (see pixel-scenes.js)
    kind                      "pack" | "story" (a page with no question) | "main" | "detour" | "recovery"
    options[]                 the choices (shown in a shuffled order that is the same for everyone)
      label                   button text
      needs                   item id this uses up (the button is locked if it was never packed or is already used)
      hideUnlessFlag          only show if an earlier choice set this flag
      effects                 meter changes, e.g. { calm: +5, health: -10 }
      days                    how many days this choice takes
      setFlag                 remembers something for later scenes
      next                    scene id that comes after ("end" = arrive at the temple)
      optimal                 true on the best choice (used for the efficiency %)
      result                  what the group sees right after choosing
      grace                   Bhagavan's view, shown in the review at the end
*/

window.STORY = {
  title: "The Yatra",
  tagline: "A pilgrimage for your breakout group. Every choice is yours to make together.",
  verse: {
    devanagari: "कर्तुराज्ञया प्राप्यते फलम् । कर्म किं परं कर्म तज्जडम् ॥",
    roman: "kartur ājñayā prāpyate phalam, karma kiṁ paraṁ karma taj jaḍam",
    meaning: "By the command of the Creator the fruit is gained. Is action supreme? Action is inert.",
    source: "Upadesha Sara, verse 1 · Bhagavan Sri Ramana Maharshi",
  },

  start: "pack",

  items: {
    rope: { name: "Rope", note: "Strong coconut-fibre rope" },
    lamp: { name: "Oil lamp", note: "A small brass diya with a little oil" },
    blanket: { name: "Wool blanket", note: "Thick and warm, big enough to share" },
    herbs: { name: "Healing herbs", note: "A pouch of herbs that can cure a fever" },
    staff: { name: "Bamboo staff", note: "For walking, and for standing your ground" },
  },
  packCount: 3,

  // The best result any group can get (worked out by trying every route). Used for the efficiency %.
  benchmark: { days: 9, avg: 81 },

  scenes: {
    /* ---------- PACKING ---------- */
    pack: {
      kind: "pack",
      art: "village",
      title: "Packing for the road",
      place: "The village",
      text:
        "There is room in the cloth bundle for only three things, and each one can only be used once. Once it's used, it's gone. Choose together, but the decision is yours.",
      next: "prologue",
      optimalItems: ["rope", "lamp", "blanket"],
      result: "The bundle is tied. You touch the village shrine one last time.",
      grace:
        "You packed without knowing what the road would ask of you. Preparing was your part. What you would need was already known.",
    },

    /* ---------- SETTING THE SCENE (no question) ---------- */
    prologue: {
      kind: "story",
      art: "gate",
      title: "Leaving the village",
      place: "Before sunrise",
      text:
        "Your group of friends sets out before sunrise, bound for the temple on the far hill. Nobody is quite sure how long the walk will take. " +
        "At the village gate, Paati blesses each of you and says: “Do your part well. The rest is His.”",
      next: "river",
    },

    /* ---------- 1. RIVER ---------- */
    river: {
      kind: "main",
      art: "river",
      title: "The river",
      place: "The riverbank",
      text:
        "By noon a fast, cold river blocks the path. There is no bridge and no boat, only an old oak tree on your bank.",
      options: [
        {
          label: "Use up your rope: tie it to the oak so no one gets washed away",
          needs: "rope",
          effects: { calm: +5 },
          days: 1,
          next: "traveler",
          optimal: true,
          result: "You hold the rope for each other. The water is freezing and everyone is laughing on the far bank. Nobody slips. The rope stays tied to the oak.",
          grace: "You used what you packed without knowing why you packed it.",
        },
        {
          label: "Find a piece of wood and float across on it",
          effects: { health: -25, calm: -10 },
          days: 1,
          next: "traveler",
          result: "The log spins in the current and dumps two of you in the water. You drag yourselves out on the far side, soaked and bruised.",
          grace: "The river was never yours to control. Your body learned that the hard way.",
        },
        {
          label: "Walk upstream to look for a shallower spot, even if it takes all day",
          days: 2,
          next: "shepherd",
          result: "It takes the rest of the day, but you find a place shallow enough to cross. An old shepherd is resting there.",
          grace: "The longer way was not wasted. Someone was waiting there for you.",
        },
      ],
    },

    shepherd: {
      kind: "detour",
      art: "shepherd",
      after: "traveler",
      title: "The shepherd",
      place: "Upstream",
      text:
        "An old shepherd sits by the shallow water while his goats wander in every direction. He smiles at you and says nothing.",
      options: [
        {
          label: "Spend an hour helping him round up his goats",
          effects: { calm: +10, faith: +10 },
          days: 0,
          setFlag: "caveTip",
          next: "traveler",
          result: "It takes an hour of chasing. When you finish, he says: “If a storm comes, there is a dry cave on the ridge.”",
          grace: "You gave an hour with nothing to gain from it, and it became your shelter later.",
        },
        {
          label: "Stop and share a meal with him",
          effects: { food: +15, calm: +5 },
          days: 0,
          next: "traveler",
          result: "He adds warm milk and jaggery to your rotis. You leave fuller than you arrived.",
          grace: "You sat down to give, and you got up having received.",
        },
        {
          label: "Thank him and hurry on",
          effects: { faith: +5 },
          days: 0,
          next: "traveler",
          result: "He waves you off with a blessing. You make up a little time.",
          grace: "Even a hurried namaskaram carries a blessing.",
        },
      ],
    },

    /* ---------- 2. SICK TRAVELER ---------- */
    traveler: {
      kind: "main",
      art: "traveler",
      title: "The sick traveler",
      place: "The dusty road",
      text: "An old pilgrim lies by the roadside, burning with fever. He asks, weakly, whether you can help him.",
      options: [
        {
          label: "Give him your healing herbs, even though you may need them later",
          needs: "herbs",
          effects: { faith: +15, calm: +10 },
          days: 1,
          next: "forest",
          optimal: true,
          result: "Within hours his fever breaks. He presses your hands together and blesses the rest of your road.",
          grace: "You gave away your own cure, and the road looked after you instead.",
        },
        {
          label: "Carry him to the next village, even though it costs a day and your strength",
          effects: { health: -15, faith: +10 },
          days: 2,
          next: "forest",
          result: "You take turns carrying him. By evening he is resting in a village home, and your backs ache.",
          grace: "Your shoulders carried him. Something carried you.",
        },
        {
          label: "Leave him some food and keep going",
          effects: { food: -15, faith: -10, calm: -5 },
          days: 1,
          next: "forest",
          result: "You leave rotis and water beside him and walk on. Nobody talks for a while.",
          grace: "You helped a little and walked on. Notice what stayed with you.",
        },
      ],
    },

    /* ---------- 3. FOREST ---------- */
    forest: {
      kind: "main",
      art: "forest",
      title: "The forest at dusk",
      place: "The forest edge",
      text:
        "The sun is setting as you reach a thick forest. Strange sounds come from the trees, and the path disappears into the dark.",
      options: [
        {
          label: "Use up the oil lamp and walk on by its small light",
          needs: "lamp",
          effects: { calm: +5 },
          days: 1,
          next: "bear",
          optimal: true,
          result: "The small flame lights only the next few steps, and that is enough. You are through by midnight, just as the oil runs out.",
          grace: "You never saw the whole forest, only the next step. That was all you needed.",
        },
        {
          label: "Camp at the edge and lose a day waiting for daylight",
          effects: { calm: +10, health: +5 },
          days: 2,
          next: "bear",
          result: "You sleep under the stars and cross the forest in daylight, rested but a day behind.",
          grace: "Rest is not falling behind. The road waited for you.",
        },
        {
          label: "Push through in the dark",
          effects: { health: -10, faith: -15 },
          days: 1,
          next: "lost",
          result: "Within an hour, nobody knows which way the path went.",
          grace: "Getting lost is where you learned to listen.",
        },
      ],
    },

    lost: {
      kind: "detour",
      art: "lost",
      after: "bear",
      title: "Lost in the forest",
      place: "Deep in the forest",
      text: "Every direction looks the same. Someone suggests one way, someone else the opposite.",
      options: [
        {
          label: "Stop everything and sit in silence for a while",
          effects: { calm: +20, faith: +10 },
          days: 1,
          next: "bear",
          result: "In the stillness you hear it: faint temple bells to the east. You follow the sound back to the path.",
          grace: "When you stopped doing, the way became clear.",
        },
        {
          label: "Keep searching in every direction",
          effects: { food: -10, health: -10 },
          days: 1,
          next: "bear",
          result: "After hours of searching you stumble back onto the path, exhausted.",
          grace: "Your effort was sincere. The finding was never in your hands.",
        },
        {
          label: "Climb a tall tree to look",
          effects: { health: -5, calm: +5 },
          days: 1,
          next: "bear",
          result: "From the top you see the path curving east. Scraped hands, but you are back on track.",
          grace: "Sometimes the answer is to rise above where you stand.",
        },
      ],
    },

    /* ---------- 4. BEAR ---------- */
    bear: {
      kind: "main",
      art: "bear",
      title: "The bear",
      place: "A narrow forest path",
      text: "A bear sits in the middle of the path, eating berries from a bush. It shows no sign of moving.",
      options: [
        {
          label: "Sit and wait, even if it takes until sundown",
          effects: { calm: +10 },
          days: 1,
          next: "bridge",
          optimal: true,
          result: "You wait. And wait. Just before sunset, the bear finishes the last berry and ambles off into the trees. The path is clear.",
          grace: "Waiting felt like losing time. Nothing was lost.",
        },
        {
          label: "Scare it off with the bamboo staff",
          needs: "staff",
          effects: { calm: -15, health: -10 },
          days: 1,
          next: "bridge",
          result: "The bear rears up and roars. It crashes away, but the staff snaps in the scramble and everyone is shaking.",
          grace: "You won the fight you picked. It cost more than waiting would have.",
        },
        {
          label: "Leave some food to lure it off the path",
          effects: { food: -20, calm: -10 },
          days: 1,
          next: "bridge",
          result: "The bear takes the food, then follows you for a mile hoping for more.",
          grace: "You paid to make the problem go away, and it followed you.",
        },
      ],
    },

    /* ---------- 5. BROKEN BRIDGE ---------- */
    bridge: {
      kind: "main",
      art: "bridge",
      title: "The broken bridge",
      place: "A deep gorge",
      text: "The rope bridge across the gorge hangs in tatters. Half its planks are gone, and the far side looks a long way off.",
      options: [
        {
          label: "Walk along the rim until the gorge narrows, with no end in sight",
          effects: { food: +10 },
          days: 1,
          next: "storm",
          optimal: true,
          result: "It takes hours, but the gorge narrows to a stream you can step across, and wild mango trees grow beside it.",
          grace: "The long way round had fruit waiting on it.",
        },
        {
          label: "Tie your rope across and pull yourselves over",
          needs: "rope",
          effects: { health: -5, calm: -15 },
          days: 1,
          next: "storm",
          result: "It works, but it's terrifying. You leave the rope behind, knotted to the posts.",
          grace: "You forced a way across, and it took your nerve with it.",
        },
        {
          label: "Climb down into the gorge and back up the other side",
          effects: { health: -20 },
          days: 1,
          next: "storm",
          result: "Scraped knees, sore arms, and one twisted ankle, but you make it.",
          grace: "Going down was part of getting across.",
        },
      ],
    },

    /* ---------- 6. STORM ---------- */
    storm: {
      kind: "main",
      art: "storm",
      title: "The storm",
      place: "An open ridge",
      text: "Black clouds roll in and monsoon rain pours sideways across the open ridge. There is nowhere obvious to hide.",
      options: [
        {
          label: "Use up the wool blanket: huddle under it and walk on slowly",
          needs: "blanket",
          effects: { health: -5 },
          days: 1,
          next: "signpost",
          optimal: true,
          result: "You huddle under one blanket and shuffle along together. It is slow and wet and strangely funny. The blanket is soaked through and ruined.",
          grace: "The storm was not your choice and not a punishment. How you walked through it was yours.",
        },
        {
          label: "Head for the cave the shepherd told you about",
          hideUnlessFlag: "caveTip",
          effects: { calm: +5 },
          days: 1,
          next: "signpost",
          result: "You find the cave exactly where he said. You wait out the storm dry and warm.",
          grace: "An hour spent chasing goats became a roof over your heads.",
        },
        {
          label: "Search the ridge for a cave",
          effects: { food: -5 },
          days: 1,
          next: "cave",
          result: "After an hour of searching you find a cave, and someone is already inside.",
          grace: "You went looking for shelter and found a teacher.",
        },
        {
          label: "Push straight through the storm",
          effects: { health: -25, calm: -20 },
          days: 1,
          next: "signpost",
          result: "You make it through, soaked and shivering. Nobody speaks for a long time.",
          grace: "You pushed on alone against something you were never meant to fight.",
        },
      ],
    },

    cave: {
      kind: "detour",
      art: "cave",
      after: "signpost",
      title: "The monk in the cave",
      place: "A cave on the ridge",
      text:
        "An old monk sits in the cave, eyes closed, perfectly still while the storm roars outside. He opens his eyes and gestures for you to sit.",
      options: [
        {
          label: "Sit in silence with him until the storm passes",
          effects: { calm: +25, faith: +20 },
          days: 1,
          next: "signpost",
          result: "You sit for hours without a word. When you open your eyes the storm is gone, and so is the tightness in your chest.",
          grace: "The storm outside did not change. The storm inside did.",
        },
        {
          label: "Ask him about the road ahead",
          effects: { faith: +15 },
          days: 1,
          next: "signpost",
          result: "He says only: “Whatever you meet next, give before you are asked.”",
          grace: "He did not tell you where to go. He told you how to walk.",
        },
        {
          label: "Sleep while the storm passes",
          effects: { health: +15 },
          days: 1,
          next: "signpost",
          result: "You wake to birdsong. The monk is gone, and a small bundle of fruit sits where he was.",
          grace: "Even your rest was looked after.",
        },
      ],
    },

    /* ---------- 7. FALLEN SIGNPOST ---------- */
    signpost: {
      kind: "main",
      art: "signpost",
      title: "The fallen signpost",
      place: "A crossroads at dusk",
      text: "Three roads meet here. The signpost lies face-down in the mud, and it's getting dark.",
      options: [
        {
          label: "Wait for someone to pass by and ask, even if it takes hours",
          effects: { faith: +10 },
          days: 1,
          next: "night",
          optimal: true,
          result: "Just as the light fades, a cowherd boy comes by with his cows. He laughs and points you up the middle road.",
          grace: "You could not find the way, so the way came walking to you.",
        },
        {
          label: "Use up the oil lamp to search the ground for tracks",
          needs: "lamp",
          effects: { calm: -5 },
          days: 1,
          next: "night",
          result: "You find tracks going every direction. You pick the clearest ones, and luckily they lead uphill. The lamp burns out.",
          grace: "You spent your light looking down. The answer was further along the road.",
        },
        {
          label: "Take the road that looks the most used",
          days: 1,
          next: "wrongroad",
          result: "The road is wide and easy, and by morning it ends at a stone quarry.",
          grace: "The easy road was busy for a reason: it wasn't going your way.",
        },
      ],
    },

    wrongroad: {
      kind: "detour",
      art: "quarry",
      after: "night",
      title: "The wrong road",
      place: "A stone quarry",
      text: "The road ends at a quarry where stonecutters are already at work. The temple is nowhere in sight.",
      options: [
        {
          label: "Walk all the way back to the crossroads",
          effects: { health: -10, calm: -5 },
          days: 1,
          next: "night",
          result: "It's a long, quiet walk back, but you find the right road by afternoon.",
          grace: "Going back was not failure. It was the way forward.",
        },
        {
          label: "Ask the stonecutters for help",
          effects: { food: +10, faith: +10 },
          days: 1,
          next: "night",
          result: "They share their lunch and show you a goat path up the mountain.",
          grace: "Asking for help turned a wrong road into a right one.",
        },
      ],
    },

    /* ---------- 8. FREEZING NIGHT ---------- */
    night: {
      kind: "main",
      art: "night",
      title: "The freezing night",
      place: "High on the mountain",
      text: "Night falls high on the mountain and the cold bites through everything you're wearing.",
      options: [
        {
          label: "Gather wood and take turns keeping a fire going (no one sleeps much)",
          effects: { health: -5, calm: +10 },
          days: 1,
          next: "robbers",
          optimal: true,
          result: "You talk and laugh through the night, feeding the fire in turns. By dawn you're tired but closer than ever.",
          grace: "Nobody slept, and nobody was alone.",
        },
        {
          label: "Wrap up in the wool blanket",
          needs: "blanket",
          effects: { health: +5 },
          days: 1,
          next: "robbers",
          result: "Everyone squeezes under it. It helps, but some of you shiver all night at the edges.",
          grace: "Comfort for some was not warmth for all.",
        },
        {
          label: "Keep walking all night to stay warm",
          effects: { health: -20, faith: -10 },
          days: 1,
          next: "robbers",
          result: "You stumble on through the dark and arrive at dawn completely drained.",
          grace: "You kept moving so you would not have to feel the cold. It found you anyway.",
        },
      ],
    },

    /* ---------- 9. ROBBERS ---------- */
    robbers: {
      kind: "main",
      art: "robbers",
      title: "The robbers",
      place: "A rocky pass",
      text: "Three men step out from behind the rocks and block the pass. “Leave your things,” says the tallest one.",
      options: [
        {
          label: "Try giving them some of your things",
          effects: { food: -20, calm: +10, faith: +15 },
          days: 1,
          setFlag: "trail",
          next: "end",
          optimal: true,
          result: "The leader is stunned. Nobody has ever just given him anything. Quietly, he shows you a hidden goat trail that climbs straight to the temple.",
          grace: "You gave away what you thought you needed, and it came back as the way forward.",
        },
        {
          label: "Stand firm with the bamboo staff",
          needs: "staff",
          effects: { calm: -15 },
          days: 2,
          next: "end",
          result: "They back off, but they block the pass, and you take the long road around the hill.",
          grace: "You kept everything you carried, and carried it the long way.",
        },
        {
          label: "Run and hide",
          effects: { health: -15, food: -15, calm: -20 },
          days: 1,
          next: "regroup",
          result: "You scatter into the rocks. When it's quiet again, some of your food is gone and so is the path.",
          grace: "Fear scattered you. What came next brought you back together.",
        },
      ],
    },

    regroup: {
      kind: "detour",
      art: "pass",
      after: "end",
      title: "Finding each other again",
      place: "Below the pass",
      text: "You call out until everyone is found. You are all shaken and a little lost.",
      options: [
        {
          label: "Sit together and pray before moving on",
          effects: { faith: +20, calm: +10 },
          days: 1,
          next: "end",
          result: "Your voices steady as you chant together. When you stand up, you know which way to go.",
          grace: "You could not find the path until you found each other.",
        },
        {
          label: "Ask at a nearby hamlet for directions",
          effects: { food: +20 },
          days: 1,
          next: "end",
          result: "A grandmother feeds you and points you to the temple road.",
          grace: "Strangers became family for an afternoon.",
        },
      ],
    },

    /* ---------- RECOVERY STOPS (a meter hit zero) ---------- */
    recover_food: {
      kind: "recovery",
      art: "camp",
      meter: "food",
      title: "Empty bundles",
      place: "The road",
      text: "The food is gone and everyone is weak with hunger. You cannot walk further like this.",
      options: [
        {
          label: "Gather fruit and greens from the forest",
          effects: { food: +40, calm: +10, faith: +10 },
          days: 1,
          result: "Among the mango trees you meet a monk collecting fruit. He fills your bundle and blesses you.",
          grace: "You went looking for food and found peace too.",
        },
        {
          label: "Ask at the nearest village",
          effects: { food: +45 },
          days: 1,
          result: "The villagers feed you rice and dal and tell you the road ahead is clear.",
          grace: "Asking for help is also a kind of surrender.",
        },
      ],
    },
    recover_health: {
      kind: "recovery",
      art: "camp",
      meter: "health",
      title: "Someone is hurt",
      place: "The road",
      text: "Someone has a twisted ankle and everyone is limping. You have to stop.",
      options: [
        {
          label: "Use the healing herbs",
          needs: "herbs",
          effects: { health: +40 },
          days: 0,
          result: "The paste stings, then soothes. By evening you can walk again.",
          grace: "You packed for a need you hoped would never come.",
        },
        {
          label: "Rest at a healer's hut for two days",
          effects: { health: +50, calm: +5 },
          days: 2,
          result: "An old vaidya binds the ankle and makes you rest for two days.",
          grace: "The delay was the medicine.",
        },
        {
          label: "Build a fire and tend to each other",
          effects: { health: +30, calm: +10 },
          days: 1,
          result: "You take turns caring for each other through the night.",
          grace: "Caring for each other healed more than the ankle.",
        },
      ],
    },
    recover_calm: {
      kind: "recovery",
      art: "camp",
      meter: "calm",
      title: "Tempers are short",
      place: "The road",
      text: "Everyone is snapping at each other. The group is falling apart.",
      options: [
        {
          label: "Sit together in silence for a while",
          effects: { calm: +40 },
          days: 0,
          result: "Nobody speaks for twenty minutes. When you stand up, the anger has gone.",
          grace: "Silence did what arguing could not.",
        },
        {
          label: "Sing bhajans as you walk",
          effects: { calm: +30, faith: +10 },
          days: 0,
          result: "One voice starts, then all of you. The miles pass lightly.",
          grace: "Your feet kept walking, and your mind found somewhere better to be.",
        },
      ],
    },
    recover_faith: {
      kind: "recovery",
      art: "camp",
      meter: "faith",
      title: "Doubt creeps in",
      place: "The road",
      text: "Someone says what everyone is thinking: “What if we never get there?”",
      options: [
        {
          label: "Visit the monk under the banyan tree",
          effects: { faith: +40, calm: +10 },
          days: 1,
          result: "He laughs gently: “The temple is not going anywhere. Neither is He.”",
          grace: "Doubt brought you to his feet.",
        },
        {
          label: "Each person shares why they set out",
          effects: { faith: +35 },
          days: 0,
          result: "Everyone's reason is different, and every one of them is enough.",
          grace: "You remembered why you started, and that was enough to keep going.",
        },
      ],
    },
  },

  arrival: {
    art: "temple",
    trail:
      "The goat trail ends at the temple's back gate just as the evening aarti begins. Lamps flicker, bells ring, and you are home.",
    default:
      "You climb the last steps as the temple bells ring. Tired, dusty and together, you have arrived.",
  },

  reveal: {
    before: "Path efficiency",
    after:
      "Every group that set out today arrived at the same temple. Some came faster, some came tired, some came with stories. " +
      "The path you walked was the one chosen for you, so it was always 100%.",
  },

  discussion: [
    "Which setback on your journey turned out to help you? Has that happened in your own life?",
    "A seed can't make itself sprout. When have you done everything right and the result still wasn't yours to decide? How did you feel about it?",
    "Look back over your journey and pick a moment that worked out in a way you didn't plan. What changes if you see it as given instead of lucky?",
    "If every path leads to the temple, what actually matters about the choices we make?",
  ],
};
