<!-- Repo público: lo que quede aquí es público. No pongas dirección ni teléfono; dímelos por el chat si hacen falta. -->

# Lo que falta de Sebas (borrador)

Gobernanza, actualizado con tus respuestas del 2026-11-01. Solo queda lo que únicamente tú puedes decidir o revisar. Puedes contestar con el número y tu respuesta.

## Decisiones

1. **Tu nombre en la tienda.** Pusimos "Sebastian Pabon" en los documentos. Pero Apple muestra como vendedor el **nombre legal** de tu cuenta de desarrollador, no el que tú elijas. Entra a tu cuenta y revisa cuál sale. Si es distinto, dime cuál debe ir en los documentos: tiene que quedar claro que eres la misma persona.

2. **Hong Kong y Venezuela: OpenAI no funciona allí.** La lista oficial de OpenAI no incluye Hong Kong, China, Macao, Venezuela ni Cuba, y ofrecer acceso fuera de esa lista puede hacer que bloqueen tu cuenta de OpenAI. Tu lista de países incluye Hong Kong y "toda América Latina".
   - *Recomendación:* no lanzar en Hong Kong ni Venezuela por ahora. China continental también queda fuera. Cuba: revisa si aparece en App Store Connect; si aparece, déjala fuera.
   - La otra opción es apagar la IA en esos países, pero eso no existe hoy y hay que construirlo.

3. **Brasil: la app y los documentos no están en portugués.** La ley brasileña del consumidor pide información en portugués, y la ley de datos pide un consentimiento claro.
   - *Recomendación:* dejar Brasil para una segunda etapa, cuando existan al menos los documentos y los textos de consentimiento en portugués.
   - Si lo quieres desde el inicio, hay que traducir eso antes de enviar la app. ¿Cuál prefieres?

4. **El proveedor de correo no puede esperar hasta después del lanzamiento.** Me dijiste "más adelante", pero sin él las personas no pueden confirmar su cuenta por correo ni recuperar su contraseña, y Apple probaría justo eso. Además, las cuentas inactivas se avisan por correo. Normalmente exige un dominio propio.
   - *Opción A (recomendada):* comprar dominio y contratar el correo antes de enviar la app.
   - *Opción B:* lanzar solo con Apple y Google, sin registro por correo, y agregarlo después. Hay que confirmar con el Tech Lead que el demo para Apple funcione así.

5. **Bloques 1 a 5.** Me confirmaste que tienes permiso para **usarlos**. ¿Ese permiso también cubre publicarlos en una app pública? Hoy están dentro de la app y en el repo público. *Recomendación:* sacarlos de la versión pública de todas formas y dejarlos solo en tu cuenta. Tú los seguirías viendo igual. Además, así es cierto lo que dicen los Términos: que ningún entrenador humano revisa los planes.

6. **Aprueba estos valores que propuse** (dime "sí" o cámbialos):
   - Ley que rige los Términos: **Nueva Gales del Sur, Australia**.
   - Tope de responsabilidad: **100 dólares australianos**.
   - Responder a soporte en **5 días hábiles**.
   - Responder pedidos de privacidad en **10 días hábiles**, y borrar por correo una cuenta en **10 días**. Es el plazo corto de varios países; tú solo tendrías que responder a tiempo.
   - Planes anteriores: se guardan **hasta que la persona borre la cuenta**.
   - **El español prevalece** para quien usa la app en español o vive en un país de habla hispana; en los demás casos, el inglés. Así, la persona se rige por el texto que puede leer. A cambio, el español debe estar tan bien revisado como el inglés.
   - En los documentos públicos aparece "Australia", sin ciudad.

7. **Frase sobre quién está detrás del contenido.** Queda así en los Términos y en Soporte: *"El entrenador con IA es un programa, no una persona. Ningún entrenador humano ni profesional de la salud escribe, revisa o supervisa tu plan. Las reglas y plantillas se prepararon con un agente especialista de IA y las aprobó el dueño de la app."* ¿Es cierta tal como está?

## Cosas de tus cuentas (solo con tu login)

8. **Apple Developer:** ¿cuál es el Team ID de la cuenta de pago? Y revisa si "GymStudio" está libre en App Store Connect. Yo no puedo revisar eso ni si alguien tiene la marca registrada.
9. **OpenAI y Supabase** (cuando el Tech Lead te guíe): que no se compartan datos con OpenAI para entrenamiento, que estén aceptados sus acuerdos de datos, y qué plan y región tienes en Supabase. Faltan para cerrar varias frases de la política.

## Para tu aprobación final

10. Como no habrá abogado, **tú eres quien aprueba** la Política, los Términos, la Política de datos de salud de EE. UU., la página de soporte, los textos de consentimiento y las respuestas de App Store Connect, después de que el PT revise lo de salud. Nada se publica ni se envía sin tu aprobación, y el envío lo haces tú con tu login.

## Abierto antes de enviar a App Store (actualizado 2026-11-07)

Política, Términos y Soporte (EN y ES) quedaron listos para publicar con fecha de vigencia **7 de noviembre de 2026** y el correo
gymstudioapp@gmail.com. Cada frase describe la app de hoy. Al aprobar esos textos apruebas también los valores de la pregunta 6
(Nueva Gales del Sur, tope de 100 AUD, soporte en 5 días hábiles, privacidad en 10 días hábiles, borrado por correo en 10 días,
el español prevalece). Lo que sigue no está resuelto y no aparece como cierto en las páginas:

1. **Borrar la cuenta dentro de la app (G1). Bloquea el envío.** Apple no acepta el borrado por correo en una app como esta: lo exige
   dentro de la app. Las páginas describen el correo porque es lo que funciona hoy; hay que cambiarlas cuando exista el botón.
   Mientras tanto, cada pedido de borrado lo haces tú a mano, a tiempo, y confirmas por correo.
2. **Iniciar sesión con Apple (G4).** Decidiste agregarlo; no existe. Las páginas solo mencionan correo y Google. Hay que actualizarlas cuando llegue.
3. **Manifiesto de privacidad (G13)** y quitar los **bloques 1 a 5** del paquete público (G7, pregunta 5). Hoy, un usuario nuevo sin
   conexión en el primer arranque podría ver tu programa privado.
4. **Política de datos de salud de EE. UU.** La ley de Washington pide una política aparte con su propio enlace. Solo se publican
   tres páginas, así que resumí lo esencial en la sección 12 de la Política de privacidad. Antes de lanzar en EE. UU.: publicar
   `consumer-health-data-policy` como cuarta página (hay que actualizarla igual que las otras) o sacar EE. UU. de la lista de países.
5. **Consentimiento aparte para datos de salud (G5, G20).** No existe. La IA sí pide permiso explícito; el peso, los pasos y las
   calorías no. Washington, Corea y Colombia piden un consentimiento separado y explícito para eso. El registro por correo ya pide
   confirmar 18+; falta confirmar que el camino con Google también lo pida y que se guarde la aceptación de los Términos.
6. **Plazos de retención automáticos (G16, G17).** No hay tareas automáticas. Por eso las páginas dicen la verdad de hoy: todo se
   guarda hasta que se borra la cuenta, y los registros borrados quedan marcados en el servidor. Cuando existan las tareas (registros
   borrados 30 días, comentarios 24 meses, uso de IA 12 meses), cambiamos la tabla.
7. **Tu plan de Supabase.** Puse "registros hasta 28 días" y "copias hasta 14 días", que vale para Free, Pro y Team. Dime cuál tienes
   para poner el número exacto. La base de datos está en Singapur (dato del enlace del proyecto, región ap-southeast-1).
8. **OpenAI:** confirma en el panel que **no** activaste compartir datos para entrenamiento y si aceptaste su acuerdo de datos (DPA).
   Hoy la política solo cita lo que dice OpenAI; si confirmas, agrego "no lo hemos activado".
9. **Gmail como proveedor.** Una cuenta de Gmail normal no tiene acuerdo de tratamiento de datos, guarda en "Enviados" cada correo de
   cuenta, y tiene límite diario de envíos. Para lanzar sirve; cuando tengas dominio, conviene un proveedor de correo con acuerdo de datos.
   Mientras tanto, borra de vez en cuando los correos de cuenta enviados.
10. **Textos de la app que aún no son ciertos (G9).** `login.benefit3` y `login.privacyBody` dicen que tus datos sincronizados "solo los
    ve tu cuenta" (tú, como dueño, también puedes verlos). Las instrucciones de la IA en el servidor todavía dicen "personal trainer" y
    "PT". El nombre en el iPhone sigue siendo "Gym Studio".
11. **Enlaces dentro de la app (G5).** El Tech Lead los está agregando (cambios sin publicar en el registro y en Perfil). Si el español
    queda en otra ruta (por ejemplo `/privacy/es/`), avísame para cambiar los enlaces entre páginas.
12. **Revisión del PT** de las secciones 4 y 5 de los Términos y de las respuestas de salud del Soporte, antes de publicar.
13. **Siguen abiertas** las preguntas 1 (nombre legal del vendedor), 2 (Hong Kong y Venezuela), 3 (Brasil), 5 (bloques 1 a 5) y 8 (Team ID).
