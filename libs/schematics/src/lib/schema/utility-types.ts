import { Symbol as TsSymbol } from 'typescript';

const utilityTypes = ['Partial', 'Readonly', 'Pick', 'Omit'];

/** Types that keep the contract or the base of the type they wrap. */
export function isUtilityType(symbol: TsSymbol | undefined): boolean {
  return !!symbol && utilityTypes.includes(symbol.name);
}
