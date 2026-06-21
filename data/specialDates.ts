/**
 * specialDates.ts — Motor de fechas de marketing para el calendario turístico
 * Next.js version — copiado sin cambios del proyecto Vite
 */

export type DateType = 'offer' | 'holiday' | 'highSeason' | 'event';

export interface DateInfo {
  type: DateType;
  label: string;
  icon: string;
  discount?: string;
  priceHint?: string;
}

export interface RecurringHoliday { type: 'holiday'; label: string; icon: string }
export interface HighSeasonRange { start: string; end: string; label: string; icon: string; priceHint: string }
export interface SpecialOffer { type: 'offer'; label: string; discount: string; icon: string }
export interface SpecialEvent { type: 'event'; label: string; icon: string }

export const RECURRING_HOLIDAYS: Record<string, RecurringHoliday> = {
  "01-01": { type: "holiday", label: "Año Nuevo",                  icon: "fa-star"         },
  "01-06": { type: "holiday", label: "Reyes Magos",                icon: "fa-crown"        },
  "04-02": { type: "holiday", label: "Jueves Santo",               icon: "fa-church"       },
  "04-03": { type: "holiday", label: "Viernes Santo",              icon: "fa-cross"        },
  "05-01": { type: "holiday", label: "Día del Trabajo",            icon: "fa-person-digging" },
  "08-15": { type: "holiday", label: "Asunción de la Virgen",      icon: "fa-dove"         },
  "10-12": { type: "holiday", label: "Fiesta Nacional de España",  icon: "fa-flag"         },
  "11-01": { type: "holiday", label: "Todos los Santos",           icon: "fa-candle-holder" },
  "12-06": { type: "holiday", label: "Día de la Constitución",     icon: "fa-scroll"       },
  "12-08": { type: "holiday", label: "Inmaculada Concepción",      icon: "fa-seedling"     },
  "12-25": { type: "holiday", label: "Navidad",                    icon: "fa-star"         },
  "12-31": { type: "holiday", label: "Nochevieja",                 icon: "fa-champagne-glasses" },
};

export const HIGH_SEASON_RANGES: HighSeasonRange[] = [
  { start: "07-01", end: "08-31", label: "Temporada Alta Verano",  icon: "fa-sun",      priceHint: "Precios +40%"  },
  { start: "12-22", end: "01-07", label: "Temporada Alta Navidad", icon: "fa-star",     priceHint: "Precios +30%"  },
  { start: "03-28", end: "04-06", label: "Semana Santa",           icon: "fa-church",   priceHint: "Alta demanda"  },
  { start: "05-01", end: "05-05", label: "Puente de Mayo",         icon: "fa-seedling", priceHint: "Alta demanda"  },
  { start: "10-10", end: "10-14", label: "Puente del Pilar",       icon: "fa-flag",     priceHint: "Alta demanda"  },
  { start: "06-21", end: "06-30", label: "Pre-verano",             icon: "fa-sun",      priceHint: "Precios +15%"  },
  { start: "02-14", end: "02-16", label: "San Valentín",           icon: "fa-heart",    priceHint: "Escapadas +20%" },
];

export const SPECIAL_OFFERS: Record<string, SpecialOffer> = {
  "2026-03-07": { type: "offer", label: "Oferta Fin de Semana",   discount: "−15%", icon: "fa-tag"   },
  "2026-03-08": { type: "offer", label: "Oferta Fin de Semana",   discount: "−15%", icon: "fa-tag"   },
  "2026-03-09": { type: "offer", label: "Oferta Lunes Flash",     discount: "−20%", icon: "fa-bolt"  },
  "2026-03-14": { type: "offer", label: "Flash Sale Vuelos",      discount: "−30%", icon: "fa-plane" },
  "2026-03-15": { type: "offer", label: "Flash Sale Vuelos",      discount: "−30%", icon: "fa-plane" },
  "2026-04-25": { type: "offer", label: "Oferta Puente",          discount: "−25%", icon: "fa-tag"   },
  "2026-04-26": { type: "offer", label: "Oferta Puente",          discount: "−25%", icon: "fa-tag"   },
  "2026-05-01": { type: "offer", label: "Especial 1 de Mayo",     discount: "−20%", icon: "fa-seedling" },
  "2026-06-01": { type: "offer", label: "Inicio de Temporada",    discount: "−18%", icon: "fa-sun"   },
  "2026-06-21": { type: "offer", label: "Solsticio de Verano",    discount: "−30%", icon: "fa-sun"   },
  "2026-07-15": { type: "offer", label: "Súper Verano Iberia",    discount: "−35%", icon: "fa-plane" },
  "2026-08-08": { type: "offer", label: "Agosto Flash",           discount: "−25%", icon: "fa-bolt"  },
  "2026-09-01": { type: "offer", label: "Fin de Temporada",       discount: "−28%", icon: "fa-tag"   },
  "2026-11-28": { type: "offer", label: "Black Friday Viajes",    discount: "−40%", icon: "fa-fire"  },
  "2026-11-29": { type: "offer", label: "Black Friday Viajes",    discount: "−40%", icon: "fa-fire"  },
  "2026-12-01": { type: "offer", label: "Cyber Monday",           discount: "−35%", icon: "fa-bolt"  },
  "2026-12-26": { type: "offer", label: "Oferta San Esteban",     discount: "−30%", icon: "fa-gift"  },
};

export const SPECIAL_EVENTS: Record<string, SpecialEvent> = {
  "2026-02-28": { type: "event", label: "Carnaval de Tenerife",    icon: "fa-masks-theater" },
  "2026-03-15": { type: "event", label: "Fallas — Inicio",         icon: "fa-fire"          },
  "2026-03-19": { type: "event", label: "Las Fallas — La Cremà",   icon: "fa-fire"          },
  "2026-04-12": { type: "event", label: "Feria de Abril — Inicio", icon: "fa-music"         },
  "2026-07-07": { type: "event", label: "San Fermín — Pamplona",   icon: "fa-bolt"          },
  "2026-08-14": { type: "event", label: "La Tomatina — Buñol",     icon: "fa-circle"        },
  "2026-09-23": { type: "event", label: "La Mercè — Barcelona",    icon: "fa-star"          },
  "2026-10-12": { type: "event", label: "Pilar — Zaragoza",        icon: "fa-flag"          },
  "2026-12-22": { type: "event", label: "Lotería de Navidad",      icon: "fa-ticket"        },
};

export function getDateInfo(dateObj: Date | null): DateInfo | null {
  if (!dateObj) return null;
  const ymd = dateObj.toISOString().split('T')[0] as string;
  const md  = `${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
  if (SPECIAL_OFFERS[ymd])    return SPECIAL_OFFERS[ymd];
  if (SPECIAL_EVENTS[ymd])    return SPECIAL_EVENTS[ymd];
  if (RECURRING_HOLIDAYS[md]) return RECURRING_HOLIDAYS[md];
  for (const range of HIGH_SEASON_RANGES) {
    if (md >= range.start && md <= range.end) return { ...range, type: 'highSeason' };
  }
  return null;
}
