export type TypedAction = { type: string };

export type ActionResolverMap<TAction extends TypedAction, TResult> = {
  [Type in TAction['type']]?: (action: Extract<TAction, { type: Type }>) => TResult;
};

export function dispatchByType<TAction extends TypedAction, TResult>(
  action: TAction,
  resolvers: ActionResolverMap<TAction, TResult>,
  onUnknown: (action: TAction) => TResult,
) {
  const resolver = resolvers[action.type as TAction['type']] as ((next: TAction) => TResult) | undefined;
  return resolver ? resolver(action) : onUnknown(action);
}

