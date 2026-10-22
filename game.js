/* ============================================================
   HOTEL 404 — v2 engine
   Vanilla JS. No build step. No backend.
   ============================================================ */

const $ = s => document.querySelector(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ---------- progress (localStorage) ---------- */
const SAVE_KEY = 'h404.progress.v2';

function loadProgress() {
  const blank = { v: 2, endings: [], badges: [], bestStreak: 0, runs: 0 };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blank;
    const p = JSON.parse(raw);
    return { ...blank, ...p };
  } catch (e) { return blank; }
}
let progress = loadProgress();
function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {}
}

/* ---------- state ---------- */
const state = {
  mood: 50,
  act: 1,
  items: [],
  flags: {},
  fragments: [],
  scene: null,
  steps: 0,
  roomsSeen: [],
  incident: false,
  history: [],
  newBadges: [],
  pendingEnding: null,
  pendingTier: null,
  view: 'start',
  sound: true,
  lang: localStorage.getItem('h404.lang') || 'en'
};

/* ---------- audio ---------- */
const audioBase = './';
const bgm = new Audio(audioBase + 'mystery-bgm.mp3');
const bell = new Audio(audioBase + 'bell.wav');
bgm.loop = true; bgm.volume = .45; bell.volume = .8;
bgm.preload = 'auto'; bell.preload = 'auto';

const outcomeSounds = {
  escaped: new Audio(audioBase + 'outcome-escaped.wav'),
  changed: new Audio(audioBase + 'outcome-hired.wav'),
  erased: new Audio(audioBase + 'outcome-erased.wav')
};
Object.values(outcomeSounds).forEach(a => { a.volume = .75; a.preload = 'auto'; });

/* ============================================================
   ITEMS — each has exactly one job
   ============================================================ */
const ITEMS = {
  photo: {
    name: 'Photo',
    hint: 'You and Peter, last summer. Proof you are not imagining this.',
    use: 'Opens a door in Room 219. Required for the true departure.'
  },
  halfkey: {
    name: 'Half-Key',
    hint: 'Stamped 404\u00BD. It will open one door, and only once.',
    use: 'Opens Room 219.'
  },
  candle: {
    name: 'Candle',
    hint: 'Still lit. It will survive one blackout \u2014 not two.',
    use: 'Survives the Act II blackout.'
  },
  bell: {
    name: 'Bell',
    hint: 'His old concierge bell. Ring it to call him \u2014 or to send him away.',
    use: 'Summons him. Bargains at the desk. Rings at the mirror.'
  }
};

/* ============================================================
   BADGES
   ============================================================ */
const BADGES = {
  first_escape: { name: 'First Escape', copy: 'You checked out. Once is enough to prove it can be done.' },
  bell_ringer: { name: 'Bell Ringer', copy: 'Twenty-eight years of silence, and you rang it.' },
  smiles_whisperer: { name: 'Smiles Whisperer', copy: 'He has not been this happy since 1998.' },
  three_doors: { name: 'Three Doors', copy: 'No reports filed. Three rooms, one night.' },
  truth_seen: { name: '404', copy: 'Peter left eleven months ago. You were the one still here.' },
  all_endings: { name: 'The Full Ledger', copy: 'Six departures. One guest.' }
};

/* ============================================================
   ENDINGS
   ============================================================ */
const ENDING_ORDER = ['alone', 'together', 'dnd', 'roomservice', 'bell', '404'];

const endings = {
  alone: {
    title: 'Check Out Alone',
    kind: 'DEPARTURE RECORD',
    status: 'ESCAPED',
    type: 'escaped',
    icon: '\u2744',
    cause: 'You reached the front desk and chose the door.',
    filedBy: 'M. Verity, Front Desk',
    advice: 'The half-key opens Room 219. You never used it.',
    text: 'You walk out at 06:04 with the coat folded under your arm and no one behind you. The doorman holds the door. He says nothing. It is the last kindness the hotel ever gives you, and you will think about it for a long time.'
  },
  together: {
    title: 'Check Out Together',
    kind: 'DEPARTURE RECORD',
    status: 'ESCAPED',
    type: 'escaped',
    icon: '\u273F',
    cause: 'You were approved for checkout with a guest.',
    filedBy: 'E. Vance, Night Concierge',
    advice: 'You did this correctly. There is no note on your file.',
    text: 'You take his hand and the two of you walk out into a morning that is real enough. Behind you the sign flickers once and goes dark, and nobody files a report. Peter does not speak until the corner. Then he says your name, and it is the first thing he has said in eleven months, and it is enough.'
  },
  dnd: {
    title: 'Do Not Disturb',
    kind: 'INCIDENT REPORT',
    status: 'DEPARTED',
    type: 'changed',
    icon: '\u2634',
    cause: 'You broke the one rule.',
    filedBy: 'E. Vance, Night Concierge',
    advice: 'He asked for a secret. He would have accepted a small one.',
    text: 'The badge is already printed with your name on it. Night shift begins at 03:33. You are very good at this. You were always going to be good at this. Somewhere in Room 404 a guest is waking up, and the phone is ringing, and you pick it up and say: welcome to Hotel 404.'
  },
  roomservice: {
    title: 'Room Service',
    kind: 'DEPARTURE RECORD',
    status: 'EXCHANGED',
    type: 'changed',
    icon: '\u2666',
    cause: 'Exchange filed: one guest for one exit.',
    filedBy: 'E. Vance, Night Concierge',
    advice: 'The bell has other uses. Try it somewhere with a mirror.',
    text: 'You trade eleven months of someone else\u2019s life for one clean exit. The bill comes to exactly one pleased guest. You pay it. The tray is silver and you do not look at what is on it. Peter walks out behind you and does not thank you, and you understand that he shouldn\u2019t.'
  },
  bell: {
    title: 'The Bell Tolls',
    kind: 'DEPARTURE RECORD',
    status: 'ESCAPED',
    type: 'escaped',
    icon: '\u266A',
    cause: 'Concierge bell rung in an unauthorised location.',
    filedBy: 'E. Vance, Night Concierge',
    advice: 'He remembered for four seconds. Four was not quite enough.',
    text: 'One ring. He remembers being a person for four seconds \u2014 you can see it arrive in his face, the way weather arrives. In those four seconds he opens the door. Then he is gone, and the hotel is still standing, and the bell is still in your hand, and it is still warm.'
  },
  '404': {
    title: '404',
    kind: 'DEPARTURE RECORD',
    status: 'CHECKED OUT',
    type: 'true',
    icon: '404',
    cause: 'You rang the bell for the guest on the register.',
    filedBy: 'The Front Desk',
    advice: 'Peter checked out eleven months ago. You were the one still here.',
    text: 'The ledger has one entry. It has always had one entry, and the name on it is yours. Eleven months ago your brother Peter checked out of Room 219. The hotel let him go because you asked it to, and because it wanted something better in exchange. It kept you. Then it took the week you made that trade, so that you would spend eleven months searching for a brother who was already safe, and never once think about the front door. You ring the bell. Not for him. For the guest on the register. You finally check out.'
  }
};

/* ============================================================
   HELPERS
   ============================================================ */
const C = (label, next, mood, o = {}) => ({ label, next, mood, ...o });

function norm(c) {
  if (Array.isArray(c)) {
    const [label, next, mood = 0, extra] = c;
    const isFlag = ['knowsRule', 'knowsPeter', 'knowsName', 'truth', 'paid'].includes(extra);
    return {
      label, next, mood,
      risk: mood >= 8 ? 'safe' : mood <= -8 ? 'danger' : 'risky',
      item: isFlag ? null : (extra || null),
      flag: isFlag ? extra : null
    };
  }
  if (!c.risk) c.risk = c.mood >= 8 ? 'safe' : c.mood <= -8 ? 'danger' : 'risky';
  return c;
}

/* ============================================================
   SCENES — 3 acts, 26 scenes
   ============================================================ */
const scenes = {

  /* ==================== ACT I — CHECK IN ==================== */

  wake: {
    act: 1,
    chapter: 'ACT I / ROOM 404',
    time: '03:33',
    icon: '\u25D4',
    title: 'The Wake-Up Call',
    text: `<p>The phone rings at 03:33. You answer it before you decide to.</p>
<p>You are in Room 404. You do not remember checking in, and the door will not open.</p>
<p>On the nightstand is your wallet, and in it a photograph: you and your brother Peter at the lake, the summer before he disappeared. Peter has been missing eleven months. You came to this hotel to find him. Now you cannot get out either.</p>
<p>The voice on the line is dry and patient. <em>"Good evening. Your checkout requires your roommate's approval. Keep the guest happy, and he will sign. Fail, and you will stay."</em></p>
<p>Your roommate is Mr. Smiles. You have not met him yet. You can hear him breathing.</p>`,
    choices: [
      C('Answer politely. Ask how checkout works.', 'verity', 10, {
        risk: 'safe', flag: 'knowsRule',
        hint: 'The front desk notices manners.',
        reason: 'You were polite to the front desk.'
      }),
      C('Check under the bed first.', 'under_bed', 5, {
        risk: 'safe',
        hint: 'Mr. Smiles respects someone who takes their time.',
        reason: 'You took your time. He respects that.'
      }),
      C('Pull the blanket over your head.', 'bed_mouth', -5, {
        risk: 'risky',
        hint: 'Mr. Smiles dislikes being ignored.',
        reason: 'You ignored him.'
      }),
      C('Demand to speak to the manager.', 'smiles_meets', -10, {
        risk: 'danger', flag: 'demanded',
        hint: 'Mr. Smiles is the manager.',
        reason: 'You raised your voice in his hotel.'
      })
    ]
  },

  verity: {
    act: 1,
    chapter: 'ACT I / ROOM 404',
    time: '03:36',
    icon: '\u260E',
    title: 'The Front Desk',
    text: `<p><em>"Checkout is a courtesy, not a right,"</em> the front desk says. <em>"Your roommate signs for it. He signs for everything in this building."</em></p>
<p>You ask what raises his rating.</p>
<p><em>"Be worth approving,"</em> she says. <em>"He has worked the night shift since 1998. Nobody has been kind to him in a very long time. That is all I am permitted to say."</em></p>
<p>You ask about Peter.</p>
<p>A pause, exactly long enough to be a decision. <em>"There is only one guest on that floor."</em></p>
<p>The line clicks. Somewhere in the wall a bell rings once, far away, as if someone has just arrived.</p>`,
    choices: [
      C('Ask about Peter.', 'under_bed', 5, {
        risk: 'safe', flag: 'askedPeter',
        hint: 'She will not answer. Ask anyway.',
        reason: 'You asked the right question.'
      }),
      C('Ask how to leave.', 'under_bed', 0, {
        risk: 'risky',
        hint: 'The front desk has been asked this before.',
        reason: 'She has heard that question eleven hundred times.'
      }),
      C('"You are lying."', 'under_bed', -5, {
        risk: 'risky', flag: 'suspectVerity',
        hint: 'She is. She will remember that you noticed.',
        reason: 'You called the front desk a liar.'
      })
    ]
  },

  under_bed: {
    act: 1,
    chapter: 'ACT I / ROOM 404',
    time: '03:38',
    icon: '\u271B',
    title: 'Under the Bed',
    text: `<p>Dust, a dead moth, and a key on a brass ring stamped <strong>404\u00BD</strong> \u2014 a room number that cannot exist.</p>
<p>Beside it, a crayon drawing folded twice: a tall man in a uniform holding a small bell. Underneath, in a child's handwriting: <strong>HE IS NOT SCARY IF YOU SAY THANK YOU</strong>.</p>
<p>Someone left these under the bed for a guest to find. You are the guest. That is either an invitation or a warning.</p>`,
    choices: [
      C('Take the key.', 'smiles_meets', 5, {
        risk: 'safe', item: 'halfkey', flag: 'sawDrawing',
        hint: 'It will open one door, and only once.',
        reason: 'You took what was offered.'
      }),
      C('Leave it. Go to the door.', 'smiles_meets', 0, {
        risk: 'risky',
        hint: 'Mr. Smiles noticed you refuse gifts.',
        reason: 'He offered you something and you declined.'
      })
    ]
  },

  smiles_meets: {
    act: 1,
    chapter: 'ACT I / ROOM 404',
    time: '03:41',
    icon: '\u263B',
    title: 'The Concierge',
    tutorial: true,
    text: `<p>The corner of the room is empty. Your shadow on the wall is not.</p>
<p>It unfolds into a man in a concierge's uniform: horns, a grin too wide for his face, and the posture of someone who has spent his whole life standing slightly forward, waiting to be needed.</p>
<p><em>"Good evening,"</em> he says, in the voice from the phone but lower, and tired. <em>"I am Mr. Smiles. Night concierge. I have kept every guest in this hotel happy. Every one. When I am pleased with you, I sign your checkout."</em></p>
<p><em>"So."</em> He waits. <em>"Impress me."</em></p>`,
    choices: [
      C('"Good evening."', 'bed_mouth', 10, {
        risk: 'safe',
        hint: 'He has not been greeted in a long time.',
        reason: 'You greeted him properly.'
      }),
      C('"What is your name?"', 'bed_mouth', 5, {
        risk: 'safe', flag: 'askedName',
        hint: 'He may not be able to answer. Ask anyway.',
        reason: 'Nobody has asked him that in years.'
      }),
      C('Say nothing.', 'bed_mouth', -10, {
        risk: 'risky',
        hint: 'Mr. Smiles does not forgive silence.',
        reason: 'You said nothing. He noticed.'
      })
    ]
  },

  bed_mouth: {
    act: 1,
    chapter: 'ACT I / ROOM 404',
    time: '03:44',
    icon: '\u2634',
    title: 'The Room Keeps You',
    text: `<p>The bed is warm. Too warm. When you try to sit up, the sheets pull back like a hand closing.</p>
<p>The walls take a breath. The ceiling has a pulse.</p>
<p><em>"Guests who cannot sleep,"</em> says the room, in a voice that is not the concierge's, <em>"are guests who stay."</em></p>
<p>You have to get out of this bed. The corridor is the only other place in this building you are sure exists.</p>`,
    choices: [
      C('Fight the sheets. Roll off the bed.', 'hall', 10, {
        risk: 'safe',
        hint: 'He respects a guest who wants to leave.',
        reason: 'You fought. He likes a fighter.'
      }),
      C('Call out: "Room service?"', 'hall', 5, {
        risk: 'safe', flag: 'knowsBell',
        hint: 'He is a concierge. He cannot ignore a request.',
        reason: 'You gave him a job to do.'
      }),
      C('Close your eyes and dream your way out.', 'hall', 5, {
        risk: 'safe',
        hint: 'Dreaming is a back door. He will charge interest.',
        reason: 'He allowed it. He will collect later.'
      })
    ]
  },

  hall: {
    act: 1,
    chapter: 'ACT I / CORRIDOR',
    time: '03:50',
    icon: '\u2194',
    title: 'The Corridor',
    text: `<p>The corridor runs both ways and neither end has a window.</p>
<p>Left: a green <strong>EXIT</strong> sign \u2014 standard, municipal, reassuring. Right: a hand-painted board, crooked, reading <strong>REAL EXIT \u2192</strong>.</p>
<p>You already know one thing about this hotel: it builds its own signs. Someone else made the board.</p>
<p>Behind you, Room 405's door is ajar. Inside, twenty people are singing to someone.</p>`,
    choices: [
      C('Follow the green EXIT sign.', 'loop', -5, {
        risk: 'risky',
        hint: 'The hotel installed that sign itself.',
        reason: 'You trusted the hotel\u2019s own signage.'
      }),
      C('Trust the hand-painted sign.', 'party405', 5, {
        risk: 'safe',
        hint: 'Someone made that sign by hand. Someone wanted you to read it.',
        reason: 'You trusted a guest over the hotel.'
      }),
      C('Take the candle from the wall sconce.', 'party405', 0, {
        risk: 'risky', item: 'candle',
        hint: 'Mr. Smiles notices guests who take things.',
        reason: 'You took something without asking.'
      }),
      C('Knock on Room 405.', 'party405', 5, {
        risk: 'safe',
        hint: 'Mr. Smiles is fond of his parties.',
        reason: 'You accepted an invitation.'
      })
    ]
  },

  loop: {
    act: 1,
    chapter: 'ACT I / CORRIDOR',
    time: '03:58',
    icon: '\u2BA5',
    title: 'The Loop',
    text: `<p>You push through the green door and step into Room 404.</p>
<p>You push again. Room 404.</p>
<p>The third time, the bed is occupied \u2014 you are in it, asleep \u2014 and Mr. Smiles stands over you with one hand on the headboard, the way a concierge steadies a luggage cart.</p>
<p><em>"That door has never opened for anyone,"</em> he says, without looking up. <em>"I did tell you the rule."</em></p>
<p>You step back into the corridor. The green sign now reads <strong>EXIT (NO)</strong>.</p>`,
    choices: [
      C('Take the hand-painted sign instead.', 'party405', 5, {
        risk: 'safe',
        hint: 'The only honest sign in the building.',
        reason: 'You learned something. He noticed.'
      }),
      C('Wake yourself up.', 'party405', -10, {
        risk: 'danger', flag: 'sawSelf',
        hint: 'There are two of you now. He only registered one.',
        reason: 'You made the register wrong.'
      })
    ]
  },

  party405: {
    act: 1,
    chapter: 'ACT I / ROOM 405',
    time: '04:02',
    icon: '\u273F',
    title: 'The Two Hundredth',
    text: `<p>Twenty silhouettes around a long table. A banner, hand-lettered: <strong>HAPPY 200TH, MR. SMILES</strong>.</p>
<p>One candle on the cake. It is whispering, and what it is whispering is a list of names.</p>
<p>On the chair nearest the door, folded neatly, is a child-sized coat. In the pocket, a bus ticket dated eleven months ago. The destination has been scratched out.</p>
<p>It is Peter's coat. You would know it anywhere.</p>`,
    choices: [
      C('Sing to them.', 'smiles_test', 10, {
        risk: 'safe',
        hint: 'He has not had a party in a very long time.',
        reason: 'You sang to him. He will not forget it.'
      }),
      C('Take the coat.', 'smiles_test', 5, {
        risk: 'safe', fragment: 'coat',
        hint: 'It is Peter\u2019s coat. He will not want you to have it.',
        reason: 'You took something of his. He allowed it.'
      }),
      C('Eat the cake first.', 'smiles_test', 0, {
        risk: 'risky', item: 'token',
        hint: 'The candle is still whispering.',
        reason: 'You ate before the guest of honour.'
      }),
      C('Ask whose birthday it really is.', 'smiles_test', 5, {
        risk: 'safe', flag: 'askedBirthday',
        hint: 'Nobody has ever asked him that.',
        reason: 'You asked about him, not the party.'
      })
    ]
  },

  smiles_test: {
    act: 1,
    chapter: 'ACT I / CORRIDOR',
    time: '04:10',
    icon: '\u2620',
    title: 'A Secret, Or Else',
    text: `<p>The party goes quiet all at once, the way a room does when the host stands up.</p>
<p>Mr. Smiles is in the corridor. He has been in the corridor the whole time.</p>
<p><em>"Every guest submits one secret before checkout,"</em> he says. <em>"It is policy. Tell me a secret, or I will tell one about you."</em></p>
<p>He is not threatening you. He is reciting a procedure. That is worse.</p>`,
    choices: [
      C('Tell him about Peter.', 'dawn_that_isnt', 10, {
        risk: 'safe', flag: 'knowsPeter',
        hint: 'He respects a straight answer.',
        reason: 'You gave him something real.'
      }),
      C('Lie to him.', 'dawn_that_isnt', -10, {
        risk: 'risky', flag: 'lied',
        hint: 'He has been lied to by professionals for twenty-eight years.',
        reason: 'He knew. He always knows.'
      }),
      C('Say nothing at all.', 'ending:dnd', -25, {
        risk: 'rulebreak', danger: true,
        hint: 'Silence is a rule-break. Mr. Smiles does not forgive silence.',
        reason: 'You broke the one rule.'
      })
    ]
  },

  dawn_that_isnt: {
    act: 1,
    chapter: 'ACT I / CORRIDOR',
    time: '04:20',
    icon: '\u25D1',
    title: 'The Dawn That Isn\u2019t',
    text: `<p>You wait for morning. The corridor clock reads 04:20.</p>
<p>It reads 04:20.</p>
<p>It reads 04:20.</p>
<p><em>"The night is eight hours long,"</em> says Mr. Smiles, from somewhere behind you, kindly. <em>"You have been checked in for eleven months. This is the first night you have been awake for."</em></p>
<p>The lights go out.</p>`,
    choices: [
      C('Keep moving in the dark.', 'blackout', 0, { risk: 'safe' })
    ]
  },

  /* ==================== ACT II — THE GUESTS ==================== */

  blackout: {
    act: 2,
    chapter: 'ACT II / THE GUESTS',
    time: '04:21',
    router: s => s.items.includes('candle') ? 'blackout_lit' : 'blackout_dark'
  },

  blackout_lit: {
    act: 2,
    chapter: 'ACT II / 405',
    time: '04:25',
    icon: '\u2736',
    title: 'By Candlelight',
    text: `<p>Your candle stays lit. In its light, the corridor walls are covered in writing \u2014 hundreds of names, each with a date beside it, each date scratched over and corrected.</p>
<p>Near the floor, in a child's hand: <strong>PETER \u2014 04/11</strong>.</p>
<p>The date has been scratched out eleven times.</p>
<p>He keeps a list of everyone he could not keep. Your brother is on it.</p>`,
    choices: [
      C('Read the walls to the end.', 'guests', 5, {
        risk: 'safe', fragment: 'walls',
        hint: 'He wrote all of these himself.',
        reason: 'You read his work. He is proud of it.'
      }),
      C('Keep moving.', 'guests', 0, { risk: 'risky' })
    ]
  },

  blackout_dark: {
    act: 2,
    chapter: 'ACT II / 405',
    time: '04:25',
    icon: '\u25CF',
    title: 'Without a Light',
    text: `<p>The dark is not empty. It has a texture, like standing inside a coat.</p>
<p>Somewhere ahead, someone is counting. They are on the number eleven and they have been on it for a while.</p>
<p>You cannot see your own hands. You have to move anyway, or the dark will decide for you.</p>`,
    choices: [
      C('Follow the counting.', 'guests', -10, {
        risk: 'risky',
        hint: 'He noticed you were afraid.',
        reason: 'You were afraid in his hotel.'
      }),
      C('Stand still and wait for morning.', 'guests', -15, {
        risk: 'danger', danger: true,
        hint: 'There is no morning. He does not like waiting.',
        reason: 'You refused to move. He had to move you.'
      })
    ]
  },

  guests: {
    act: 2,
    chapter: 'ACT II / ROOM 405',
    time: '04:30',
    icon: '\u2637',
    title: 'The Guests',
    text: `<p>Room 405 is not a party anymore. Three figures sit at the long table in the dark.</p>
<p>A woman in a housecoat, hair set for a funeral. Two children holding hands. A man whose face has been worn smooth, like a coin.</p>
<p><em>"You're the one looking,"</em> the woman says. <em>"We can tell. You have that walk."</em></p>
<p>They were guests once. This is what the hotel does to guests who are never approved.</p>`,
    choices: [
      C('Ask about Peter.', 'ledger', 10, {
        risk: 'safe', flag: 'askedGuests',
        hint: 'They have been waiting for someone to ask.',
        reason: 'You asked a guest about a guest. Correct.'
      }),
      C('Ask about the concierge.', 'ledger', 5, {
        risk: 'safe',
        hint: 'He is listening. He is flattered.',
        reason: 'He is flattered you asked.'
      }),
      C('Demand answers.', 'ledger', -10, {
        risk: 'risky',
        hint: 'You are a guest. Guests do not demand.',
        reason: 'You raised your voice in his hotel.'
      }),
      C('Ask the faceless man.', 'ledger', 5, {
        risk: 'safe', bonus: true, requires: s => s.mood >= 75,
        lockedLabel: 'He has no mouth. He only speaks to guests Mr. Smiles approves of.',
        flag: 'facelessTruth',
        hint: 'Pleased guests get answers.',
        reason: 'You were approved, so he spoke.'
      })
    ]
  },

  ledger: {
    act: 2,
    chapter: 'ACT II / FRONT DESK',
    time: '04:40',
    icon: '\u2261',
    title: 'The Register',
    text: `<p>The front desk is unattended. The ledger lies open, and the pages are warm.</p>
<p>Twenty-three names. Twenty-three dates. Twenty-three columns headed <strong>CHECKED OUT</strong> \u2014 all blank.</p>
<p>Eleven months ago: <strong>PETER \u2014 ROOM 219 \u2014 NOT CHECKED OUT</strong>.</p>
<p>And directly beneath it, in the same handwriting, a second name. Yours. Dated the same night.</p>`,
    choices: [
      C('Read to the end.', 'memo', 10, {
        risk: 'safe', fragment: 'ledger', flag: 'sawOwnName',
        hint: 'He does not want you to finish this page.',
        reason: 'You learned something he wanted hidden.'
      }),
      C('Close it.', 'memo', -5, {
        risk: 'risky',
        hint: 'He prefers guests who look away.',
        reason: 'You looked away. He prefers that.'
      })
    ]
  },

  memo: {
    act: 2,
    chapter: 'ACT II / STAFF HALL',
    time: '04:50',
    icon: '\u270E',
    title: 'Staff Notice 44-B',
    text: `<p>A service corridor, narrow as a lift shaft. A memo is pinned to the board, yellowed, typed on a machine that no longer exists.</p>
<p><strong>STAFF NOTICE 44-B</strong><br><strong>SUBJECT: E. VANCE, NIGHT CONCIERGE</strong></p>
<p><em>Mr. Vance continues to exceed guest satisfaction targets. Under no circumstances allow him to remember that he is not a member of staff. Do not use his first name.</em></p>
<p>Someone has written beneath it, in pencil: <em>sorry Elias</em>.</p>
<p>So the man who decides whether you leave does not know what he is. His name is Elias Vance, and the hotel has been keeping him employed for twenty-eight years.</p>`,
    choices: [
      C('Pocket the memo.', 'basement', 10, {
        risk: 'safe', fragment: 'memo', flag: 'knowsName',
        hint: 'Knowing his name will matter.',
        reason: 'You know his name now. He can feel it.'
      }),
      C('Leave it pinned.', 'basement', 0, { risk: 'risky' })
    ]
  },

  basement: {
    act: 2,
    chapter: 'ACT II / BASEMENT',
    time: '05:00',
    icon: '\u2235',
    title: 'The Laundry',
    text: `<p>Six machines turning with no power, sheets folding themselves in the drums.</p>
<p>In the third machine, something brass is tumbling \u2014 a hand bell, the kind kept on a hotel desk. The grip is worn silver where a thumb has rested for twenty-eight years.</p>
<p>It is his bell. A concierge answers a bell; it is the one thing he cannot refuse. The drum is spinning fast. The door is not locked.</p>`,
    choices: [
      C('Press STOP first.', 'door219', 10, {
        risk: 'safe', item: 'bell',
        hint: 'Careful with his things.',
        reason: 'You were careful with his things.'
      }),
      C('Reach in while it spins.', 'door219', -10, {
        risk: 'danger', item: 'bell',
        hint: 'It will take something from you.',
        reason: 'You were careless with his things.'
      })
    ]
  },

  door219: {
    act: 2,
    chapter: 'ACT II / ROOM 219',
    time: '05:10',
    router: s => s.items.includes('halfkey') ? 'room219' : 'door219_locked'
  },

  door219_locked: {
    act: 2,
    chapter: 'ACT II / ROOM 219',
    time: '05:10',
    icon: '\u26A0',
    title: 'The Door That Does Not Open',
    text: `<p>Room 219. The number is painted in the same gold as every other, and underneath it, smaller, someone has scratched a second number: <strong>11</strong>.</p>
<p>The handle does not move. There is no lock on this door \u2014 it simply does not open for you.</p>
<p>Through the wood, very faint, a voice says one word. It is your name.</p>`,
    choices: [
      C('Say the word back.', 'confront', 5, {
        risk: 'safe', flag: 'heardPeter',
        hint: 'He heard you try.',
        reason: 'He heard you try. It counted for something.'
      }),
      C('Walk away.', 'act2_choice', -5, {
        risk: 'risky',
        hint: 'He watched you give up.',
        reason: 'He watched you give up.'
      })
    ]
  },

  room219: {
    act: 2,
    chapter: 'ACT II / ROOM 219',
    time: '05:12',
    icon: '\u273F',
    title: 'Room 219',
    text: `<p>The key turns. The room is smaller than it should be, and colder, and the wallpaper has been picked at in one corner by someone with nothing to do for eleven months.</p>
<p>Peter is sitting on the edge of the bed. Awake. Not looking at you \u2014 looking at the door, the way you look at a door when you have been listening to it for a year.</p>
<p>He is exactly as he is in the photograph.</p>`,
    choices: [
      C('Show him the photograph.', 'confront', 15, {
        risk: 'safe', flag: 'foundPeter',
        hint: 'Proof. He respects proof.',
        reason: 'He watched you keep a promise.'
      }),
      C('Say his name.', 'confront', 5, {
        risk: 'safe',
        hint: 'He allows this. Barely.',
        reason: 'He allowed it.'
      }),
      C('Take his hand.', 'confront', -5, {
        risk: 'risky',
        hint: 'He does not like being touched.',
        reason: 'He does not like being touched.'
      }),
      C('Ask Peter about the bell.', 'confront', 5, {
        risk: 'safe', bonus: true, requires: s => s.mood >= 75,
        lockedLabel: 'Peter will not speak to you in front of him unless he is pleased.',
        flag: 'knowsName',
        hint: 'Pleased guests get answers.',
        reason: 'He let Peter answer. That is rare.'
      })
    ]
  },

  confront: {
    act: 2,
    chapter: 'ACT II / ROOM 219',
    time: '05:20',
    icon: '\u263B',
    title: 'The Performance Review',
    text: `<p>Mr. Smiles is in the doorway. He does not come in. He has not been invited, and some part of him is still, after twenty-eight years, a man who waits to be invited.</p>
<p><em>"That room is not on the register,"</em> he says.</p>
<p><em>"I have kept every guest happy. Every one. I would like you to tell me I have done well."</em></p>
<p>This is the review. This is what his rating has been measuring all night.</p>`,
    choices: [
      C('"Elias."', 'act2_choice', 15, {
        risk: 'safe', requires: s => s.flags.knowsName,
        lockedLabel: 'You do not know his name.',
        flag: 'namedHim',
        hint: 'Nobody has used his name in twenty-eight years.',
        reason: 'You used his name. Nobody has in twenty-eight years.'
      }),
      C('Ring the bell.', 'act2_choice', 5, {
        risk: 'safe', requires: s => s.items.includes('bell'),
        lockedLabel: 'You have nothing to ring.',
        flag: 'rangBell',
        hint: 'He will answer it. He always answers it.',
        reason: 'He answered it. Of course he answered it.'
      }),
      C('Apologise.', 'act2_choice', 5, {
        risk: 'risky',
        hint: 'He accepts apologies. He always accepts them.',
        reason: 'He accepted it. He always accepts it.'
      }),
      C('Run.', 'act2_choice', -15, {
        risk: 'danger', danger: true,
        hint: 'You are in his hotel.',
        reason: 'You ran from him in his own hotel.'
      }),
      C('Ask him about the bell.', 'act2_choice', 5, {
        risk: 'safe', bonus: true, requires: s => s.mood >= 75,
        lockedLabel: 'He will not discuss it with a guest he is unhappy with.',
        flag: 'knowsName',
        hint: 'Pleased guests get the truth.',
        reason: 'He told you because you pleased him.'
      })
    ]
  },

  act2_choice: {
    act: 2,
    chapter: 'ACT II / CORRIDOR',
    time: '05:40',
    icon: '\u2195',
    title: 'Three Ways Out',
    text: `<p>The corridor is longer than it was. At the far end the lobby lights are on \u2014 the only warm thing in the building, and the only door out.</p>
<p>Peter is behind you. Mr. Smiles is behind Peter.</p>
<p>Somewhere above, the roof. Somewhere below, the machines have started turning again.</p>`,
    choices: [
      C('Take Peter to the lobby.', 'lobby', 5, {
        risk: 'safe',
        hint: 'The front doors. The only door that matters.',
        reason: 'You chose the door. He approves.'
      }),
      C('Go up to the roof.', 'roof', 0, { risk: 'risky' }),
      C('Go down to the basement.', 'basement_final', 0, { risk: 'risky' })
    ]
  },

  /* ==================== ACT III — CHECK OUT ==================== */

  roof: {
    act: 3,
    chapter: 'ACT III / THE ROOF',
    time: '05:45',
    icon: '\u2744',
    title: 'The Roof',
    text: `<p>The roof is flat and cold, and the city below is a model of a city, lit from inside, with no one in it.</p>
<p>Far off, one window is warm. Room 219. It is the only warm window in the city.</p>
<p>Mr. Smiles stands at the parapet with his back to you, hands behind him \u2014 the way a concierge stands when he is waiting for a car that is not coming.</p>
<p><em>"I have been at this desk since 1998,"</em> he says. <em>"I would like someone to know that."</em></p>`,
    choices: [
      C('Stand at the parapet with him.', 'checkout', 10, {
        risk: 'safe',
        hint: 'He has not been stood with in a long time.',
        reason: 'You stood with him. That was kind.'
      }),
      C('Ask him what he wants.', 'checkout', 5, {
        risk: 'safe',
        hint: 'He has an answer. He has had it ready for years.',
        reason: 'You asked him a real question.'
      }),
      C('Go back down.', 'checkout', 0, { risk: 'risky' })
    ]
  },

  basement_final: {
    act: 3,
    chapter: 'ACT III / BASEMENT',
    time: '05:45',
    icon: '\u2696',
    title: 'The Exchange',
    text: `<p>The machines have stopped. In the quiet, Mr. Smiles stands at the end of the room with the ledger open in his hands, and he is not smiling, and that is worse.</p>
<p><em>"There is a form for this,"</em> he says. <em>"There is a form for everything. You want the guest released. I want to be told I did well. We can file it as an exchange."</em></p>`,
    choices: [
      C('Ring the bell and accept the exchange.', 'ending:roomservice', 0, {
        risk: 'risky', requires: s => s.items.includes('bell'),
        lockedLabel: 'You have no bell. He will not open a form without one.',
        hint: 'You will pay with something you cannot see.',
        reason: 'You filed the form. He was delighted.'
      }),
      C('Refuse. Go up to the lobby.', 'lobby', 5, {
        risk: 'safe',
        hint: 'He respects a guest who will not bargain.',
        reason: 'You refused to bargain. He respected it.'
      }),
      C('Stay. Take the badge.', 'ending:dnd', -10, {
        risk: 'danger',
        hint: 'The badge is already printed with your name.',
        reason: 'You took the badge.'
      })
    ]
  },

  lobby: {
    act: 3,
    chapter: 'ACT III / THE LOBBY',
    time: '05:50',
    icon: '\u2308',
    title: 'The Lobby',
    text: `<p>The lobby is over-lit and completely white, and it smells of nothing at all.</p>
<p>The front desk is staffed now. There is no one behind it, but it is staffed.</p>
<p>The receipt printer wakes up and prints one line: <strong>PAYMENT: ONE PLEASED GUEST.</strong></p>
<p>That is the price of the door. It has always been the price.</p>`,
    choices: [
      C('Walk to the desk.', 'checkout', 0, { risk: 'safe' })
    ]
  },

  checkout: {
    act: 3,
    chapter: 'ACT III / THE LOBBY',
    time: '05:55',
    icon: '\u2302',
    title: 'Checkout',
    text: `<p>The front doors are glass. Beyond them it is 06:04, and the morning is grey and ordinary and real.</p>
<p>Mr. Smiles stands beside the desk with his hands folded.</p>
<p><em>"Checkout requires my approval,"</em> he says. <em>"I have never withheld it. I want you to know that."</em></p>
<p>This is the last decision in the hotel. Everything you did tonight is in his rating.</p>`,
    choices: [
      C('Leave now.', 'ending:alone', 0, {
        risk: 'risky',
        hint: 'You will walk out alone.',
        reason: 'You chose the door over the guest.'
      }),
      C('Take Peter\u2019s hand.', 'checkout_together', 10, {
        risk: 'safe', requires: s => s.flags.foundPeter,
        lockedLabel: 'Peter is not with you. You never opened Room 219.',
        hint: 'He will only approve this if he is pleased.',
        reason: 'You asked for two departures instead of one.'
      }),
      C('Stay. Take the badge.', 'ending:dnd', -10, {
        risk: 'danger',
        hint: 'Night shift begins at 03:33.',
        reason: 'You stayed.'
      }),
      C('Ring the bell at the desk.', 'ending:roomservice', 0, {
        risk: 'risky', requires: s => s.items.includes('bell'),
        lockedLabel: 'You have no bell.',
        hint: 'A form will be filed. Forms have costs.',
        reason: 'You filed a form at the desk.'
      }),
      C('Ring the bell at the mirror.', 'mirror', 5, {
        risk: 'safe', requires: s => s.items.includes('bell') && s.flags.knowsName,
        lockedLabel: 'You do not know enough to ring it here.',
        hint: 'He will answer it. What answers may not be him.',
        reason: 'You rang it somewhere you were not supposed to.'
      })
    ]
  },

  mirror: {
    act: 3,
    chapter: 'ACT III / 06:00',
    time: '06:00',
    icon: '\u25CE',
    title: 'The Mirror',
    text: `<p>The mirror behind the desk is the only thing in the lobby that is not white.</p>
<p>In it: Room 219. The bed. Someone sitting on the edge of it, listening to a door.</p>
<p>In it, also: the register, open, with one line on the page.</p>
<p>You put your hand on the bell. It is the one thing in this building that has ever answered you.</p>`,
    choices: [
      C('Ring it.', 'mirror_ring', 20, {
        risk: 'safe',
        hint: 'This is the right moment. It is also the wrong one.',
        reason: 'You rang it for the guest.'
      }),
      C('Step back.', 'checkout', 0, { risk: 'risky' })
    ]
  }
};

/* ============================================================
   ROUTERS — pure functions of state
   ============================================================ */
const routers = {
  blackout: s => s.items.includes('candle') ? 'blackout_lit' : 'blackout_dark',
  door219: s => s.items.includes('halfkey') ? 'room219' : 'door219_locked',
  checkout_together: s =>
    (s.flags.foundPeter && s.items.includes('halfkey') && s.mood >= 75) ? 'ending:together' : 'ending:alone',
  mirror_ring: s => {
    const full = s.fragments.length === 4 && s.items.includes('photo') && s.mood >= 75;
    return full ? 'ending:404' : 'ending:bell';
  }
};

/* ============================================================
   MOOD ZONES
   ============================================================ */
function moodZone(n) {
  if (n >= 75) return 'PLEASED';
  if (n >= 50) return 'NEUTRAL';
  if (n >= 25) return 'IRRITATED';
  return 'FURIOUS';
}
function moodMeta(n) {
  if (n >= 75) return { i: 0, cls: 'happy', color: '#7fff9e' };
  if (n >= 50) return { i: 1, cls: '', color: '#c7ff5a' };
  if (n >= 25) return { i: 2, cls: 'annoyed', color: '#ffb866' };
  return { i: 3, cls: 'furious', color: '#ff6a4a' };
}

/* ============================================================
   TRANSLATION ACCESS
   ============================================================ */
const ENUI = {
  horror: 'AN ESCAPE GAME IN THREE ACTS',
  hero: 'HOTEL<br>404.<br><em>NO EXIT.</em>',
  coverTagline: 'You are locked in Room 404. The only way out is a signature.',
  storyEyebrow: 'THE NIGHT YOU CHECKED IN',
  storyTitle: 'HOW YOU GOT HERE',
  premise1: '<strong>You are locked in Room 404.</strong> The door does not open, and the hotel does not mean to let you leave.',
  premise2: '<strong>Your roommate decides.</strong> Mr. Smiles is the night concierge \u2014 and he shares this room with you. Every checkout needs his signature, and he only signs for a guest he is pleased with.',
  premise3: '<strong>So keep him happy.</strong> His rating is the lock on your door. Raise it and he signs you out at dawn. Drop it and you stay.',
  premise4: 'You checked in eleven months ago \u2014 the week your brother <strong>Peter</strong> vanished here. You remember none of it. Peter is still here. So are you.',
  start: 'RING THE BELL',
  howTo: 'HOW TO PLAY',
  howToContinue: 'ENTER HOTEL 404',
  tip: 'Headphones recommended \u00B7 Every choice is assessed',
  soundOn: 'SOUND: ON',
  soundOff: 'SOUND: OFF',
  restart: 'RESTART',
  roommate: 'GUEST SATISFACTION \u2014 MR. SMILES',
  pockets: 'PROPERTY LOG',
  empty: 'Nothing. Not even a phone.',
  way: 'WAY OUT?',
  status: 'YOUR STATUS',
  view: 'VIEW RECORD',
  again: 'CHECK IN AGAIN',
  endHint: 'Six departures. One guest. The ledger remembers all of them.',
  choices: 'CHOICES',
  mood: 'RATING',
  items: 'ITEMS',
  fragments: 'FRAGMENTS',
  ending: 'DEPARTURE',
  approve: 'HE APPROVES',
  disapprove: 'HE IS FURIOUS',
  undecided: 'UNDECIDED',
  ruleIdle: 'KEEP THE GUEST HAPPY \u2014 that\u2019s Mr. Smiles. He signs your checkout.',
  ruleAlarm: 'YOU ARE ABOUT TO BREAK THE ONE RULE.',
  ruleHeroLabel: 'THE RULE',
  ruleHeroText: 'Keep the guest happy \u2014 that\u2019s Mr. Smiles. He signs your checkout.',
  goalLabel: 'YOUR GOAL',
  goalText: 'Get his rating to <strong>PLEASED</strong>, then reach the front desk at dawn.',
  rulesEyebrow: 'GUEST INFORMATION CARD',
  rulesTitle: 'HOUSE RULES',
  rc1t: 'READ THE ASSESSMENT',
  rc1b: 'Every option carries a stamp. A <em>rule-break</em> ends your stay.<span class="stamp-row"><span class="badge-demo safe">SAFE</span><span class="badge-demo risky">RISKY</span><span class="badge-demo danger">DANGER</span><span class="badge-demo rulebreak">RULE-BREAK</span></span>',
  rc2t: 'WATCH HIS RATING',
  rc2b: '<em>Pleased</em> means he signs. <em>Furious</em> means he keeps you.',
  rc3t: 'LOG YOUR PROPERTY',
  rc3b: 'Four items, one job each: photo, half-key, candle, bell.',
  rc4t: 'FILE A DEPARTURE',
  rc4b: 'Six ways out. None is a failure \u2014 the ledger counts them all.',
  back: 'BACK',
  splash: 'CHECKING IN\u2026',
  splashEyebrow: 'REMEMBER',
  splashReminder: 'Make <strong>Mr. Smiles</strong> happy \u2014 so you can escape.',
  rfCauseLabel: 'CAUSE OF DEPARTURE',
  rfFiledLabel: 'FILED BY',
  rfAdviceLabel: 'WHAT YOU COULD HAVE DONE',
  departureWord: 'DEPARTURE',
  locked: 'LOCKED',
  itemLogged: 'GUEST PROPERTY LOGGED',
  badgeEarned: 'LOYALTY STAMP EARNED',
  departures: 'DEPARTURES RECORDED',
  newDeparture: 'NEW DEPARTURE',
  streak: 'NO REPORTS FILED \u2014 3 ROOMS CLEARED',
  streakBody: 'Mr. Smiles noticed. He is pleased with you.'
};

const RISK_LABEL = { safe: 'SAFE', risky: 'RISKY', danger: 'DANGER', rulebreak: 'RULE-BREAK' };

function tr(k) { return (LANGS[state.lang] && LANGS[state.lang].ui && LANGS[state.lang].ui[k]) || ENUI[k]; }

/* ============================================================
   AUDIO
   ============================================================ */
function startBgm() {
  if (!state.sound || !bgm.paused) return;
  try { const p = bgm.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (e) {}
}
function stopBgm() { bgm.pause(); }
function tone() {
  if (!state.sound) return;
  try { bell.currentTime = 0; const p = bell.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (e) {}
}
function restoreVolumes() { bgm.volume = .45; bell.volume = .8; }

/* ============================================================
   SCREEN FLOW
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ringTheBell() {
  state.view = 'brief';
  showScreen('briefScreen');
  if (state.sound) { startBgm(); tone(); }
}

function briefBack() {
  state.view = 'start';
  showScreen('startScreen');
  renderLedger();
}

/* true while the briefing -> curtain -> first-scene handover is running,
   so a double click cannot start two overlapping transitions */
let transitioning = false;

function start() {
  if (transitioning) return;
  transitioning = true;

  restoreVolumes();
  Object.values(outcomeSounds).forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });

  state.mood = 50;
  state.act = 1;
  state.items = ['photo'];
  state.flags = {};
  state.fragments = [];
  state.scene = null;
  state.steps = 0;
  state.roomsSeen = [];
  state.incident = false;
  state.history = [];
  state.newBadges = [];
  state.pendingEnding = null;
  state.pendingTier = null;
  state.view = 'game';

  progress.runs = (progress.runs || 0) + 1;
  saveProgress();

  const brief = document.getElementById('briefScreen');
  const splash = document.getElementById('introSplash');
  splash.classList.remove('out');

  /* 1. the page under the click lets go */
  brief.classList.add('leaving');

  /* 2. the curtain rises on the reminder — every screen is hidden behind it */
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    brief.classList.remove('leaving');
    splash.classList.add('active');
    startBgm();
    tone();
  }, 300);

  /* 3. hold the line long enough to read, then start lifting the curtain */
  setTimeout(() => splash.classList.add('out'), 300 + 1400);

  /* 4. bring the room up *under* the fading curtain, so it dissolves into scene 1
        instead of cutting to black */
  setTimeout(() => {
    showScreen('gameScreen');
    document.getElementById('restartBtn').classList.remove('hidden');
    route('wake');
  }, 300 + 1600);

  /* 5. the curtain is gone — release the lock */
  setTimeout(() => {
    splash.classList.remove('active', 'out');
    transitioning = false;
  }, 300 + 1800);
}

/* ============================================================
   ROUTING
   ============================================================ */
function route(id) {
  if (!id) return;
  if (typeof id === 'string' && id.indexOf('ending:') === 0) return end(id.slice(7));
  if (routers[id]) return route(routers[id](state));
  if (endings[id]) return end(id);
  if (scenes[id]) return show(id);
  return end('alone');
}

/* ============================================================
   SCENE DATA (translated if available)
   ============================================================ */
function sceneData(id) {
  const base = scenes[id];
  if (!base) return null;
  const z = LANGS[state.lang] && LANGS[state.lang].scenes && LANGS[state.lang].scenes[id];
  if (!z) return base;
  const merged = { ...base };
  if (z.chapter) merged.chapter = z.chapter;
  if (z.title) merged.title = z.title;
  if (z.text) merged.text = z.text;
  if (z.icon) merged.icon = z.icon;
  if (z.choices) {
    merged.choices = base.choices.map((c, i) => {
      const t = z.choices[i];
      if (!t) return c;
      return {
        ...c,
        label: (typeof t === 'string') ? t : t.label,
        hint: (t && t.hint) ? t.hint : c.hint
      };
    });
  }
  return merged;
}

/* ============================================================
   SHOW A SCENE
   ============================================================ */
const ROOM_MAP = {
  wake: '404', under_bed: '404', smiles_meets: '404', bed_mouth: '404',
  party405: '405', guests: '405',
  room219: '219', confront: '219', door219_locked: '219'
};

function show(id) {
  const s = sceneData(id);
  if (!s) return end('alone');

  state.scene = id;
  state.view = 'game';
  state.act = s.act || state.act;
  document.body.dataset.act = String(state.act);
  state.steps++;

  // --- three-room streak ---
  const room = ROOM_MAP[id];
  if (room && !state.roomsSeen.includes(room)) {
    state.roomsSeen.push(room);
    if (state.roomsSeen.length === 3) {
      state.mood = clamp(state.mood + 10, 15, 100);
      showToast('badge', '\u2605 ' + tr('streak'), tr('streakBody'));
      grantBadge('three_doors');
      showMoodDelta('', moodZone(state.mood), 10, tr('streakBody'));
    }
  }

  // --- rule banner ---
  const banner = document.getElementById('ruleBanner');
  banner.classList.remove('alarm');
  document.getElementById('ruleText').textContent = tr('ruleIdle');

  // --- meta ---
  document.getElementById('chapter').textContent = s.chapter;
  document.getElementById('time').textContent = s.time;
  document.getElementById('sceneIcon').textContent = s.icon;
  document.getElementById('sceneTitle').textContent = s.title;
  document.getElementById('storyText').innerHTML = s.text;

  const panel = document.querySelector('.story-panel');
  panel.classList.remove('animating');
  void panel.offsetWidth;
  panel.classList.add('animating');

  // --- choices ---
  const wrap = document.getElementById('choices');
  wrap.innerHTML = '';
  (s.choices || []).forEach((raw, i) => {
    const c = norm(raw);
    const locked = c.requires ? !c.requires(state) : false;
    const btn = document.createElement('button');
    btn.className = 'choice risk-' + c.risk + (locked ? ' locked' : '') + (c.bonus ? ' is-bonus' : '');
    btn.type = 'button';

    const badge = `<span class="risk-badge ${c.risk}">${RISK_LABEL[c.risk]}</span>`;
    const bonus = c.bonus ? `<span class="bonus-tag">BONUS</span>` : '';
    const tip = (locked && c.lockedLabel) ? c.lockedLabel : (c.hint || '');
    const tipEl = tip ? `<span class="choice-tip">${tip}</span>` : '';

    btn.innerHTML = `${badge}<span class="choice-text">${c.label}</span>${bonus}${tipEl}`;

    if (c.risk === 'rulebreak') {
      btn.addEventListener('mouseenter', () => {
        banner.classList.add('alarm');
        document.getElementById('ruleText').textContent = tr('ruleAlarm');
      });
      btn.addEventListener('mouseleave', () => {
        banner.classList.remove('alarm');
        document.getElementById('ruleText').textContent = tr('ruleIdle');
      });
      btn.addEventListener('focus', () => {
        banner.classList.add('alarm');
        document.getElementById('ruleText').textContent = tr('ruleAlarm');
      });
    }

    btn.onclick = () => {
      if (locked) {
        showToast('locked', tr('locked'), c.lockedLabel || 'The door will not open.');
        return;
      }
      choose(c, i);
    };
    wrap.appendChild(btn);
  });

  update();
}

/* ============================================================
   THE CHOICE PIPELINE
   ============================================================ */
function choose(c, index) {
  document.querySelectorAll('.choice').forEach(b => b.disabled = true);

  // 1. GATE
  if (c.requires && !c.requires(state)) {
    showToast('locked', tr('locked'), c.lockedLabel || 'The door will not open.');
    document.querySelectorAll('.choice').forEach(b => b.disabled = false);
    return;
  }

  // 2. SNAPSHOT
  const before = state.mood;
  const zoneBefore = moodZone(before);

  // 3. MOOD
  state.mood = clamp(before + (typeof c.mood === 'number' ? c.mood : 0), 15, 100);
  const zoneAfter = moodZone(state.mood);

  // 4. ITEM / FLAG / FRAGMENT
  if (c.item && !state.items.includes(c.item)) {
    state.items.push(c.item);
    const meta = ITEMS[c.item];
    if (meta) showToast('item', '\uFF0B ' + tr('itemLogged') + ' \u2014 ' + meta.name.toUpperCase(), meta.hint);
  }
  if (c.flag) state.flags[c.flag] = true;
  if (c.fragment && !state.fragments.includes(c.fragment)) state.fragments.push(c.fragment);

  // 5. HISTORY
  state.history.push({ scene: state.scene, choice: index, before, after: state.mood });

  // 6. INCIDENT
  if ((c.risk === 'rulebreak' || c.danger) && state.mood <= 24) state.incident = true;

  // 7. FEEDBACK
  if (c.mood) showMoodDelta(zoneBefore, zoneAfter, c.mood, c.reason);

  tone();
  const flash = document.getElementById('flash');
  flash.classList.remove('go');
  void flash.offsetWidth;
  flash.classList.add('go');

  // 8. ROUTE
  setTimeout(() => route(c.next), 300);
}

/* ============================================================
   UI: mood delta
   ============================================================ */
function showMoodDelta(zoneBefore, zoneAfter, delta, reason) {
  const el = document.getElementById('moodDelta');
  if (!el) return;
  const sign = delta > 0 ? '+' : '';
  const zones = zoneBefore && zoneAfter && zoneBefore !== zoneAfter
    ? `<span class="md-zones">${zoneBefore} \u2192 ${zoneAfter}</span>`
    : (zoneAfter ? `<span class="md-zones">${zoneAfter}</span>` : '');
  el.innerHTML =
    `<span class="md-row">${zones}<span class="md-num ${delta > 0 ? 'up' : 'down'}">(${sign}${delta})</span></span>` +
    (reason ? `<span class="md-reason">\u201C${reason}\u201D</span>` : '');
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4500);
}

/* ============================================================
   UI: toasts
   ============================================================ */
function showToast(kind, title, body) {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + kind;
  t.innerHTML = `<span class="toast-title">${title}</span>` + (body ? `<span class="toast-body">${body}</span>` : '');
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 350);
  }, 4200);
}

/* ============================================================
   UI: main update
   ============================================================ */
function update() {
  const meta = moodMeta(state.mood);
  const face = document.getElementById('demonFace');
  face.classList.remove('happy', 'annoyed', 'furious');
  if (meta.cls) face.classList.add(meta.cls);

  document.documentElement.style.setProperty('--mood', meta.color);
  const zones = (LANGS[state.lang] && LANGS[state.lang].zones) || {
    PLEASED: 'PLEASED', NEUTRAL: 'NEUTRAL', IRRITATED: 'IRRITATED', FURIOUS: 'FURIOUS'
  };
  const quotes = (LANGS[state.lang] && LANGS[state.lang].quotes) || {
    PLEASED: '"He is pleased. He will sign for you."',
    NEUTRAL: '"He has not decided about you yet."',
    IRRITATED: '"He is looking for a reason to refuse you."',
    FURIOUS: '"He has stopped pretending to be polite. He will keep you."'
  };
  const zoneName = moodZone(state.mood);

  document.getElementById('moodName').textContent = zones[zoneName] || zoneName;
  document.getElementById('moodValue').textContent = state.mood + '%';
  document.getElementById('moodBar').style.width = state.mood + '%';
  document.getElementById('demonQuote').textContent = quotes[zoneName] || '';
  face.style.transform = `scale(${0.94 + state.mood / 800})`;

  const names = (LANGS[state.lang] && LANGS[state.lang].items) || {};
  document.getElementById('items').innerHTML = state.items.length
    ? state.items.map(i => `<span class="item">${(names[i] || (ITEMS[i] ? ITEMS[i].name : i)).toUpperCase()}</span>`).join('')
    : `<span class="empty">${tr('empty')}</span>`;

  const p = Math.min(95, Math.round(state.steps / 18 * 100));
  document.getElementById('progressText').textContent = p + '%';
  document.getElementById('progressBar').style.width = p + '%';
}

/* ============================================================
   ENDINGS
   ============================================================ */
function endingTier(s, id) {
  const f = s.fragments.length;
  if (id === '404' || id === 'bell') return 'gold';
  if (id === 'together') return f === 4 ? 'gold' : f >= 2 ? 'silver' : 'bronze';
  if (id === 'roomservice') return s.mood >= 75 ? 'gold' : 'silver';
  if (id === 'dnd') return s.mood <= 24 ? 'silver' : 'bronze';
  return f >= 2 ? 'silver' : 'bronze';
}

const TIER_ICON = { gold: '\uD83E\uDD47', silver: '\uD83E\uDD48', bronze: '\uD83E\uDD49' };
const EN_TIERS = { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' };

function tierLabel(t) {
  const m = (LANGS[state.lang] && LANGS[state.lang].tiers) || EN_TIERS;
  return m[t] || EN_TIERS[t] || String(t).toUpperCase();
}

function badgeName(id) {
  const m = (LANGS[state.lang] && LANGS[state.lang].badges) || {};
  return (m[id] && m[id].name) || (BADGES[id] ? BADGES[id].name : id);
}
function badgeCopy(id) {
  const m = (LANGS[state.lang] && LANGS[state.lang].badges) || {};
  return (m[id] && m[id].copy) || (BADGES[id] ? BADGES[id].copy : '');
}

function end(id, refresh) {
  if (!endings[id]) id = 'alone';
  const e = endings[id];
  const z = LANGS[state.lang] && LANGS[state.lang].endings && LANGS[state.lang].endings[id];
  const view = z ? {
    title: z.title || e.title,
    kind: z.kind || e.kind,
    status: z.status || e.status,
    cause: z.cause || e.cause,
    filedBy: z.filedBy || e.filedBy,
    advice: z.advice || e.advice,
    text: z.text || e.text
  } : e;

  state.pendingEnding = id;
  state.pendingTier = endingTier(state, id);
  state.view = 'result';

  const isNew = !progress.endings.includes(id);
  if (isNew) {
    progress.endings.push(id);
    saveProgress();
  }
  if (progress.endings.length === ENDING_ORDER.length) grantBadge('all_endings');
  if (state.mood >= 90) grantBadge('smiles_whisperer');
  if (id === '404') grantBadge('truth_seen');
  if (state.history.some(h => h.scene === 'confront' || h.scene === 'checkout' || h.scene === 'mirror') && state.items.includes('bell')) {
    // bell was rung at least once in a late scene
    grantBadge('bell_ringer');
  }
  if (id !== 'dnd') grantBadge('first_escape');

  const screen = document.getElementById('resultScreen');
  screen.className = 'screen result-screen active type-' + e.type + (id === 'dnd' ? ' incident' : '');

  document.getElementById('reportKind').textContent = view.kind;
  document.getElementById('reportRef').textContent = (id === 'dnd' ? '404' : '404') + ' \u00B7 ' + (state.act === 3 ? '06:04' : '04:10');
  document.getElementById('resultIcon').textContent = e.icon;
  document.getElementById('resultStatus').textContent = view.status;
  document.getElementById('resultHint').textContent = isNew ? tr('newDeparture') : '';
  document.getElementById('rfCause').textContent = view.cause;
  document.getElementById('rfFiled').textContent = view.filedBy;
  document.getElementById('rfAdvice').textContent = view.advice;

  const tierEl = document.getElementById('tierStamp');
  tierEl.textContent = TIER_ICON[state.pendingTier] + ' ' + tierLabel(state.pendingTier) + ' ' + tr('departureWord');
  tierEl.className = 'tier-stamp tier-' + state.pendingTier;

  document.getElementById('ledgerCount').textContent =
    tr('departures') + ' \u2014 ' + progress.endings.length + '/' + ENDING_ORDER.length;

  if (!refresh) {
    bgm.volume = .12; bell.volume = .12;
    const snd = outcomeSounds[e.type === 'true' ? 'escaped' : e.type];
    if (state.sound && snd) {
      try { snd.currentTime = 0; snd.onended = restoreVolumes; snd.play().catch(restoreVolumes); }
      catch (err) { restoreVolumes(); }
    } else restoreVolumes();
    showScreen('resultScreen');
  }
}

function revealEnding(refresh) {
  const id = state.pendingEnding || 'alone';
  const e = endings[id];
  const z = LANGS[state.lang] && LANGS[state.lang].endings && LANGS[state.lang].endings[id];
  const view = z ? { title: z.title || e.title, text: z.text || e.text } : e;

  state.view = 'ending';
  const verdict = state.mood >= 75 ? tr('approve') : state.mood < 25 ? tr('disapprove') : tr('undecided');
  const idx = ENDING_ORDER.indexOf(id) + 1;

  document.getElementById('endStamp').textContent = tr('ending') + ' ' + idx + ' \u2014 ' + verdict;
  document.getElementById('endIcon').textContent = e.icon;
  document.getElementById('endTitle').textContent = view.title;
  document.getElementById('endText').textContent = view.text;

  document.getElementById('endStats').innerHTML =
    `<div class="stat"><b>${state.steps}</b><span>${tr('choices')}</span></div>` +
    `<div class="stat"><b>${state.mood}%</b><span>${tr('mood')}</span></div>` +
    `<div class="stat"><b>${state.fragments.length}/4</b><span>${tr('fragments')}</span></div>` +
    `<div class="stat"><b>${state.items.length}/4</b><span>${tr('items')}</span></div>`;

  const badgeWrap = document.getElementById('endBadges');
  badgeWrap.innerHTML = state.newBadges.length
    ? state.newBadges.map(b => `<span class="earned-badge">\u2605 ${badgeName(b)}</span>`).join('')
    : '';

  if (!refresh) { tone(); showScreen('endScreen'); }
}

/* ============================================================
   BADGES
   ============================================================ */
function grantBadge(id) {
  if (!BADGES[id]) return false;
  if (progress.badges.includes(id)) return false;
  progress.badges.push(id);
  saveProgress();
  if (!state.newBadges.includes(id)) state.newBadges.push(id);
  showToast('badge', '\u2605 ' + tr('badgeEarned') + ' \u2014 ' + badgeName(id), badgeCopy(id));
  return true;
}

/* ============================================================
   LEDGER STRIP
   ============================================================ */
function renderLedger() {
  const slots = document.getElementById('ledgerSlots');
  if (!slots) return;
  slots.innerHTML = ENDING_ORDER.map(id => {
    const found = progress.endings.includes(id);
    const title = found ? endings[id].title : '???';
    return `<span class="slot${found ? ' found' : ''}" title="${title}" aria-label="${title}"></span>`;
  }).join('');
  const c = document.getElementById('startLedgerCount');
  if (c) c.textContent = progress.endings.length + ' / ' + ENDING_ORDER.length;
}

/* ============================================================
   LANGUAGE
   ============================================================ */
function applyLanguage(lang) {
  state.lang = lang;
  try { localStorage.setItem('h404.lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

  document.title = 'HOTEL 404 \u2014 A Departure';
  const eyebrow = document.getElementById('coverEyebrow');
  if (eyebrow) eyebrow.textContent = tr('horror');
  const h1 = document.querySelector('.start-screen h1');
  if (h1) h1.innerHTML = tr('hero');

  const ct = document.getElementById('coverTagline');
  if (ct) ct.textContent = tr('coverTagline');

  /* --- briefing page: story --- */
  const se = document.getElementById('briefEyebrow');
  if (se) se.textContent = tr('storyEyebrow');
  const sti = document.getElementById('briefTitle');
  if (sti) sti.textContent = tr('storyTitle');

  /* --- premise paragraphs --- */
  ['1', '2', '3', '4'].forEach(n => {
    const el = document.getElementById('premise' + n);
    if (el) el.innerHTML = tr('premise' + n);
  });

  const sb = document.getElementById('startBtn');
  if (sb) sb.innerHTML = tr('start') + ' <span>\u2192</span>';
  const tiny = document.querySelector('.start-screen .tiny');
  if (tiny) tiny.textContent = tr('tip');
  const sound = document.getElementById('soundBtn');
  if (sound) sound.textContent = state.sound ? tr('soundOn') : tr('soundOff');
  const restart = document.getElementById('restartBtn');
  if (restart) restart.textContent = tr('restart');
  const dl = document.querySelector('.demon-label');
  if (dl) dl.textContent = tr('roommate');
  const st = document.querySelector('.side-title');
  if (st) st.textContent = tr('pockets');
  const pw = document.querySelector('.progress-wrap > span:first-child');
  if (pw) pw.textContent = tr('way');
  const ve = document.getElementById('viewEndingBtn');
  if (ve) ve.innerHTML = tr('view') + ' <span>\u2192</span>';
  const ag = document.getElementById('againBtn');
  if (ag) ag.innerHTML = tr('again') + ' <span>\u21BB</span>';
  const eh = document.querySelector('.end-screen .tiny');
  if (eh) eh.textContent = tr('endHint');

  /* --- briefing page: rules panel --- */
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  setText('rulesEyebrow', tr('rulesEyebrow'));
  setText('rulesTitle', tr('rulesTitle'));
  setText('ruleHeroLabel', tr('ruleHeroLabel'));
  setText('ruleHeroText', tr('ruleHeroText'));
  setText('goalLabel', tr('goalLabel'));
  setHTML('goalText', tr('goalText'));

  ['1', '2', '3', '4'].forEach(n => {
    setText('rc' + n + 't', tr('rc' + n + 't'));
    setHTML('rc' + n + 'b', tr('rc' + n + 'b'));
  });

  const hs = document.getElementById('briefStartBtn');
  if (hs) hs.innerHTML = tr('howToContinue') + ' <span>\u2192</span>';
  const back = document.getElementById('briefBackBtn');
  if (back) back.textContent = '\u2190 ' + tr('back');

  setText('splashText', tr('splash'));
  setText('splashEyebrow', tr('splashEyebrow'));
  setHTML('splashReminder', tr('splashReminder'));

  /* --- report card field labels --- */
  setText('rfCauseLabel', tr('rfCauseLabel'));
  setText('rfFiledLabel', tr('rfFiledLabel'));
  setText('rfAdviceLabel', tr('rfAdviceLabel'));

  const lz = document.querySelector('.ledger-label');
  if (lz) lz.textContent = tr('departures');
  const rt = document.getElementById('ruleText');
  if (rt) rt.textContent = tr('ruleIdle');

  if (state.view === 'game' && state.scene) show(state.scene);
  else if (state.view === 'result') end(state.pendingEnding, true);
  else if (state.view === 'ending') revealEnding(true);
  else { update(); renderLedger(); }
}

/* ============================================================
   BINDINGS
   ============================================================ */
document.getElementById('startBtn').onclick = ringTheBell;
document.getElementById('briefBackBtn').onclick = briefBack;
document.getElementById('briefStartBtn').onclick = start;
document.getElementById('againBtn').onclick = start;
document.getElementById('restartBtn').onclick = start;
document.getElementById('viewEndingBtn').onclick = () => revealEnding();

document.getElementById('soundBtn').onclick = () => {
  state.sound = !state.sound;
  document.getElementById('soundBtn').textContent = state.sound ? tr('soundOn') : tr('soundOff');
  if (state.sound) { startBgm(); tone(); }
  else {
    stopBgm(); try { bell.pause(); } catch (e) {}
    Object.values(outcomeSounds).forEach(a => { try { a.pause(); } catch (e) {} });
  }
};

document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => applyLanguage(b.dataset.lang));

function unlockSound() { if (!state.sound) return; startBgm(); }
document.addEventListener('pointerdown', unlockSound, { once: true });
document.addEventListener('keydown', unlockSound, { once: true });

/* boot */
applyLanguage(state.lang);
renderLedger();
