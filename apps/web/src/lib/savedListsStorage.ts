/**
 * Persistencia local (design.md - Decision 1, proposal.md): `managementToken`
 * se guarda en `localStorage` del navegador que creo la lista, junto con el
 * `shareToken` y el nombre para poder mostrar "listas guardadas en este
 * navegador" al usuario sin volver a llamar a la API. Perder este
 * `localStorage` significa perder el control de edicion de la lista
 * (design.md - Risks/Trade-offs), aceptado como limitacion conocida.
 */

const STORAGE_KEY = 'savedPropertyLists';

export interface StoredSavedPropertyList {
  id: string;
  name: string;
  managementToken: string;
  shareToken: string;
}

function readAll(): StoredSavedPropertyList[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(lists: StoredSavedPropertyList[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // localStorage no disponible (modo privado, cuota agotada, etc.):
    // la lista sigue existiendo en el servidor, solo no se recuerda aqui.
  }
}

export function getStoredSavedPropertyLists(): StoredSavedPropertyList[] {
  return readAll();
}

/** Añade o actualiza (por managementToken) una entrada, p. ej. tras crear una lista nueva. */
export function rememberSavedPropertyList(list: StoredSavedPropertyList): void {
  const existing = readAll().filter((item) => item.managementToken !== list.managementToken);
  writeAll([...existing, list]);
}

export function forgetSavedPropertyList(managementToken: string): void {
  writeAll(readAll().filter((item) => item.managementToken !== managementToken));
}
