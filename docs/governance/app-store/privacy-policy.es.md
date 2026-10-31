<!--
BORRADOR de Governancer, 2026-10-31. No es asesoría legal. Requiere revisión de un abogado antes de publicar.
No publicar hasta que: se completen todos los [PO: …], se entreguen los [REQUIERE Gn: …] y se quite la marca, y se confirmen los
[VERIFICAR: …]. Gn se refiere a gaps-for-tech-lead.md. Hechos: data-inventory.md.
Los párrafos marcados LAWYER necesitan revisión específica. Si hay diferencias, el abogado define qué versión prevalece.
-->

# Política de privacidad de GymStudio

**Última actualización:** [PO: fecha de publicación]

Esta política explica qué recopila GymStudio, para qué, quién lo recibe, cuánto tiempo lo guardamos y cómo puedes controlarlo.
GymStudio es una app de entrenamiento para consultar ejercicios, seguir un plan, registrar series y ver tu progreso.

## 1. Responsable

[PO: nombre legal completo o empresa], [PO: país y dirección, si debe publicarse], es responsable de tus datos personales
("nosotros"). Contacto de privacidad: [PO: correo de privacidad].

<!-- LAWYER: representante en la UE/Reino Unido (RGPD art. 27) si se dirige a usuarios allí y no hay establecimiento. -->
[PO/LAWYER: datos del representante en la UE/Reino Unido, si se requiere.]

## 2. Usar GymStudio sin cuenta

Puedes usar la demo o guardar entrenamientos en tu dispositivo sin crear una cuenta. En ese caso, tus entrenamientos se quedan en tu
dispositivo. Cuando la app descarga la lista de ejercicios, nuestro proveedor de alojamiento recibe tu dirección IP como parte de la
conexión. Los planes, objetivos, medidas, comentarios y funciones de IA requieren una cuenta.

## 3. Qué recopilamos si tienes cuenta

| Datos | Ejemplos | Para qué los usamos |
|---|---|---|
| Datos de la cuenta | Correo; contraseña (nuestro proveedor la guarda cifrada con hash); si usas Google [REQUIERE G4: o Apple], tu nombre, correo, enlace a tu foto de perfil y el identificador que te asigna el proveedor | Crear tu cuenta e iniciar sesión |
| Datos de entrenamiento | Ejercicios, fechas, pesos, repeticiones, series y tiempos, repeticiones en reserva, objetivos del plan, tus notas, ejercicios que creas | Hacer funcionar la app, sincronizar entre dispositivos y mostrar tu progreso |
| Datos de salud y actividad física | Peso corporal, pasos y calorías que escribes; tu objetivo (como perder grasa o ganar músculo), experiencia, nivel de actividad, equipo y las notas que agregues | Crear y adaptar tu plan y mostrar tu progreso |
| Planes y recomendaciones | Tus planes, cambios de ejercicio, las cargas que recomendamos y si las usaste | Recomendar la carga de hoy y adaptarla a ti |
| Preguntas a la IA | Lo que le escribes a la IA, si la activas | Responderte. No guardamos tus preguntas ni las respuestas en nuestros servidores |
| Conteo de uso de IA | Función, modelo, cantidad de texto procesado, costo, hora. No el contenido | Aplicar límites diarios y controlar costos |
| Comentarios | Tu mensaje, con versión de la app, pantalla e idioma | Responderte y mejorar la app |
| Datos técnicos | Dirección IP, tipo de dispositivo y navegador, horas de sesión, registros del servidor | Proteger tu cuenta y mantener el servicio funcionando |

No usamos Apple Salud, tu ubicación, cámara, contactos ni fotos. GymStudio no tiene anuncios, ni herramientas de analítica, ni rastreo
a través de apps o sitios de otras empresas. No vendemos tus datos. No usamos tus datos de salud y actividad física para publicidad ni
marketing.

En tu dispositivo, la app también guarda tus datos, preferencias y sesión para funcionar sin conexión. Durante un descanso, el
temporizador y el nombre del ejercicio pueden aparecer en tu pantalla bloqueada y en la Dynamic Island mediante Actividades en vivo.
Esto se queda en tu dispositivo.

## 4. Por qué podemos usar tus datos

<!-- LAWYER: confirmar bases legales por país. Aquí peso, pasos, calorías y notas de objetivo se tratan como datos de salud (sensibles). -->

| Finalidad | Base (donde la ley la pide) |
|---|---|
| Prestar la cuenta, sincronización, plan y progreso | El contrato contigo |
| Guardar y usar tus datos de salud y actividad física | Tu consentimiento o autorización explícita, que puedes retirar. [REQUIERE G5/G20: paso de consentimiento en la app] |
| Enviar datos al proveedor de IA | Tu consentimiento o autorización explícita, que puedes retirar. [REQUIERE G2, G3] |
| Seguridad, prevención de abuso, límites y control de costos, responder comentarios | Nuestros intereses legítimos |
| Obligaciones legales | La ley |

No estás obligado a dar datos de salud, que son datos sensibles, ni a activar la IA. Sin ellos, la app sigue registrando entrenamientos y
da planes y recomendaciones basados en reglas.

## 5. Funciones de IA

Las funciones de IA de GymStudio usan **OpenAI** como proveedor externo. Son opcionales, y no se envía nada hasta que las actives.
[REQUIERE G2]

| Función | Qué se envía a OpenAI |
|---|---|
| Preguntar a la IA | Tu pregunta, la fecha de hoy, tu plan actual y hasta 30 registros recientes de entrenamiento |
| Explicación del Entrenador IA | Nombre del ejercicio; carga recomendada y anterior; fecha, peso y repeticiones de la última sesión; repetición máxima estimada; número de sesiones usadas |
| Personalización del plan con IA | Tu objetivo, experiencia, nivel de actividad, duración de sesión, equipo y notas; tu peso, pasos y calorías de los últimos 14 días; tu plan y ejercicios alternativos |

No enviamos tu nombre, correo ni las notas de tus entrenamientos. [REQUIERE G11: quitar el identificador interno de usuario en la
personalización del plan] Evita escribir nombres o detalles médicos en notas o preguntas.

Según OpenAI, los datos enviados por su API no se usan para entrenar sus modelos a menos que el cliente lo autorice, lo cual no hemos
hecho [VERIFICAR: panel], y puede conservarlos hasta 30 días para vigilar abusos, más si la ley lo exige. OpenAI los trata principalmente
en Estados Unidos.

La carga que ves cada día la calculan las reglas de la app. La IA escribe la explicación, y solo puede personalizar un plan dentro de los
límites de esas reglas. Las respuestas de la IA pueden tener errores. Puedes desactivar la IA en cualquier momento en Perfil → Privacidad
e IA [REQUIERE G3]. Los datos ya enviados no se pueden recuperar, pero siguen el plazo indicado.

## 6. Quién recibe tus datos

| Destinatario | Función | Ubicación |
|---|---|---|
| Supabase | Aloja la base de datos, el inicio de sesión, funciones de servidor y registros | [VERIFICAR: región] |
| OpenAI | Texto de IA, solo si activas la IA | Estados Unidos |
| Google | Solo si inicias sesión con Google, o tocas un enlace que abre Google Imágenes (solo la búsqueda del ejercicio va a Google, y aplican sus propios términos) | Global |
| [REQUIERE G4: Apple] | Iniciar sesión con Apple, si lo usas; el App Store gestiona tu descarga según los términos de Apple | Global |
| GitHub | Aloja nuestra app web y estas páginas, y puede ver la dirección IP de los visitantes | Estados Unidos |
| [REQUIERE G6: proveedor de correo, nombre] | Envía correos de la cuenta | [VERIFICAR] |
| Autoridades, jueces | Cuando la ley lo exija | |

El dueño de GymStudio puede acceder a los datos guardados cuando sea necesario para dar soporte, corregir problemas o cumplir la ley.

### Transferencias internacionales

<!-- LAWYER: mecanismo por país: RGPD cap. V, APP 8, Ley 1581 art. 26. -->
Tus datos pueden tratarse fuera de tu país, incluso en Estados Unidos, donde las leyes pueden ser distintas. Nos apoyamos en las
condiciones de tratamiento de datos de los proveedores, incluidas las Cláusulas Contractuales Tipo de la Comisión Europea donde
apliquen. [VERIFICAR: acuerdos aceptados con Supabase y OpenAI]

## 7. Cuánto tiempo guardamos los datos

| Datos | Plazo |
|---|---|
| Cuenta, entrenamientos, objetivos, medidas, planes, recomendaciones | Hasta que los borres o borres tu cuenta. [PO: cuentas inactivas se borran tras N meses, con aviso] [REQUIERE G17 si se elige un plazo] |
| Un registro o ejercicio que borras | Desaparece de inmediato de la vista; se elimina del servidor tras [PO: N días] [REQUIERE G16] |
| Planes anteriores | [PO: plazo, o hasta borrar la cuenta] |
| Conteo de uso de IA, comentarios | [PO: plazo, o hasta borrar la cuenta] |
| Registros de servidor y de inicio de sesión | [VERIFICAR: plazo de registros de Supabase] |
| Copias de seguridad | Hasta que venza la copia, hasta [VERIFICAR: plan, 7 a 30 días]. Solo se usan para restaurar el servicio |
| Datos en OpenAI | Hasta 30 días, según OpenAI |
| Datos en tu dispositivo | Hasta que borres la cuenta en la app o elimines la app. Cerrar sesión no los borra [ver G25] |

## 8. Cómo borrar tu cuenta

En la app: **Perfil → Borrar cuenta**. [REQUIERE G1] Esto elimina de forma permanente tu cuenta y todos los datos asociados de nuestra
base de datos de inmediato. Las copias de seguridad vencen como se indica arriba. Los datos permanecen en otro dispositivo hasta que abras
la app allí o la elimines. Borrar la app por sí solo no borra tu cuenta. Si no puedes iniciar sesión, escribe a [PO: correo de privacidad].

## 9. Tus derechos

Según donde vivas, puedes pedir ver tus datos, obtener una copia, corregirlos, suprimirlos, limitar u oponerte a su uso, y retirar tu
consentimiento o autorización cuando quieras sin afectar el uso anterior. La app permite corregir la mayoría de los datos y también borrar.
Para lo demás, escribe a [PO: correo de privacidad]. Respondemos en el plazo legal, normalmente [PO/LAWYER: 30 días; revisar 10/15 días
hábiles en Colombia]. No te trataremos peor por ejercer tus derechos.

Puedes presentar una queja ante tu autoridad de protección de datos, como tu autoridad en la UE; la Office of the Australian Information
Commissioner; o la Superintendencia de Industria y Comercio de Colombia. <!-- LAWYER: dejar solo las aplicables. -->

## 10. Menores

GymStudio es para personas de [PO: edad mínima, 16 o 18] años o más. No recopilamos a sabiendas datos de personas menores de esa edad. Si
crees que alguien menor tiene una cuenta, escríbenos y la borraremos.

## 11. Seguridad

Las conexiones están cifradas. Los datos de cada persona están separados en la base de datos mediante reglas de acceso. Las claves de IA y de
administrador se guardan en el servidor. Ningún sistema es totalmente seguro. Si una brecha te afecta, te avisaremos a ti y a las autoridades
cuando la ley lo exija.

## 12. Avisos para estados de EE. UU.

<!-- LAWYER: la Washington My Health My Data Act y leyes estatales similares (p. ej., Nevada) pueden exigir una política separada de datos de
salud del consumidor, enlazada en la página principal, y consentimiento separado, sin exención para pequeñas empresas. Probablemente no se
alcanzan los umbrales de la CCPA. -->
[LAWYER: sección estatal y política separada de datos de salud del consumidor, si se incluyen usuarios de EE. UU.]

## 13. Cambios

Si cambiamos esta política, actualizaremos la fecha y, si el cambio es importante, te avisaremos en la app antes de que aplique. Si queremos
usar tus datos para una finalidad nueva, te lo pediremos primero.

## 14. Contacto

[PO: nombre legal], [PO: correo de privacidad]. Soporte: [PO: URL de soporte].
