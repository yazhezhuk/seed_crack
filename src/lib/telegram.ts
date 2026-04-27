// Telegram Web App SDK helpers
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        initDataUnsafe?: {
          user?: { id: number; first_name?: string; username?: string };
        };
        colorScheme?: string;
        themeParams?: Record<string, string>;
      };
    };
  }
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#020a04");
    tg.setBackgroundColor("#020a04");
  } catch {
    /* ignore */
  }
  return tg;
}

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
  } catch {
    /* ignore */
  }
}
