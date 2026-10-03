# Fitness knowledge

Contenido de dominio fitness (técnica, cues, músculos, seguridad) con un circuito
de aprobación. Nada de aquí llega a la app sin pasar por estos pasos:

```
PT / Fitness Expert  →  drafts/  →  aprobación de Sebas  →  approved/  →  Tech Lead diseña  →  Copilot implementa
```

| Carpeta | Quién escribe | Significado |
|---|---|---|
| `drafts/` | Agente PT (`.claude/agents/pt-fitness-expert.md`) | Propuesta. **No es verdad para la app.** |
| `approved/` | Tech Lead, solo tras la aprobación explícita de Sebas | Conocimiento aprobado; puede convertirse en un Issue. |

Cada archivo usa [TEMPLATE.md](TEMPLATE.md). Al aprobarse, se mueve a `approved/`,
se cambia `status: approved` y se anota quién y cuándo lo aprobó.
