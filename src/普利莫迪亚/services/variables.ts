declare const getVariables: undefined | ((options?: Record<string, any>) => any);
declare const replaceVariables: undefined | ((variables: any, options?: Record<string, any>) => void);
declare const updateVariablesWith:
  | undefined
  | ((updater: (variables: Record<string, any>) => Record<string, any> | void, options?: Record<string, any>) => Promise<void> | void);

export function readChatVariable<T>(key: string): T | undefined {
  if (typeof getVariables !== 'function') return undefined;
  const variables = getVariables({ type: 'chat' });
  return variables?.[key] as T | undefined;
}

export async function writeChatVariable<T>(key: string, value: T) {
  if (typeof updateVariablesWith === 'function') {
    await updateVariablesWith(variables => {
      variables[key] = value;
      return variables;
    }, { type: 'chat' });
    return true;
  }

  if (typeof getVariables === 'function' && typeof replaceVariables === 'function') {
    const variables = getVariables({ type: 'chat' });
    variables[key] = value;
    replaceVariables(variables, { type: 'chat' });
    return true;
  }

  return false;
}

