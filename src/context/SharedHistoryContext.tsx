import {
  createEmptyHistoryState,
  type HistoryState,
} from "@lexical/react/LexicalHistoryPlugin";
import {
  type Context,
  createContext,
  type JSX,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

interface ContextShape {
  historyState?: HistoryState;
}

const ContextContext: Context<ContextShape> = createContext({});

const SharedHistoryContext = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const historyContext = useMemo(
    () => ({ historyState: createEmptyHistoryState() }),
    [],
  );

  return (
    <ContextContext.Provider value={historyContext}>
      {children}
    </ContextContext.Provider>
  );
};

export const useSharedHistoryContext = (): ContextShape =>
  useContext(ContextContext);

export default SharedHistoryContext;
