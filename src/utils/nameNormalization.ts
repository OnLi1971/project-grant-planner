// Utility funkce pro normalizaci jmen konstruktérů
// Tato funkce replikuje logiku z DB funkce normalize_name() na klientovi

export const normalizeName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .replace(/[áäćčďéěëíîĺľňóöŕřšťúůüýž]/g, (char) => {
      const map: { [key: string]: string } = {
        'á': 'a', 'ä': 'a', 'ć': 'c', 'č': 'c', 'ď': 'd',
        'é': 'e', 'ě': 'e', 'ë': 'e', 'í': 'i', 'î': 'i',
        'ĺ': 'l', 'ľ': 'l', 'ň': 'n', 'ó': 'o', 'ö': 'o',
        'ŕ': 'r', 'ř': 'r', 'š': 's', 'ť': 't', 'ú': 'u',
        'ů': 'u', 'ü': 'u', 'ý': 'y', 'ž': 'z'
      };
      return map[char] || char;
    });
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