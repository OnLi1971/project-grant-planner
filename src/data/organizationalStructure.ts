export interface Employee {
  id: string;
  name: string;
  company: string;
  program: string;
  organizationalLeader: string;
}

export const employees: Employee[] = [
  { id: '1', name: 'Ambrož David', company: 'TM CZ a.s.', program: 'Steam Turbines', organizationalLeader: 'OnLi' },
  { id: '2', name: 'Anovčín Branislav', company: 'TM CZ a.s.', program: 'Steam Turbines', organizationalLeader: 'DaAm' },
  { id: '3', name: 'Bartovič Anton', company: 'TM CZ a.s.', program: 'Steam Turbines', organizationalLeader: 'DaAm' },
  { id: '4', name: 'Bartovičová Agáta', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '5', name: 'Bohušík Martin', company: 'MB idea SK, s.r.o.', program: 'N/A', organizationalLeader: 'Dodavatel' },
  { id: '6', name: 'Borský Jan', company: 'TM CZ a.s.', program: 'Electro Design', organizationalLeader: 'PaHo' },
  { id: '7', name: 'Břicháček Miloš', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '8', name: 'Brojír Jaroslav', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '9', name: 'Chrenko Daniel', company: 'MB idea SK, s.r.o.', program: 'N/A', organizationalLeader: 'Dodavatel' },
  { id: '10', name: 'Chrenko Peter', company: 'MB idea SK, s.r.o.', program: 'N/A', organizationalLeader: 'Dodavatel' },
  { id: '11', name: 'Fenyk Pavel', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '12', name: 'Fica Ladislav', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '13', name: 'Friedlová Jiřina', company: 'TM CZ a.s.', program: 'IWE', organizationalLeader: 'OnLi' },
  { id: '14', name: 'Fuchs Pavel', company: 'TM CZ a.s.', program: 'Steam Turbines', organizationalLeader: 'DaAm' },
  { id: '15', name: 'Heřman Daniel', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '16', name: 'Hibler František', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '17', name: 'Hlavan Martin', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '18', name: 'Hrachová Ivana', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '19', name: 'Jandečka Karel', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '20', name: 'Ješš Jozef', company: 'TM CZ a.s.', program: 'Stress Analysis', organizationalLeader: 'PeNe' },
  { id: '21', name: 'Jiřička Aleš', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '22', name: 'Jurčišin Peter', company: 'MB idea SK, s.r.o.', program: 'N/A', organizationalLeader: 'Dodavatel' },
  { id: '23', name: 'Kalafa Ján', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '24', name: 'Karlesz Michal', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '25', name: 'Karlík Štěpán', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '26', name: 'Klíma Milan', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '27', name: 'Lengyel Martin', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '28', name: 'Litvinov Evgenii', company: 'TM CZ a.s.', program: 'Electro Design', organizationalLeader: 'PaHo' },
  { id: '29', name: 'Madanský Peter', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'OnLi' },
  { id: '30', name: 'Matta Jozef', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'OnLi' },
  { id: '31', name: 'Melichar Ondřej', company: 'TM CZ a.s.', program: 'Stress Analysis', organizationalLeader: 'PeNe' },
  { id: '32', name: 'Mohelník Martin', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '33', name: 'Nedavaška Petr', company: 'TM CZ a.s.', program: '', organizationalLeader: 'OnLi' },
  { id: '34', name: 'Pecinovský Pavel', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '35', name: 'Púpava Marián', company: 'MB idea SK, s.r.o.', program: 'N/A', organizationalLeader: 'Dodavatel' },
  { id: '36', name: 'Pytela Martin', company: 'TM CZ a.s.', program: 'Electro Design', organizationalLeader: 'PaHo' },
  { id: '37', name: 'Samko Mikuláš', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '38', name: 'Šedovičová Darina', company: 'TM CZ a.s.', program: 'Stress Analysis', organizationalLeader: 'PeNe' },
  { id: '39', name: 'Slavík Ondřej', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'KaSo' },
  { id: '40', name: 'Šoupa Karel', company: 'TM CZ a.s.', program: 'Car Body & Bogies', organizationalLeader: 'OnLi' },
  { id: '41', name: 'Stránský Martin', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '42', name: 'Trač Vasyl', company: 'TM CZ a.s.', program: 'General Machinery', organizationalLeader: 'PeMa' },
  { id: '43', name: 'Uher Tomáš', company: 'TM CZ a.s.', program: 'Steam Turbines', organizationalLeader: 'DaAm' },
  { id: '44', name: 'Večeř Jiří', company: 'TM CZ a.s.', program: 'Interiors & Non-metallic Design', organizationalLeader: 'JoMa' },
  { id: '45', name: 'Weiss Ondřej', company: 'TM CZ a.s.', program: 'Electro Design', organizationalLeader: 'PaHo' }
];

export const organizationalLeaders = [
  'JoMa',
  'OnLi', 
  'KaSo',
  'PaHo',
  'PeMa',
  'DaAm',
  'PeNe',
  'Dodavatel'
];

export const companies = [
  'TM CZ a.s.',
  'MB idea SK, s.r.o.'
];

export const programs = [
  'Steam Turbines',
  'Car Body & Bogies',
  'Electro Design',
  'Interiors & Non-metallic Design',
  'General Machinery',
  'Stress Analysis',
  'IWE',
  'N/A'
];