# Botones flotantes que no se pisen nunca más

## Problema
Hoy hay dos botones flotantes que se posicionan por su cuenta en la esquina inferior derecha:
el botón naranja "Inicio" y el botón oscuro "Feedback". Cada uno fija su propia posición, así
que en las pantallas donde ambos aparecen quedan encima uno del otro.

## Solución
Crear una única "columna" de botones flotantes en la esquina inferior derecha. Los botones
dejan de posicionarse solos: se colocan dentro de esa columna, apilados en vertical con
separación fija. Si mañana se agrega un tercer botón flotante, entra en la misma columna y
tampoco se superpone.

Orden propuesto (de abajo hacia arriba): Inicio, luego Feedback.

## Detalle visual
- La columna se ancla a 24px del borde inferior y derecho, con 12px entre botones.
- En móvil los botones se mantienen compactos (solo ícono si no cabe el texto), como ahora.
- Se respeta la lógica actual: "Inicio" sigue oculto en portada, login, bienvenida y dashboard;
  "Feedback" sigue visible solo con sesión iniciada.

## Detalle técnico
- Nuevo `src/components/ui/FloatingActionStack.tsx`: contenedor `fixed bottom-6 right-6 z-50
  flex flex-col-reverse items-end gap-3`, con `pointer-events-none` en el contenedor y
  `pointer-events-auto` en los hijos.
- `HomeButton.tsx` y `FeedbackWidget.tsx`: se les quitan las clases `fixed bottom-* right-* z-*`
  y quedan como elementos normales dentro del stack.
- `src/App.tsx`: `<HomeButton />` y `<FeedbackWidget />` se envuelven en `<FloatingActionStack>`.
- Regla a futuro: cualquier botón flotante nuevo va dentro de `FloatingActionStack`, nunca con
  `fixed` propio.
