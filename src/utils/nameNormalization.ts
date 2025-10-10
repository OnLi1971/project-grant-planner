// Utility funkce pro normalizaci jmen konstruktérů
// Tato funkce replikuje logiku z DB funkce normalize_name() na klientovi
// Rozšířená verze: pokrývá španělské znaky, whitespace anomálie, Unicode NFD

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g; // Zero-width chars
const NBSP = /\u00A0/g;                      // Non-breaking space
const MULTI_SPACE = /\s+/g;                  // Multiple spaces

export const normalizeName = (name: string): string => {
  if (!name) return '';
  
  // 1) Trim + odstranění neviditelných znaků a NBSP
  let s = String(name)
    .replace(ZERO_WIDTH, '')
    .replace(NBSP, ' ')
    .trim();
  
  // 2) Unicode NFD normalizace + odstranění kombinujících diakritických znamének
  s = s.normalize('NFD').replace(/\p{M}+/gu, '');
  
  // 3) Speciální výjimky (German ß, Spanish ñ, atd.)
  s = s
    .replace(/ß/g, 'ss')
    .replace(/ñ/gi, 'n');
  
  // 4) Sjednocení whitespace & lowercase
  s = s.replace(MULTI_SPACE, ' ').toLowerCase();
  
  return s;
};

// Utility funkce pro nalezení konstruktéra podle normalizovaného jména
export const findEngineerByName = (engineers: any[], targetName: string): any => {
  const normalizedTarget = normalizeName(targetName);
  return engineers.find(engineer => 
    normalizeName(engineer.jmeno || engineer.konstrukter || engineer.name) === normalizedTarget
  );
};

// Utility funkce pro mapování jmen z DB na display names
export const createNameMapping = (engineers: any[]): Map<string, string> => {
  const mapping = new Map<string, string>();
  engineers.forEach(engineer => {
    const name = engineer.jmeno || engineer.konstrukter || engineer.name;
    if (name) {
      mapping.set(normalizeName(name), name);
    }
  });
  return mapping;
};