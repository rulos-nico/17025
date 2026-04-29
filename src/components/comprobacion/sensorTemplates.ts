/**
 * Plantillas de formulario de comprobación por tipo de sensor.
 *
 * Cada plantilla define:
 *  - cómo identificar al sensor (regex contra `sensor.tipo`),
 *  - unidad de la magnitud principal,
 *  - label del campo "valor patrón",
 *  - paso/decimales sugeridos para los inputs numéricos,
 *  - campos de condiciones ambientales a registrar.
 */

export interface AmbienteField {
  key: string; // clave en data.ambiente
  label: string; // etiqueta en UI
  unidad?: string;
  step?: string;
  defaultValue?: number;
}

export interface SensorTemplate {
  id: string;
  match: RegExp;
  unidad: string;
  patronLabel: string;
  patronDefault: number;
  step: string;
  decimales: number;
  ambiente: AmbienteField[];
}

export const SENSOR_TEMPLATES: SensorTemplate[] = [
  {
    id: 'masa',
    match: /balanza|masa/i,
    unidad: 'g',
    patronLabel: 'Masa patrón',
    patronDefault: 200,
    step: '0.0001',
    decimales: 4,
    ambiente: [
      {
        key: 'temperatura_c',
        label: 'Temperatura ambiente',
        unidad: '°C',
        step: '0.1',
        defaultValue: 22,
      },
      { key: 'humedad_pct', label: 'Humedad', unidad: '%', step: '0.1' },
    ],
  },
  {
    id: 'horno',
    match: /horno|estufa/i,
    unidad: '°C',
    patronLabel: 'Setpoint',
    patronDefault: 110,
    step: '0.1',
    decimales: 2,
    ambiente: [
      { key: 'humedad_pct', label: 'Humedad', unidad: '%', step: '0.1', defaultValue: 45 },
    ],
  },
  {
    id: 'carga',
    match: /prensa|carga|fuerza/i,
    unidad: 'kN',
    patronLabel: 'Carga patrón',
    patronDefault: 50,
    step: '0.01',
    decimales: 3,
    ambiente: [
      {
        key: 'temperatura_c',
        label: 'Temperatura ambiente',
        unidad: '°C',
        step: '0.1',
        defaultValue: 21,
      },
    ],
  },
  {
    id: 'temperatura_ambiente',
    match: /temperatura ambiente|term[oó]metro/i,
    unidad: '°C',
    patronLabel: 'Patrón',
    patronDefault: 25,
    step: '0.1',
    decimales: 2,
    ambiente: [
      { key: 'humedad_pct', label: 'Humedad', unidad: '%', step: '0.1', defaultValue: 55 },
    ],
  },
];

export const FALLBACK_TEMPLATE: SensorTemplate = {
  id: 'generico',
  match: /.*/,
  unidad: '',
  patronLabel: 'Valor patrón',
  patronDefault: 0,
  step: 'any',
  decimales: 4,
  ambiente: [{ key: 'temperatura_c', label: 'Temperatura', unidad: '°C', step: '0.1' }],
};

export const getSensorTemplate = (tipo: string | undefined | null): SensorTemplate => {
  if (!tipo) return FALLBACK_TEMPLATE;
  return SENSOR_TEMPLATES.find(t => t.match.test(tipo)) ?? FALLBACK_TEMPLATE;
};
