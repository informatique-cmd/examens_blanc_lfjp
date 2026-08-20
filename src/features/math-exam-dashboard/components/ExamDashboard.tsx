import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { DashboardContext } from "../context";
import { useDashboardTabs } from "../hooks";
import type { DashboardView } from "../utils";
import DashboardFooter from "./Footer";

interface ExamDashboardProps {
  children?: ReactNode;
}

export default function ExamDashboard({ children }: ExamDashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>("teacher");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<DashboardView, HTMLButtonElement | null>>>({});
  const { tabIds, tabs } = useDashboardTabs();

  const handleTabClick = useCallback((view: DashboardView) => {
    setActiveView(view);
  }, []);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  const focusTab = useCallback((view: DashboardView) => {
    const tab = tabRefs.current[view];
    tab?.focus();
  }, []);

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, currentId: DashboardView) => {
      const { key } = event;
      const currentIndex = tabIds.indexOf(currentId);

      if (currentIndex === -1) {
        return;
      }

      let nextView: DashboardView | null = null;

      switch (key) {
        case "ArrowRight":
          nextView = tabIds[(currentIndex + 1) % tabIds.length];
          break;
        case "ArrowLeft":
          nextView = tabIds[(currentIndex - 1 + tabIds.length) % tabIds.length];
          break;
        case "Home":
          nextView = tabIds[0];
          break;
        case "End":
          nextView = tabIds[tabIds.length - 1];
          break;
        default:
          break;
      }

      if (nextView) {
        event.preventDefault();
        setActiveView(nextView);
        focusTab(nextView);
      }
    },
    [focusTab, tabIds],
  );

  const contextValue = useMemo(
    () => ({ activeView, setActiveView, container, setContainer: setContainerRef }),
    [activeView, container, setContainerRef],
  );

  return (
    <section aria-labelledby="views-title" className="space-y-6">
      <h2 id="views-title" className="sr-only">
        Affichage des plannings
      </h2>
      <DashboardContext.Provider value={contextValue}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="mb-4">
            <DashboardFooter />
          </div>
          <div
            className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4"
            role="tablist"
            aria-label="Affichage des plannings"
          >
            {tabs.map(({ id, label, Icon }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${id}-view`}
                  id={`${id}-tab`}
                  onClick={() => handleTabClick(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, id)}
                  tabIndex={isActive ? 0 : -1}
                  ref={(node) => {
                    tabRefs.current[id] = node;
                  }}
                  className={`view-tab inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-10" ref={setContainerRef} />
        </div>
        {children}
      </DashboardContext.Provider>
    </section>
  );
}
