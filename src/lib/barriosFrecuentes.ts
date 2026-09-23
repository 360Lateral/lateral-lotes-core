// Catálogo base de sectores, barrios y veredas frecuentes por municipio.
// Se complementa con los barrios ya registrados en lotes de la plataforma.
const SECTORES: Record<string, string[]> = {
  "medellin": ["El Poblado", "Laureles", "Estadio", "Belén", "Envigado Límite", "Robledo", "La América", "Buenos Aires", "Castilla", "Manrique", "Aranjuez", "Guayabal", "San Javier", "La Candelaria", "Villa Hermosa", "Santa Elena", "San Antonio de Prado", "San Cristóbal", "Altavista", "Palmitas"],
  "envigado": ["Zúñiga", "El Esmeraldal", "La Frontera", "Loma del Chocho", "El Portal", "Las Palmas", "Alto de las Palmas", "La Magnolia", "San Marcos", "Jardines", "Perico", "Pantanillo", "El Vallano"],
  "sabaneta": ["Aves María", "La Doctora", "Cañaveralejo", "Las Lomitas", "Pan de Azúcar", "San José", "María Auxiliadora", "Calle Larga"],
  "itagui": ["Santa María", "Ditaires", "San Pío X", "La Estrella Límite", "Los Gómez", "El Pedregal", "El Progreso"],
  "bello": ["Niquía", "Cabañas", "Paris", "Zamora", "Hato Viejo", "Fontidueño", "San Félix", "Potrerito"],
  "la estrella": ["Pueblo Viejo", "La Tablaza", "Sagrada Familia", "San Isidro", "Tierra Amarilla", "La Bermejala"],
  "caldas": ["La Valeria", "La Salada", "El Cano", "La Clara", "La Miel", "Primavera"],
  "copacabana": ["Machado", "El Cabuyal", "Ancón", "Fontidueño", "Quebrada Arriba"],
  "girardota": ["San Andrés", "El Totumo", "Juan Cojo", "La Palma", "Encenillos"],
  "rionegro": ["Llanogrande", "San Antonio", "Cabeceras", "Abreo", "Tablazo", "Pontezuela", "Santa Bárbara", "Galicia", "Guayabito", "Chipre", "Higuerón", "Playa Rica", "Río Abajo", "Tres Puertas", "Los Pinos", "Vilachuaga", "Fontibón", "El Capiro"],
  "el retiro": ["Don Diego", "Pantanillo", "Carrizales", "Lejos del Nido", "Los Salados", "Normandía", "Nazareth", "El Chuscal", "Santa Elena", "La Fe"],
  "la ceja": ["San Nicolás", "El Tambo", "San José", "Fátima", "La Playa", "San Rafael", "El Uchuval", "Guamito"],
  "guarne": ["San Ignacio", "Canoas", "Chaparral", "La Mosquita", "Hojas Anchas", "Batea Seca", "El Colorado", "La Clara"],
  "marinilla": ["Chagualo", "Belén", "La Esperanza", "San José", "Cascajo", "Montañita", "Salto Arriba"],
  "el carmen de viboral": ["La Chapa", "Aldana", "El Porvenir", "Cristo Rey", "Campo Alegre", "La Madera"],
  "el santuario": ["El Carmelo", "La Aurora", "Portachuelo", "Bodegas", "Las Palmas"],
  "san vicente": ["Corrientes", "La Magdalena", "Chaparral", "Guamito"],
  "la union": ["San Miguel", "Chalarca", "La Concha", "El Guarango"],
  "bogota": ["Chapinero", "Usaquén", "Suba", "Teusaquillo", "Engativá", "Fontibón", "Kennedy", "Chicó", "Cedritos", "Salitre", "Rosales", "La Candelaria", "Barrios Unidos", "Puente Aranda"],
  "chia": ["Fonquetá", "Bojacá", "Yerbabuena", "La Balsa", "Cerca de Piedra", "Fagua", "Tíquiza", "Samaria"],
  "cajica": ["Chuntame", "Calahorra", "Canelón", "Río Grande", "Capellanía"],
  "cota": ["Parcelas", "Rozo", "El Abra", "Cetime", "Pueblo Viejo", "La Moya"],
  "la calera": ["El Salitre", "La Aurora", "San José del Triunfo", "Buenos Aires", "Mundo Nuevo"],
  "sopo": ["Hatogrande", "La Carolina", "Mercenarios", "Bellavista", "Chuscal"],
  "tocancipa": ["Canavita", "La Esmeralda", "Verganzo", "El Porvenir", "Tausavita"],
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\(.*\)/, "").trim();

export function getSectoresFrecuentes(ciudad: string): string[] {
  if (!ciudad) return [];
  const n = normalizar(ciudad);
  return SECTORES[n] ?? (n.includes("bogota") ? SECTORES["bogota"] : []);
}
