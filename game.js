const $ = s => document.querySelector(s);
const state = {
  mood: 55,
  items: [],
  flags: {},
  steps: 0,
  sound: true,
  lang: localStorage.getItem('checkout-lang') || 'en',
  currentScene: null,
  pendingEnding: null,
  view: 'start'
};

const audioBase = './';
const bgm = new Audio(audioBase + 'mystery-bgm.mp3');
const bell = new Audio(audioBase + 'bell.wav');
bgm.loop = true; bgm.volume = .5; bell.volume = .8;
bgm.preload = 'auto'; bell.preload = 'auto';

const outcomeSounds = {
  escaped: new Audio(audioBase + 'outcome-escaped.wav'),
  changed: new Audio(audioBase + 'outcome-hired.wav'),
  erased: new Audio(audioBase + 'outcome-erased.wav')
};
Object.values(outcomeSounds).forEach(a => { a.volume = .8; a.preload = 'auto'; });

const endNames = [
  'Night Shift',
  'Best Friends Forever',
  'The Honest Exit',
  'Room Service',
  'Error 404',
  'Walk of the Damned',
  'The Real Checkout',
  'The Mirror Guest',
  'The Midnight Reset',
  'The Last Receptionist'
];

// ============================================================
// SCENES — Dark horror, simpler language, no early death
// Every path continues. Every ending feels earned.
// ============================================================
const scenes = {
  wake: {
    chapter: '01 / ROOM 404',
    time: '03:33 AM',
    icon: '\u25D4',
    title: 'The Wake-Up Call',
    text: `<p>You wake in Room 404 of <strong>Hotel 404</strong> — a hotel that does not exist. The phone is ringing.</p><p>The voice on the line says: <em>"Your stay ended hours ago. Come downstairs. Keep the guest happy."</em></p><p>Something sits in the corner of the room. It is watching you.</p>`,
    choices: [
      ['Answer politely. Ask how to leave.', 'hall', 10, 'polite'],
      ['Check under the bed first.', 'under', 14],
      ['Pull the blanket over your head.', 'sleep', -5],
      ['Shout: "I want the manager!"', 'manager', -3]
    ]
  },
  under: {
    chapter: '01 / ROOM 404',
    time: '03:35 AM',
    icon: '\u271B',
    title: 'Under the Bed',
    text: `<p>You look under the bed. A key lies in the dust — <strong>Room 404\u00BD</strong> — half a room that should not exist.</p><p>The thing in the corner giggles. <em>"Clever. But not clever enough."</em></p>`,
    choices: [
      ['Take the key. Move on.', 'hall', 10, 'halfkey'],
      ['Look for the thing in the corner.', 'corner', -5],
      ['Leave the key. Go to the door.', 'hall', 2],
      ['Slide under the bed yourself.', 'sleep', -8]
    ]
  },
  corner: {
    chapter: '01 / ROOM 404',
    time: '03:36 AM',
    icon: '\u263B',
    title: 'The Thing in the Corner',
    text: `<p>You turn to face it. The corner is empty. But your shadow on the wall is not yours — it has horns and a wide grin.</p><p>The shadow speaks: <em>"I am Mr. Smiles. I will decide if you leave. You cannot see me yet — only what I show you."</em></p>`,
    choices: [
      ['Nod. Walk to the door.', 'hall', 5],
      ['Ask: "What do you want?"', 'hall', 0, 'truth'],
      ['Smash the lamp at the shadow.', 'sleep', -8]
    ]
  },
  sleep: {
    chapter: '01 / ROOM 404',
    time: '03:40 AM',
    icon: '\u2634',
    title: 'The Room Keeps You',
    text: `<p>The bed is warm. Too warm. When you try to sit up, the sheets pull back.</p><p>The walls breathe. The ceiling drips. Room 404 is not a room anymore — it is a mouth.</p>`,
    choices: [
      ['Fight the sheets. Roll off the bed.', 'hall', 12],
      ['Call out: "Room service?"', 'service', 3],
      ['Close your eyes. Dream your way out.', 'dream', 5]
    ]
  },
  // === NEW SCENE: dream escape from sleep ===
  dream: {
    chapter: '01 / ROOM 404',
    time: '03:41 AM',
    icon: '\u273B',
    title: 'The Dreaming Exit',
    text: `<p>You close your eyes. The swallowing stops. Instead of a stomach, you are falling through warm dark — like sliding down a throat made of stars.</p><p>A voice follows you down: <em>"Clever girl. Or clever boy. I forget. Dreaming is the back door. Most guests never try it."</em></p>`,
    choices: [
      ['Land softly. Look for a door in the dark.', 'dream2', 10],
      ['Ask: "Who are you, really?"', 'dream2', 5, 'truth']
    ]
  },
  dream2: {
    chapter: '01 / DREAMING',
    time: '03:43 AM',
    icon: '\u273C',
    title: 'The Other Room',
    text: `<p>You land in a room that is the mirror of Room 404 — same shape, wrong colors. The phone rings here too, but it sounds like it is underwater.</p><p>A mirror stands against the far wall. Behind you, a door with no handle.</p>`,
    choices: [
      ['Touch the mirror.', 'dream3', 8, 'mirror'],
      ['Push the handleless door.', 'hall', 5]
    ]
  },
  dream3: {
    chapter: '01 / DREAMING',
    time: '03:44 AM',
    icon: '\u273D',
    title: 'Through the Glass',
    text: `<p>Your hand goes through the mirror. On the other side, you see the real hotel hallway — the one the phone wanted you to reach.</p><p>Mr. Smiles stands behind you in the reflection. <em>"I let you dream. Dreams cost interest. I will collect later."</em></p>`,
    choices: [
      ['Step through the mirror to the hallway.', 'hall', 10],
      ['Stay in the mirror world. It feels safer.', 'mirror', 12],
      ['Turn around and face Mr. Smiles first.', 'corner', 3]
    ]
  },
  manager: {
    chapter: '01 / ROOM 404',
    time: '03:38 AM',
    icon: '\u2620',
    title: 'The Manager',
    text: `<p>The wallpaper peels off the wall and forms a shape — tall, thin, faceless. A badge reads <strong>MANAGER</strong>.</p><p><em>"I heard your complaint,"</em> it says. <em>"Do you want a refund, or a way out?"</em></p>`,
    choices: [
      ['A way out.', 'correct', 12],
      ['A refund.', 'comp', -3],
      ['Ask: "Who is the guest in 404?"', 'manager2', 5, 'truth']
    ]
  },
  // === NEW SCENE: deeper manager conversation ===
  manager2: {
    chapter: '02 / CUSTOMER SERVICE',
    time: '03:39 AM',
    icon: '\u2620',
    title: 'The Real Answer',
    text: `<p>The Manager tilts its head. The badge rusts and reforms.</p><p><em>"The guest in 404? He checked in long ago. He never checked out. He grew into the walls. He became the hotel. You are sleeping in his ribcage."</em></p>`,
    choices: [
      ['"Then I will check him out with me."', 'correct', 15, 'truth'],
      ['"I want a refund for my sanity."', 'comp', -5],
      ['"Show me the exit. Now."', 'correct', 8]
    ]
  },
  comp: {
    chapter: '02 / CUSTOMER SERVICE',
    time: '03:42 AM',
    icon: '\u2716',
    title: 'Refund',
    text: `<p>The Manager hands you a receipt: <strong>ONE FREE NIGHT — FOREVER</strong>. <em>"No returns,"</em> it says.</p><p>The door behind you closes. The door ahead does not open.</p>`,
    choices: [
      ['Sign the receipt and see what happens.', 'comp2', 5],
      ['Burn the receipt.', 'hall', 8, 'ash'],
      ['Tear it in half.', 'hall', -5, 'scrap']
    ]
  },
  // === NEW SCENE: after signing the receipt ===
  comp2: {
    chapter: '02 / CUSTOMER SERVICE',
    time: '03:43 AM',
    icon: '\u2717',
    title: 'The Fine Print',
    text: `<p>You sign. The receipt folds itself into a small paper key. The Manager's voice changes — younger, scared.</p><p><em>"Wait — you actually signed? Nobody signs. The key opens the back door of the basement. But the fine print says you owe the hotel a story. Tell it one before you leave, or it will come looking."</em></p>`,
    choices: [
      ['Take the paper key. Go to the basement.', 'laundry', 10, 'paperkey'],
      ['Tell the hotel a story right now.', 'comp3', 12, 'story'],
      ['Refuse. Run for the hallway.', 'hall', -5]
    ]
  },
  // === NEW SCENE: telling the hotel a story ===
  comp3: {
    chapter: '02 / CUSTOMER SERVICE',
    time: '03:45 AM',
    icon: '\u2718',
    title: 'A Story for the Hotel',
    text: `<p>You tell the hotel about the worst night of your life — the one that brought you here. The walls soften. The wallpaper grows flowers that wilt as they bloom.</p><p>The Manager wipes its badge. <em>"That was good. The hotel is satisfied. Your debt is a receipt no more."</em> The paper key turns to brass.</p>`,
    choices: [
      ['Take the brass key to the basement.', 'laundry', 15, 'staffkey'],
      ['Ask for the elevator instead.', 'elevator', 10]
    ]
  },
  correct: {
    chapter: '02 / CUSTOMER SERVICE',
    time: '03:43 AM',
    icon: '\u271A',
    title: 'A Way Out',
    text: `<p>The Manager gestures at the hall. <em>"There is no guest in Room 404,"</em> it says, and dissolves.</p><p>For a moment, the hotel cannot see you. The cameras, the eyes in the wallpaper — all blind.</p>`,
    choices: [
      ['Sneak to the elevator while unseen.', 'elevator', 5, 'invisible'],
      ['Follow the Manager.', 'laundry', 8]
    ]
  },
  hall: {
    chapter: '02 / THE HALLWAY',
    time: '03:45 AM',
    icon: '\u2194',
    title: 'The Hallway',
    text: `<p>The hallway stretches both ways. A green EXIT sign points left. A hand-painted sign points right: <strong>REAL EXIT \u2192</strong></p><p>Something scratches behind Room 405's door. The carpet has teeth.</p>`,
    choices: [
      ['Follow the green EXIT sign.', 'exitdoor', -3],
      ['Trust the hand-painted sign.', 'laundry', 8],
      ['Knock on Room 405.', 'room405', 0],
      ['Check the carpet teeth.', 'carpet', -8]
    ]
  },
  carpet: {
    chapter: '02 / THE HALLWAY',
    time: '03:46 AM',
    icon: '\u224B',
    title: 'The Carpet Bites',
    text: `<p>The carpet teeth close around your ankle. It does not hurt — it just will not let go.</p><p>A voice from the floor: <em>"You taste like a liar."</em></p>`,
    choices: [
      ['Say: "I am not a liar."', 'hall', 0, 'truth'],
      ['Give it your shoe and run.', 'laundry', 5, 'mint'],
      ['Ask: "Then what do I taste like?"', 'carpet2', 5]
    ]
  },
  // === NEW SCENE: deeper carpet interaction ===
  carpet2: {
    chapter: '02 / THE HALLWAY',
    time: '03:47 AM',
    icon: '\u224C',
    title: 'The Floor Speaks',
    text: `<p>The carpet loosens its grip. The voice grows warmer — almost fatherly.</p><p><em>"You taste like someone who has been here before. Not you, exactly. But close enough. Take this."</em> A thread of carpet curls into your hand — a tiny woven bell.</p>`,
    choices: [
      ['Take the woven bell. Go to the elevator.', 'elevator', 12, 'bell'],
      ['Take it and go to Room 405.', 'room405', 8, 'bell']
    ]
  },
  room405: {
    chapter: '03 / ROOM 405',
    time: '03:50 AM',
    icon: '\u273F',
    title: 'Room 405',
    text: `<p>Twenty silhouettes sit around a table. They all turn to look at you at once.</p><p>A banner reads: <strong>HAPPY 200TH, MR. SMILES</strong>. The cake has one candle. It is whispering.</p>`,
    choices: [
      ['Sing to them.', 'cake', 15, 'candle'],
      ['Blow out the candle.', 'dark', -3],
      ['Eat the cake first.', 'cakeeat', 8],
      ['Close the door slowly.', 'hall', -5]
    ]
  },
  cake: {
    chapter: '03 / ROOM 405',
    time: '03:52 AM',
    icon: '\u2736',
    title: 'The Gift',
    text: `<p>The silhouettes give you a <strong>tiny silver bell</strong>. <em>"Ring it when you know who needs help,"</em> they say, and fade.</p><p>The room goes dark and cold.</p>`,
    choices: [
      ['Take the bell. Go to the elevator.', 'elevator', 8, 'bell'],
      ['Ring the bell right now.', 'service', 0, 'bell']
    ]
  },
  cakeeat: {
    chapter: '03 / ROOM 405',
    time: '03:51 AM',
    icon: '\u2735',
    title: 'Something in the Cake',
    text: `<p>It tastes like ash. Something hard cracks between your teeth — a brass coin.</p><p>Stamped on it: <strong>LAUNDRY ROOM \u2014 ONE FREE WASH</strong>.</p>`,
    choices: [
      ['Keep chewing.', 'laundry', 10, 'token'],
      ['Spit it out.', 'elevator', -8, 'token']
    ]
  },
  dark: {
    chapter: '03 / ROOM 405',
    time: '03:53 AM',
    icon: '\u271D',
    title: 'In the Dark',
    text: `<p>A voice in the dark: <em>"The demon must be pleased to open the front door. The demon must be furious to open the back door."</em></p><p>The candle relights. No one admits they spoke.</p>`,
    choices: [
      ['Take the candle and leave.', 'elevator', 3, 'candle'],
      ['Ask: "Who said that?"', 'room405', 5, 'secret']
    ]
  },
  exitdoor: {
    chapter: '03 / FIRE EXIT',
    time: '03:55 AM',
    icon: '\u2BA5',
    title: 'The Loop',
    text: `<p>You push through the green door and end up back in Room 404.</p><p>You push again. Room 404.</p><p>The third time, you see yourself sleeping in the bed. Mr. Smiles stands over the sleeping you.</p>`,
    choices: [
      ['Wake yourself up.', 'error', -5],
      ['Take your place in bed.', 'exitdoor2', 5],
      ['Use a strange item on the door.', 'elevator', 8, 'mirror']
    ]
  },
  // === NEW SCENE: replacing "disturb" death with continuation ===
  exitdoor2: {
    chapter: '03 / FIRE EXIT',
    time: '03:56 AM',
    icon: '\u2BA6',
    title: 'The Other You',
    text: `<p>You lie down in the bed next to yourself. The sleeping you opens one eye — it is gold, not human.</p><p><em>"Finally,"</em> says the other you. <em>"I have been waiting for someone to take over the dream. Now I can leave. You can stay. Or we can both go."</em></p>`,
    choices: [
      ['Let them leave. You stay and dream.', 'exitdoor3', 8],
      ['Both go together through the green door.', 'elevator', 12, 'mirror'],
      ['Refuse. Get up and head for the elevator.', 'elevator', 5]
    ]
  },
  // === NEW SCENE: the dreaming takeover ===
  exitdoor3: {
    chapter: '03 / THE DREAMING GUEST',
    time: '03:58 AM',
    icon: '\u2BA7',
    title: 'The Guest Who Dreams',
    text: `<p>The other you rises from the bed, stretches, and walks through the wall. You feel the hotel settle around you — not hostile, not welcoming. Just... patient.</p><p>The phone rings. The voice on the line is yours now: <em>"Welcome to Hotel 404. Your stay has just begun."</em></p>`,
    choices: [
      ['Hang up. Find the real exit.', 'elevator', 10],
      ['Pick up and ask for room service.', 'laundry', 5],
      ['Accept your role. Become the hotel\'s dreamer.', 'reset', 10]
    ]
  },
  laundry: {
    chapter: '03 / BASEMENT',
    time: '03:58 AM',
    icon: '\u2235',
    title: 'The Laundry Room',
    text: `<p>Washing machines spin with no power. Inside one, a key tumbles with a tag: <strong>BACK EXIT \u2014 STAFF ONLY</strong>.</p><p>The basement smells like iron. Something drips from the ceiling.</p>`,
    choices: [
      ['Open the machine while it spins.', 'spin', -8],
      ['Press STOP first.', 'stopped', 10],
      ['Climb into an empty machine.', 'service', 5],
      ['Look up at what is dripping.', 'drip', -8]
    ]
  },
  drip: {
    chapter: '03 / BASEMENT',
    time: '03:59 AM',
    icon: '\u2248',
    title: 'What Drips',
    text: `<p>You look up. A face stares down from the ceiling — too long, too wide. It is smiling.</p><p><em>"I was waiting for someone to look up,"</em> it says.</p>`,
    choices: [
      ['Look away. Run to the elevator.', 'elevator', -5],
      ['Smile back.', 'drip2', 8],
      ['Throw something at it.', 'spin', -8]
    ]
  },
  drip2: {
    chapter: '03 / BASEMENT',
    time: '04:00 AM',
    icon: '\u263B',
    title: 'The Smiling Face',
    text: `<p>The face on the ceiling laughs. The sound fills the room and hurts your teeth.</p><p><em>"You are brave. Take this."</em> Something drops into your hand — a fragment of mirror.</p>`,
    choices: [
      ['Take the fragment. Go to the elevator.', 'elevator', 12, 'mirror'],
      ['Ask: "What are you?"', 'drip3', 3]
    ]
  },
  drip3: {
    chapter: '03 / BASEMENT',
    time: '04:01 AM',
    icon: '\u263B',
    title: 'The Answer',
    text: `<p><em>"I am what Mr. Smiles shows you when he is happy."</em> The face sinks into the ceiling and is gone.</p>`,
    choices: [
      ['Go to the elevator.', 'elevator', 5, 'mirror']
    ]
  },
  spin: {
    chapter: '03 / BASEMENT',
    time: '04:00 AM',
    icon: '\u27F3',
    title: 'The Machine Grabs',
    text: `<p>The machine grabs your sleeve and tries to fold you like a sheet.</p><p>A voice from inside the drum: <em>"Say please."</em></p>`,
    choices: [
      ['"Please."', 'stopped', 8, 'staffkey'],
      ['Kick it until it lets go.', 'laundry', -8],
      ['Let go. See what happens.', 'service', 2]
    ]
  },
  stopped: {
    chapter: '04 / STAFF HALL',
    time: '04:05 AM',
    icon: '\u2756',
    title: 'Staff Only',
    text: `<p>The machine stops. Inside: a staff key and a clean uniform. A badge reads <strong>NIGHT RECEPTIONIST</strong>.</p><p>The back exit is close. The elevator is upstairs.</p>`,
    choices: [
      ['Wear the uniform. Take the staff exit.', 'staffend', 5, 'uniform'],
      ['Take the key. Leave the uniform.', 'elevator', -2, 'staffkey'],
      ['Burn the uniform in the machine.', 'elevator', 15, 'ash']
    ]
  },
  elevator: {
    chapter: '04 / THE ELEVATOR',
    time: '04:10 AM',
    icon: '\u2B07',
    title: 'Pick a Floor',
    text: `<p>The elevator has four buttons:</p><p><strong>LOBBY \u00B7 ROOF \u00B7 HOME \u00B7 404</strong></p><p>HOME is written in your own handwriting. The elevator hums a tune you almost recognize.</p>`,
    choices: [
      ['LOBBY', 'lobby', 3],
      ['ROOF', 'roof', -3],
      ['HOME', 'home', 0],
      ['404', 'error', 5]
    ]
  },
  lobby: {
    chapter: '05 / THE LOBBY',
    time: '04:15 AM',
    icon: '\u2308',
    title: 'Final Checkout',
    text: `<p>The front desk is empty. A receipt printer prints on its own: <em>"Payment: one pleased guest."</em></p><p>The front doors will only open while Mr. Smiles is happy.</p>`,
    choices: [
      ['Tell Mr. Smiles a joke.', 'frontcheck', 15],
      ['Ring the silver bell.', 'bellend', state.mood > 60 ? -3 : 5],
      ['Offer a pocket item as payment.', 'frontcheck', 8, 'paid'],
      ['Tell him the truth: "I used you."', 'honest', -10, 'truth']
    ]
  },
  roof: {
    chapter: '05 / THE ROOF',
    time: '04:20 AM',
    icon: '\u2744',
    title: 'The Roof',
    text: `<p>The city below looks like a model. Far away, you can see your real bedroom — lit, warm, close.</p><p>A bridge made of receipts stretches toward it. Mr. Smiles cannot cross alone — he is too heavy with rage, too light with joy.</p>`,
    choices: [
      ['Leave him behind and cross.', 'walk', -8],
      ['Carry him across yourself.', 'best', 20],
      ['Ask him to change size.', 'real', 8],
      ['Jump. It is just a model.', 'error', -3]
    ]
  },
  home: {
    chapter: '05 / HOME?',
    time: '04:25 AM',
    icon: '\u2300',
    title: 'Home',
    text: `<p>The doors open to your bedroom. Morning sun. Your phone. Everything is normal.</p><p>But the mirror shows Room 404. And Mr. Smiles is not beside you anymore.</p>`,
    choices: [
      ['Walk out without looking back.', 'walk', -5],
      ['Check under your real bed.', 'real', 10],
      ['Invite Mr. Smiles to come with you.', 'best', 20]
    ]
  }
};

// ============================================================
// ENDINGS — All satisfying. No early death. No dead-end traps.
// ============================================================
const endings = {
  staffend: [0, '\u2756', 'NIGHT SHIFT',
    'The staff door opens to freedom — almost. The uniform tightens; the badge changes to your name. Every night at 03:33, Room 404 calls the front desk. You pick up and say, "Welcome to Hotel 404." You are not trapped — you are employed. The hotel needs someone kind at the desk. It picked you.'],
  best: [1, '\u263B', 'BEST FRIENDS FOREVER',
    'You carry Mr. Smiles across the bridge. Halfway, it breaks — but he grows wings. You wake in your own bed with a horned shadow on the wall, a hotel key that opens any door, and one fewer sock every morning. He is grateful. You are not alone. You never will be.'],
  honest: [2, '\u271A', 'THE HONEST EXIT',
    'The lobby goes silent. Mr. Smiles looks at you — really looks. "Nobody tells the truth here." He tears up your bill. The front doors open. Honesty was the key — and the hardest door. You walk out into grey dawn, and for the first time, the hotel lets you remember everything.'],
  bellend: [3, '\u2666', 'ROOM SERVICE',
    'You ring the bell. The printer stops. Mr. Smiles whispers, "You finally know who needs help." The hotel folds itself into a silver tray and slides under the desk. You walk out before dawn. Behind you, the building exhales — relieved, not angry. You helped it rest.'],
  error: [4, '404', 'ERROR 404',
    'You chose something impossible. The hotel cannot decide if you are guest, staff, or ghost. Reality returns an error and ejects you. You escape — but mirrors glitch when you walk past them, and your shadow has horns. You are free. You are also different. Both can be true.'],
  walk: [5, '\u2744', 'WALK OF THE DAMNED',
    'You escape alone. Cold streets, empty buses, normal life. In your pocket, a receipt: GUEST HAPPINESS — 0%. But the number changes over the years. It climbs. You did not save Mr. Smiles, but you remember him. That is its own kind of freedom.'],
  real: [6, '\u273F', 'THE REAL CHECKOUT',
    'You understand now: Mr. Smiles was never the guard. He was the last guest — trapped here long before you. You say his real name — you do not know how you know it — and check him out with you. Hotel 404 vanishes before dawn. Two people walk out. Neither is alone.'],
  front: [7, '\u263B', 'THE REAL CHECKOUT',
    'Mr. Smiles laughs — a real laugh, free of malice. The front doors open to a grey dawn. You hold the door for him. Behind you, the Hotel 404 sign flickers once, then forgets it was ever there. You both step into morning. The bellhop waves goodbye. So does your shadow.'],
  // === NEW ENDINGS ===
  mirror: [8, '\u273D', 'THE MIRROR GUEST',
    'You step through the mirror one last time. The real world greets you with morning light — but when you pass a dark window, someone waves back. It is you, or it was you, or it will be. You are free. You are also a guest in every mirror you pass. They never ask you to leave.'],
  reset: [9, '\u2300', 'THE MIDNIGHT RESET',
    'You took the other you\'s place. Now you dream the hotel, and the hotel dreams you. You wake every night at 03:33, answer the phone, and guide new guests toward the exit. You are not trapped — you are the hotel\'s conscience. It needed one.']
};

// ============================================================
// GAME LOGIC
// ============================================================
function startBgm() { if (state.sound && bgm.paused) bgm.play().catch(() => {}); }
function stopBgm() { bgm.pause(); }
function tone() { if (!state.sound) return; bell.currentTime = 0; bell.play().catch(() => {}); }
function restoreGameVolumes() { bgm.volume = .5; bell.volume = .8; }

// === Forced instructions flow: RING THE BELL → show how-to → CONTINUE → game
function ringTheBell() {
  state.view = 'howto';
  $('.start-screen').classList.remove('active');
  $('#howToScreen').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (state.sound) { startBgm(); tone(); }
}

function backToStart() {
  state.view = 'start';
  $('#howToScreen').classList.remove('active');
  $('.start-screen').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function start() {
  restoreGameVolumes();
  Object.values(outcomeSounds).forEach(a => { a.pause(); a.currentTime = 0; });
  state.mood = 55;
  state.items = [];
  state.flags = {};
  state.steps = 0;
  state.pendingEnding = null;
  state.view = 'game';
  $('.start-screen').classList.remove('active');
  $('#howToScreen').classList.remove('active');
  $('.result-screen').classList.remove('active');
  $('.end-screen').classList.remove('active');
  // Show intro splash
  const splash = $('#introSplash');
  splash.classList.add('active');
  startBgm();
  tone();
  setTimeout(() => {
    splash.classList.remove('active');
    $('.game-screen').classList.add('active');
    $('#restartBtn').classList.remove('hidden');
    show('wake');
  }, 1800);
}

function sceneData(id) {
  const s = scenes[id];
  const z = LANGS[state.lang]?.scenes[id];
  if (!z) return s;
  return {
    ...s,
    chapter: z[0],
    title: z[1],
    text: z[2],
    choices: s.choices.map((x, i) => [z[3][i], ...x.slice(1)])
  };
}

function show(id, refresh = false) {
  if (endings[id]) return end(id);
  // frontcheck: mood-based routing — no death, always an escape
  if (id === 'frontcheck') {
    if (state.mood >= 55) return end('front');
    if (state.mood <= 18) return end('honest');
    return show('lobby');
  }
  // service: if you have the bell, bellend; otherwise staffend
  if (id === 'service') return state.items.includes('bell') ? end('bellend') : end('staffend');
  // exitdoor2/exitdoor3 — new dream paths, handled as normal scenes
  const s = sceneData(id);
  if (!s) return end('error');
  state.currentScene = id;
  state.view = 'game';
  if (!refresh) state.steps++;
  const chapterNum = (s.chapter.match(/\d+/) || ['01'])[0];
  $('#chapter').textContent = s.chapter;
  $('#time').textContent = s.time;
  $('#sceneIcon').textContent = s.icon;
  $('#sceneTitle').textContent = s.title;
  $('#storyText').innerHTML = s.text;
  // Apply chapter-based atmospheric tint
  const panel = document.querySelector('.story-panel');
  panel.setAttribute('data-chapter', chapterNum);
  // Trigger re-entry animation
  panel.classList.remove('animating');
  void panel.offsetWidth;
  panel.classList.add('animating');
  const c = $('#choices');
  c.innerHTML = '';
  s.choices.forEach((x, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    const moodChange = typeof x[2] === 'number' ? x[2] : 0;
    let hint = '';
    if (moodChange >= 10) hint = '<i class="choice-hint good"></i>';
    else if (moodChange <= -8) hint = '<i class="choice-hint bad"></i>';
    b.innerHTML = `<b>0${i + 1}</b><span>${x[0]}</span>${hint}`;
    b.onclick = () => choose(x);
    c.appendChild(b);
  });
  update();
  if (!refresh) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function choose(x) {
  document.querySelectorAll('.choice').forEach(b => b.disabled = true);
  // Mood floor raised: never below 15 (was 0)
  state.mood = Math.max(15, Math.min(100, state.mood + (typeof x[2] === 'number' ? x[2] : 0)));
  if (x[3]) {
    if (['polite', 'truth', 'secret', 'paid', 'story'].includes(x[3])) state.flags[x[3]] = true;
    else if (!state.items.includes(x[3])) state.items.push(x[3]);
  }
  tone();
  $('#flash').classList.remove('go');
  void $('#flash').offsetWidth;
  $('#flash').classList.add('go');
  setTimeout(() => show(x[1]), 280);
}

function update() {
  let mi = 2, color = '#ffb866';
  if (state.mood >= 75) { mi = 0; color = '#7fff9e'; }
  else if (state.mood >= 55) { mi = 1; color = '#c7ff5a'; }
  else if (state.mood >= 30) { mi = 2; color = '#ffb866'; }
  else if (state.mood >= 15) { mi = 3; color = '#ff9a3c'; }
  else { mi = 4; color = '#ff6a4a'; }

  const en = [
    ['DELIGHTED', '"You amuse me. That is rare."'],
    ['AMUSED', '"I like you. For now."'],
    ['CURIOUS', '"I still have not decided about you."'],
    ['ANNOYED', '"You are testing my patience."'],
    ['FURIOUS', '"I will enjoy watching you struggle."']
  ];
  const mq = LANGS[state.lang]?.moods || en;
  const face = $('#demonFace');
  face.classList.remove('happy', 'annoyed', 'furious');
  if (mi <= 1) face.classList.add('happy');
  else if (mi === 2) {} // neutral/curious
  else if (mi === 3) face.classList.add('annoyed');
  else face.classList.add('furious');

  document.documentElement.style.setProperty('--mood', color);
  $('#moodName').textContent = mq[mi][0];
  $('#moodValue').textContent = state.mood + '%';
  $('#moodBar').style.width = state.mood + '%';
  $('#demonQuote').textContent = mq[mi][1];
  face.style.transform = `scale(${0.94 + state.mood / 800})`;

  const it = LANGS[state.lang]?.items;
  $('#items').innerHTML = state.items.length
    ? state.items.map(i => `<span class="item">${(it?.[i] || i).toUpperCase()}</span>`).join('')
    : `<span class="empty">${tr('empty')}</span>`;

  const p = Math.min(92, Math.round(state.steps / 12 * 100));
  $('#progressText').textContent = p + '%';
  $('#progressBar').style.width = p + '%';
}

// All results are positive — no "DEAD!" or "TRAPPED!"
const resultTypes = {
  staffend: ['changed', '\u2756', 'HIRED!', 'The hotel chose you for the night shift.'],
  best: ['escaped', '\u263B', 'ESCAPED!', 'You got out — and you are not alone.'],
  honest: ['escaped', '\u271A', 'ESCAPED!', 'The truth opened the door.'],
  bellend: ['escaped', '\u2666', 'ESCAPED!', 'The hotel helped the right guest.'],
  error: ['changed', '404', 'CHANGED!', 'Reality could not file you.'],
  walk: ['escaped', '\u2744', 'ESCAPED!', 'You walked out. Alone, but free.'],
  real: ['escaped', '\u273F', 'ESCAPED!', 'No one was left behind this time.'],
  front: ['escaped', '\u263B', 'ESCAPED!', 'The front doors finally opened.'],
  mirror: ['changed', '\u273D', 'CHANGED!', 'You are free. You are also different.'],
  reset: ['changed', '\u2300', 'REBORN!', 'You became the hotel\'s conscience.']
};

function resultData(id) {
  const r = resultTypes[id] || resultTypes.error;
  const z = LANGS[state.lang]?.results[id];
  return z ? [r[0], r[1], z[0], z[1]] : r;
}

function end(id, refresh = false) {
  state.pendingEnding = id;
  state.view = 'result';
  const r = resultData(id);
  $('.game-screen').classList.remove('active');
  const screen = $('#resultScreen');
  screen.className = `screen result-screen active ${r[0]}`;
  $('#resultIcon').textContent = r[1];
  $('#resultStatus').textContent = r[2];
  $('#resultHint').textContent = r[3];
  if (!refresh) {
    bgm.volume = .12; bell.volume = .12;
    const sound = outcomeSounds[id === 'error' ? 'erased' : r[0]];
    if (state.sound && sound) {
      sound.currentTime = 0;
      sound.onended = restoreGameVolumes;
      sound.play().catch(restoreGameVolumes);
    } else restoreGameVolumes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function endingData(id) {
  const e = endings[id] || endings.error;
  const z = LANGS[state.lang]?.endings[id];
  return z ? [e[0], e[1], z[0], z[1]] : e;
}

function revealEnding(refresh = false) {
  state.view = 'ending';
  const id = state.pendingEnding || 'error';
  const e = endingData(id);
  $('.result-screen').classList.remove('active');
  $('.end-screen').classList.add('active');
  const verdict = state.mood >= 55 ? tr('approve') : state.mood < 30 ? tr('disapprove') : tr('undecided');
  $('#endStamp').textContent = `${tr('ending')} ${e[0] + 1} \u2014 ${verdict}`;
  $('#endIcon').textContent = e[1];
  $('#endTitle').textContent = e[2];
  $('#endText').textContent = e[3];
  $('#endStats').innerHTML =
    `<div class="stat"><b>${state.steps}</b><span>${tr('choices')}</span></div>` +
    `<div class="stat"><b>${state.mood}%</b><span>${tr('mood')}</span></div>` +
    `<div class="stat"><b>${state.items.length}</b><span>${tr('items')}</span></div>`;
  if (!refresh) { tone(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

const ENUI = {
  horror: 'A HORROR STORY',
  hero: 'YOU CAN<br>CHECK OUT.<br><em>CAN\'T YOU?</em>',
  intro: 'You wake in Room 404 of a hotel that does not exist. The receptionist says there is one rule: keep the guest happy.',
  start: 'RING THE BELL',
  howTo: 'HOW TO PLAY',
  howToEyebrow: 'BEFORE YOU CHECK IN',
  howToTitle: 'HOW TO SURVIVE<br>HOTEL 404',
  howToContinue: 'ENTER HOTEL 404',
  tip: 'Headphones recommended \u00B7 Every choice matters',
  soundOn: 'SOUND: ON',
  soundOff: 'SOUND: OFF',
  restart: 'RESTART',
  roommate: 'YOUR ROOMMATE',
  pockets: 'POCKETS',
  empty: 'Nothing. Not even a phone.',
  way: 'WAY OUT?',
  status: 'YOUR STATUS',
  view: 'VIEW ENDING',
  again: 'CHECK IN AGAIN',
  endHint: 'Every ending is a different kind of escape. Try another path.',
  choices: 'CHOICES',
  mood: 'MOOD',
  items: 'ITEMS',
  ending: 'ENDING',
  approve: 'HE APPROVES',
  disapprove: 'HE IS FURIOUS',
  undecided: 'UNDECIDED'
};

function tr(k) { return LANGS[state.lang]?.ui[k] || ENUI[k]; }

function applyLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('checkout-lang', lang);
  document.documentElement.lang = lang;
  document.title = 'CHECK OUT \u2014 A Horror Story';
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  $('.eyebrow').textContent = tr('horror');
  $('.start-screen h1').innerHTML = tr('hero');
  $('.intro').textContent = tr('intro');
  $('#startBtn').innerHTML = `${tr('start')} <span>\u2192</span>`;
  $('.start-screen .tiny').textContent = tr('tip');
  $('#soundBtn').textContent = state.sound ? tr('soundOn') : tr('soundOff');
  $('#restartBtn').textContent = tr('restart');
  $('.demon-label').textContent = tr('roommate');
  $('.side-title').textContent = tr('pockets');
  $('.progress-wrap > span:first-child').textContent = tr('way');
  $('.result-label').textContent = tr('status');
  $('#viewEndingBtn').innerHTML = `${tr('view')} <span>\u2192</span>`;
  $('#againBtn').innerHTML = `${tr('again')} <span>\u21BB</span>`;
  $('.end-screen .tiny').textContent = tr('endHint');
  // How-to screen texts
  $('.howto-eyebrow').textContent = tr('howToEyebrow');
  $('.howto-title').innerHTML = tr('howToTitle');
  $('#howToStartBtn').innerHTML = `${tr('howToContinue')} <span>\u2192</span>`;
  if (state.view === 'game' && state.currentScene) show(state.currentScene, true);
  else if (state.view === 'result') end(state.pendingEnding, true);
  else if (state.view === 'ending') revealEnding(true);
  else update();
}

function unlockSound() { if (!state.sound) return; startBgm(); tone(); }
document.addEventListener('pointerdown', unlockSound, { once: true });
document.addEventListener('keydown', unlockSound, { once: true });

// === FORCED INSTRUCTIONS FLOW ===
// RING THE BELL → how-to screen → ENTER HOTEL 404 → game
$('#startBtn').onclick = ringTheBell;
$('#againBtn').onclick = start;
$('#restartBtn').onclick = start;
$('#viewEndingBtn').onclick = () => revealEnding();
$('#howToBackBtn').onclick = backToStart;
$('#howToStartBtn').onclick = start;
$('#soundBtn').onclick = () => {
  state.sound = !state.sound;
  $('#soundBtn').textContent = state.sound ? tr('soundOn') : tr('soundOff');
  if (state.sound) { startBgm(); tone(); }
  else { stopBgm(); bell.pause(); Object.values(outcomeSounds).forEach(a => a.pause()); }
};
document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => applyLanguage(b.dataset.lang));
applyLanguage(state.lang);
