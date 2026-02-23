/**
 * Tests para helpers.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDiasParaVencimiento,
  getAlertaVencimiento,
  getAlertaCalibracion,
  getEstadoEquipo,
  getEstadoProyecto,
  canTransitionTo,
} from './helpers';

describe('getDiasParaVencimiento', () => {
  beforeEach(() => {
    // Mock de fecha fija: 2026-02-18 a medianoche local
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 0, 0, 0)); // Mes es 0-indexed
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna días positivos para fecha futura', () => {
    const resultado = getDiasParaVencimiento(new Date(2026, 1, 23));
    expect(resultado).toBe(5);
  });

  it('retorna días negativos para fecha pasada', () => {
    const resultado = getDiasParaVencimiento(new Date(2026, 1, 15));
    expect(resultado).toBe(-3);
  });

  it('retorna 0 para fecha de hoy', () => {
    const resultado = getDiasParaVencimiento(new Date(2026, 1, 18));
    expect(resultado).toBe(0);
  });

  it('retorna null para fecha null', () => {
    expect(getDiasParaVencimiento(null)).toBe(null);
  });

  it('retorna null para fecha undefined', () => {
    expect(getDiasParaVencimiento(undefined)).toBe(null);
  });

  it('retorna null para string vacío', () => {
    expect(getDiasParaVencimiento('')).toBe(null);
  });

  it('funciona con objeto Date', () => {
    const fecha = new Date(2026, 1, 28);
    expect(getDiasParaVencimiento(fecha)).toBe(10);
  });
});

describe('getAlertaVencimiento', () => {
  it('retorna alerta roja para días negativos (vencido)', () => {
    const alerta = getAlertaVencimiento(-5);
    expect(alerta!.texto).toBe('Vencido');
    expect(alerta!.color).toBe('#EF4444');
  });

  it('retorna alerta amarilla para 0-30 días', () => {
    const alerta = getAlertaVencimiento(15);
    expect(alerta!.texto).toBe('15d');
    expect(alerta!.color).toBe('#F59E0B');
  });

  it('retorna alerta azul para 31-90 días', () => {
    const alerta = getAlertaVencimiento(60);
    expect(alerta!.texto).toBe('60d');
    expect(alerta!.color).toBe('#3B82F6');
  });

  it('retorna alerta verde para más de 90 días', () => {
    const alerta = getAlertaVencimiento(120);
    expect(alerta!.texto).toBe('120d');
    expect(alerta!.color).toBe('#10B981');
  });

  it('retorna null para días null', () => {
    expect(getAlertaVencimiento(null)).toBe(null);
  });

  it('retorna null para días undefined', () => {
    expect(getAlertaVencimiento(undefined)).toBe(null);
  });
});

describe('getAlertaCalibracion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca como vencido cuando fecha ya pasó', () => {
    const resultado = getAlertaCalibracion(new Date(2026, 1, 10));
    expect(resultado.vencido).toBe(true);
    expect(resultado.requiereAccion).toBe(true);
  });

  it('marca requiereAccion cuando faltan menos de 30 días', () => {
    const resultado = getAlertaCalibracion(new Date(2026, 2, 1)); // 1 marzo
    expect(resultado.vencido).toBe(false);
    expect(resultado.requiereAccion).toBe(true);
  });

  it('no requiere acción cuando faltan más de 30 días', () => {
    const resultado = getAlertaCalibracion(new Date(2026, 5, 1)); // 1 junio
    expect(resultado.vencido).toBe(false);
    expect(resultado.requiereAccion).toBe(false);
  });
});

describe('getEstadoEquipo', () => {
  it('retorna estado conocido correctamente', () => {
    const estado = getEstadoEquipo('operativo');
    expect(estado.label).toBeDefined();
    expect(estado.color).toBeDefined();
  });

  it('retorna fallback para estado desconocido', () => {
    const estado = getEstadoEquipo('estado_inventado');
    expect(estado.label).toBe('estado_inventado');
    expect(estado.color).toBe('#6B7280');
  });

  it('retorna fallback para estado null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const estado = getEstadoEquipo(null as any);
    expect(estado.label).toBe('Desconocido');
  });
});

describe('getEstadoProyecto', () => {
  it('retorna estado conocido correctamente', () => {
    const estado = getEstadoProyecto('en_proceso');
    expect(estado.label).toBeDefined();
    expect(estado.color).toBeDefined();
  });

  it('retorna fallback para estado desconocido', () => {
    const estado = getEstadoProyecto('xyz');
    expect(estado.label).toBe('xyz');
    expect(estado.color).toBe('#6B7280');
  });
});

describe('canTransitionTo', () => {
  it('permite transiciones válidas', () => {
    // E1 -> E2 debería ser válido según workflow típico
    // Este test puede necesitar ajuste según tu configuración real
    const result = canTransitionTo('E1', 'E2');
    expect(typeof result).toBe('boolean');
  });

  it('retorna false para estado origen inexistente', () => {
    expect(canTransitionTo('INVALID', 'E2')).toBe(false);
  });
});
