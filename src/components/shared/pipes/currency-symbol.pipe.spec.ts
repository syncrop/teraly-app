import { CurrencySymbolPipe } from './currency-symbol.pipe';

describe('CurrencySymbolPipe', () => {
  let pipe: CurrencySymbolPipe;

  beforeEach(() => {
    pipe = new CurrencySymbolPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return € for undefined', () => {
    expect(pipe.transform(undefined)).toBe('€');
  });

  it('should return € for empty string', () => {
    expect(pipe.transform('')).toBe('€');
  });

  it('should transform EUR to €', () => {
    expect(pipe.transform('EUR')).toBe('€');
  });

  it('should transform USD to $', () => {
    expect(pipe.transform('USD')).toBe('$');
  });

  it('should transform GBP to £', () => {
    expect(pipe.transform('GBP')).toBe('£');
  });

  it('should transform PLN to zł', () => {
    expect(pipe.transform('PLN')).toBe('zł');
  });

  it('should transform UAH to ₴', () => {
    expect(pipe.transform('UAH')).toBe('₴');
  });

  it('should transform JPY to ¥', () => {
    expect(pipe.transform('JPY')).toBe('¥');
  });

  it('should transform CNY to ¥', () => {
    expect(pipe.transform('CNY')).toBe('¥');
  });

  it('should transform MXN to MX$', () => {
    expect(pipe.transform('MXN')).toBe('MX$');
  });

  it('should transform BRL to R$', () => {
    expect(pipe.transform('BRL')).toBe('R$');
  });

  it('should transform INR to ₹', () => {
    expect(pipe.transform('INR')).toBe('₹');
  });

  it('should handle lowercase currency codes', () => {
    expect(pipe.transform('usd')).toBe('$');
    expect(pipe.transform('eur')).toBe('€');
    expect(pipe.transform('gbp')).toBe('£');
  });

  it('should handle mixed case currency codes', () => {
    expect(pipe.transform('UsD')).toBe('$');
    expect(pipe.transform('EuR')).toBe('€');
  });

  it('should return original code for unknown currency', () => {
    expect(pipe.transform('XYZ')).toBe('XYZ');
    expect(pipe.transform('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should transform all supported currencies correctly', () => {
    const testCases = [
      { code: 'CHF', symbol: 'CHF' },
      { code: 'CAD', symbol: 'CA$' },
      { code: 'AUD', symbol: 'A$' },
      { code: 'RUB', symbol: '₽' },
      { code: 'KRW', symbol: '₩' },
      { code: 'SEK', symbol: 'kr' },
      { code: 'NOK', symbol: 'kr' },
      { code: 'DKK', symbol: 'kr' },
      { code: 'CZK', symbol: 'Kč' },
      { code: 'HUF', symbol: 'Ft' },
      { code: 'RON', symbol: 'lei' },
      { code: 'BGN', symbol: 'лв' },
      { code: 'HRK', symbol: 'kn' },
      { code: 'TRY', symbol: '₺' },
      { code: 'ZAR', symbol: 'R' },
      { code: 'ARS', symbol: 'AR$' },
      { code: 'CLP', symbol: 'CL$' },
      { code: 'COP', symbol: 'CO$' },
      { code: 'PEN', symbol: 'S/' }
    ];

    testCases.forEach(({ code, symbol }) => {
      expect(pipe.transform(code)).toBe(symbol);
    });
  });
});
