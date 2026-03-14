let swRegistration: ServiceWorkerRegistration | undefined;

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    // SW registration failed, showNotification will fall back to Notification API
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

export const showNotification = (
  title: string,
  options: { body?: string; icon?: string },
  data?: Record<string, unknown>,
) => {
  if (Notification.permission !== "granted") return;

  if (swRegistration) {
    swRegistration.showNotification(title, { ...options, data });
  } else {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
};
