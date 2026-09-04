import { ReactNode } from "react";

/**
 * Contenedor único para botones flotantes de la esquina inferior derecha.
 * Cualquier botón flotante nuevo debe ir aquí dentro (sin clases `fixed` propias)
 * para evitar superposiciones.
 */
const FloatingActionStack = ({ children }: { children: ReactNode }) => (
  <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 [&>*]:pointer-events-auto">
    {children}
  </div>
);

export default FloatingActionStack;
