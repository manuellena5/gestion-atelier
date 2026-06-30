import { registerSW } from 'virtual:pwa-register';

type UpdateSWFn = (reloadPage?: boolean) => Promise<void>;

let updateSWFn: UpdateSWFn | null = null;
let needsRefresh = false;

export function initPwaUpdate(): void {
  if (!('serviceWorker' in navigator)) return;
  updateSWFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      needsRefresh = true;
    },
  });
}

/**
 * Pide al navegador que busque una nueva versión del service worker.
 * Devuelve true si hay una actualización lista para aplicar.
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    await registration.update();
    // Le da tiempo al navegador a disparar el evento de actualización detectada.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return needsRefresh || registration.waiting !== null;
  } catch {
    return false;
  }
}

/** Activa la nueva versión del service worker y recarga la app. */
export async function applyUpdate(): Promise<void> {
  if (updateSWFn) {
    await updateSWFn(true);
    return;
  }
  window.location.reload();
}
