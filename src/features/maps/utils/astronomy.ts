// Dados astronômicos aproximados para as constelações suportadas no mapa
// RA (Right Ascension) em horas (0-24)
// Dec (Declination) em graus (-90 a +90)

interface ConstellationAstro {
  id: string;
  name: string; // Nome de exibição
  ra: number;
  dec: number;
}

const CONSTELLATIONS_ASTRO: ConstellationAstro[] = [
  { id: 'ORION', name: 'Órion', ra: 5.5, dec: 5 },
  { id: 'TAURUS', name: 'Touro', ra: 4.5, dec: 15 },
  { id: 'GEMINI', name: 'Gêmeos', ra: 7.0, dec: 22 },
  { id: 'CAO MAIOR', name: 'Cão Maior', ra: 6.8, dec: -22 },
  { id: 'CAO MENOR', name: 'Cão Menor', ra: 7.6, dec: 5 },
  { id: 'LEO', name: 'Leão', ra: 10.5, dec: 15 },
  { id: 'ESCORPIAO', name: 'Escorpião', ra: 16.8, dec: -30 },
  { id: 'VIRGO', name: 'Virgem', ra: 13.0, dec: -5 },
  { id: 'CANCER', name: 'Câncer', ra: 8.5, dec: 20 },
  { id: 'AQUARIUS', name: 'Aquário', ra: 22.5, dec: -10 },
  { id: 'PISCES', name: 'Peixes', ra: 1.0, dec: 15 },
  { id: 'ARIES', name: 'Áries', ra: 2.5, dec: 20 },
  { id: 'SAGITTARIUS', name: 'Sagitário', ra: 19.0, dec: -25 },
  { id: 'CAPRICORNUS', name: 'Capricórnio', ra: 21.0, dec: -20 },
  { id: 'CASSIOPEIA', name: 'Cassiopeia', ra: 1.0, dec: 60 },
  { id: 'URSA MAIOR', name: 'Ursa Maior', ra: 11.0, dec: 50 },
  { id: 'URSA MENOR', name: 'Ursa Menor', ra: 15.0, dec: 75 },
  { id: 'CRUX', name: 'Cruzeiro do Sul', ra: 12.5, dec: -60 },
  { id: 'HERCULES', name: 'Hércules', ra: 17.0, dec: 30 },
  { id: 'LYRA', name: 'Lira', ra: 18.5, dec: 35 },
  { id: 'CYGNUS', name: 'Cisne', ra: 20.5, dec: 40 },
  { id: 'LEPUS', name: 'Lebre', ra: 5.5, dec: -20 },
  { id: 'ANDROMEDA', name: 'Andrômeda', ra: 1.0, dec: 40 },
  { id: 'PERSEUS', name: 'Perseu', ra: 3.5, dec: 45 },
  { id: 'AGUIA', name: 'Águia', ra: 19.5, dec: 5 }
];

/**
 * Calcula a Data Juliana para uma dada data e hora UTC.
 */
function getJulianDate(date: Date): number {
  const time = date.getTime();
  // 2440587.5 is the Julian Date for 1970-01-01T00:00:00Z
  return (time / 86400000) + 2440587.5;
}

/**
 * Calcula o Tempo Sideral Local (LST) em horas.
 * O LST indica qual Ascensão Reta (RA) está cruzando o meridiano local (zenite).
 */
function getLocalSiderealTime(date: Date, longitude: number): number {
  const jd = getJulianDate(date);
  const d = jd - 2451545.0; // Dias desde J2000.0
  
  // Tempo Sideral de Greenwich (GMST) em graus
  let gmst = 280.46061837 + 360.98564736629 * d;
  
  // Tempo Sideral Local (LST) em graus
  let lst = gmst + longitude;
  
  // Normaliza para 0-360
  lst = lst % 360;
  if (lst < 0) lst += 360;
  
  // Converte para horas (0-24)
  return lst / 15;
}

/**
 * Calcula a distância angular entre duas Ascensões Retas (RA) em horas (0-24).
 * Retorna o valor absoluto da diferença mais curta no ciclo de 24 horas.
 */
function raDifference(ra1: number, ra2: number): number {
  let diff = Math.abs(ra1 - ra2);
  if (diff > 12) {
    diff = 24 - diff;
  }
  return diff;
}

/**
 * Determina as constelações mais relevantes/visíveis para um determinado momento e local.
 * Retorna os nomes (ids) das constelações que serão exibidas no mapa.
 */
export function calculateVisibleConstellations(
  dateStr: string,
  timeStr: string,
  lat: number,
  lng: number,
  maxCount: number = 5
): string[] {
  if (!dateStr || isNaN(lat) || isNaN(lng)) return [];

  // Parse date and time
  const [year, month, day] = dateStr.split('-').map(Number);
  let hour = 21; // Default to 9 PM local time if not provided
  let minute = 0;

  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h)) hour = h;
    if (!isNaN(m)) minute = m;
  }

  // To calculate LST from Local Time without a timezone DB:
  // 1. Calculate approximate UTC time by subtracting the longitude offset from Local Time.
  //    (Earth rotates 15 degrees per hour. Longitude is positive East, negative West).
  const offsetHours = lng / 15;
  
  // We construct the local time as if it were UTC, then subtract the offset to get true UTC
  let utcHour = hour - offsetHours;
  let utcDate = new Date(Date.UTC(year, month - 1, day, 0, minute));
  // Add the floating hours
  utcDate.setUTCMilliseconds(Math.round(utcHour * 3600000));

  const lst = getLocalSiderealTime(utcDate, lng);

  // Filtrar e classificar as constelações
  const visible = CONSTELLATIONS_ASTRO.map(c => {
    // A constelação está acima do horizonte?
    // Max altitude = 90 - |lat - dec|. Se max altitude > 10 graus, consideramos visível.
    const maxAltitude = 90 - Math.abs(lat - c.dec);
    
    // Distância do meridiano central (quão alta no céu ela está Leste-Oeste)
    const distFromMeridian = raDifference(c.ra, lst);
    
    // Penalidade por estar perto do horizonte
    const horizonPenalty = maxAltitude < 20 ? (20 - maxAltitude) * 2 : 0;
    
    // Pontuação: menor é melhor. Baseado na distância do centro do céu + penalidade do horizonte
    const score = distFromMeridian + horizonPenalty;

    return { ...c, maxAltitude, distFromMeridian, score };
  })
  .sort((a, b) => a.score - b.score); // Classificar pelas mais bem posicionadas (menor score)

  // Retornar os top `maxCount` nomes
  return visible.slice(0, maxCount).map(c => c.name);
}
