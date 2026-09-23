# Ubicación en un solo bloque: datos que buscan en el mapa

## Qué cambia para el usuario
En el paso 2 ("Ubicación") hoy hay dos tarjetas separadas: "Jurisdicción" y "Georreferenciación". Se unen en una sola tarjeta, **"Ubicación del predio"**, que funciona así:

1. El usuario elige **Departamento** y **Municipio**. El mapa se centra solo en ese municipio.
2. Si escribe **Barrio o vereda** y/o **Dirección aproximada**, el mapa busca esa combinación (por ejemplo "CL 50 30 20, Laureles, Medellín, Antioquia") y se acerca a la zona, con un pin provisional.
3. El usuario solo tiene que **arrastrar el pin (o hacer clic en el mapa)** hasta el punto exacto del lote.
4. Aparece un indicador de estado:
   - "Ubicación aproximada — ajusta el pin al punto exacto" (pin puesto por la búsqueda)
   - "Ubicación confirmada" en verde (pin movido o clic hecho por el usuario)
5. El buscador de sitios de referencia se mantiene como opción secundaria ("¿No encuentras la dirección? Busca un sitio cercano").
6. Los campos de latitud y longitud pasan a una línea pequeña de solo lectura debajo del mapa, con un enlace "Editar coordenadas" para quien quiera escribirlas a mano.

## Diseño
```text
+--------------------------------------------------+
| Ubicación del predio                             |
| [Departamento v]        [Municipio v]            |
| [Barrio o vereda]       [Dirección aproximada]   |
| La dirección exacta no se muestra públicamente   |
|                                                  |
| (Buscar sitio de referencia cercano...) [Buscar] |
| +----------------------------------------------+ |
| |                 MAPA  + pin                  | |
| +----------------------------------------------+ |
| * Ubicación aproximada — arrastra el pin         |
| 6.253000, -75.573600 · Editar coordenadas        |
+--------------------------------------------------+
```

## Reglas
- La búsqueda automática espera a que el usuario deje de escribir (cerca de 1 segundo) para no hacer búsquedas en cada tecla.
- Si el usuario ya ajustó el pin a mano, cambiar después el barrio o la dirección **no mueve** el pin. Solo cambiar de municipio lo reubica, avisando antes.
- Si al recuperar un borrador ya hay coordenadas guardadas, se usan tal cual y se marca como confirmada.
- Si la búsqueda no encuentra nada, el mapa queda en el municipio y se muestra: "No encontramos la dirección exacta; ubica el pin manualmente".

## Detalles técnicos
- `LoteWizard.tsx`: unir las dos `WizardSection` del paso 2 en una. Agregar un estado `pinConfirmado` que se activa con el clic o el arrastre del pin, y se guarda con el borrador. Agregar un efecto con espera (debounce) sobre `departamento/ciudad/barrio/direccion` que calcula el texto a buscar y lo pasa al mapa.
- `MemoizedLoteMap.tsx`: nueva propiedad `geocodeQuery` más un callback `onGeocoded(lat, lng, precision)`. Usa `google.maps.Geocoder` restringido a Colombia y ajusta el zoom según la precisión (municipio unos 13, barrio unos 15, dirección unos 17). Se mantiene el Autocomplete de sitios de referencia.
- La validación del paso 2 no cambia (departamento y municipio siguen siendo obligatorios). El pin sigue siendo opcional, pero si no está confirmado se muestra un aviso.
- No hay cambios en la base de datos: se siguen guardando `lat`/`lng` como hoy.
