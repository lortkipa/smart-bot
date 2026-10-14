import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export const isDesktop = "__TAURI_INTERNALS__" in window;

// macOS keeps its native traffic lights (see tauri.macos.conf.json).
const isMac = navigator.userAgent.includes("Mac");

/**
 * Frameless window controls for the desktop app: an invisible drag strip along the top edge and
 * three floating buttons in the top-right corner. Renders nothing on the web.
 */
export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isDesktop || isMac) return;
    const win = getCurrentWindow();
    const sync = () => win.isMaximized().then(setMaximized);
    sync();
    const unlisten = win.onResized(sync);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  if (!isDesktop) return null;
  const win = getCurrentWindow();

  return (
    <>
      <div className="drag-strip" data-tauri-drag-region />
      {!isMac && (
        <div className="window-controls">
          <button type="button" aria-label="Minimize" onClick={() => win.minimize()}>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 6h7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={maximized ? "Restore" : "Maximize"}
            onClick={() => win.toggleMaximize()}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              {maximized ? (
                <>
                  <rect x="2.5" y="4" width="5.5" height="5.5" rx="1.5" />
                  <path d="M4.5 2.5h3.5a1.5 1.5 0 0 1 1.5 1.5v3.5" />
                </>
              ) : (
                <rect x="2.5" y="2.5" width="7" height="7" rx="1.75" />
              )}
            </svg>
          </button>
          <button type="button" className="close" aria-label="Close" onClick={() => win.close()}>
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
