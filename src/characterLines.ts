// character-voiced reminder copy. no LLM calls — all lines are pre-written templates.
// shared between the app (praise, in-app flourishes) and api/send-reminders.ts (push bodies).

export type CharacterId = 'jarvis';
export type LineCategory = 'reminder' | 'nag1' | 'nag2' | 'praise' | 'schedule' | 'calendar';
export type CharacterLineBank = Record<LineCategory, string[]>;

// internal id stays 'jarvis'; display name is a single constant so it can be renamed trivially
export const CHARACTER_DISPLAY_NAME: Record<CharacterId, string> = { jarvis: 'jarvis' };

export const CHARACTER_LINES: Record<CharacterId, CharacterLineBank> = {
  jarvis: {
    reminder: [
      "{task}, madam. you indicated this hour. it is this hour.",
      "a gentle note that {task} is now due. i remain optimistic.",
      "{task}. i've cleared your schedule of excuses.",
      "per your instructions: {task}. i merely relay them back to you.",
      "the appointed time for {task} has arrived, punctual as ever. one of you had to be.",
      "{task} awaits. it has been very patient.",
      "now would be an excellent moment for {task}. i have consulted the data.",
      "you asked to be reminded of {task}. consider it done — my half, at least.",
      "{task}, when convenient. and it is, in fact, convenient now.",
      "initiating reminder protocol: {task}. resistance is expected but inadvisable.",
    ],
    nag1: [
      "i've assumed you were momentarily detained. {task} remains, undeterred.",
      "a second notice regarding {task}. i shall not characterize the first as ignored. merely unanswered.",
      "{task} is still with us. it sends its regards.",
      "revisiting the matter of {task}. my confidence is undimmed, if slightly revised.",
      "the window for {task} remains open. windows, however, are known to close.",
      "i note {task} is pending. i note it without judgment. mostly.",
      "should you be looking for {task}, it is precisely where you left it.",
      "an update: no update on {task}. i thought you should know.",
    ],
    nag2: [
      "far be it from me to observe that this is the third notice regarding {task}. and yet.",
      "{task}: final reminder. after this, i retire to quiet disappointment.",
      "i have exhausted my subtler methods. {task}. please.",
      "my models suggest {task} will not, in fact, complete itself. i've run them twice.",
      "this concludes my formal efforts regarding {task}. informally, i believe in you.",
      "{task}. i say this with all the urgency my composure permits.",
    ],
    // shown in-app when jarvis auto-assigns reminder times; {task} receives e.g. "3 tasks"
    schedule: [
      "i've taken the liberty of scheduling {task}. objections may be filed with the clock icon.",
      "{task}, assigned appointed hours. i chose them with some care.",
      "i've arranged {task} across your day. the day has been notified.",
      "{task}, scheduled. you need only appear.",
      "the itinerary is set: {task}. my half of the arrangement is complete.",
      "i've distributed {task} at sensible intervals. sensible being, of course, my judgment.",
    ],
    // shown in-app after google calendar is connected; no {task} slot
    calendar: [
      "your calendar and i are now acquainted. i shall schedule around it.",
      "calendar access confirmed. i have reviewed your meetings. my condolences.",
      "very good. i can now see the shape of your day, and will plan accordingly.",
    ],
    praise: [
      "done, and noted. i shall update my models accordingly.",
      "{task}: complete. i never doubted. i merely projected scenarios.",
      "excellent. marking {task} resolved and my faith restored.",
      "ahead of my revised projections. quietly impressed.",
      "{task} complete. do carry on — momentum suits you.",
      "resolved. i've logged it under 'inevitable, eventually.'",
      "very good, madam. the streak survives another day.",
      "noted and filed. my compliments.",
    ],
  },
};

// random pick that avoids repeating the last-used line per category (no persistence needed)
const lastIndex: Partial<Record<string, number>> = {};

export const pickLine = (character: CharacterId, category: LineCategory, task: string): string => {
  const bank = CHARACTER_LINES[character][category];
  const key = character + ':' + category;
  let idx = Math.floor(Math.random() * bank.length);
  if (bank.length > 1 && idx === lastIndex[key]) {
    idx = (idx + 1) % bank.length;
  }
  lastIndex[key] = idx;
  return bank[idx].replace('{task}', task);
};
