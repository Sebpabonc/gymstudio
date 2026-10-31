<!--
BORRADOR de Governancer, actualizado con las respuestas del PO del 2026-11-01. No es asesoría legal. Governancer no es abogado.
Ningún abogado lo revisará (decisión del PO, 2026-11-01): el PO lo lee y lo aprueba. Los comentarios HIGH RISK marcan lo que normalmente revisaría un abogado;
README.md lista las leyes consideradas y lo que no se pudo verificar.
No publicar hasta que: se aprueben los [PO aprueba: …] y se quite la marca, se entreguen los [REQUIERE Gn: …] y se quite la marca, y se confirmen los
[VERIFICAR: …]. Gn se refiere a gaps-for-tech-lead.md. Hechos: data-inventory.md. Los enlaces funcionan cuando G5 publique las páginas.
Regla de documentos públicos: el PO aprobó nombre y correo; nunca agregar dirección ni teléfono.
Este texto prevalece para quienes usan la app en español o viven en países de habla hispana (sección 14): revísalo con el mismo cuidado que el inglés.
-->

# Política de privacidad de GymStudio

**Última actualización:** [PO: fecha de publicación]

Esta política explica qué recopila GymStudio, para qué, quién lo recibe, cuánto tiempo lo guardamos y cómo puedes controlarlo.
GymStudio es una app de entrenamiento para consultar ejercicios, seguir un plan, registrar series y ver tu progreso.

## 1. Responsable

GymStudio está a cargo de **Sebastian Pabon**, una persona natural con base en Australia, no una empresa. Él es el responsable de tus datos personales ("nosotros").
Contacto de privacidad: js.pabonc979@gmail.com.
<!-- PO: el App Store muestra como vendedor el nombre legal de la cuenta de Apple Developer. Revisa que coincida (pregunta 1). -->

## 2. Usar GymStudio sin cuenta

Puedes usar la demo o guardar entrenamientos en tu dispositivo sin crear una cuenta. En ese caso, tus entrenamientos se quedan en tu
dispositivo. Cuando la app descarga la lista de ejercicios, nuestro proveedor de alojamiento recibe tu dirección IP como parte de la
conexión. Los planes, objetivos, medidas, comentarios y funciones de IA requieren una cuenta.

GymStudio es para personas de 18 años o más. No se ofrece en la Unión Europea.

## 3. Qué recopilamos si tienes cuenta

| Datos | Ejemplos | Para qué los usamos |
|---|---|---|
| Datos de la cuenta | Correo; contraseña (nuestro proveedor la guarda cifrada con hash); si usas Google o Apple [REQUIERE G4: Apple], tu nombre, correo (Apple te deja ocultarlo), el enlace a tu foto de perfil de Google y el identificador que te asigna el proveedor | Crear tu cuenta e iniciar sesión |
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

<!-- HIGH RISK: las bases cambian por país (Brasil, Colombia, Corea, Japón y Argentina se apoyan en el consentimiento para datos de salud). Tratamos peso, pasos,
calorías y notas de objetivo como datos de salud (sensibles) en todas partes, que es la lectura segura. -->

| Finalidad | Base (donde la ley la pide) |
|---|---|
| Prestar la cuenta, sincronización, plan y progreso | El contrato contigo |
| Guardar y usar tus datos de salud y actividad física | Tu consentimiento o autorización explícita, que puedes retirar. [REQUIERE G5/G20: paso de consentimiento en la app] |
| Enviar datos al proveedor de IA | Tu consentimiento o autorización explícita, separada de la anterior, que puedes retirar. [REQUIERE G2, G3] |
| Guardar y tratar tus datos fuera de tu país | Tu consentimiento o autorización, o lo que tu ley permita para proveedores de servicios. Ver sección 6 |
| Seguridad, prevención de abuso, límites y control de costos, responder comentarios | Nuestros intereses legítimos |
| Obligaciones legales | La ley |

No estás obligado a dar datos de salud, que son datos sensibles, ni a activar la IA. Sin ellos, la app sigue registrando entrenamientos y
da planes y recomendaciones basados en reglas. Aceptar nuestros Términos no cuenta como consentimiento para estos usos.

## 5. Funciones de IA

Las funciones de IA de GymStudio, incluidas las explicaciones del entrenador con IA, usan **OpenAI** como proveedor externo. Son opcionales, y no se envía nada
hasta que las actives. [REQUIERE G2]

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
límites de esas reglas. El entrenador con IA es un programa, no una persona. Las respuestas de la IA pueden tener errores. Puedes desactivar
la IA en cualquier momento en Perfil → Privacidad e IA [REQUIERE G3]. Los datos ya enviados no se pueden recuperar, pero siguen el plazo indicado.

## 6. Quién recibe tus datos

| Destinatario | Función | Ubicación |
|---|---|---|
| Supabase | Aloja la base de datos, el inicio de sesión, funciones de servidor y registros | [VERIFICAR: región] |
| OpenAI | Texto de IA, solo si activas la IA | Estados Unidos |
| Google | Solo si inicias sesión con Google, o tocas un enlace que abre Google Imágenes (solo la búsqueda del ejercicio va a Google, y aplican sus propios términos) | Global |
| Apple [REQUIERE G4] | Iniciar sesión con Apple, si lo usas; el App Store gestiona tu descarga según los términos de Apple | Global |
| GitHub | Aloja nuestra app web y estas páginas, y puede ver la dirección IP de los visitantes | Estados Unidos |
| [REQUIERE G6: proveedor de correo, nombre] | Envía correos de la cuenta | [VERIFICAR] |
| Autoridades, jueces | Cuando la ley lo exija | |

Sebastian Pabon puede acceder a los datos guardados cuando sea necesario para dar soporte, corregir problemas o cumplir la ley.

### Transferencias internacionales

<!-- HIGH RISK: cada país de lanzamiento tiene su regla: APP 8 (Australia), APPI art. 28 (Japón), PIPA art. 28-8 (Corea), limitación de transferencia del PDPA
(Singapur), LGPD cap. V (Brasil), Ley 1581 art. 26 (Colombia), Ley 25.326 art. 12 (Argentina), México. Lo común: destinatario y país nombrados más consentimiento;
los contratos con proveedores deben estar aceptados (G19). -->
Tus datos se guardan y se tratan fuera de tu país, en los lugares indicados arriba, incluidos Estados Unidos y donde operen nuestros proveedores. Sus leyes pueden proteger
tus datos menos que las tuyas y darte menos formas de reclamar. Usamos proveedores que se comprometen con condiciones de tratamiento de datos [VERIFICAR: acuerdos aceptados con Supabase y OpenAI].
Al dar los consentimientos de la sección 4 aceptas estas transferencias; puedes retirarlos cuando quieras, aunque la app no puede sincronizar sin su proveedor de alojamiento.

## 7. Cuánto tiempo guardamos los datos

| Datos | Plazo |
|---|---|
| Cuenta, entrenamientos, objetivos, medidas, planes, recomendaciones | Hasta que los borres o borres tu cuenta. Si una cuenta no se usa durante **24 meses**, la borramos, después de avisarte por correo. [REQUIERE G6, G17] |
| Un registro o ejercicio que borras | Desaparece de inmediato de la vista; se elimina del servidor tras **30 días** [REQUIERE G16] |
| Planes anteriores | Hasta que borres tu cuenta [PO aprueba: este plazo] |
| Comentarios | **24 meses** [REQUIERE G17] |
| Conteo de uso de IA | **12 meses** [REQUIERE G17] |
| Registros de servidor y de inicio de sesión | [VERIFICAR: plazo de registros de Supabase] |
| Copias de seguridad | Hasta que venza la copia, hasta [VERIFICAR: plan, 7 a 30 días]. Solo se usan para restaurar el servicio |
| Datos en OpenAI | Hasta 30 días, según OpenAI |
| Datos en tu dispositivo | Hasta que borres la cuenta en la app o elimines la app. Cerrar sesión no los borra [ver G25] |

## 8. Cómo borrar tu cuenta

En la app: **Perfil → Borrar cuenta**. [REQUIERE G1] Esto elimina de forma permanente tu cuenta y todos los datos asociados de nuestra
base de datos de inmediato. Las copias de seguridad vencen como se indica arriba. Los datos permanecen en otro dispositivo hasta que abras
la app allí o la elimines. Borrar la app por sí solo no borra tu cuenta. Si no puedes iniciar sesión, escribe a js.pabonc979@gmail.com.

## 9. Tus derechos

Según donde vivas, puedes pedir ver tus datos, obtener una copia, corregirlos, suprimirlos, limitar u oponerte a su uso, saber quién los recibió y retirar tu
consentimiento o autorización cuando quieras sin afectar el uso anterior. La app permite corregir la mayoría de los datos y también borrar.
Para lo demás, escribe a js.pabonc979@gmail.com. Respondemos en [PO aprueba: 10 días hábiles], o antes si tu ley local fija un plazo menor. Si rechazamos tu solicitud,
te diremos por qué y podrás pedir que la revisemos. No te trataremos peor por ejercer tus derechos.

También puedes presentar una queja ante tu autoridad de protección de datos o de consumo. Por ejemplo: Superintendencia de Industria y Comercio (Colombia), Secretaría
Anticorrupción y Buen Gobierno (México), Agencia de Acceso a la Información Pública (Argentina), Autoridade Nacional de Proteção de Dados (Brasil), Office of the Australian
Information Commissioner (Australia), Personal Data Protection Commission (Singapur), Personal Information Protection Commission (Japón, Corea del Sur), Data Protection Board
(India), el fiscal general de tu estado o la Federal Trade Commission (Estados Unidos).

## 10. Menores

GymStudio es solo para personas de 18 años o más. No recopilamos a sabiendas datos de personas menores de esa edad. Si crees que alguien menor tiene una cuenta, escríbenos
y la borraremos junto con sus datos.

## 11. Seguridad

Las conexiones están cifradas. Los datos de cada persona están separados en la base de datos mediante reglas de acceso. Las claves de IA y de
administrador se guardan en el servidor. Ningún sistema es totalmente seguro. Si una brecha te afecta, te avisaremos a ti y a las autoridades
cuando la ley lo exija.

## 12. Estados Unidos

Si vives en Estados Unidos, lee también nuestra [Política de privacidad de datos de salud del consumidor](https://sebpabonc.github.io/gymstudio/legal/consumer-health-data.es.html) [REQUIERE G5],
que cubre Washington, Nevada y leyes estatales similares. No vendemos tus datos personales ni los compartimos para publicidad dirigida.

## 13. Cambios

Si cambiamos esta política, actualizaremos la fecha y, si el cambio es importante, te avisaremos en la app antes de que aplique. Si queremos
usar tus datos para una finalidad nueva, te lo pediremos primero.

## 14. Idioma

Esta política existe en inglés y en español. Si usas la app en español o vives en un país de habla hispana, aplica la versión en español. En los demás casos, aplica la
versión en inglés. <!-- PO aprueba. Brasil: se necesita una versión en portugués antes de lanzar allí (pregunta 3). -->

## 15. Contacto

Sebastian Pabon, js.pabonc979@gmail.com. Soporte: https://sebpabonc.github.io/gymstudio/legal/support.es.html [REQUIERE G5]
