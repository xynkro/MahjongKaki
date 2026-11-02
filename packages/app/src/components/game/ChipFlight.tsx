import { useEffect, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';

// Keep in step with sound.chips, so each chip lands on its clink.
export const FIRST_LAND_MS = 1300;
const CLINK_GAP_MS = 75;
const FLIGHT_MS = 560;
// Measure after the Scoreboard's entrance: its transform would skew the rects.
const MEASURE_MS = 650;

export function chipCountForTai(tai: number): number {
  return Math.min(10, 3 + tai);
}

export function countDurationMs(chips: number): number {
  return Math.max(900, (chips - 1) * CLINK_GAP_MS + 300);
}

// Which seat each chip flies from: everyone who paid sends one, the rest follow the amounts.
export function dealChips(deltas: number[], winner: number, count: number): number[] {
  const payers = [0, 1, 2, 3]
    .filter(seat => seat !== winner && deltas[seat] < 0)
    .map(seat => ({ seat, paid: -deltas[seat], sent: 1 }));
  if (payers.length === 0) return [];
  const seats = payers.map(p => p.seat);
  while (seats.length < count) {
    const next = payers.reduce((a, b) => (b.paid / (b.sent + 1) > a.paid / (a.sent + 1) ? b : a));
    next.sent += 1;
    seats.push(next.seat);
  }
  return seats;
}

type Flight = { left: number; top: number; dx: number; dy: number; arc: number; delay: number };

/**
 * Chips arc from each seat that paid into the winner's total. Decorative and
 * transient: it portals to the body so no scroll container clips it, takes no
 * touches, and the totals are correct whether or not it ever runs.
 */
export function ChipFlight({ sources, winner, boardRef }: {
  sources: number[];
  winner: number;
  boardRef: RefObject<HTMLElement>;
}) {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    const mountedAt = performance.now();
    const totalRect = (seat: number) =>
      boardRef.current?.querySelector(`[data-seat-total="${seat}"]`)?.getBoundingClientRect();
    const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

    const measure = window.setTimeout(() => {
      const target = totalRect(winner);
      if (!target) return;
      const to = centre(target);
      // A late timer starts the chips part-way through (negative delay), so they still land on the clinks.
      const firstLaunch = FIRST_LAND_MS - FLIGHT_MS - (performance.now() - mountedAt);
      setFlights(sources.flatMap((seat, i) => {
        const rect = totalRect(seat);
        if (!rect) return [];
        const from = centre(rect);
        const left = from.x + ((i * 7) % 17) - 8;
        const top = from.y + ((i * 5) % 11) - 5;
        return [{ left, top, dx: to.x - left, dy: to.y - top, arc: 64 + (i % 3) * 20, delay: firstLaunch + i * CLINK_GAP_MS }];
      }));
    }, MEASURE_MS);
    const clear = window.setTimeout(() => setFlights([]), FIRST_LAND_MS + sources.length * CLINK_GAP_MS + 200);

    return () => {
      clearTimeout(measure);
      clearTimeout(clear);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (flights.length === 0) return null;
  return createPortal(
    <div aria-hidden>
      {flights.map((f, i) => (
        <div
          key={i}
          className="chip-flight"
          style={{
            left: f.left,
            top: f.top,
            '--dx': `${f.dx}px`,
            '--dy': `${f.dy}px`,
            '--arc': `${f.arc}px`,
            '--chip-delay': `${f.delay}ms`,
            '--chip-time': `${FLIGHT_MS}ms`,
          } as CSSProperties}
        >
          <div className="chip-arc"><div className="chip-token" /></div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
