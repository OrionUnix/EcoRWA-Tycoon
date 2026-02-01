// Data du marché immo 
export interface MarketEvent {
  eventKey: string;   // Clé de traduction (ex: 'eventCovid')
  impact: 'low' | 'med' | 'high' | 'severe';
}

export interface ParisPriceData {
  year: string;
  price: number;
  event?: MarketEvent;
  isForecast?: boolean;
}

// Historique prix au m² avec les crises pour les traders
export const newYorkMarketHistory = [
  { year: '2005', price: 984 },
  { year: '2006', price: 1008 },
  { year: '2007', price: 1181 },
  { year: '2008', price: 1251, event: 'eventSubprimes' },
  { year: '2009', price: 1073 },
  { year: '2010', price: 1080 },
  { year: '2011', price: 1087 },
  { year: '2012', price: 1150 },
  { year: '2013', price: 1300 },
  { year: '2014', price: 1400 },
  { year: '2015', price: 1563 },
  { year: '2016', price: 1600 },
  { year: '2017', price: 1775 },
  { year: '2018', price: 1760 },
  { year: '2019', price: 1657 },
  { year: '2020', price: 1400, event: 'eventCovid' },
  { year: '2021', price: 1360 },
  { year: '2022', price: 1440 },
  { year: '2023', price: 1406, event: 'eventRates' },
  { year: '2024', price: 1391 },
  { year: '2025*', price: 1423 }
];

//New York (Manhattan) Vacancy History
export const newYorkVacancyHistory = [
  { year: '2005', rate: 3.0 },
  { year: '2006', rate: 3.0 },
  { year: '2007', rate: 3.2 },
  { year: '2008', rate: 4.0, event: 'eventSubprimes' },
  { year: '2009', rate: 5.0 },
  { year: '2010', rate: 4.0 },
  { year: '2011', rate: 3.5 },
  { year: '2012', rate: 3.0 },
  { year: '2013', rate: 2.8 },
  { year: '2014', rate: 2.5 },
  { year: '2015', rate: 2.3 },
  { year: '2016', rate: 2.2 },
  { year: '2017', rate: 3.6 },
  { year: '2018', rate: 2.5 },
  { year: '2019', rate: 2.3 },
  { year: '2020', rate: 5.5, event: 'eventCovid' },
  { year: '2021', rate: 4.5 },
  { year: '2022', rate: 3.3 },
  { year: '2023', rate: 1.4, event: 'eventRates' },
  { year: '2024', rate: 1.5 },
  { year: '2025*', rate: 1.6 }
];

//New York Housing Demand History (New Units)
export const newYorkHousingDemandHistory = [
  { year: '2005', units: 25 },
  { year: '2006', units: 26 },
  { year: '2007', units: 27 },
  { year: '2008', units: 20, event: 'eventSubprimes' },
  { year: '2009', units: 15 },
  { year: '2010', units: 10 },
  { year: '2011', units: 8 },
  { year: '2012', units: 7.5 },
  { year: '2013', units: 10 },
  { year: '2014', units: 15 },
  { year: '2015', units: 20 },
  { year: '2016', units: 22 },
  { year: '2017', units: 24 },
  { year: '2018', units: 29 },
  { year: '2019', units: 26 },
  { year: '2020', units: 21, event: 'eventCovid' },
  { year: '2021', units: 22 },
  { year: '2022', units: 25 },
  { year: '2023', units: 30, event: 'eventRates' },
  { year: '2024', units: 27 },
  { year: '2025*', units: 28 }
];

//NYC Rents vs. U.S. CPI
export const newYorkRentVsCpiHistory = [
  { year: '2005', rentGrowth: 3.5, cpi: 3.4 },
  { year: '2006', rentGrowth: 3.6, cpi: 3.2 },
  { year: '2007', rentGrowth: 4.0, cpi: 2.8 },
  { year: '2008', rentGrowth: 3.8, cpi: 3.8, event: 'eventSubprimes' },
  { year: '2009', rentGrowth: -1.0, cpi: -0.4 },
  { year: '2010', rentGrowth: -0.7, cpi: 1.6 },
  { year: '2011', rentGrowth: 2.5, cpi: 3.2 },
  { year: '2012', rentGrowth: 3.2, cpi: 2.1 },
  { year: '2013', rentGrowth: 3.5, cpi: 1.5 },
  { year: '2014', rentGrowth: 3.0, cpi: 1.6 },
  { year: '2015', rentGrowth: 3.0, cpi: 0.1 },
  { year: '2016', rentGrowth: 2.8, cpi: 1.3 },
  { year: '2017', rentGrowth: 2.5, cpi: 2.1 },
  { year: '2018', rentGrowth: 2.7, cpi: 2.4 },
  { year: '2019', rentGrowth: 2.4, cpi: 1.8 },
  { year: '2020', rentGrowth: 2.5, cpi: 1.2, event: 'eventCovid' },
  { year: '2021', rentGrowth: 3.0, cpi: 4.7 },
  { year: '2022', rentGrowth: 5.6, cpi: 8.0 },
  { year: '2023', rentGrowth: 5.1, cpi: 4.1, event: 'eventRates' },
  { year: '2024', rentGrowth: 4.5, cpi: 3.4 },
  { year: '2025*', rentGrowth: 4.0, cpi: 2.9 }
];

//USA (Savings vs. NYC Yields)
export const usaYieldSpreadHistory = [
  { year: '2005', savings: 3.0, rental: 6.5, spread: 3.5 },
  { year: '2006', savings: 5.0, rental: 6.0, spread: 1.0 },
  { year: '2007', savings: 4.5, rental: 5.8, spread: 1.3 },
  { year: '2008', savings: 3.0, rental: 5.7, spread: 2.7, event: 'eventSubprimes' },
  { year: '2009', savings: 0.5, rental: 5.6, spread: 5.1 },
  { year: '2010', savings: 0.1, rental: 5.5, spread: 5.4 },
  { year: '2011', savings: 0.1, rental: 5.3, spread: 5.2 },
  { year: '2012', savings: 0.1, rental: 5.2, spread: 5.1 },
  { year: '2013', savings: 0.1, rental: 5.1, spread: 5.0 },
  { year: '2014', savings: 0.1, rental: 5.0, spread: 4.9 },
  { year: '2015', savings: 0.1, rental: 5.0, spread: 4.9 },
  { year: '2016', savings: 0.3, rental: 4.9, spread: 4.6 },
  { year: '2017', savings: 0.6, rental: 4.8, spread: 4.2 },
  { year: '2018', savings: 1.4, rental: 4.7, spread: 3.3 },
  { year: '2019', savings: 1.8, rental: 4.6, spread: 2.8 },
  { year: '2020', savings: 0.1, rental: 5.5, spread: 5.4, event: 'eventCovid' },
  { year: '2021', savings: 0.1, rental: 5.7, spread: 5.6 },
  { year: '2022', savings: 2.0, rental: 6.0, spread: 4.0 },
  { year: '2023', savings: 4.5, rental: 6.2, spread: 1.7, event: 'eventRates' },
  { year: '2024', savings: 4.5, rental: 6.4, spread: 1.9 },
  { year: '2025*', savings: 4.0, rental: 6.5, spread: 2.5 }
];

// Démographie
export const newYorkDemography = [
  { year: 2005, population: 8300000, growth: 0.4 },
  { year: 2010, population: 8400000, growth: 0.2 },
  { year: 2015, population: 8550000, growth: 0.3 },
  { year: 2020, population: 8330000, growth: -0.2 },
  { year: 2025, population: 8200000, growth: -0.3 },
];

//Demande locative
export const newYorkRentalDemand = [
  { year: 2005, tensionIndex: 85, vacancyRate: 4.5 },
  { year: 2010, tensionIndex: 88, vacancyRate: 4.0 },
  { year: 2015, tensionIndex: 92, vacancyRate: 3.8 },
  { year: 2020, tensionIndex: 89, vacancyRate: 6.0 },
  { year: 2025, tensionIndex: 94, vacancyRate: 4.2 },
];

// Finances & fiscalité
export const newYorkFinanceTax = [
  { year: 2005, interestRate: 5.8, propertyTax: 1.1, creditAccess: "medium" },
  { year: 2010, interestRate: 4.2, propertyTax: 1.2, creditAccess: "easy" },
  { year: 2015, interestRate: 3.8, propertyTax: 1.3, creditAccess: "easy" },
  { year: 2020, interestRate: 2.9, propertyTax: 1.4, creditAccess: "tight" },
  { year: 2025, interestRate: 6.1, propertyTax: 1.5, creditAccess: "very_tight" },
];

//. Indicateurs investisseurs
export const newYorkInvestorIndicators = [
  { year: 2005, yield: 5.2, priceM2: 7200, liquidity: "high" },
  { year: 2010, yield: 4.9, priceM2: 8200, liquidity: "high" },
  { year: 2015, yield: 4.5, priceM2: 9800, liquidity: "very_high" },
  { year: 2020, yield: 4.1, priceM2: 11200, liquidity: "medium" },
  { year: 2025, yield: 4.3, priceM2: 11800, liquidity: "stable" },
];

export const accessDataNY = [
  { year: 2005, ratio: 8.0, homeownership: 33, capable: 35, excluded: 65 },
  { year: 2006, ratio: 7.0, homeownership: 33, capable: 37, excluded: 63 },
  { year: 2007, ratio: 7.5, homeownership: 33, capable: 36, excluded: 64 },
  { year: 2008, ratio: 8.0, homeownership: 33, capable: 35, excluded: 65 },
  { year: 2009, ratio: 7.2, homeownership: 32, capable: 36, excluded: 64 },
  { year: 2010, ratio: 6.5, homeownership: 32, capable: 38, excluded: 62 },
  { year: 2011, ratio: 6.8, homeownership: 32, capable: 37, excluded: 63 },
  { year: 2012, ratio: 7.0, homeownership: 32, capable: 37, excluded: 63 },
  { year: 2013, ratio: 7.2, homeownership: 32.0, capable: 36, excluded: 64 },
  { year: 2014, ratio: 7.5, homeownership: 32, capable: 36, excluded: 64 },
  { year: 2015, ratio: 8.0, homeownership: 32, capable: 35, excluded: 65 },
  { year: 2016, ratio: 8.2, homeownership: 32, capable: 34, excluded: 66 },
  { year: 2017, ratio: 8.5, homeownership: 32, capable: 33, excluded: 67 },
  { year: 2018, ratio: 8.7, homeownership: 33, capable: 33, excluded: 67 },
  { year: 2019, ratio: 9.0, homeownership: 33, capable: 32, excluded: 68 },
  { year: 2020, ratio: 8.5, homeownership: 33, capable: 33, excluded: 67 },
  { year: 2021, ratio: 9.0, homeownership: 33, capable: 32, excluded: 68 },
  { year: 2022, ratio: 9.5, homeownership: 33.9, capable: 30, excluded: 70 },
  { year: 2023, ratio: 9.8, homeownership: 32.5, capable: 29, excluded: 71 },
  { year: 2024, ratio: 9.9, homeownership: 32, capable: 28, excluded: 72 },
  { year: 2025, ratio: 10.0, homeownership: 32, capable: 18, excluded: 82 }
];

export const nycPopulationData = [{ year: 2005, cityProper: 8143000, metro: 18087000 }, { year: 2006, cityProper: 8214000, metro: 18142000 }, { year: 2007, cityProper: 8274000, metro: 18198000 }, { year: 2008, cityProper: 8364000, metro: 18254000 }, { year: 2009, cityProper: 8391000, metro: 18309000 }, { year: 2010, cityProper: 8175133, metro: 18365000 }, { year: 2011, cityProper: 8244000, metro: 18421000 }, { year: 2012, cityProper: 8337000, metro: 18478000 }, { year: 2013, cityProper: 8406000, metro: 18534000 }, { year: 2014, cityProper: 8491000, metro: 18591000 }, { year: 2015, cityProper: 8550000, metro: 18648000 }, { year: 2016, cityProper: 8538000, metro: 18705000 }, { year: 2017, cityProper: 8623000, metro: 18762000 }, { year: 2018, cityProper: 8399000, metro: 18819000 }, { year: 2019, cityProper: 8336000, metro: 18805000 }, { year: 2020, cityProper: 8804190, metro: 18804000 }, { year: 2021, cityProper: 8453772, metro: 18823000 }, { year: 2022, cityProper: 8356179, metro: 18867000 }, { year: 2023, cityProper: 8390888, metro: 18937000 }, { year: 2024, cityProper: 8478072, metro: 19034000 }, { year: 2025, cityProper: 8500000, metro: 19154000 },];

export const nycUnemploymentData = [{ year: 2005, rate: 5.5 }, { year: 2010, rate: 8.6 }, { year: 2015, rate: 5.7 }, { year: 2020, rate: 10.2 }, { year: 2025, rate: 5.0 },];
export const nycShelterPopulationData = [{ year: 2005, number: 35000 }, { year: 2010, number: 40000 }, { year: 2015, number: 55000 }, { year: 2020, number: 62679 }, { year: 2025, number: 101978 },];
export const nycDomesticMigrationData = [{ yearRange: "2005-06", netThousands: -63 }, { yearRange: "2010-11", netThousands: -31 }, { yearRange: "2015-16", netThousands: -80 }, { yearRange: "2020-21", netThousands: -142 }, { yearRange: "2024-25", netThousands: -137 },];