import type { DevRoleSimulated } from "@/contexts/DevRoleContext";

export interface PasoQA {
  id: string;
  titulo: string;
  /** Qué debería pasar / verse */
  esperado: string;
  /** Ruta a la que lleva el botón "Ir" */
  ruta: string;
}

export interface RecorridoQA {
  id: string;
  rol: DevRoleSimulated;
  titulo: string;
  descripcion: string;
  pasos: PasoQA[];
}

export const RECORRIDOS: RecorridoQA[] = [
  {
    id: "visitante",
    rol: "visitante",
    titulo: "Visitante (sin sesión)",
    descripcion: "Lo que ve alguien que llega por primera vez, sin cuenta.",
    pasos: [
      {
        id: "vis-landing",
        titulo: "Página de inicio",
        esperado:
          "Menú superior completo y legible en móvil y escritorio, textos sin datos en cero, botones de registro visibles.",
        ruta: "/",
      },
      {
        id: "vis-catalogo",
        titulo: "Catálogo público de lotes",
        esperado:
          "Se listan los lotes disponibles, el mapa carga y los filtros responden sin dejar el listado vacío por defecto.",
        ruta: "/lotes",
      },
      {
        id: "vis-ficha",
        titulo: "Ficha de un lote",
        esperado:
          "Se muestran fotos y datos básicos; la información financiera y de mercado aparece bloqueada con invitación a registrarse.",
        ruta: "/lotes",
      },
      {
        id: "vis-diagnostico",
        titulo: "Diagnóstico gratuito",
        esperado:
          "El formulario se puede enviar, valida los campos obligatorios y muestra confirmación o error claro.",
        ruta: "/diagnostico",
      },
      {
        id: "vis-mercado",
        titulo: "Índice de mercado",
        esperado: "Tablas y filtros cargan, precios en pesos sin decimales.",
        ruta: "/mercado",
      },
      {
        id: "vis-planes",
        titulo: "Planes y Resultoría",
        esperado:
          "Precios correctos, comparación clara entre planes y botones de contacto/pago funcionando.",
        ruta: "/planes",
      },
      {
        id: "vis-registro",
        titulo: "Registro y elección de perfil",
        esperado:
          "Las tres tarjetas de perfil se seleccionan bien y Continuar lleva al inicio de sesión con el perfil elegido.",
        ruta: "/bienvenida",
      },
    ],
  },
  {
    id: "propietario",
    rol: "propietario",
    titulo: "Propietario",
    descripcion: "Dueño de tierra que quiere vender o viabilizar su lote.",
    pasos: [
      {
        id: "pro-portal",
        titulo: "Mi panel",
        esperado:
          "Resumen de lotes, engagements y próximos pasos; sin tarjetas vacías ni cifras en cero sin explicación.",
        ruta: "/portal",
      },
      {
        id: "pro-publicar",
        titulo: "Publicar un lote (asistente de 4 pasos)",
        esperado:
          "Se puede avanzar y retroceder, los datos se conservan al salir y volver, y el área total es obligatoria.",
        ruta: "/dashboard/lotes/nuevo",
      },
      {
        id: "pro-diagnostico",
        titulo: "Solicitar diagnóstico",
        esperado: "El diagnóstico queda registrado y aparece en el panel.",
        ruta: "/diagnostico",
      },
      {
        id: "pro-portafolio",
        titulo: "Portafolio consolidado",
        esperado:
          "Indicadores de salud por lote, totales correctos y descarga del PDF ejecutivo sin errores.",
        ruta: "/portal/portafolio",
      },
      {
        id: "pro-engagements",
        titulo: "Mis engagements y documentos",
        esperado:
          "Se ve el avance por etapas, los documentos requeridos y se pueden subir archivos.",
        ruta: "/portal/engagements",
      },
      {
        id: "pro-negociaciones",
        titulo: "Negociaciones",
        esperado:
          "Chat, ofertas formales y adjuntos funcionan; las notificaciones se marcan como leídas.",
        ruta: "/dashboard/owner/negociaciones",
      },
      {
        id: "pro-pago",
        titulo: "Pago de plan / servicio",
        esperado:
          "El checkout abre, redirige a la pasarela y al volver muestra el estado correcto.",
        ruta: "/planes",
      },
    ],
  },
  {
    id: "comisionista",
    rol: "comisionista",
    titulo: "Comisionista",
    descripcion: "Representante autorizado de un propietario.",
    pasos: [
      {
        id: "com-portal",
        titulo: "Portal del comisionista",
        esperado: "Se listan los lotes representados y el estado de verificación.",
        ruta: "/comisionista",
      },
      {
        id: "com-docs",
        titulo: "Documentos de autorización",
        esperado:
          "Se pueden subir y ver los documentos; el estado cambia a verificado o pendiente.",
        ruta: "/comisionista",
      },
      {
        id: "com-cargar",
        titulo: "Cargar lote representado",
        esperado:
          "El formulario exige la autorización del propietario y guarda el lote como pendiente de validación.",
        ruta: "/comisionista",
      },
      {
        id: "com-seguimiento",
        titulo: "Seguimiento y comisiones",
        esperado: "Se ve el avance de cada lote y las comisiones asociadas.",
        ruta: "/comisionista",
      },
    ],
  },
  {
    id: "desarrollador",
    rol: "desarrollador",
    titulo: "Desarrollador",
    descripcion: "Busca tierra para comprar o desarrollar.",
    pasos: [
      {
        id: "des-home",
        titulo: "Panel y alertas",
        esperado: "Alertas configurables y lotes recomendados coherentes con los criterios.",
        ruta: "/dashboard/developer",
      },
      {
        id: "des-catalogo",
        titulo: "Catálogo con filtros",
        esperado: "Filtros combinados devuelven resultados correctos y el mapa se sincroniza.",
        ruta: "/lotes",
      },
      {
        id: "des-ficha",
        titulo: "Ficha completa de un lote",
        esperado:
          "Con acceso: normativa, análisis y financiero visibles. Sin acceso: bloques bloqueados con CTA claro.",
        ruta: "/lotes",
      },
      {
        id: "des-suscripcion",
        titulo: "Suscripción y pago por vista",
        esperado:
          "Los límites del plan se respetan y el pago por vista desbloquea el lote correcto.",
        ruta: "/suscripcion",
      },
      {
        id: "des-contacto",
        titulo: "Solicitar contacto / firmar NDA",
        esperado: "La solicitud se envía y queda registrada para el admin.",
        ruta: "/lotes",
      },
      {
        id: "des-negociacion",
        titulo: "Sala de negociación",
        esperado: "Mensajes, ofertas y documentos funcionan en tiempo real.",
        ruta: "/dashboard/negociaciones",
      },
      {
        id: "des-cuenta",
        titulo: "Mi cuenta",
        esperado: "Datos del plan, consumo y facturación correctos.",
        ruta: "/mi-cuenta",
      },
    ],
  },
  {
    id: "experto",
    rol: "experto",
    titulo: "Experto",
    descripcion: "Profesional que ejecuta los análisis técnicos.",
    pasos: [
      {
        id: "exp-ordenes",
        titulo: "Órdenes disponibles",
        esperado: "Se listan las órdenes abiertas y las invitaciones.",
        ruta: "/dashboard/ordenes-servicio",
      },
      {
        id: "exp-postular",
        titulo: "Postularme a una orden",
        esperado: "La propuesta se envía con precio y plazo dentro del contrato marco.",
        ruta: "/dashboard/ordenes-servicio",
      },
      {
        id: "exp-mis-ordenes",
        titulo: "Mis órdenes en ejecución",
        esperado: "Estados y fechas límite correctos, con alertas de SLA.",
        ruta: "/dashboard/mis-ordenes",
      },
      {
        id: "exp-analisis",
        titulo: "Diligenciar el análisis 360 por áreas",
        esperado:
          "Las 8 áreas guardan bien, muestran indicador de guardado y el avance se recalcula.",
        ruta: "/dashboard",
      },
      {
        id: "exp-entregables",
        titulo: "Subir entregables",
        esperado: "Los archivos se suben y quedan visibles para el cliente cuando se publican.",
        ruta: "/dashboard/mis-ordenes",
      },
      {
        id: "exp-liquidacion",
        titulo: "Liquidaciones",
        esperado: "Al completar la orden se genera la liquidación con el valor correcto.",
        ruta: "/dashboard/liquidaciones",
      },
    ],
  },
  {
    id: "admin",
    rol: "admin",
    titulo: "Admin",
    descripcion: "Operación diaria de la plataforma.",
    pasos: [
      {
        id: "adm-dashboard",
        titulo: "Panel principal",
        esperado: "KPIs coherentes y accesos rápidos funcionando.",
        ruta: "/dashboard",
      },
      {
        id: "adm-validacion",
        titulo: "Lotes pendientes de validación",
        esperado: "Aprobar o rechazar cambia el estado y notifica al propietario.",
        ruta: "/dashboard/lotes/pendientes-validacion",
      },
      {
        id: "adm-huerfanos",
        titulo: "Lotes sin propietario",
        esperado: "La asignación masiva a un usuario real funciona y actualiza el listado.",
        ruta: "/dashboard/lotes/sin-propietario",
      },
      {
        id: "adm-usuarios",
        titulo: "Usuarios",
        esperado:
          "Filtros, cambio de rol y nivel, acceso de cortesía y estado activo/inactivo funcionan.",
        ruta: "/dashboard/usuarios",
      },
      {
        id: "adm-solicitudes",
        titulo: "Solicitudes de contacto",
        esperado: "Se pueden marcar como contactadas o cerradas.",
        ruta: "/dashboard/solicitudes-contacto",
      },
      {
        id: "adm-pagos",
        titulo: "Pagos y transacciones",
        esperado:
          "Estados correctos y el reintento de activación funciona en transacciones fallidas.",
        ruta: "/dashboard/pagos",
      },
      {
        id: "adm-feedback",
        titulo: "Tablero de feedback",
        esperado: "Los hallazgos reportados aparecen y se pueden mover de estado.",
        ruta: "/dashboard/feedback",
      },
      {
        id: "adm-metricas",
        titulo: "Métricas y análisis de clientes",
        esperado: "Gráficas cargan con datos reales y sin errores en consola.",
        ruta: "/dashboard/analisis-clientes",
      },
    ],
  },
  {
    id: "super_admin",
    rol: "super_admin",
    titulo: "Super Admin",
    descripcion: "Configuración y control total.",
    pasos: [
      {
        id: "sup-config",
        titulo: "Configuración general",
        esperado: "Los cambios se guardan y se reflejan en el portal.",
        ruta: "/dashboard/config",
      },
      {
        id: "sup-contratos",
        titulo: "Contratos marco",
        esperado: "Crear nueva versión y activar/desactivar funciona con historial.",
        ruta: "/dashboard/contratos-marco",
      },
      {
        id: "sup-precios",
        titulo: "Precios y planes",
        esperado: "Precios en SMLMV y pesos se actualizan en /planes y /suscripcion.",
        ruta: "/dashboard/config-suscripciones",
      },
      {
        id: "sup-usuarios",
        titulo: "Desactivar y eliminar usuarios",
        esperado:
          "Solo el super admin ve el menú; la eliminación pide el correo exacto y conserva los lotes.",
        ruta: "/dashboard/usuarios",
      },
      {
        id: "sup-finanzas",
        titulo: "Finanzas consolidadas",
        esperado: "Totales, liquidaciones y comisiones cuadran.",
        ruta: "/dashboard/finanzas",
      },
    ],
  },
];

export type EstadoPaso = "pendiente" | "ok" | "hallazgo";

export const TOTAL_PASOS = RECORRIDOS.reduce((n, r) => n + r.pasos.length, 0);
