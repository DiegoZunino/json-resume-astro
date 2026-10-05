/** WCAG 2.x relative luminance contrast between two CSS colours (rgb/rgba). */
export function contrast(a: string, b: string): number {
  const lum = (color: string) => {
    const [r, g, bl] = (color.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map(Number)
      .map((c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Private values of the fixtures: they must never appear in the published site. */
export const PRIVATE_VALUES = [
  '+39 011 555 0199',
  '0115550199',
  'Nota riservata per i test',
  'Obiettivo riservato',
  'Private objective',
];
