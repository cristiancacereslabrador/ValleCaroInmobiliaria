---
name: feedback-incremental-progress
description: User wants task-by-task progress visibility during delegated implementation work, not a single silent batch delegation
metadata:
  type: feedback
---

Cuando se delega la implementación de un checklist grande (p. ej. tasks.md de un OpenSpec change) a un subagente, no lanzar todo el bloque de tareas en background y esperar en silencio a que termine. Ir mostrando el avance a medida que se completa cada tarea (o grupo pequeño de tareas), no solo un resumen al final.

**Por qué:** el usuario corrigió explícitamente ("pero no tenías q implementar todo al tiempo ni si quiera me has mostrado las tareas q has hecho") tras delegar de una sola vez 19 tareas (todo el backend del MVP `real-estate-platform-mvp`) a un agente `coder` en background sin dar visibilidad intermedia.

**Cómo aplicar:** al delegar un checklist largo, montar un `Monitor` (o mecanismo equivalente) que vigile el archivo de tareas (`tasks.md` u otro) y reporte cada checkbox nuevo marcado `[x]` a medida que ocurre, en vez de solo notificar al terminar todo el bloque. Si el trabajo es grande, considerar también trocear la delegación en fases más pequeñas con checkpoints explícitos al usuario, en vez de una única llamada de agente que cubra decenas de tareas de un tirón.
