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
export const parisMarketHistory = [
  { year: '2005', price: 5200 },
  { year: '2006', price: 5600 },
  { year: '2007', price: 6000 },
  { year: '2008', price: 6500, event: 'eventSubprimes' },
  { year: '2009', price: 6400 },
  { year: '2010', price: 7000 },
  { year: '2011', price: 8200 },
  { year: '2012', price: 8400, event: 'eventEuro' },
  { year: '2013', price: 8300 },
  { year: '2014', price: 8100 },
  { year: '2015', price: 8200 },
  { year: '2016', price: 8400 },
  { year: '2017', price: 8800 },
  { year: '2018', price: 9600 },
  { year: '2019', price: 10200 },
  { year: '2020', price: 10600, event: 'eventCovid' },
  { year: '2021', price: 9827 },
  { year: '2022', price: 10100 },
  { year: '2023', price: 10420, event: 'eventRates' },
  { year: '2024', price: 10580 },
  { year: '2025*', price: 9650 }
];

// Données de liquidité (Volume mensuel estimé 2025)
export const parisLiquidity2025 = [
  { month: 'Jan', volume: 2100, status: 'stable' },
  { month: 'Feb', volume: 1950, status: 'stable' },
  { month: 'Mar', volume: 2450, status: 'active' },
  { month: 'Apr', volume: 2200, status: 'stable' },
  { month: 'May', volume: 2900, status: 'high' },
  { month: 'Jun', volume: 2750, status: 'active' },
];

// Paris Vacancy History
export const parisVacancyHistory = [
  { year: '2005', rate: 2.4 },
  { year: '2006', rate: 2.5 },
  { year: '2007', rate: 2.4 },
  { year: '2008', rate: 2.6, event: 'eventSubprimes' },
  { year: '2009', rate: 2.8 },
  { year: '2010', rate: 2.8 },
  { year: '2011', rate: 2.7 },
  { year: '2012', rate: 2.9, event: 'eventEuro' },
  { year: '2013', rate: 2.8 },
  { year: '2014', rate: 2.7 },
  { year: '2015', rate: 2.6 },
  { year: '2016', rate: 2.5 },
  { year: '2017', rate: 2.4 },
  { year: '2018', rate: 2.3 },
  { year: '2019', rate: 2.2 },
  { year: '2020', rate: 3.0, event: 'eventCovid' },
  { year: '2021', rate: 2.9 },
  { year: '2022', rate: 2.7 },
  { year: '2023', rate: 2.8, event: 'eventRates' },
  { year: '2024', rate: 2.8 },
  { year: '2025*', rate: 2.8 }
];

//Paris Housing Demand History (New Builds)
export const parisHousingDemandHistory = [
  { year: '2005', builds: 576 },
  { year: '2006', builds: 576 },
  { year: '2007', builds: 576 },
  { year: '2008', builds: 480, event: 'eventSubprimes' },
  { year: '2009', builds: 343 },
  { year: '2010', builds: 380 },
  { year: '2011', builds: 400 },
  { year: '2012', builds: 350, event: 'eventEuro' },
  { year: '2013', builds: 320 },
  { year: '2014', builds: 300 },
  { year: '2015', builds: 280 },
  { year: '2016', builds: 270 },
  { year: '2017', builds: 260 },
  { year: '2018', builds: 250 },
  { year: '2019', builds: 240 },
  { year: '2020', builds: 200, event: 'eventCovid' },
  { year: '2021', builds: 180 },
  { year: '2022', builds: 150 },
  { year: '2023', builds: 100, event: 'eventRates' },
  { year: '2024', builds: 59 },
  { year: '2025*', builds: 60 }
];
//Correlation with Inflation: Rents vs. CPI (% YoY)
//Paris Rents vs. CPI
export const parisRentVsCpiHistory = [
  { year: '2005', rentGrowth: 2.5, cpi: 1.9 },
  { year: '2006', rentGrowth: 3.9, cpi: 1.7 },
  { year: '2007', rentGrowth: 3.5, cpi: 1.5 },
  { year: '2008', rentGrowth: 3.0, cpi: 2.8, event: 'eventSubprimes' },
  { year: '2009', rentGrowth: 1.0, cpi: 0.1 },
  { year: '2010', rentGrowth: 1.5, cpi: 1.5 },
  { year: '2011', rentGrowth: 2.0, cpi: 2.1 },
  { year: '2012', rentGrowth: 1.8, cpi: 2.0, event: 'eventEuro' },
  { year: '2013', rentGrowth: 1.2, cpi: 0.9 },
  { year: '2014', rentGrowth: 0.8, cpi: 0.5 },
  { year: '2015', rentGrowth: 0.5, cpi: 0.0 },
  { year: '2016', rentGrowth: 0.2, cpi: 0.2 },
  { year: '2017', rentGrowth: 1.0, cpi: 1.0 },
  { year: '2018', rentGrowth: 1.5, cpi: 1.9 },
  { year: '2019', rentGrowth: 1.2, cpi: 1.1 },
  { year: '2020', rentGrowth: 1.0, cpi: 0.5, event: 'eventCovid' },
  { year: '2021', rentGrowth: 0.8, cpi: 1.6 },
  { year: '2022', rentGrowth: 1.5, cpi: 5.2 },
  { year: '2023', rentGrowth: 2.0, cpi: 4.9, event: 'eventRates' },
  { year: '2024', rentGrowth: 2.4, cpi: 2.3 },
  { year: '2025*', rentGrowth: 2.3, cpi: 2.0 }
];

//France (Livret A vs. Paris Yields)
export const franceYieldSpreadHistory = [
  { year: '2005', savings: 2.25, rental: 4.8, spread: 2.55 },
  { year: '2006', savings: 2.75, rental: 4.5, spread: 1.75 },
  { year: '2007', savings: 3.0, rental: 4.3, spread: 1.3 },
  { year: '2008', savings: 4.0, rental: 4.2, spread: 0.2, event: 'eventSubprimes' },
  { year: '2009', savings: 1.75, rental: 4.1, spread: 2.35 },
  { year: '2010', savings: 1.75, rental: 4.0, spread: 2.25 },
  { year: '2011', savings: 2.25, rental: 3.9, spread: 1.65 },
  { year: '2012', savings: 2.25, rental: 3.8, spread: 1.55, event: 'eventEuro' },
  { year: '2013', savings: 1.75, rental: 3.7, spread: 1.95 },
  { year: '2014', savings: 1.0, rental: 3.6, spread: 2.6 },
  { year: '2015', savings: 0.75, rental: 3.5, spread: 2.75 },
  { year: '2016', savings: 0.75, rental: 3.4, spread: 2.65 },
  { year: '2017', savings: 0.75, rental: 3.3, spread: 2.55 },
  { year: '2018', savings: 0.75, rental: 3.2, spread: 2.45 },
  { year: '2019', savings: 0.75, rental: 3.1, spread: 2.35 },
  { year: '2020', savings: 0.5, rental: 4.0, spread: 3.5, event: 'eventCovid' },
  { year: '2021', savings: 0.5, rental: 4.2, spread: 3.7 },
  { year: '2022', savings: 2.0, rental: 4.4, spread: 2.4 },
  { year: '2023', savings: 3.0, rental: 4.6, spread: 1.6, event: 'eventRates' },
  { year: '2024', savings: 3.0, rental: 4.7, spread: 1.7 },
  { year: '2025*', savings: 3.0, rental: 4.8, spread: 1.8 }
];

//Démographie 
export const parisDemography = [
  { year: 2005, population: 2150000, growth: -0.1 },
  { year: 2010, population: 2210000, growth: 0.3 },
  { year: 2015, population: 2240000, growth: 0.2 },
  { year: 2020, population: 2140000, growth: -0.4 },
  { year: 2025, population: 2110000, growth: -0.3 },
];

// Finances & fiscalité
export const parisFinanceTax = [
  { year: 2005, interestRate: 3.5, taxeFonciere: 14, creditAccess: "medium" },
  { year: 2010, interestRate: 2.8, taxeFonciere: 14.5, creditAccess: "easy" },
  { year: 2015, interestRate: 1.5, taxeFonciere: 15, creditAccess: "very_easy" },
  { year: 2020, interestRate: 1.2, taxeFonciere: 15.5, creditAccess: "tight" },
  { year: 2025, interestRate: 4.2, taxeFonciere: 16, creditAccess: "very_tight" },
];

// Indicateurs investisseurs
export const parisInvestorIndicators = [
  { year: 2005, yield: 3.8, priceM2: 6200, liquidity: "medium" },
  { year: 2010, yield: 3.5, priceM2: 7800, liquidity: "high" },
  { year: 2015, yield: 3.1, priceM2: 9000, liquidity: "high" },
  { year: 2020, yield: 2.8, priceM2: 10600, liquidity: "medium" },
  { year: 2025, yield: 3.0, priceM2: 9800, liquidity: "stable" },
];

export const accessDataParis = [
  { year: 2005, ratio: 12.5, homeownership: 60.5, capable: 40, excluded: 60 },
  { year: 2006, ratio: 13.2, homeownership: 61, capable: 38, excluded: 62 },
  { year: 2007, ratio: 14.0, homeownership: 60.5, capable: 36, excluded: 64 },
  { year: 2008, ratio: 15.0, homeownership: 61, capable: 33, excluded: 67 },
  { year: 2009, ratio: 15.5, homeownership: 62, capable: 32, excluded: 68 },
  { year: 2010, ratio: 15.2, homeownership: 62, capable: 33, excluded: 67 },
  { year: 2011, ratio: 16.5, homeownership: 63, capable: 30, excluded: 70 },
  { year: 2012, ratio: 17.0, homeownership: 63, capable: 29, excluded: 71 },
  { year: 2013, ratio: 18.0, homeownership: 63, capable: 28, excluded: 72 },
  { year: 2014, ratio: 19.0, homeownership: 64, capable: 26, excluded: 74 },
  { year: 2015, ratio: 20.1, homeownership: 64, capable: 25, excluded: 75 },
  { year: 2016, ratio: 21.0, homeownership: 64, capable: 24, excluded: 76 },
  { year: 2017, ratio: 22.0, homeownership: 65, capable: 23, excluded: 77 },
  { year: 2018, ratio: 23.5, homeownership: 65.1, capable: 21, excluded: 79 },
  { year: 2019, ratio: 24.5, homeownership: 65, capable: 20, excluded: 80 },
  { year: 2020, ratio: 22.4, homeownership: 64, capable: 22, excluded: 78 },
  { year: 2021, ratio: 23.0, homeownership: 64, capable: 22, excluded: 78 },
  { year: 2022, ratio: 24.5, homeownership: 63, capable: 20, excluded: 80 },
  { year: 2023, ratio: 26.0, homeownership: 63.1, capable: 19, excluded: 81 },
  { year: 2024, ratio: 27.0, homeownership: 61.2, capable: 19, excluded: 81 },
  { year: 2025, ratio: 27.9, homeownership: 61, capable: 25, excluded: 75 }
];

export const parisPopulationData = [{ year: 2005, cityProper: 2172186, metro: 10092000 }, { year: 2006, cityProper: 2181371, metro: 10164000 }, { year: 2007, cityProper: 2193030, metro: 10238000 }, { year: 2008, cityProper: 2211297, metro: 10311000 }, { year: 2009, cityProper: 2234105, metro: 10385000 }, { year: 2010, cityProper: 2243833, metro: 10460000 }, { year: 2011, cityProper: 2249975, metro: 10514000 }, { year: 2012, cityProper: 2240621, metro: 10569000 }, { year: 2013, cityProper: 2229621, metro: 10623000 }, { year: 2014, cityProper: 2220445, metro: 10678000 }, { year: 2015, cityProper: 2206488, metro: 10734000 }, { year: 2016, cityProper: 2190327, metro: 10789000 }, { year: 2017, cityProper: 2187526, metro: 10845000 }, { year: 2018, cityProper: 2175601, metro: 10901000 }, { year: 2019, cityProper: 2165423, metro: 10958000 }, { year: 2020, cityProper: 2145906, metro: 11017000 }, { year: 2021, cityProper: 2133111, metro: 11079000 }, { year: 2022, cityProper: 2113705, metro: 11142000 }, { year: 2023, cityProper: 2103778, metro: 11208000 }, { year: 2024, cityProper: 2084894, metro: 11277000 }, { year: 2025, cityProper: 2065560, metro: 11347000 },];

export const franceUnemploymentData = [{ year: 2005, rate: 8.94 }, { year: 2010, rate: 9.34 }, { year: 2015, rate: 10.41 }, { year: 2020, rate: 8.01 }, { year: 2024, rate: 7.37 }, { year: 2025, rate: 7.4 },];
export const parisUnemploymentQ3_2025 = { year: 2025, quarter: "Q3", rate: 6.1 };
export const franceHomelessData = [{ year: 2001, number: 93000 }, { year: 2012, number: 141500 }, { year: 2020, number: 143000 }, { year: 2024, number: 350000 },];
export const parisHomelessShareData = { year: 2024, share: 0.44 }; // ~44%
export const franceNetMigrationData = [{ year: 2005, net: 191417 }, { year: 2010, net: 52644 }, { year: 2015, net: -345 }, { year: 2020, net: 145593 }, { year: 2025, net: 90000 },];


