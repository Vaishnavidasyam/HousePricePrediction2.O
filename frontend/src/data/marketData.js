export const API_BASE_URL = "http://127.0.0.1:8000";

export const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'Building' },
  { id: 'villa', label: 'Villa', icon: 'Home' },
  { id: 'plot', label: 'Plot', icon: 'Map' },
  { id: 'commercial', label: 'Commercial', icon: 'Briefcase' },
  { id: 'luxury', label: 'Luxury Residence', icon: 'Crown' },
  { id: 'township', label: 'Township', icon: 'Globe' },
];

export const FALLBACK_CITY_METADATA = [
  {
    city: "Hyderabad",
    supported_bhk: [1, 2, 3, 4, 5],
    localities: ["Gachibowli", "Kondapur", "Madhapur", "Kukatpally", "Banjara Hills", "Jubilee Hills", "Nanakramguda", "Alkapur", "Ameerpet", "Manikonda"],
  },
  {
    city: "Bengaluru",
    supported_bhk: [1, 2, 3, 4, 5],
    localities: ["Whitefield", "Electronic City", "Koramangala", "HSR Layout", "Indira Nagar", "Hebbal", "Marathahalli", "Sarjapur Road", "Jayanagar", "Yelahanka"],
  },
  {
    city: "Mumbai",
    supported_bhk: [1, 2, 3, 4, 5],
    localities: ["Andheri East", "Andheri West", "Bandra West", "Bandra Kurla Complex", "Powai", "Borivali West", "Thane West", "Worli", "Airoli", "Chembur"],
  },
  {
    city: "Kolkata",
    supported_bhk: [1, 2, 3, 4, 5],
    localities: ["New Town", "Action Area 1", "Action Area 2", "Rajarhat", "Salt Lake City", "Alipore", "Behala", "Ballygunge", "BT Road", "Jadavpur"],
  },
  {
    city: "Gurgaon",
    supported_bhk: [1, 2, 3, 4, 5],
    localities: ["DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "DLF Phase 4", "DLF Phase 5", "Golf Course Ext Road", "MG Road", "Sohna Road", "Palam Vihar", "Sector 56"],
  },
];

export const CITY_PROFILES = {
  Hyderabad: { growth: 13.2, yield: 4.1, risk: "Moderate", infra: 88, demand: 91, color: "#00b8a9" },
  Bengaluru: { growth: 11.8, yield: 3.8, risk: "Balanced", infra: 84, demand: 94, color: "#5b7cfa" },
  Mumbai: { growth: 8.7, yield: 2.9, risk: "Low", infra: 92, demand: 97, color: "#f59f00" },
  Kolkata: { growth: 7.4, yield: 3.5, risk: "Value", infra: 78, demand: 75, color: "#e64980" },
  Gurgaon: { growth: 10.6, yield: 3.7, risk: "Balanced", infra: 86, demand: 89, color: "#12b886" },
};

export const CITIES = FALLBACK_CITY_METADATA.map((item) => item.city);

export const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

export const areaSqmToSqft = (sqm) => Math.round(Number(sqm || 0) * 10.7639);
export const areaSqftToSqm = (sqft) => Math.round(Number(sqft || 0) / 10.7639);

export const getProfile = (city) => CITY_PROFILES[city] || CITY_PROFILES.Bengaluru;

export const estimatePrice = ({ city = "Bengaluru", bhk = 2, area_sqm = 100, propertyType = 'apartment' }) => {
  const profile = getProfile(city);
  const baseByCity = {
    Hyderabad: 98000,
    Bengaluru: 112000,
    Mumbai: 265000,
    Kolkata: 72000,
    Gurgaon: 138000,
  };
  
  const typeMultipliers = {
    apartment: 1.0,
    villa: 1.65,
    plot: 0.85,
    commercial: 1.45,
    luxury: 2.2,
    township: 1.15
  };

  const sqft = areaSqmToSqft(area_sqm);
  const bhkMultiplier = 1 + (Number(bhk) - 2) * 0.12;
  const typeMultiplier = typeMultipliers[propertyType] || 1.0;
  const demandMultiplier = 0.86 + profile.demand / 500;
  
  return Math.round((baseByCity[city] || 110000) * sqft * bhkMultiplier * typeMultiplier * demandMultiplier);
};

export const generateForecast = (basePrice, years = 10) => {
  const yearsArr = Array.from({ length: years + 1 }, (_, i) => i);
  const baseGrowth = 0.08;
  
  return yearsArr.map(year => {
    const base = basePrice * Math.pow(1 + baseGrowth, year);
    return {
      year: 2024 + year,
      base: Math.round(base),
      bull: Math.round(base * Math.pow(1.04, year)),
      bear: Math.round(base * Math.pow(0.95, year)),
    };
  });
};

export const getAmenities = (city, locality) => [
  { name: "Metro Station", distance: "0.8 km", time: "10 mins", score: 95, icon: "TrainFront" },
  { name: "International Airport", distance: "32 km", time: "55 mins", score: 78, icon: "Plane" },
  { name: "Multi-specialty Hospital", distance: "2.4 km", time: "12 mins", score: 88, icon: "Hospital" },
  { name: "Premium School", distance: "1.2 km", time: "5 mins", score: 92, icon: "School" },
  { name: "IT Park / Business Hub", distance: "3.5 km", time: "15 mins", score: 96, icon: "Briefcase" },
  { name: "Luxury Shopping Mall", distance: "1.8 km", time: "8 mins", score: 84, icon: "ShoppingBag" },
];

export const getMarketPulse = (city) => {
  const profile = getProfile(city);
  return [
    { label: "Demand Score", value: profile.demand, trend: "+4.2%", icon: "TrendingUp" },
    { label: "Supply Pressure", value: 100 - profile.demand + 10, trend: "-2.1%", icon: "Layers" },
    { label: "Buyer Interest", value: Math.round(profile.demand * 1.05), trend: "+8.4%", icon: "Users" },
    { label: "Rental Activity", value: Math.round(profile.yield * 20), trend: "+1.2%", icon: "Key" },
  ];
};

export const getAdjustedProfile = (city, propertyType = 'apartment', bhk = 2) => {
  const profile = getProfile(city);
  let { yield: y, growth: g, demand: d, infra: i, risk } = profile;
  
  if (propertyType === 'commercial') {
    y += 2.8; g -= 1.2; d += 4; risk = "Balanced";
  } else if (propertyType === 'plot') {
    y = 0.0; g += 3.5; d -= 5; risk = "Speculative";
  } else if (propertyType === 'luxury') {
    y -= 1.2; g += 1.8; d -= 12; risk = "High";
  } else if (propertyType === 'villa') {
    y -= 0.6; g += 0.8; d -= 4;
  } else if (propertyType === 'township') {
    y += 0.4; i = Math.min(99, i + 8);
  }
  
  bhk = Number(bhk);
  if (propertyType === 'apartment' || propertyType === 'villa' || propertyType === 'luxury') {
      if (bhk === 1) { y += 0.8; d += 8; g -= 0.5; }
      else if (bhk === 2) { y += 0.2; d += 4; }
      else if (bhk === 3) { y -= 0.2; d -= 2; g += 0.5; }
      else if (bhk === 4) { y -= 0.5; d -= 6; g += 1.0; }
      else if (bhk === 5) { y -= 0.8; d -= 10; g += 1.5; }
  }

  return {
    ...profile,
    yield: Math.max(0, Number(y.toFixed(1))),
    growth: Number(g.toFixed(1)),
    demand: Math.min(99, Math.max(10, Math.round(d))),
    infra: Math.min(99, Math.max(10, Math.round(i))),
    risk
  };
};

export const getCityMeta = (metadata, city) =>
  (metadata || FALLBACK_CITY_METADATA).find((item) => item.city === city) || FALLBACK_CITY_METADATA[1];

export const topLocalities = (metadata, city, count = 8) =>
  getCityMeta(metadata, city).localities.slice(0, count);

export const buildScenario = (city, locality, index = 0, config = {}) => {
  const bhk = config.bhk || ((index % 5) + 1);
  const propertyType = config.propertyType || "apartment";
  const profile = getAdjustedProfile(city, propertyType, bhk);
  const area_sqm = config.area_sqm || (50 * bhk + (index * 10));
  const estimated = estimatePrice({ city, bhk, area_sqm, propertyType });
  return {
    city,
    place: locality,
    bhk,
    area_sqm,
    estimated,
    growth: Math.max(5, profile.growth + (index - 2) * 0.45),
    yield: Math.max(0, profile.yield + (2 - index) * 0.12),
    score: Math.min(98, Math.round((profile.demand + profile.infra) / 2 + index)),
  };
};
