import { useCallback, useEffect, useRef } from 'react';
import type { MessageFromWebview, MessageToWebview } from '../../src/types';

interface VSCodeAPI {
  postMessage(message: MessageFromWebview): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let api: VSCodeAPI | undefined;

function getApi(): VSCodeAPI {
  if (!api) {
    api = acquireVsCodeApi();
  }
  return api;
}

export function useVSCode(onMessage?: (msg: MessageToWebview) => void) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    const handler = (event: MessageEvent<MessageToWebview>) => {
      callbackRef.current?.(event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const postMessage = useCallback((msg: MessageFromWebview) => {
    getApi().postMessage(msg);
  }, []);

  const getState = useCallback(() => getApi().getState(), []);
  const setState = useCallback((state: any) => getApi().setState(state), []);

  return { postMessage, getState, setState };
}
