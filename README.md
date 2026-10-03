# Gym Studio

App para registrar entrenamientos de gimnasio, consultar ejercicios y seguir tu plan.

- Tecnología: React, TypeScript, Vite, Capacitor (iOS)
- Persistencia actual: `localStorage` (la migración a Supabase está planificada)

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # chequeo de tipos + build de producción en dist/
```

Para probar en el teléfono: `npm run dev -- --host` y abre la IP del Mac desde el móvil (misma red Wi-Fi).

## iOS

```bash
npm run mobile:sync      # build web + copia a ios/ (los archivos copiados no se versionan)
npm run mobile:open:ios  # abre el proyecto en Xcode
```

## Estructura

```
src/
  App.tsx                 pantalla principal
  components/WorkoutPlan  plan de entrenamiento y calendario
  data/                   biblioteca de ejercicios y plan base
  utils/storage.ts        lectura/escritura en localStorage
  types.ts                modelo de datos
ios/                      proyecto nativo de Capacitor
docs/reference/           material de origen (plan en Excel, branding)
```

## Contribuir

- Cada cambio parte de un Issue, se trabaja en una rama y entra a `main` por Pull Request.
- Cambios pequeños y enfocados.
