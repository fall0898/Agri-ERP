import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'date' | 'datetime' = 'date'): string {
    if (!value) return '—';

    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';

    const options: Intl.DateTimeFormatOptions = format === 'datetime'
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  }
}
