import { crewTarget } from './ops';

export default function FillBar({ event }: { event: any }) {
  const fill = crewTarget(event);
  const pct = Math.round(fill.ratio * 100);
  const tone = !fill.targetSet ? 'is-unset' : fill.ratio >= 1 ? 'is-full' : fill.ratio >= 0.5 ? 'is-short' : 'is-open';
  const label = fill.targetSet
    ? `${fill.assigned} of ${fill.needed} filled, ${pct}%`
    : `${fill.assigned} assigned, no crew target yet`;
  return (
    <div className="escc-fill-wrap">
      <div className="escc-fill-label">{label}</div>
      <div
        className={`escc-fill ${tone}`}
        role="meter"
        aria-label="Crew fill rate"
        aria-valuemin={0}
        aria-valuemax={fill.targetSet ? fill.needed : Math.max(fill.assigned, 1)}
        aria-valuenow={fill.assigned}
      >
        <span style={{ width: fill.targetSet ? `${pct}%` : '0%' }} />
      </div>
    </div>
  );
}
