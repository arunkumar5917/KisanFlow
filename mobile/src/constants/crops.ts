export const CROP_OPTIONS = [
  { code: 'WHEAT', name: 'Wheat', name_hi: 'गेहूं', name_pa: 'ਕਣਕ', mspPerQuintal: 2275, icon: '🌾' },
  { code: 'PADDY', name: 'Paddy', name_hi: 'धान', name_pa: 'ਧਾਨ', mspPerQuintal: 2183, icon: '🌾' },
  { code: 'MUSTARD', name: 'Mustard', name_hi: 'सरसों', name_pa: 'ਸਰਸੋਂ', mspPerQuintal: 5650, icon: '🌿' },
  { code: 'GRAM', name: 'Gram', name_hi: 'चना', name_pa: 'ਚਨਾ', mspPerQuintal: 5335, icon: '🌱' },
  { code: 'MAIZE', name: 'Maize', name_hi: 'मक्का', name_pa: 'ਮੱਕੀ', mspPerQuintal: 2090, icon: '🌽' },
];

export function getCropName(code: string, lang: 'en' | 'hi' | 'pa' = 'en'): string {
  const crop = CROP_OPTIONS.find(c => c.code === code);
  if (!crop) return code;
  return crop[`name_${lang}`] || crop.name;
}

export function getCropMsp(code: string): number {
  const crop = CROP_OPTIONS.find(c => c.code === code);
  return crop?.mspPerQuintal || 0;
}

export function getCropIcon(code: string): string {
  const crop = CROP_OPTIONS.find(c => c.code === code);
  return crop?.icon || '🌾';
}