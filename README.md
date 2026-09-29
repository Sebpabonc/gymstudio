# Gym Studio

Registra tu rendimiento en el gimnasio día a día y comprueba si progresas semana a semana.

Flujo principal: **abrir → buscar ejercicio → ver la última vez → registrar hoy → guardar → ver comparación**.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de producción en dist/
```

Para probar en el teléfono: `npm run dev -- --host` y abre la IP del Mac desde el móvil (misma red Wi-Fi).

## Estructura

```
src/
  app/          App.tsx y router por hash (#/ y #/exercise/:id)
  domain/       types.ts (modelo de datos) y metrics.ts (volumen, 1RM estimado, comparaciones)
  data/         exercises.ts — biblioteca de ejercicios (temporal)
  storage/      repository.ts (interfaz), localStorageRepository.ts, drafts.ts
  features/
    search/     pantalla principal con búsqueda
    exercise/   página de ejercicio: última vez, registro de series, resultado
  lib/          fechas, formato de números, búsqueda, ids
  styles/       tokens.css (identidad de marca) y app.css
legacy/src-v0/  prototipo anterior, solo como referencia (no se compila)
```

## Modelo de datos

- `Exercise` — `id` único y estable, `name`, `primaryMuscle`, `secondaryMuscle?`, `notes?`, `aliases?`.
- `ExerciseLog` — un registro por ejercicio y día: `exerciseId`, `date` (YYYY-MM-DD local), `sets[{ weight, reps }]` en kg, `notes?`, `programId?` (reservado para programas), `createdAt`, `updatedAt`.

Los datos se guardan en `localStorage` bajo `gym-studio.data` con `schemaVersion`. El historial del prototipo anterior (`gym-studio.history`) se migra automáticamente la primera vez.

## Añadir la lista completa de ejercicios

Sustituye el array de `src/data/exercises.ts` manteniendo la misma forma. No cambies el `id` de un ejercicio que ya tenga registros.

## Fases

1. ✅ Biblioteca, búsqueda, página de ejercicio, registro y guardado, comparación con la última vez.
2. Historial por ejercicio y progreso semana a semana.
3. Editar/borrar registros, uso sin conexión (PWA), lista completa de ejercicios.
