import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFcfa', standalone: true })
export class CurrencyFcfaPipe implements PipeTransform {
  transform(value: number | null | undefined, showSign = false): string {
    if (value === null || value === undefined) return '—';

    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));

    const sign = showSign ? (value >= 0 ? '+' : '−') : (value < 0 ? '−' : '');

    return `${sign}${formatted} FCFA`;
  }
}
