/**
 * Tests para formatters.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  toISODateString,
  todayISO,
  daysBetween,
  daysUntil,
  isExpired,
  expiresSoon,
  formatNumber,
  formatCurrency,
} from './formatters';

describe('formatDate', () => {
  it('formatea fecha al formato local', () => {
    const resultado = formatDate(new Date(2024, 0, 15)); // 15 enero 2024
    // Verificar que contiene el día y año
    expect(resultado).toMatch(/15/);
    expect(resultado).toMatch(/2024/);
  });

  it('retorna fallback para fecha null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('retorna fallback personalizado', () => {
    expect(formatDate(null, 'N/A')).toBe('N/A');
  });

  it('retorna fallback para string vacío', () => {
    expect(formatDate('')).toBe('-');
  });
});

describe('formatDateLong', () => {
  it('formatea fecha con formato largo', () => {
    const resultado = formatDateLong(new Date(2024, 0, 15));
    // Debería incluir día y año
    expect(resultado).toMatch(/15/);
    expect(resultado).toMatch(/2024/);
  });

  it('retorna fallback para fecha inválida', () => {
    expect(formatDateLong(null)).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('formatea fecha con hora', () => {
    const fecha = new Date(2024, 0, 15, 14, 30, 0);
    const resultado = formatDateTime(fecha);
    expect(resultado).toMatch(/15/);
    expect(resultado).toMatch(/30/); // minutos
  });

  it('retorna fallback para fecha null', () => {
    expect(formatDateTime(null)).toBe('-');
  });
});

describe('toISODateString', () => {
  it('convierte Date a string ISO', () => {
    const fecha = new Date('2024-06-15T10:30:00');
    expect(toISODateString(fecha)).toBe('2024-06-15');
  });

  it('convierte string a formato ISO', () => {
    expect(toISODateString('2024-06-15')).toBe('2024-06-15');
  });

  it('retorna fecha de hoy si no se proporciona argumento', () => {
    const hoy = new Date().toISOString().split('T')[0];
    expect(toISODateString()).toBe(hoy);
  });
});

describe('todayISO', () => {
  it('retorna fecha de hoy en formato ISO', () => {
    const hoy = new Date().toISOString().split('T')[0];
    expect(todayISO()).toBe(hoy);
  });
});

describe('daysBetween', () => {
  it('calcula días entre dos fechas', () => {
    const resultado = daysBetween('2024-01-01', '2024-01-11');
    expect(resultado).toBe(10);
  });

  it('retorna negativo si fecha inicio es posterior', () => {
    const resultado = daysBetween('2024-01-11', '2024-01-01');
    expect(resultado).toBe(-10);
  });

  it('retorna null para fecha null', () => {
    expect(daysBetween(null)).toBe(null);
  });
});

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna días hasta fecha futura', () => {
    expect(daysUntil(new Date(2026, 1, 28))).toBe(10);
  });

  it('retorna días negativos para fecha pasada', () => {
    expect(daysUntil(new Date(2026, 1, 8))).toBe(-10);
  });

  it('retorna null para fecha null', () => {
    expect(daysUntil(null)).toBe(null);
  });
});

describe('isExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna true para fecha pasada', () => {
    expect(isExpired(new Date(2026, 1, 10))).toBe(true);
  });

  it('retorna false para fecha futura', () => {
    expect(isExpired(new Date(2026, 1, 28))).toBe(false);
  });

  it('retorna false para fecha de hoy', () => {
    expect(isExpired(new Date(2026, 1, 18))).toBe(false);
  });
});

describe('expiresSoon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna true si vence dentro de 30 días (default)', () => {
    expect(expiresSoon(new Date(2026, 2, 1))).toBe(true); // 1 marzo
  });

  it('retorna false si vence después de 30 días', () => {
    expect(expiresSoon(new Date(2026, 3, 1))).toBe(false); // 1 abril
  });

  it('acepta parámetro de días personalizado', () => {
    expect(expiresSoon(new Date(2026, 1, 25), 10)).toBe(true);
    expect(expiresSoon(new Date(2026, 2, 15), 10)).toBe(false);
  });

  it('retorna false para fecha ya vencida', () => {
    expect(expiresSoon(new Date(2026, 1, 10))).toBe(false);
  });
});

describe('formatNumber', () => {
  it('formatea número con separador de miles', () => {
    const resultado = formatNumber(1234567);
    // Formato chileno usa punto como separador de miles
    expect(resultado).toMatch(/1.*234.*567/);
  });

  it('retorna fallback para null', () => {
    expect(formatNumber(null)).toBe('-');
  });

  it('retorna fallback para NaN', () => {
    expect(formatNumber(NaN)).toBe('-');
  });
});

describe('formatCurrency', () => {
  it('formatea número como moneda chilena', () => {
    const resultado = formatCurrency(1500000);
    expect(resultado).toMatch(/\$/);
    expect(resultado).toMatch(/1.*500.*000/);
  });

  it('retorna fallback para null', () => {
    expect(formatCurrency(null)).toBe('-');
  });
});
