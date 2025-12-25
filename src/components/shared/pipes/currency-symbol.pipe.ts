import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencySymbol',
  standalone: true
})
export class CurrencySymbolPipe implements PipeTransform {
  transform(currencyCode: string | undefined): string {
    if (!currencyCode) {
      return '€';
    }

    const currencyMap: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'PLN': 'zł',
      'UAH': '₴',
      'JPY': '¥',
      'CNY': '¥',
      'CHF': 'CHF',
      'CAD': 'CA$',
      'AUD': 'A$',
      'MXN': 'MX$',
      'BRL': 'R$',
      'INR': '₹',
      'RUB': '₽',
      'KRW': '₩',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RON': 'lei',
      'BGN': 'лв',
      'HRK': 'kn',
      'TRY': '₺',
      'ZAR': 'R',
      'ARS': 'AR$',
      'CLP': 'CL$',
      'COP': 'CO$',
      'PEN': 'S/',
    };

    return currencyMap[currencyCode.toUpperCase()] || currencyCode;
  }
}
