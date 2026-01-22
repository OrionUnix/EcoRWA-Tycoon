export interface AIReport {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunities: { fr: string[]; en: string[] };
  risks: { fr: string[]; en: string[] };
}

export interface BuildingData {
  id: number;
  name: string;
  type: { fr: string; en: string };
  typeColor: string;
  coord: string;
  img: string;
  size: number;
  yield: string;
  price: string;
  pluAlert: { fr: string; en: string };
  aiReport: AIReport;
  owned: boolean;
  isMintable: boolean; // True = Disponible sur le Smart Contract
}

export const BUILDINGS_DATA: BuildingData[] = [
  {
    id: 1,
    name: 'Loft Saint-Germain',
    type: { fr: 'Résidentiel', en: 'Residential' },
    typeColor: 'blue',
    coord: 'H6',
    img: '/assets/buildings/Loft_Saint-Germain.png',
    size: 5,
    yield: '4.2%',
    price: '150 USDC',
    pluAlert: { 
      fr: 'Zone protégée, travaux interdits. Stabilité maximale.', 
      en: 'Protected zone, no construction allowed. Max stability.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Forte demande locative', 'Emplacement prestigieux'],
        en: ['High rental demand', 'Prestigious location']
      },
      risks: {
        fr: ['Règlementations strictes', 'Pas d’agrandissement possible'],
        en: ['Strict regulations', 'No expansion possible']
      }
    },
    owned: false,
    isMintable: true,
  },
  {
    id: 2,
    name: 'Le Bistrot Central',
    type: { fr: 'Commercial', en: 'Commercial' },
    typeColor: 'orange',
    coord: 'F8',
    img: '/assets/buildings/bistro.png',
    size: 4,
    yield: '7.8%',
    price: '100 USDC',
    pluAlert: { 
      fr: 'Travaux de rue prévus en 2026. Risque de vacance.', 
      en: 'Roadworks planned for 2026. Vacancy risk.' 
    },
    aiReport: {
      riskLevel: 'MEDIUM',
      opportunities: {
        fr: ['Rendement élevé', 'Clientèle fidèle'],
        en: ['High yield', 'Loyal customer base']
      },
      risks: {
        fr: ['Nuisances sonores temporaires', 'Accessibilité réduite'],
        en: ['Temporary noise issues', 'Reduced accessibility']
      }
    },
    owned: false,
    isMintable: true,
  },
  {
    id: 3,
    name: 'Eco-Tower 2030',
    type: { fr: 'Mixte', en: 'Mixed' },
    typeColor: 'green',
    coord: 'E5',
    img: '/assets/buildings/EcoTower_2030.png',
    size: 7,
    yield: '6.5%',
    price: '250 USDC',
    pluAlert: { 
      fr: 'Neuf. Exonération taxe foncière. Score Éco A+.', 
      en: 'New construction. Property tax exemption. Eco Score A+.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Bâtiment basse consommation', 'Subventions écologiques'],
        en: ['Low energy building', 'Ecological subsidies']
      },
      risks: {
        fr: ['Maintenance technique coûteuse', 'Marché volatil'],
        en: ['High maintenance costs', 'Volatile market']
      }
    },
    owned: true,
    isMintable: true,
  },
  {
    id: 4,
    name: 'Skyline Hub',
    type: { fr: 'Bureaux', en: 'Offices' },
    typeColor: 'indigo',
    coord: 'C2',
    img: '/assets/buildings/building02.png',
    size: 8,
    yield: '5.9%',
    price: '400 USDC',
    pluAlert: { 
      fr: 'Extension autorisée jusqu’à 10 étages.', 
      en: 'Extension authorized up to 10 floors.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Baux commerciaux longue durée', 'Fibre optique premium'],
        en: ['Long-term commercial leases', 'Premium fiber optic']
      },
      risks: {
        fr: ['Télétravail en hausse', 'Concurrence du quartier'],
        en: ['Rising remote work', 'District competition']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 5,
    name: 'Hôtel Riviera',
    type: { fr: 'Hôtellerie', en: 'Hospitality' },
    typeColor: 'pink',
    coord: 'B9',
    img: '/assets/buildings/building08.png',
    size: 6,
    yield: '9.2%',
    price: '350 USDC',
    pluAlert: { 
      fr: 'Taxe de séjour majorée dans cette zone.', 
      en: 'Increased tourist tax in this area.' 
    },
    aiReport: {
      riskLevel: 'HIGH',
      opportunities: {
        fr: ['Tourisme en croissance', 'Toit-terrasse aménageable'],
        en: ['Growing tourism', 'Roof terrace potential']
      },
      risks: {
        fr: ['Saisonnalité forte', 'Coûts de personnel'],
        en: ['High seasonality', 'Staffing costs']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 6,
    name: 'Résidence Pixel',
    type: { fr: 'Résidentiel', en: 'Residential' },
    typeColor: 'blue',
    coord: 'A2',
    img: '/assets/buildings/building02.png',
    size: 4,
    yield: '5.1%',
    price: '180 USDC',
    pluAlert: { 
      fr: 'Parking obligatoire pour chaque unité.', 
      en: 'Mandatory parking for each unit.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Quartier étudiant', 'Proche métro'],
        en: ['Student district', 'Near metro station']
      },
      risks: {
        fr: ['Turnover locatif élevé', 'Entretien parties communes'],
        en: ['High tenant turnover', 'Common area maintenance']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 7,
    name: 'L’Entrepôt Global',
    type: { fr: 'Logistique', en: 'Logistics' },
    typeColor: 'slate',
    coord: 'I1',
    img: '/assets/buildings/bistro.png',
    size: 8,
    yield: '11.5%',
    price: '550 USDC',
    pluAlert: { 
      fr: 'Zone industrielle. Accès poids lourds 24/7.', 
      en: 'Industrial zone. 24/7 heavy truck access.' 
    },
    aiReport: {
      riskLevel: 'MEDIUM',
      opportunities: {
        fr: ['E-commerce en boom', 'Grandes surfaces modulables'],
        en: ['E-commerce boom', 'Modular large surfaces']
      },
      risks: {
        fr: ['Réglementation incendie', 'Obsolescence technique'],
        en: ['Fire safety regulations', 'Technical obsolescence']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 8,
    name: 'Data Center X',
    type: { fr: 'Infrastructure', en: 'Infrastructure' },
    typeColor: 'violet',
    coord: 'D9',
    img: '/assets/buildings/building_nord.png',
    size: 5,
    yield: '14.0%',
    price: '700 USDC',
    pluAlert: { 
      fr: 'Normes électriques haute tension.', 
      en: 'High voltage electrical standards.' 
    },
    aiReport: {
      riskLevel: 'MEDIUM',
      opportunities: {
        fr: ['Besoin IA croissant', 'Contrat énergie garanti'],
        en: ['Growing AI needs', 'Guaranteed energy contract']
      },
      risks: {
        fr: ['Refroidissement coûteux', 'Risque cyber'],
        en: ['Costly cooling', 'Cyber risk']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 9,
    name: 'Galerie Marchande',
    type: { fr: 'Commercial', en: 'Commercial' },
    typeColor: 'orange',
    coord: 'G4',
    img: '/assets/buildings/building02.png',
    size: 9,
    yield: '8.4%',
    price: '600 USDC',
    pluAlert: { 
      fr: 'Extension possible côté Sud.', 
      en: 'South side extension possible.' 
    },
    aiReport: {
      riskLevel: 'HIGH',
      opportunities: {
        fr: ['Ancrage grandes marques', 'Flux constant'],
        en: ['Big brands anchor', 'Constant traffic']
      },
      risks: {
        fr: ['Concurrence e-commerce', 'Vacance des petites cellules'],
        en: ['E-commerce competition', 'Small unit vacancy']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 10,
    name: 'La Serre Urbaine',
    type: { fr: 'Agricole', en: 'Agricultural' },
    typeColor: 'teal',
    coord: 'J10',
    img: '/assets/buildings/building04.png',
    size: 4,
    yield: '3.5%',
    price: '120 USDC',
    pluAlert: { 
      fr: 'Usage agricole exclusif. Zéro béton.', 
      en: 'Exclusive agricultural use. Zero concrete.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Circuit court valorisé', 'Aide de la ville'],
        en: ['Valued short circuits', 'City grants']
      },
      risks: {
        fr: ['Rendement faible', 'Dépendance météo'],
        en: ['Low yield', 'Weather dependency']
      }
    },
    owned: false,
    isMintable: false,
  },
  {
    id: 11,
    name: 'Creative Studio',
    type: { fr: 'Mixte', en: 'Mixed' },
    typeColor: 'cyan',
    coord: 'A10',
    img: '/assets/buildings/building08.png',
    size: 3,
    yield: '6.8%',
    price: '140 USDC',
    pluAlert: { 
      fr: 'ERP catégorie 5. Accueil public limité.', 
      en: 'Category 5 ERP. Limited public access.' 
    },
    aiReport: {
      riskLevel: 'LOW',
      opportunities: {
        fr: ['Zone créative active', 'Faibles charges'],
        en: ['Active creative zone', 'Low charges']
      },
      risks: {
        fr: ['Insonorisation moyenne', 'Bail précaire'],
        en: ['Average soundproofing', 'Precarious lease']
      }
    },
    owned: false,
    isMintable: false,
  }
];