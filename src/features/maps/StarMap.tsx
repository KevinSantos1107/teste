import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Card } from '../../shared/ui/Card';
import { Spinner } from '../../shared/ui/Spinner';
import { Calendar, Clock, MapPin, Compass, Star as StarIcon } from 'lucide-react';

interface StarMapConfig {
  specialDate: string;
  time?: string;
  customLocation: { lat: number; lng: number; name: string };
  romanticQuote: string;
  constellations: string[];
}

// ─────────────────────────────────────────────
//  CONSTELLATION DATABASE
//  Relative coords (x: -1..1, y: -1..1)
//  mag: 1=small dim, 2=medium, 3=bright main star
//  lines: pairs of star indices to connect
// ─────────────────────────────────────────────
interface ConstellationShape {
  stars: { x: number; y: number; mag: number }[];
  lines: [number, number][];
}

const CONSTELLATION_DB: Record<string, ConstellationShape> = {
  // ── ÓRION / ORION ──────────────────────────
  ORION: {
    stars: [
      { x: -0.40, y: -0.65, mag: 3 }, // 0 Betelgeuse
      { x:  0.40, y: -0.58, mag: 2 }, // 1 Bellatrix
      { x: -0.12, y: -0.05, mag: 2 }, // 2 Alnitak
      { x:  0.00, y: -0.00, mag: 2 }, // 3 Alnilam
      { x:  0.12, y:  0.05, mag: 2 }, // 4 Mintaka
      { x: -0.28, y:  0.70, mag: 2 }, // 5 Saiph
      { x:  0.38, y:  0.72, mag: 3 }, // 6 Rigel
      { x: -0.55, y: -0.25, mag: 1 }, // 7 Pi3 Ori (left arm)
      { x:  0.55, y: -0.22, mag: 1 }, // 8 Pi1 Ori (right arm)
    ],
    lines: [[0,1],[0,2],[1,4],[0,7],[1,8],[2,3],[3,4],[2,5],[4,6],[5,6]],
  },
  // ── TOURO / TAURUS ──────────────────────────
  TAURUS: {
    stars: [
      { x:  0.00, y:  0.00, mag: 3 }, // 0 Aldebaran (eye)
      { x: -0.30, y: -0.20, mag: 2 }, // 1 Ain
      { x: -0.55, y: -0.35, mag: 1 }, // 2 Hyadum I
      { x: -0.15, y:  0.20, mag: 2 }, // 3 Theta2 Tau
      { x:  0.25, y:  0.35, mag: 1 }, // 4 Tianguan
      { x: -0.60, y:  0.50, mag: 2 }, // 5 Elnath (tip of horn)
      { x:  0.60, y:  0.50, mag: 2 }, // 6 Zeta Tau (tip of horn 2)
      { x: -0.80, y: -0.60, mag: 2 }, // 7 Pleiades center (asterism)
    ],
    lines: [[0,1],[1,2],[0,3],[3,4],[1,5],[0,6],[2,7]],
  },
  // ── GÊMEOS / GEMINI ─────────────────────────
  GEMINI: {
    stars: [
      { x: -0.35, y: -0.80, mag: 3 }, // 0 Castor (head 1)
      { x:  0.35, y: -0.80, mag: 3 }, // 1 Pollux (head 2)
      { x: -0.30, y: -0.30, mag: 2 }, // 2 Alhena
      { x:  0.30, y: -0.30, mag: 2 }, // 3 Wasat
      { x: -0.20, y:  0.10, mag: 1 }, // 4
      { x:  0.20, y:  0.10, mag: 1 }, // 5
      { x: -0.25, y:  0.55, mag: 2 }, // 6 Mebsuda
      { x:  0.25, y:  0.55, mag: 2 }, // 7 Propus
      { x: -0.15, y:  0.80, mag: 1 }, // 8 Foot Castor
      { x:  0.30, y:  0.80, mag: 2 }, // 9 Foot Pollux
    ],
    lines: [[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,8],[7,9],[2,3]],
  },
  // ── CÃO MAIOR / CANIS MAJOR ─────────────────
  'CAO MAIOR': {
    stars: [
      { x:  0.00, y: -0.40, mag: 3 }, // 0 Sirius (brightest)
      { x: -0.25, y: -0.65, mag: 2 }, // 1 Adhara
      { x:  0.30, y: -0.60, mag: 2 }, // 2 Mirzam
      { x:  0.00, y:  0.10, mag: 1 }, // 3 Wezen area
      { x: -0.20, y:  0.40, mag: 2 }, // 4 Wezen
      { x:  0.25, y:  0.50, mag: 2 }, // 5 Aludra
      { x: -0.35, y:  0.70, mag: 1 }, // 6 Omicron1
      { x:  0.40, y: -0.10, mag: 1 }, // 7 Furud
    ],
    lines: [[0,1],[0,2],[0,3],[3,4],[3,5],[4,6],[5,7],[1,4],[2,7]],
  },
  // ── CÃO MENOR / CANIS MINOR ─────────────────
  'CAO MENOR': {
    stars: [
      { x:  0.00, y: -0.30, mag: 3 }, // 0 Procyon
      { x:  0.25, y:  0.40, mag: 2 }, // 1 Gomeisa
    ],
    lines: [[0,1]],
  },
  // ── LEÃO / LEO ──────────────────────────────
  LEO: {
    stars: [
      { x: -0.45, y: -0.50, mag: 3 }, // 0 Regulus
      { x: -0.20, y: -0.65, mag: 2 }, // 1 Eta Leo
      { x:  0.10, y: -0.75, mag: 2 }, // 2 Algieba
      { x:  0.40, y: -0.55, mag: 1 }, // 3 Zosma
      { x:  0.60, y: -0.20, mag: 2 }, // 4 Denebola
      { x:  0.50, y:  0.15, mag: 1 }, // 5 Chort
      { x:  0.00, y:  0.10, mag: 1 }, // 6 Theta Leo
      { x: -0.40, y:  0.00, mag: 2 }, // 7 Adhafera
      { x: -0.55, y: -0.25, mag: 1 }, // 8 Epsilon Leo
    ],
    lines: [[0,8],[8,7],[7,2],[2,1],[1,0],[2,3],[3,4],[4,5],[5,6],[6,7]],
  },
  // ── ESCORPIÃO / SCORPIUS ─────────────────────
  ESCORPIAO: {
    stars: [
      { x:  0.00, y: -0.70, mag: 3 }, // 0 Antares (heart)
      { x: -0.25, y: -0.50, mag: 2 }, // 1 Acrab
      { x:  0.25, y: -0.50, mag: 2 }, // 2 Dschubba
      { x: -0.40, y: -0.20, mag: 1 }, // 3
      { x:  0.40, y: -0.20, mag: 1 }, // 4
      { x: -0.20, y:  0.10, mag: 2 }, // 5 Tau Sco
      { x:  0.00, y:  0.30, mag: 1 }, // 6
      { x:  0.10, y:  0.55, mag: 2 }, // 7
      { x: -0.10, y:  0.75, mag: 2 }, // 8 Shaula area
      { x: -0.35, y:  0.85, mag: 3 }, // 9 Shaula (tail)
      { x:  0.35, y:  0.85, mag: 2 }, // 10 Lesath
    ],
    lines: [[1,0],[0,2],[1,3],[2,4],[0,5],[5,6],[6,7],[7,8],[8,9],[8,10]],
  },
  // ── VIRGEM / VIRGO ───────────────────────────
  VIRGO: {
    stars: [
      { x:  0.00, y: -0.10, mag: 3 }, // 0 Spica
      { x: -0.40, y: -0.50, mag: 2 }, // 1 Vindemiatrix
      { x: -0.60, y: -0.20, mag: 1 }, // 2
      { x: -0.30, y:  0.30, mag: 2 }, // 3 Porrima
      { x:  0.30, y:  0.20, mag: 1 }, // 4
      { x:  0.55, y: -0.30, mag: 2 }, // 5 Zavijava
      { x:  0.60, y:  0.55, mag: 1 }, // 6 Heze
      { x: -0.10, y:  0.65, mag: 1 }, // 7
    ],
    lines: [[0,3],[0,4],[3,1],[1,2],[3,7],[4,5],[4,6],[0,7]],
  },
  // ── CÂNCER / CANCER ──────────────────────────
  CANCER: {
    stars: [
      { x:  0.00, y:  0.00, mag: 2 }, // 0 Acubens
      { x: -0.40, y: -0.35, mag: 2 }, // 1 Asellus Australis
      { x:  0.40, y: -0.35, mag: 2 }, // 2 Asellus Borealis
      { x: -0.55, y:  0.50, mag: 1 }, // 3 Beta Cnc
      { x:  0.55, y:  0.50, mag: 1 }, // 4 Iota Cnc
    ],
    lines: [[3,1],[1,0],[0,2],[2,4],[1,2]],
  },
  // ── AQUÁRIO / AQUARIUS ───────────────────────
  AQUARIUS: {
    stars: [
      { x:  0.00, y: -0.60, mag: 2 }, // 0 Sadalsuud
      { x:  0.30, y: -0.30, mag: 2 }, // 1 Sadalmelik
      { x: -0.30, y: -0.10, mag: 1 }, // 2 Albali
      { x:  0.00, y:  0.10, mag: 1 }, // 3
      { x:  0.20, y:  0.40, mag: 1 }, // 4
      { x: -0.20, y:  0.55, mag: 1 }, // 5
      { x:  0.00, y:  0.70, mag: 2 }, // 6 Sadachbia
      { x:  0.45, y:  0.80, mag: 1 }, // 7
    ],
    lines: [[0,1],[0,2],[1,3],[3,4],[3,5],[4,6],[5,6],[6,7]],
  },
  // ── PEIXES / PISCES ──────────────────────────
  PISCES: {
    stars: [
      { x: -0.50, y: -0.30, mag: 2 }, // 0 Eta Psc
      { x: -0.30, y: -0.60, mag: 1 }, // 1
      { x:  0.00, y: -0.70, mag: 1 }, // 2
      { x:  0.30, y: -0.50, mag: 1 }, // 3
      { x:  0.55, y: -0.20, mag: 2 }, // 4 Alrescha
      { x:  0.50, y:  0.20, mag: 1 }, // 5
      { x:  0.30, y:  0.55, mag: 1 }, // 6
      { x: -0.10, y:  0.70, mag: 1 }, // 7
      { x: -0.50, y:  0.50, mag: 1 }, // 8
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0]],
  },
  // ── ÁRIES / ARIES ────────────────────────────
  ARIES: {
    stars: [
      { x: -0.30, y:  0.10, mag: 3 }, // 0 Hamal
      { x:  0.10, y: -0.10, mag: 2 }, // 1 Sheratan
      { x:  0.50, y: -0.20, mag: 1 }, // 2 Mesarthim
      { x: -0.60, y:  0.50, mag: 1 }, // 3 Bharani
    ],
    lines: [[0,1],[1,2],[0,3]],
  },
  // ── SAGITÁRIO / SAGITTARIUS ──────────────────
  SAGITTARIUS: {
    stars: [
      { x:  0.00, y: -0.20, mag: 3 }, // 0 Kaus Australis
      { x: -0.25, y: -0.50, mag: 2 }, // 1 Kaus Medius
      { x: -0.45, y: -0.70, mag: 2 }, // 2 Kaus Borealis
      { x:  0.30, y: -0.60, mag: 2 }, // 3 Nunki
      { x:  0.55, y: -0.30, mag: 1 }, // 4 Ascella
      { x:  0.50, y:  0.20, mag: 1 }, // 5 Phi Sgr
      { x:  0.00, y:  0.40, mag: 2 }, // 6 Rukbat
      { x: -0.40, y:  0.20, mag: 1 }, // 7 Alnasl
      { x: -0.55, y:  0.50, mag: 1 }, // 8
    ],
    lines: [[0,1],[1,2],[0,3],[0,4],[4,5],[0,7],[7,8],[1,7],[2,1],[3,4]],
  },
  // ── CAPRICÓRNIO / CAPRICORNUS ────────────────
  CAPRICORNUS: {
    stars: [
      { x: -0.55, y: -0.40, mag: 2 }, // 0 Algedi
      { x: -0.30, y: -0.55, mag: 2 }, // 1 Dabih
      { x:  0.20, y: -0.60, mag: 1 }, // 2
      { x:  0.55, y: -0.40, mag: 1 }, // 3
      { x:  0.55, y:  0.20, mag: 2 }, // 4 Deneb Algedi
      { x:  0.20, y:  0.55, mag: 1 }, // 5
      { x: -0.20, y:  0.60, mag: 1 }, // 6
      { x: -0.55, y:  0.30, mag: 1 }, // 7
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[1,7]],
  },
  // ── CASSIOPEIA ───────────────────────────────
  CASSIOPEIA: {
    stars: [
      { x: -0.80, y:  0.20, mag: 2 }, // 0 Segin
      { x: -0.40, y: -0.30, mag: 2 }, // 1 Ruchbah
      { x:  0.00, y:  0.10, mag: 3 }, // 2 Gamma (middle)
      { x:  0.40, y: -0.30, mag: 2 }, // 3 Schedar
      { x:  0.80, y:  0.20, mag: 2 }, // 4 Caph
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
  },
  // ── URSA MAIOR / URSA MAJOR ──────────────────
  'URSA MAIOR': {
    stars: [
      { x: -0.65, y: -0.30, mag: 2 }, // 0 Dubhe
      { x: -0.40, y: -0.50, mag: 2 }, // 1 Merak
      { x: -0.10, y: -0.45, mag: 2 }, // 2 Phecda
      { x:  0.10, y: -0.20, mag: 2 }, // 3 Megrez
      { x:  0.40, y:  0.10, mag: 2 }, // 4 Alioth
      { x:  0.65, y:  0.30, mag: 2 }, // 5 Mizar
      { x:  0.80, y:  0.55, mag: 2 }, // 6 Alkaid
    ],
    lines: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
  },
  // ── URSA MENOR / URSA MINOR ──────────────────
  'URSA MENOR': {
    stars: [
      { x:  0.00, y: -0.80, mag: 3 }, // 0 Polaris
      { x:  0.20, y: -0.40, mag: 2 }, // 1 Kochab
      { x:  0.40, y:  0.00, mag: 1 }, // 2
      { x:  0.50, y:  0.40, mag: 2 }, // 3
      { x:  0.20, y:  0.55, mag: 1 }, // 4
      { x: -0.10, y:  0.70, mag: 2 }, // 5
      { x: -0.30, y:  0.50, mag: 2 }, // 6
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  // ── CRUX / CRUZEIRO DO SUL ───────────────────
  CRUX: {
    stars: [
      { x:  0.00, y: -0.70, mag: 3 }, // 0 Acrux (bottom)
      { x:  0.00, y:  0.70, mag: 3 }, // 1 Gacrux (top)
      { x: -0.70, y:  0.00, mag: 2 }, // 2 Delta Cru (left)
      { x:  0.70, y:  0.00, mag: 2 }, // 3 Beta Cru (right)
      { x:  0.30, y:  0.30, mag: 1 }, // 4 Epsilon Cru
    ],
    lines: [[0,1],[2,3],[4,1]],
  },
  // ── HÉRCULES / HERCULES ──────────────────────
  HERCULES: {
    stars: [
      { x:  0.00, y: -0.70, mag: 2 }, // 0 Rasalgethi
      { x: -0.15, y: -0.35, mag: 1 }, // 1
      { x:  0.15, y: -0.35, mag: 1 }, // 2
      { x: -0.40, y:  0.00, mag: 2 }, // 3 Kornephoros
      { x:  0.40, y:  0.00, mag: 2 }, // 4 Zeta Her
      { x: -0.30, y:  0.40, mag: 1 }, // 5
      { x:  0.30, y:  0.40, mag: 1 }, // 6
      { x: -0.50, y:  0.70, mag: 2 }, // 7 Sarin
      { x:  0.50, y:  0.70, mag: 2 }, // 8
    ],
    lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,8],[3,4],[5,6]],
  },
  // ── LIRA / LYRA ──────────────────────────────
  LYRA: {
    stars: [
      { x:  0.00, y: -0.70, mag: 3 }, // 0 Vega
      { x: -0.30, y: -0.10, mag: 2 }, // 1 Sulafat
      { x:  0.30, y: -0.10, mag: 2 }, // 2 Sheliak
      { x: -0.35, y:  0.40, mag: 1 }, // 3 Delta1 Lyr
      { x:  0.35, y:  0.40, mag: 1 }, // 4 Delta2 Lyr
    ],
    lines: [[0,1],[0,2],[1,3],[2,4],[1,2],[3,4]],
  },
  // ── CISNE / CYGNUS ───────────────────────────
  CYGNUS: {
    stars: [
      { x:  0.00, y: -0.80, mag: 3 }, // 0 Deneb
      { x:  0.00, y: -0.20, mag: 2 }, // 1 Sadr
      { x: -0.70, y: -0.20, mag: 2 }, // 2 Gienah
      { x:  0.70, y: -0.20, mag: 2 }, // 3 Delta Cyg
      { x:  0.00, y:  0.70, mag: 2 }, // 4 Albireo
    ],
    lines: [[0,1],[1,4],[2,3],[1,2],[1,3]],
  },
  // ── LEBRE / LEPUS ────────────────────────────
  LEPUS: {
    stars: [
      { x: -0.30, y: -0.60, mag: 2 }, // 0 Arneb
      { x:  0.25, y: -0.50, mag: 2 }, // 1 Nihal
      { x: -0.55, y: -0.10, mag: 1 }, // 2
      { x:  0.55, y:  0.00, mag: 1 }, // 3
      { x: -0.30, y:  0.50, mag: 1 }, // 4
      { x:  0.30, y:  0.60, mag: 1 }, // 5
    ],
    lines: [[0,2],[0,1],[1,3],[2,4],[4,5],[3,5],[0,4],[1,5]],
  },
  // ── ANDRÔMEDA / ANDROMEDA ────────────────────
  ANDROMEDA: {
    stars: [
      { x: -0.55, y:  0.10, mag: 2 }, // 0 Alpheratz
      { x: -0.20, y: -0.20, mag: 2 }, // 1 Mirach
      { x:  0.20, y: -0.50, mag: 2 }, // 2 Almach
      { x:  0.55, y: -0.70, mag: 1 }, // 3
      { x: -0.30, y:  0.50, mag: 1 }, // 4
    ],
    lines: [[0,1],[1,2],[2,3],[0,4]],
  },
  // ── PERSEU / PERSEUS ─────────────────────────
  PERSEUS: {
    stars: [
      { x:  0.00, y: -0.60, mag: 3 }, // 0 Mirfak
      { x: -0.25, y: -0.30, mag: 2 }, // 1 Algol
      { x: -0.50, y: -0.05, mag: 1 }, // 2
      { x:  0.30, y: -0.25, mag: 2 }, // 3 Zeta Per
      { x:  0.55, y:  0.10, mag: 1 }, // 4
      { x:  0.20, y:  0.45, mag: 2 }, // 5 Epsilon Per
      { x: -0.15, y:  0.65, mag: 1 }, // 6
    ],
    lines: [[0,1],[1,2],[0,3],[3,4],[0,5],[5,6],[3,5]],
  },
  // ── AGUIA / AQUILA ───────────────────────────
  AGUIA: {
    stars: [
      { x:  0.00, y: -0.15, mag: 3 }, // 0 Altair
      { x: -0.30, y: -0.00, mag: 2 }, // 1 Tarazed
      { x:  0.30, y: -0.00, mag: 2 }, // 2 Alshain
      { x: -0.10, y:  0.45, mag: 1 }, // 3
      { x:  0.10, y:  0.45, mag: 1 }, // 4
      { x:  0.00, y:  0.70, mag: 2 }, // 5 Lambda Aql
    ],
    lines: [[1,0],[0,2],[0,3],[0,4],[3,5],[4,5]],
  },
};

// ─────────────────────────────────────────────
//  Normalise a name from Admin → DB key
//  Handles Portuguese, English, accented
// ─────────────────────────────────────────────
function normaliseConstellationName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

// Portuguese → DB key aliases
const PT_ALIASES: Record<string, string> = {
  'ORIAO': 'ORION',
  'ORION': 'ORION',
  'TOURO': 'TAURUS',
  'TAURUS': 'TAURUS',
  'GEMEOS': 'GEMINI',
  'GEMINI': 'GEMINI',
  'CAO MAIOR': 'CAO MAIOR',
  'CANIS MAJOR': 'CAO MAIOR',
  'CAO MENOR': 'CAO MENOR',
  'CANIS MINOR': 'CAO MENOR',
  'LEAO': 'LEO',
  'LEO': 'LEO',
  'VIRGEM': 'VIRGO',
  'VIRGO': 'VIRGO',
  'ESCORPIAO': 'ESCORPIAO',
  'SCORPIUS': 'ESCORPIAO',
  'ESCORPIO': 'ESCORPIAO',
  'CANCER': 'CANCER',
  'AQUARIO': 'AQUARIUS',
  'AQUARIUS': 'AQUARIUS',
  'PEIXES': 'PISCES',
  'PISCES': 'PISCES',
  'ARIES': 'ARIES',
  'CARNEIRO': 'ARIES',
  'SAGITARIO': 'SAGITTARIUS',
  'SAGITTARIUS': 'SAGITTARIUS',
  'CAPRICORNIO': 'CAPRICORNUS',
  'CAPRICORNUS': 'CAPRICORNUS',
  'CASSIOPEIA': 'CASSIOPEIA',
  'URSA MAIOR': 'URSA MAIOR',
  'URSA MAJOR': 'URSA MAIOR',
  'URSA MENOR': 'URSA MENOR',
  'URSA MINOR': 'URSA MENOR',
  'CRUX': 'CRUX',
  'CRUZEIRO DO SUL': 'CRUX',
  'SOUTHERN CROSS': 'CRUX',
  'HERCULES': 'HERCULES',
  'LIRA': 'LYRA',
  'LYRA': 'LYRA',
  'CISNE': 'CYGNUS',
  'CYGNUS': 'CYGNUS',
  'LEBRE': 'LEPUS',
  'ANDROMEDA': 'ANDROMEDA',
  'PERSEU': 'PERSEUS',
  'PERSEUS': 'PERSEUS',
  'AGUIA': 'AGUIA',
  'AQUILA': 'AGUIA',
};

function lookupConstellation(name: string): ConstellationShape | null {
  const key = PT_ALIASES[normaliseConstellationName(name)];
  return key ? CONSTELLATION_DB[key] ?? null : null;
}

export function StarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = useSiteConfigStore();
  const [mapConfig, setMapConfig] = useState<StarMapConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapConfig = async () => {
      const siteId = config?.id || 'meu-site';
      try {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
          setTimeout(() => {
            setMapConfig({
              specialDate: config?.relationship.startDate || '2025-10-27',
              time: '19:42',
              customLocation: { lat: -23.5505, lng: -46.6333, name: 'São Paulo, Brasil' },
              romanticQuote: 'De todas as possibilidades do universo, nossas trajetórias se cruzaram aqui.',
              constellations: ['Órion', 'Touro', 'Cão Maior', 'Gêmeos'],
            });
            setLoading(false);
          }, 500);
          return;
        }
        const docRef = doc(db, 'sites', siteId, 'config', 'star_map');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<StarMapConfig>;
          setMapConfig({
            specialDate: data.specialDate || config?.relationship.startDate || '',
            time: data.time || '',
            customLocation: data.customLocation || { lat: 0, lng: 0, name: '' },
            romanticQuote: data.romanticQuote || '',
            constellations: data.constellations || [],
          });
        } else {
          setMapConfig({
            specialDate: config?.relationship.startDate || '',
            time: '',
            customLocation: { lat: 0, lng: 0, name: 'Local não definido' },
            romanticQuote: 'De todas as possibilidades do universo, nossas trajetórias se cruzaram aqui.',
            constellations: [],
          });
        }
      } catch (e) {
        console.error('StarMap fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMapConfig();
  }, [config]);

  useEffect(() => {
    if (loading || !mapConfig) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let startTime: number | null = null;

    // Animation stages (ms)
    const T = {
      STARS_IN:        2000,
      CONSTELLATIONS_IN: 2000,
      ROUTE_IN:        3000,
      ENCOUNTER_IN:    1000,
      DELAY_STARS:        0,
      DELAY_CONST:     1200,
      DELAY_ROUTE:     3000,
      DELAY_ENCOUNTER: 5500,
    };

    // Storage for generated scene
    let bgStars: { x: number; y: number; r: number; a: number; speed: number; phase: number }[] = [];
    let rendered: {
      cx: number; cy: number; scale: number;
      name: string;
      stars: { x: number; y: number; r: number }[];
      lines: [number, number][];
      shape: ConstellationShape;
    }[] = [];

    const setup = (w: number, h: number) => {
      // ── background stars ──────────────────────
      bgStars = [];
      const n = w < 600 ? 300 : 600;
      for (let i = 0; i < n; i++) {
        bgStars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.8 + 0.1,
          a: Math.random() * 0.45 + 0.05,
          speed: Math.random() * 0.015 + 0.003,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // ── place constellations dynamically ───────
      rendered = [];
      const encX = w * 0.50;
      const encY = h * 0.52;
      
      // Calculate curve points for collision detection
      const isMobile = w < 768;
      const startX = isMobile ? w * 0.20 : w * 0.08;
      const startY = isMobile ? h * 0.78 : h * 0.88;
      const endX   = isMobile ? w * 0.80 : w * 0.87;
      const endY   = isMobile ? h * 0.28 : h * 0.18;
      const cp1x   = isMobile ? encX - w * 0.25 : encX - w * 0.12;
      const cp1y   = isMobile ? encY + h * 0.15 : encY + h * 0.12;
      const cp2x   = isMobile ? encX + w * 0.25 : encX + w * 0.10;
      const cp2y   = isMobile ? encY - h * 0.15 : encY - h * 0.12;

      const bezier3 = (t: number, p0: number, p1: number, p2: number) =>
        (1-t)*(1-t)*p0 + 2*(1-t)*t*p1 + t*t*p2;

      const curvePts: {x: number, y: number}[] = [];
      for (let t = 0; t <= 1; t += 0.02) {
        curvePts.push({ x: bezier3(t, startX, cp1x, encX), y: bezier3(t, startY, cp1y, encY) });
        curvePts.push({ x: bezier3(t, encX, cp2x, endX), y: bezier3(t, encY, cp2y, endY) });
      }

      // We only want to draw up to 5 constellations to keep it elegant
      const constellationsToDraw = (mapConfig?.constellations || []).slice(0, 5);

      constellationsToDraw.forEach((name) => {
        const shape = lookupConstellation(name);
        if (!shape) return;

        // Base scale for the constellation
        const baseW = Math.min(w, 1000);
        // Reduced mobile scale so 5 can actually fit on a narrow screen
        const scale = baseW * (isMobile ? 0.16 : 0.14) * (0.8 + Math.random() * 0.4);
        
        // Approximate radius of the constellation bounding box
        const reqRadius = scale * 0.6 + 20;

        let bestPos: { cx: number; cy: number } | null = null;
        let bestScore = -Infinity;

        const constSize = reqRadius * 2;
        const rectIntersect = (r1x: number, r1y: number, r1w: number, r1h: number, 
                               r2x: number, r2y: number, r2w: number, r2h: number) => {
          return !(r2x > r1x + r1w || r2x + r2w < r1x || r2y > r1y + r1h || r2y + r2h < r1y);
        };

        const titleBoxW = isMobile ? 320 : 500;
        const titleBoxH = isMobile ? 180 : 150;
        const titleBoxX = (w - titleBoxW) / 2;

        const quoteBoxW = isMobile ? 360 : 650;
        const quoteBoxH = isMobile ? 130 : 110;
        const quoteBoxX = (w - quoteBoxW) / 2;
        const quoteBoxY = h - quoteBoxH;

        // Try 3 passes with decreasing strictness to guarantee it finds a spot
        for (let pass = 0; pass < 3; pass++) {
          const padConst = pass === 0 ? (isMobile ? 10 : 20) : (pass === 1 ? 0 : -20);
          const padCurve = pass === 0 ? (isMobile ? 10 : 20) : (pass === 1 ? 0 : -15);
          const padCenter = pass === 0 ? (isMobile ? w * 0.25 : w * 0.15) : (isMobile ? w * 0.15 : w * 0.10);

          for (let attempt = 0; attempt < 800; attempt++) {
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const constLeft = cx - reqRadius;
            const constTop = cy - reqRadius;

            // 1. BOUNDARY (HARD)
            if (cx < reqRadius || cx > w - reqRadius || cy < reqRadius || cy > h - (reqRadius + 20)) continue;

            // 2. TEXT BOXES (HARD)
            if (rectIntersect(titleBoxX, 0, titleBoxW, titleBoxH, constLeft, constTop, constSize, constSize)) continue;
            if (rectIntersect(quoteBoxX, quoteBoxY, quoteBoxW, quoteBoxH, constLeft, constTop, constSize, constSize)) continue;

            // 3. CENTER (RELAXABLE)
            const distToCenter = Math.hypot(cx - encX, cy - encY);
            if (distToCenter < padCenter) continue;

            // 4. CURVE (RELAXABLE)
            let distToCurve = Infinity;
            for (const pt of curvePts) {
              const d = Math.hypot(cx - pt.x, cy - pt.y);
              if (d < distToCurve) distToCurve = d;
            }
            if (distToCurve < reqRadius + padCurve) continue;

            // 5. OTHER CONSTELLATIONS (RELAXABLE)
            let distToOthers = Infinity;
            for (const other of rendered) {
              // @ts-ignore
              const d = Math.hypot(cx - other.cx, cy - other.cy);
              // @ts-ignore
              if (d < distToOthers) distToOthers = d - other.reqRadius;
            }
            if (distToOthers < reqRadius + padConst) continue;

            // Score position
            const score = Math.min(distToCurve, distToOthers !== Infinity ? distToOthers : w);
            if (score > bestScore) {
              bestScore = score;
              bestPos = { cx, cy };
            }
          }

          if (bestPos) break; // found a spot in this pass!
        }

        // If we found a valid position (even if we had to relax, but loop guarantees basic constraints if bestPos != null)
        if (bestPos) {
          const finalCx = bestPos.cx;
          const finalCy = bestPos.cy;

          const stars = shape.stars.map(s => ({
            x: finalCx + s.x * scale * 0.5,
            y: finalCy + s.y * scale * 0.5,
            r: s.mag === 3 ? 2.8 : s.mag === 2 ? 1.8 : 0.9,
          }));

          rendered.push({
            cx: finalCx,
            cy: finalCy,
            scale,
            name: name.toUpperCase(),
            stars,
            lines: shape.lines,
            shape: shape,
            // @ts-ignore (temporary property for collision check)
            reqRadius: reqRadius 
          });
        }
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = window.innerWidth < 768 ? 750 : Math.max(600, window.innerHeight - 130);
      
      // Prevent unnecessary re-renders on mobile scroll (URL bar hiding/showing fires resize)
      if (canvas.width === w * dpr && canvas.height === h * dpr) {
        return;
      }
      
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      setup(w, h);
    };

    const bezier3 = (t: number, p0: number, p1: number, p2: number) =>
      (1-t)*(1-t)*p0 + 2*(1-t)*t*p1 + t*t*p2;

    const draw = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      const w = parseFloat(canvas.style.width);
      const h = parseFloat(canvas.style.height);

      ctx.clearRect(0, 0, w, h);

      // ── BACKGROUND ───────────────────────────
      const bg = ctx.createRadialGradient(w/2, h * 0.4, 0, w/2, h/2, w * 0.8);
      bg.addColorStop(0, '#0c1833');
      bg.addColorStop(0.5, '#060c1a');
      bg.addColorStop(1, '#020509');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle milky-way streak
      const mw = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, h);
      mw.addColorStop(0, 'rgba(120,160,220,0)');
      mw.addColorStop(0.3, 'rgba(120,160,220,0.04)');
      mw.addColorStop(0.5, 'rgba(150,185,235,0.06)');
      mw.addColorStop(0.7, 'rgba(120,160,220,0.04)');
      mw.addColorStop(1, 'rgba(120,160,220,0)');
      ctx.fillStyle = mw;
      ctx.fillRect(0, 0, w, h);

      // ── PROGRESS ────────────────────────────
      const pStar = Math.min(Math.max((elapsed - T.DELAY_STARS)  / T.STARS_IN, 0), 1);
      const pConst = Math.min(Math.max((elapsed - T.DELAY_CONST) / T.CONSTELLATIONS_IN, 0), 1);
      const pRoute = Math.min(Math.max((elapsed - T.DELAY_ROUTE) / T.ROUTE_IN, 0), 1);
      const pEnc   = Math.min(Math.max((elapsed - T.DELAY_ENCOUNTER) / T.ENCOUNTER_IN, 0), 1);

      // ── BACKGROUND STARS ────────────────────
      if (pStar > 0) {
        bgStars.forEach(s => {
          s.phase += s.speed;
          const a = s.a + Math.sin(s.phase) * 0.12;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${a * pStar})`;
          ctx.fill();
        });
      }

      // ── CONSTELLATIONS ──────────────────────
      if (pConst > 0) {
        rendered.forEach(c => {
          if (c.stars.length === 0) return;

          // Draw connecting lines
          ctx.save();
          ctx.strokeStyle = `rgba(223,206,168,${0.45 * pConst})`;
          ctx.lineWidth = 0.8;
          c.lines.forEach(([i, j]) => {
            const a = c.stars[i];
            const b = c.stars[j];
            if (!a || !b) return;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          });
          ctx.restore();

          // Draw stars
          c.stars.forEach((s, idx) => {
            // Subtle twinkle effect: modulates between 0.7 and 1.3 based on time and star position
            const twinkle = 1 + Math.sin(elapsed * 0.0015 + (s.x * 0.01 + s.y * 0.01 + idx)) * 0.3;
            
            // Glow
            const glowR = s.r * 5 * twinkle;
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
            glow.addColorStop(0, `rgba(223,206,168,${0.35 * pConst * twinkle})`);
            glow.addColorStop(1, 'rgba(223,206,168,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * (0.8 + 0.2 * twinkle), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.95 * pConst})`;
            ctx.fill();
          });

          // Draw label below the lowest star
          if (pConst > 0.6) {
            const bottomY = Math.max(...c.stars.map(s => s.y));
            const centerX = c.cx;
            const alpha = (pConst - 0.6) / 0.4;
            ctx.save();
            ctx.font = '700 10px sans-serif';
            ctx.fillStyle = `rgba(223,206,168,${0.75 * alpha})`;
            ctx.textAlign = 'center';
            ctx.letterSpacing = '2px';
            ctx.fillText(c.name, centerX, bottomY + 18);
            ctx.restore();
          }
        });
      }

      // ── ROUTE (ANTES → ENCONTRO → DEPOIS) ───
      const encX = w * 0.50;
      const encY = h * 0.52;

      if (pRoute > 0) {
        const isMobile = w < 768;
        const startX = isMobile ? w * 0.20 : w * 0.08;
        const startY = isMobile ? h * 0.78 : h * 0.88;
        const endX   = isMobile ? w * 0.80 : w * 0.87;
        const endY   = isMobile ? h * 0.28 : h * 0.18;
        const cp1x   = isMobile ? encX - w * 0.25 : encX - w * 0.12;
        const cp1y   = isMobile ? encY + h * 0.15 : encY + h * 0.12;
        const cp2x   = isMobile ? encX + w * 0.25 : encX + w * 0.10;
        const cp2y   = isMobile ? encY - h * 0.15 : encY - h * 0.12;

        const STEPS = 200;
        const drawTo = Math.floor(STEPS * pRoute);

        ctx.save();
        ctx.strokeStyle = `rgba(223,206,168,${0.65 * pRoute})`;
        ctx.lineWidth   = 1.2;
        ctx.shadowColor = `rgba(223,206,168,0.4)`;
        ctx.shadowBlur  = 4;
        ctx.beginPath();

        for (let i = 0; i <= drawTo; i++) {
          const t  = i / STEPS;
          let x: number, y: number;
          if (t < 0.5) {
            const t1 = t * 2;
            x = bezier3(t1, startX, cp1x, encX);
            y = bezier3(t1, startY, cp1y, encY);
          } else {
            const t2 = (t - 0.5) * 2;
            x = bezier3(t2, encX, cp2x, endX);
            y = bezier3(t2, encY, cp2y, endY);
          }
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Dot at start + label ANTES
        if (pRoute > 0.04) {
          ctx.beginPath();
          ctx.arc(startX, startY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(223,206,168,${0.8 * pRoute})`;
          ctx.fill();
          ctx.font = '700 9px sans-serif';
          ctx.fillStyle = `rgba(223,206,168,${0.6 * pRoute})`;
          ctx.textAlign = 'center';
          ctx.letterSpacing = '2px';
          ctx.fillText('ANTES', startX + 16, startY + 16);
        }

        // Arrow tip + DEPOIS label
        if (pRoute > 0.92) {
          const alpha = (pRoute - 0.92) / 0.08;
          ctx.fillStyle = `rgba(223,206,168,${0.8 * alpha})`;
          ctx.save();
          // Compute angle of last segment
          const tEnd = (STEPS - 1) / STEPS;
          const t2Pre = (tEnd - 0.5) * 2;
          const px = bezier3(t2Pre, encX, cp2x, endX);
          const py = bezier3(t2Pre, encY, cp2y, endY);
          const angle = Math.atan2(endY - py, endX - px);
          ctx.translate(endX, endY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-8, 3.5);
          ctx.lineTo(-8, -3.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.font = '700 9px sans-serif';
          ctx.fillStyle = `rgba(223,206,168,${0.6 * alpha})`;
          ctx.textAlign = 'center';
          ctx.letterSpacing = '2px';
          ctx.fillText('DEPOIS', endX + 16, endY - 12);
        }
      }

      // ── ENCOUNTER POINT ─────────────────────
      if (pEnc > 0) {
        const pulse = 1 + Math.sin(elapsed * 0.0025) * 0.08;

        // Outer rings
        [40, 22].forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(encX, encY, r * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(223,206,168,${(0.18 - idx * 0.06) * pEnc})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        });

        // Glow halo
        const halo = ctx.createRadialGradient(encX, encY, 0, encX, encY, 50 * pulse);
        halo.addColorStop(0, `rgba(223,206,168,${0.35 * pEnc})`);
        halo.addColorStop(0.4, `rgba(223,206,168,${0.12 * pEnc})`);
        halo.addColorStop(1, 'rgba(223,206,168,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(encX, encY, 50 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Cross hair lines
        ctx.strokeStyle = `rgba(223,206,168,${0.45 * pEnc})`;
        ctx.lineWidth = 0.8;
        const lineLen = 30;
        ctx.beginPath();
        ctx.moveTo(encX - lineLen, encY); ctx.lineTo(encX + lineLen, encY);
        ctx.moveTo(encX, encY - lineLen); ctx.lineTo(encX, encY + lineLen);
        ctx.stroke();

        // Core dot (bright white)
        const coreGlow = ctx.createRadialGradient(encX, encY, 0, encX, encY, 8);
        coreGlow.addColorStop(0, `rgba(255,255,255,${pEnc})`);
        coreGlow.addColorStop(0.4, `rgba(255,245,220,${0.8 * pEnc})`);
        coreGlow.addColorStop(1, 'rgba(223,206,168,0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(encX, encY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(encX, encY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${pEnc})`;
        ctx.fill();

        // Label O ENCONTRO
        if (pEnc > 0.5) {
          const la = (pEnc - 0.5) / 0.5;
          ctx.font = '700 10px sans-serif';
          ctx.fillStyle = `rgba(223,206,168,${0.85 * la})`;
          ctx.textAlign = 'center';
          ctx.letterSpacing = '2px';
          ctx.fillText('O ENCONTRO', encX, encY - 52);
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, [loading, mapConfig]);

  // ─── FORMATTING ────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="w-full max-w-5xl mx-auto overflow-hidden bg-[#02040A] border-white/5 min-h-[520px] flex items-center justify-center">
        <Spinner />
      </Card>
    );
  }

  let formattedDate = mapConfig?.specialDate || '';
  if (formattedDate.includes('-')) {
    const [y, m, d] = formattedDate.split('-');
    formattedDate = `${d} · ${m} · ${y}`;
  }

  const lat = mapConfig?.customLocation.lat;
  const lng = mapConfig?.customLocation.lng;
  const coordStr = lat && lng
    ? `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
    : '';

  const numConst = mapConfig?.constellations?.length ?? 0;

  return (
    <Card className="w-full h-full overflow-hidden bg-[#02040A] shadow-2xl border-0 rounded-none flex flex-col font-sans">
      {/* ── CANVAS ZONE ── */}
      <div className="relative w-full">
        <canvas ref={canvasRef} className="w-full block" />

        {/* Top title overlay */}
        <div className="absolute top-0 left-0 w-full pointer-events-none flex flex-col items-center pt-10 md:pt-12 px-4">
          <h2 className="text-[#DFCEA8] font-serif text-[26px] md:text-3xl tracking-[0.2em] md:tracking-[0.25em] font-light leading-snug text-center">
            O CÉU DAQUELA<br className="md:hidden" /> NOITE
          </h2>
          <div className="mt-4 mb-4 flex items-center gap-3 text-[#DFCEA8]/40">
            <div className="h-[1px] w-12 md:w-16 bg-[#DFCEA8]/30" />
            <StarIcon className="w-3.5 h-3.5 fill-[#DFCEA8]/50 text-transparent" />
            <div className="h-[1px] w-12 md:w-16 bg-[#DFCEA8]/30" />
          </div>
        </div>

        {/* Bottom quote overlay */}
        {mapConfig?.romanticQuote && (
          <div className="absolute bottom-6 md:bottom-10 left-0 w-full pointer-events-none flex flex-col items-center px-6">
            <p className="text-[#DFCEA8]/80 font-serif italic text-sm md:text-lg text-center max-w-sm md:max-w-xl leading-relaxed">
              "{mapConfig.romanticQuote}"
            </p>
            <div className="mt-4 flex items-center gap-3 text-[#DFCEA8]/40">
              <div className="h-[1px] w-8 bg-[#DFCEA8]/20" />
              <StarIcon className="w-3 h-3 fill-[#DFCEA8]/30 text-transparent" />
              <div className="h-[1px] w-8 bg-[#DFCEA8]/20" />
            </div>
          </div>
        )}
      </div>

      {/* ── INFO BAR (Desktop) / GRID (Mobile) ── */}
      <div className="bg-[#030610] md:border-t border-[#DFCEA8]/10 px-5 md:px-6 pb-8 pt-4 md:py-4">
        
        {/* DESKTOP LAYOUT */}
        <div className="hidden md:flex items-center justify-between gap-5">
          <div className="flex items-center gap-6 text-xs tracking-widest uppercase text-[#DFCEA8]/60">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#DFCEA8]/40 flex-shrink-0" />
              <div>
                <p className="text-[#DFCEA8]/40 mb-1">DATA</p>
                <p className="text-[#DFCEA8]/80">{formattedDate}</p>
              </div>
            </div>

            {mapConfig?.time && (
              <>
                <div className="w-px h-8 bg-[#DFCEA8]/10" />
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#DFCEA8]/40 flex-shrink-0" />
                  <div>
                    <p className="text-[#DFCEA8]/40 mb-1">HORA</p>
                    <p className="text-[#DFCEA8]/80">{mapConfig.time}</p>
                  </div>
                </div>
              </>
            )}

            <div className="w-px h-8 bg-[#DFCEA8]/10" />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#DFCEA8]/40 flex-shrink-0" />
              <div>
                <p className="text-[#DFCEA8]/40 mb-1">LOCAL</p>
                <p className="text-[#DFCEA8]/80 max-w-[160px] truncate" title={mapConfig?.customLocation.name}>
                  {mapConfig?.customLocation.name}
                </p>
              </div>
            </div>

            {coordStr && (
              <>
                <div className="w-px h-8 bg-[#DFCEA8]/10" />
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-[#DFCEA8]/40 flex-shrink-0" />
                  <div>
                    <p className="text-[#DFCEA8]/40 mb-1">COORDENADAS</p>
                    <p className="text-[#DFCEA8]/80 font-mono text-[11px]">{coordStr}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border border-[#DFCEA8]/20 rounded-lg px-5 py-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <StarIcon className="w-3.5 h-3.5 text-[#DFCEA8]/70" />
              <span className="text-[#DFCEA8]/90 text-xs font-bold tracking-widest uppercase">
                {numConst} {numConst === 1 ? 'CONSTELAÇÃO' : 'CONSTELAÇÕES'}
              </span>
            </div>
            <span className="text-[#DFCEA8]/40 text-[9px] tracking-[0.2em] uppercase mt-1">
              CALCULADAS PARA ESTE MOMENTO
            </span>
          </div>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="md:hidden flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#DFCEA8]/10 bg-[#060a14] rounded-lg p-3.5 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#DFCEA8]/40 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#DFCEA8]/40 text-[9px] tracking-widest uppercase mb-1">DATA</p>
                <p className="text-[#DFCEA8]/80 text-[11px] uppercase tracking-wide">{formattedDate}</p>
              </div>
            </div>
            
            <div className="border border-[#DFCEA8]/10 bg-[#060a14] rounded-lg p-3.5 flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#DFCEA8]/40 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#DFCEA8]/40 text-[9px] tracking-widest uppercase mb-1">HORA</p>
                <p className="text-[#DFCEA8]/80 text-[11px] uppercase tracking-wide">{mapConfig?.time || '--:--'}</p>
              </div>
            </div>

            <div className="border border-[#DFCEA8]/10 bg-[#060a14] rounded-lg p-3.5 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#DFCEA8]/40 mt-0.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[#DFCEA8]/40 text-[9px] tracking-widest uppercase mb-1">LOCAL</p>
                <p className="text-[#DFCEA8]/80 text-[11px] uppercase tracking-wide truncate">{mapConfig?.customLocation.name}</p>
              </div>
            </div>

            <div className="border border-[#DFCEA8]/10 bg-[#060a14] rounded-lg p-3.5 flex items-start gap-3">
              <Compass className="w-4 h-4 text-[#DFCEA8]/40 mt-0.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[#DFCEA8]/40 text-[9px] tracking-widest uppercase mb-1">COORDENADAS</p>
                <p className="text-[#DFCEA8]/80 text-[10px] font-mono whitespace-nowrap">{coordStr}</p>
              </div>
            </div>
          </div>

          <div className="border border-[#DFCEA8]/20 bg-gradient-to-b from-[#0a101f] to-[#04070e] rounded-lg p-4 flex flex-col items-center justify-center mt-1">
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-[#DFCEA8]/70" />
              <span className="text-[#DFCEA8]/90 text-xs font-bold tracking-widest uppercase">
                {numConst} {numConst === 1 ? 'CONSTELAÇÃO' : 'CONSTELAÇÕES'}
              </span>
            </div>
            <span className="text-[#DFCEA8]/50 text-[9px] tracking-[0.2em] uppercase mt-1.5">
              CALCULADAS PARA ESTE MOMENTO
            </span>
          </div>
        </div>

      </div>
    </Card>
  );
}
