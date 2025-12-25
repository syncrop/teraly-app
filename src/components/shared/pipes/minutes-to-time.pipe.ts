import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minutesToTime',
  standalone: true
})
export class MinutesToTimePipe implements PipeTransform {
  transform(minutes: number): string {
    if (!minutes || minutes === 0) {
      return '0 min';
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
  }
}
