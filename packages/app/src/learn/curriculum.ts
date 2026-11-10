// The Learn path: Singapore mahjong from zero, in plain English (docs/REDESIGN.md).
// Tiles are engine indices, so every tile shown is drawn by TileFace, never by AI art.
// Rules stated here must match the engine: chow only from the player before you,
// pung and kong from anyone, win beats pung beats chow, each tai doubles the points.

import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';

type V = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const b = (v: V) => tileToIndex(suit('bamboo', v));
const c = (v: V) => tileToIndex(suit('character', v));
const d = (v: V) => tileToIndex(suit('dot', v));
const E = tileToIndex(wind('east'));
const S = tileToIndex(wind('south'));
const W = tileToIndex(wind('west'));
const N = tileToIndex(wind('north'));
const RED = tileToIndex(dragon('red'));
const GREEN = tileToIndex(dragon('green'));
const WHITE = tileToIndex(dragon('white'));

export type Task =
  | { kind: 'info'; title: string; body: string; tiles?: number[] }
  /** Tap exactly the tiles at `correct` (positions in `tiles`), in any order. */
  | { kind: 'pick'; prompt: string; tiles: number[]; correct: number[]; explain: string }
  | { kind: 'choose'; prompt: string; tiles?: number[]; options: string[]; answer: number; explain: string };

export interface Lesson { id: string; title: string; minutes: number; tasks: Task[] }
export interface Unit { id: string; title: string; blurb: string; video?: string; lessons: Lesson[] }

export const CURRICULUM: Unit[] = [
  {
    id: 'tiles', title: 'Meet the tiles', blurb: 'Suits, winds, dragons and bonus tiles.', video: 'U1',
    lessons: [
      {
        id: 'suits', title: 'The three suits', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Three suits, numbered 1 to 9', body: 'Most tiles belong to a suit. Bamboo tiles show green sticks, character tiles show a red Chinese number over the word 萬, and dot tiles show circles. The small number in the corner tells you the value, so you never need to read Chinese.', tiles: [b(3), c(3), d(3)] },
          { kind: 'pick', prompt: 'Tap every bamboo tile.', tiles: [b(2), c(5), b(7), d(4), b(9), d(1)], correct: [0, 2, 4], explain: 'Bamboo tiles are the green sticks.' },
          { kind: 'choose', prompt: 'Which suit is this tile?', tiles: [c(5)], options: ['Bamboo', 'Characters', 'Dots'], answer: 1, explain: 'A red Chinese number above 萬 means characters. This is the 5 of characters.' },
          { kind: 'pick', prompt: 'Tap the 7 of dots.', tiles: [d(4), c(7), d(7), b(7)], correct: [2], explain: 'Count the circles, or read the 7 in the corner.' },
        ],
      },
      {
        id: 'honours', title: 'Winds and dragons', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Honour tiles have no numbers', body: 'There are four winds (East, South, West, North) and three dragons (red, green and white). They can only be matched, never put in a row.', tiles: [E, S, W, N] },
          { kind: 'info', title: 'The three dragons', body: 'Red shows 中, green shows 發, and the white dragon is an empty frame.', tiles: [RED, GREEN, WHITE] },
          { kind: 'pick', prompt: 'Tap the three dragons.', tiles: [E, RED, d(5), GREEN, N, WHITE], correct: [1, 3, 5], explain: 'Red 中, green 發 and the blank white frame.' },
          { kind: 'choose', prompt: 'Which wind is this?', tiles: [S], options: ['East', 'South', 'West', 'North'], answer: 1, explain: 'This is South. Beginner labels show E, S, W or N in the corner.' },
        ],
      },
      {
        id: 'bonus', title: 'Flowers and animals', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Bonus tiles', body: 'Singapore mahjong adds flowers, seasons and animals. They never stay in your hand. When you draw one, put it face up beside you and draw another tile. Bonus tiles can add to your score at the end.' },
          { kind: 'choose', prompt: 'You draw a flower. What do you do?', options: ['Keep it in your hand', 'Put it aside and draw again', 'Throw it to the middle'], answer: 1, explain: 'Bonus tiles go face up beside you, and you draw a replacement straight away.' },
          { kind: 'choose', prompt: 'Which of these is a bonus tile?', options: ['A cat', 'The 9 of dots', 'The East wind'], answer: 0, explain: 'The four animals (cat, rat, rooster and centipede) are bonus tiles, like flowers and seasons.' },
        ],
      },
    ],
  },
  {
    id: 'sets', title: 'Sets', blurb: 'Three of a kind, three in a row, and the pair.', video: 'U2',
    lessons: [
      {
        id: 'pung', title: 'Three of a kind', minutes: 2,
        tasks: [
          { kind: 'info', title: 'A pung', body: 'Three identical tiles make a set called a pung. Any tile can make a pung, including winds and dragons.', tiles: [b(3), b(3), b(3)] },
          { kind: 'pick', prompt: 'Tap the three that make a pung.', tiles: [c(5), b(3), c(2), b(3), d(4), b(3)], correct: [1, 3, 5], explain: 'Three 3s of bamboo: an exact match.' },
          { kind: 'choose', prompt: 'Is this a pung?', tiles: [RED, RED, RED], options: ['Yes', 'No'], answer: 0, explain: 'Three red dragons is a pung. Dragon pungs even score extra.' },
        ],
      },
      {
        id: 'chow', title: 'Three in a row', minutes: 2,
        tasks: [
          { kind: 'info', title: 'A chow', body: 'Three numbers in a row in the same suit make a set called a chow. Winds and dragons can never make a chow.', tiles: [d(4), d(5), d(6)] },
          { kind: 'pick', prompt: 'Tap the three that make a chow.', tiles: [c(2), d(7), c(3), b(3), c(4), E], correct: [0, 2, 4], explain: '2, 3 and 4 of characters, all one suit.' },
          { kind: 'choose', prompt: 'Is this a chow?', tiles: [b(8), b(9), b(1)], options: ['Yes', 'No'], answer: 1, explain: 'No. A row cannot wrap round from 9 back to 1.' },
          { kind: 'choose', prompt: 'Is this a chow?', tiles: [c(4), d(5), b(6)], options: ['Yes', 'No'], answer: 1, explain: 'No. The numbers run on, but the suits are different.' },
        ],
      },
      {
        id: 'pair', title: 'The pair and a winning hand', minutes: 3,
        tasks: [
          { kind: 'info', title: 'Four sets and a pair', body: 'A winning hand is four sets plus one pair, 14 tiles in all. The pair is just two identical tiles.', tiles: [c(1), c(2), c(3), d(6), d(6), d(6), b(4), b(5), b(6), W, W, W, GREEN, GREEN] },
          { kind: 'choose', prompt: 'How many tiles are in a winning hand?', options: ['13', '14', '16'], answer: 1, explain: 'Four sets of three, plus a pair: 12 + 2 = 14.' },
          { kind: 'pick', prompt: 'This hand is one pair short of finished. Tap the two tiles that make the pair.', tiles: [d(2), d(3), d(4), N, b(7), b(7), b(7), N], correct: [3, 7], explain: 'Two North winds make the pair.' },
        ],
      },
    ],
  },
  {
    id: 'turn', title: 'A turn', blurb: 'Draw one, throw one, and what to do with a kong.', video: 'U3',
    lessons: [
      {
        id: 'draw-throw', title: 'Draw and throw', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Every turn is the same', body: 'You hold 13 tiles. On your turn you take one from the wall, so you have 14, then throw one face up into the middle, back to 13. Then the next player goes.' },
          { kind: 'choose', prompt: 'You have just drawn. How many tiles are you holding?', options: ['13', '14', '15'], answer: 1, explain: 'You draw up to 14, then throw one away.' },
          { kind: 'pick', prompt: 'You must throw one. Which tile fits nothing in this hand? Tap it.', tiles: [c(2), c(3), c(4), d(5), d(5), d(5), b(6), b(7), N], correct: [8], explain: 'The North wind has no partner, so it is the easy throw.' },
        ],
      },
      {
        id: 'kong', title: 'Four of a kind', minutes: 2,
        tasks: [
          { kind: 'info', title: 'A kong', body: 'Four identical tiles make a kong. It counts as one set, so you lay it out and draw one extra tile to keep your hand the right size.', tiles: [d(8), d(8), d(8), d(8)] },
          { kind: 'choose', prompt: 'You lay out a kong. What happens next?', options: ['You draw one extra tile', 'You throw two tiles', 'Your turn ends at once'], answer: 0, explain: 'A kong uses four tiles for one set, so you draw a replacement.' },
        ],
      },
    ],
  },
  {
    id: 'claiming', title: 'Claiming', blurb: 'Taking a tile someone else threw.', video: 'U4',
    lessons: [
      {
        id: 'pung-claim', title: 'Calling pung', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Take it from anyone', body: 'If anyone throws a tile and you already hold two of it, call "pung", take it, and lay the three out face up. Then you throw a tile, and play carries on from you.' },
          { kind: 'choose', prompt: 'Someone throws the red dragon. You hold two red dragons. Can you call pung?', tiles: [RED, RED], options: ['Yes', 'No'], answer: 0, explain: 'Yes. You can pung a tile from any player.' },
        ],
      },
      {
        id: 'chow-claim', title: 'Calling chow', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Only from the player before you', body: 'You can only call "chow" on a tile thrown by the player whose turn was just before yours. From anyone else, you have to let it go.' },
          { kind: 'choose', prompt: 'The player across from you throws the 5 of dots. You hold 4 and 6 of dots. Can you chow?', tiles: [d(4), d(6)], options: ['Yes', 'No'], answer: 1, explain: 'No. Chow only works on a throw from the player just before you.' },
          { kind: 'choose', prompt: 'Two people want the same tile, one for pung and one for chow. Who gets it?', options: ['Pung', 'Chow', 'Whoever spoke first'], answer: 0, explain: 'Pung beats chow. A winning claim beats both.' },
        ],
      },
      {
        id: 'winning', title: 'Winning', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Two ways to win', body: 'If someone throws the last tile you need, call "hu" and take it. If you draw it yourself from the wall, that is a self-drawn win, and everyone pays you.' },
          { kind: 'choose', prompt: 'Who pays more when you win on someone else\'s throw?', options: ['The player who threw it', 'Everyone pays the same', 'Nobody pays'], answer: 0, explain: 'The player who threw your winning tile pays double. The others pay the normal amount.' },
        ],
      },
    ],
  },
  {
    id: 'winds', title: 'Seats and winds', blurb: 'Who goes first, and why your seat matters.', video: 'U5',
    lessons: [
      {
        id: 'seats', title: 'Your seat wind', minutes: 2,
        tasks: [
          { kind: 'info', title: 'The dealer is East', body: 'One player is the dealer and sits as East. Turns go round the table to the dealer\'s right: East, then South, West and North. Each player\'s seat has that wind.', tiles: [E, S, W, N] },
          { kind: 'choose', prompt: 'Who plays first in each hand?', options: ['East, the dealer', 'North', 'Whoever has the most flowers'], answer: 0, explain: 'The dealer, East, always starts.' },
          { kind: 'choose', prompt: 'You sit South. A pung of which wind gives you extra tai for your seat?', options: ['East', 'South', 'North'], answer: 1, explain: 'A pung of your own seat wind scores extra.' },
        ],
      },
      {
        id: 'round', title: 'The round wind', minutes: 2,
        tasks: [
          { kind: 'info', title: 'The whole table shares a round wind', body: 'A game starts in the East round. When the dealer has moved all the way round the table, the round wind moves on to South. A pung of the round wind also scores extra, for everyone.' },
          { kind: 'choose', prompt: 'When does the dealer change?', options: ['When someone other than the dealer wins', 'Every single hand', 'Never'], answer: 0, explain: 'The dealer stays on after winning or a drawn hand, and passes on when someone else wins.' },
        ],
      },
    ],
  },
  {
    id: 'scoring', title: 'Scoring', blurb: 'Tai, and why bigger hands pay more.', video: 'U6',
    lessons: [
      {
        id: 'tai', title: 'What tai means', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Tai are points for your hand', body: 'When you win, you count tai: points for what is in your hand. A pung of dragons, bonus tiles and special hand shapes all add tai. You need at least 1 tai to win, and most tables stop counting at 5.' },
          { kind: 'choose', prompt: 'Can you win with 0 tai?', options: ['Yes', 'No'], answer: 1, explain: 'No. A hand needs at least 1 tai to count as a win.' },
          { kind: 'choose', prompt: 'Which of these adds a tai?', tiles: [RED, RED, RED], options: ['A pung of red dragons', 'A chow of 1-2-3', 'A pair of 5s'], answer: 0, explain: 'A dragon pung is worth 1 tai. The Hand tab shows the tai for any hand.' },
        ],
      },
      {
        id: 'doubling', title: 'Each tai doubles', minutes: 2,
        tasks: [
          { kind: 'info', title: 'Small steps, big jumps', body: 'Each extra tai doubles what you win. A 3 tai hand is worth twice a 2 tai hand, and four times a 1 tai hand.' },
          { kind: 'choose', prompt: 'A 2 tai win pays 4 points. What does a 3 tai win pay?', options: ['5 points', '6 points', '8 points'], answer: 2, explain: 'One more tai doubles it: 4 becomes 8.' },
        ],
      },
    ],
  },
];

export function lessonKey(unit: Unit, lesson: Lesson) {
  return `${unit.id}/${lesson.id}`;
}
