'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import Link from 'next/link';
import {
  forgetSavedPropertyList,
  getStoredSavedPropertyLists,
  rememberSavedPropertyList,
  type StoredSavedPropertyList,
} from '../lib/savedListsStorage';
import { addPropertyToSavedList, createSavedPropertyList } from '../lib/api/savedPropertyLists';
import { ApiError } from '../lib/api/client';

type Feedback = { type: 'success' | 'error'; text: string; managementToken?: string };

/**
 * Botón "guardar en lista" (tasks.md 3.1): permite añadir una propiedad a
 * una lista ya guardada en este navegador o crear una lista nueva sobre la
 * marcha. Se usa tanto en `PropertyCard` (dentro de un `<Link>` de tarjeta,
 * de ahí el `stopPropagation`/`preventDefault` en cada interacción) como en
 * la ficha de detalle.
 */
export function SaveToListButton({
  propertyId,
  className,
  compact = false,
}: {
  propertyId: string;
  className?: string;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<StoredSavedPropertyList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLists(getStoredSavedPropertyLists());
      setFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function toggleOpen(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  async function handleAddToExisting(list: StoredSavedPropertyList, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await addPropertyToSavedList(list.managementToken, propertyId);
      setFeedback({
        type: 'success',
        text: `Añadida a "${list.name}".`,
        managementToken: list.managementToken,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // La lista se borro/dejo de existir en el servidor: limpiamos la
        // referencia local obsoleta para no seguir ofreciendola.
        forgetSavedPropertyList(list.managementToken);
        setLists(getStoredSavedPropertyLists());
      }
      setFeedback({
        type: 'error',
        text:
          err instanceof ApiError
            ? err.message
            : 'No se pudo añadir la propiedad a la lista.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateAndAdd(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const name = newListName.trim();
    if (!name) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const created = await createSavedPropertyList(name);
      rememberSavedPropertyList({
        id: created.id,
        name: created.name,
        managementToken: created.managementToken,
        shareToken: created.shareToken,
      });
      await addPropertyToSavedList(created.managementToken, propertyId);
      setLists(getStoredSavedPropertyLists());
      setNewListName('');
      setFeedback({
        type: 'success',
        text: `Lista "${created.name}" creada y propiedad añadida.`,
        managementToken: created.managementToken,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'No se pudo crear la lista.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`save-to-list ${className ?? ''}`} ref={containerRef}>
      <button type="button" className="btn btn-secondary" onClick={toggleOpen}>
        {compact ? '♡' : '♡ Guardar'}
      </button>

      {isOpen && (
        <div className="save-to-list-panel" onClick={(event) => event.stopPropagation()}>
          <p className="save-to-list-title">Guardar propiedad en…</p>

          {lists.length > 0 && (
            <ul className="save-to-list-existing">
              {lists.map((list) => (
                <li key={list.managementToken}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                    onClick={(event) => handleAddToExisting(list, event)}
                  >
                    {list.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="save-to-list-new" onSubmit={handleCreateAndAdd}>
            <input
              type="text"
              placeholder="Nombre de lista nueva (p. ej. TOP 3)"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              maxLength={150}
            />
            <button type="submit" className="btn" disabled={isSubmitting || !newListName.trim()}>
              Crear y añadir
            </button>
          </form>

          {feedback && (
            <p
              className={`save-to-list-feedback ${
                feedback.type === 'error' ? 'field-error' : ''
              }`}
            >
              {feedback.text}
              {feedback.type === 'success' && feedback.managementToken && (
                <>
                  {' '}
                  <Link
                    href={`/lists/${feedback.managementToken}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Ver lista
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
