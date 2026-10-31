# Preguntas para Sebas (borrador)

Gobernanza, 2026-10-31. Solo lo que únicamente tú puedes responder. Puedes contestar con el número y tu respuesta. Doy mi recomendación cuando la tengo, pero la decisión es tuya.

> Ojo: el repo es público. No pongas tus datos personales aquí; dímelos por el chat y decidimos qué se publica.

## Primero: bloquean los documentos

1. **¿Quién aparece como dueño de la app?** ¿Tu nombre completo o una empresa? ¿Cuál exactamente? Debe coincidir con tu cuenta de Apple Developer. Si es a tu nombre, tu nombre sale público en el App Store.
2. **¿En qué país vives y en cuál está registrada la cuenta o empresa?** Tu Mac está en hora de Australia, pero no quiero suponerlo. Esto decide qué leyes aplican y qué abogado buscar.
3. **¿Dónde estarán tus usuarios al lanzar?** ¿Todos los países, o solo algunos? Por ejemplo, Colombia, Australia, EE. UU., Europa. Menos países significa menos trabajo legal al inicio. *Recomendación: empezar con pocos y sumar después.*
4. **¿Qué correos usamos?** Uno para soporte y uno para privacidad (puede ser el mismo). No tu correo personal. Ideal con dominio propio, por ejemplo soporte@tudominio.
5. **¿Edad mínima?** *Recomendación: 18*. Es lo más simple porque la app guarda peso y calorías y usa IA, y evita las reglas de datos de menores (en Colombia, menor es hasta 18 años). Con 16 alcanzas a más gente, pero necesitas más revisión legal. Ten en cuenta: si tus Términos piden más edad que la que calcula Apple, el App Store debe mostrar esa edad más alta.
6. **¿Es gratis al lanzar?** El plan de marketing habla de Pro a $7.99/mes, pero no existe en la app. *Recomendación: lanzar gratis y agregar Pro en otra versión.* Si cobras, tiene que ser con compra dentro de la app de Apple, y hay que completar acuerdos, impuestos y banco.
7. **¿Seguimos con OpenAI como proveedor de IA?** Es el que usa la app hoy. Si cambias, cambia todo el texto de consentimiento. *Recomendación: seguir.*
8. **¿Vas a usar Google para iniciar sesión en iPhone?** Apple exige ofrecer también otra opción privada si hay Google.
   - **Opción A (recomendada):** agregar Iniciar sesión con Apple. Más trabajo, pero es lo que más esperan los usuarios de iPhone.
   - **Opción B:** quitar Google solo en el iPhone. Más rápido, pero quien ya entra con Google necesitaría una contraseña.
9. **¿Hay un entrenador humano real detrás del contenido?** La app y el texto del App Store dicen "reglas escritas por un entrenador personal" y "Designed by the PT", pero nuestro PT es un agente de IA, y tú apruebas. Si no hay un profesional humano calificado que lo revise, debemos cambiar esas frases, porque Apple y las leyes de consumo no permiten decir algo que no es cierto. O contratas a alguien para revisar, y entonces se puede decir, con su nombre o título. ¿Qué prefieres?
10. **Los bloques 1 a 5 vienen de "coach", de tu Excel original. ¿Quién los hizo? ¿Tienes permiso para usarlos?** Hoy esos planes están dentro de la app que se publicaría. *Recomendación: sacarlos de la versión pública.*

## Plazos de los datos

11. **¿Cuánto guardamos los datos?** Hoy todo se guarda para siempre hasta que el usuario lo borre, y eso es difícil de justificar. Propongo:
    - Cuentas sin uso: borrar tras **24 meses**, con aviso previo por correo.
    - Registros que el usuario borró: eliminarlos del todo tras **30 días**.
    - Comentarios: **24 meses**.
    - Conteo de uso de IA: **12 meses**.
    - Planes anteriores: hasta que borre la cuenta.

    ¿Aceptas o cambias alguno?

## Cosas de tus cuentas (solo con tu login)

12. **Apple Developer:** ¿estás inscrito como persona o como empresa? ¿Cuál es el nuevo Team ID? (es un dato técnico, no es secreto, pero mándalo por el chat).
13. **Dominio:** ¿compramos uno? Sirve para el correo de soporte, los correos de la app y la página. Sin dominio podemos usar la dirección de GitHub Pages con tu usuario, sebpabonc, visible en el enlace.
14. **Correos de la app:** Supabase por defecto solo envía correos a tu equipo, así que un usuario nuevo no podría confirmar su cuenta. Hay que contratar un servicio de correo (muchos son gratis al inicio). ¿Lo apruebas? Yo te paso las opciones.
15. **Revisar en OpenAI y Supabase** (cuando el Tech Lead te guíe): que no se compartan datos con OpenAI para entrenamiento, y qué plan y región tienes en Supabase.

## Decisiones de la tienda

16. **Vendedor en Europa (DSA):** si publicas en la UE, Apple te pregunta si eres "comerciante". Como planeas cobrar o promocionar, lo más probable es que sí. Eso **publica tu dirección, teléfono y correo** en la página del App Store en la UE. ¿Aceptas, usas una empresa o apartado postal, o dejas fuera la UE al inicio?
17. **¿GymStudio o Gym Studio?** Hoy están ambos. Hay que elegir uno. ¿Y ya revisaste si el nombre está libre en el App Store y como marca?
18. **¿Solo iPhone, o también iPad?** *Recomendación: solo iPhone al inicio.* El iPad requiere capturas y revisión aparte.
19. **Abogado:** ¿tienes presupuesto para que un abogado revise los documentos? Yo no soy abogado. Es lo que más recomiendo antes de publicar, sobre todo porque la app guarda datos de salud. Con las respuestas 2 y 3 te digo qué pedirle.

## Para tu aprobación cuando esté listo

20. Política de privacidad, Términos, página de soporte, textos de consentimiento y respuestas de App Store Connect, después de la revisión del PT y del abogado. Nada se publica ni se envía sin tu aprobación, y el envío lo haces tú con tu login.
