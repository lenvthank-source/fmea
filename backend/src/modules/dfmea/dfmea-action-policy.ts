import type { DfmeaData } from './dfmea-document';
/** Product review policy; does not claim to implement a licensed handbook status vocabulary. */
export function dfmeaActionChanges(
  previous: DfmeaData | null | undefined,
  incoming: DfmeaData,
  reviewer: { id: string; name: string | null; email: string },
) {
  const errors: string[] = [];
  const old = new Map(
    (previous?.chains ?? [])
      .flatMap((c) => c.causes.flatMap((x) => x.actions))
      .map((a) => [a.id, a]),
  );
  const actions = incoming.chains.flatMap((c) =>
    c.causes.flatMap((x) => x.actions),
  );
  const transitions: Record<string, string[]> = {
    open: ['in_progress'],
    in_progress: ['open', 'completed'],
    completed: ['in_progress', 'verified'],
    verified: [],
  };
  for (const before of old.values())
    if (
      before.status === 'verified' &&
      !actions.some((a) => a.id === before.id)
    )
      errors.push(
        'Verified action evidence cannot be removed with an action, cause or analysis. Preserve the record and create a new action for further changes.',
      );
  for (const action of actions) {
    const before = old.get(action.id);
    if (
      action.status === 'verified' &&
      before?.status !== 'verified' &&
      (action.revisedOccurrence !== null || action.revisedDetection !== null) &&
      (action.revisedOccurrence === null || action.revisedDetection === null)
    )
      errors.push(
        'Verified reassessment requires an explicit complete O and D pair with effectiveness justification; partial ratings are not combined with baseline or other actions (product integrity policy).',
      );
    if (
      before?.status === 'verified' &&
      JSON.stringify(before) !== JSON.stringify(action)
    )
      errors.push(
        'Verified action records are protected. Record a new action for further changes.',
      );
    if (
      before &&
      action.status !== before.status &&
      !transitions[before.status]?.includes(action.status)
    )
      errors.push('Save each action lifecycle transition in order');
    if (!before && action.status !== 'open')
      errors.push(
        'New/imported actions start open and require reviewed lifecycle transitions',
      );
    if (
      action.status === 'verified' &&
      before?.status !== 'verified' &&
      [reviewer.id, reviewer.name, reviewer.email].some(
        (value) =>
          value &&
          value.trim().toLowerCase() === action.owner.trim().toLowerCase(),
      )
    )
      errors.push(
        'Action owner cannot independently verify their own effectiveness (product policy)',
      );
  }
  return [...new Set(errors)];
}
