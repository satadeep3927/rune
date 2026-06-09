export function getLuminance(hex: string) {
  try {
    const c = hex.startsWith("#") ? hex.substring(1) : hex;
    // For 3-digit hex like #FFF
    const expanded = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
    const rgb = parseInt(expanded, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch (e) {
    return 0;
  }
}
