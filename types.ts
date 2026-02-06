
export enum ThreatLevel {
  LEAST_CONCERN = "Least Concern",
  NEAR_THREATENED = "Near Threatened",
  VULNERABLE = "Vulnerable",
  ENDANGERED = "Endangered",
  CRITICALLY_ENDANGERED = "Critically Endangered",
  EXTINCT_IN_WILD = "Extinct in the Wild",
  EXTINCT = "Extinct"
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MapRegion {
  name: string;
  latitude: number;
  longitude: number;
}

export interface AnimalTaxonomy {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

export interface ScientificPaper {
  title: string;
  authors: string;
  year: number;
  journal: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AnimalData {
  isAnimal: boolean;
  commonName: string;
  scientificName: string;
  taxonomy: AnimalTaxonomy;
  evolutionaryHistory: string;
  habitat: string;
  habitatMapRegions: MapRegion[];
  diet: string;
  physicalFeatures: string[];
  visualDescriptionForAi: string;
  behavior: string;
  roleInEcosystem: string;
  threats: {
    level: ThreatLevel;
    description: string;
  };
  wikipediaSummary: string;
  aiResearchMethodology: string;
  funFacts: string[];
  scientificLiterature?: ScientificPaper[];
  quiz: QuizQuestion[];
  sources?: GroundingSource[];
  suggestions?: string[];
}

export interface FavoriteItem {
  name: string;
  scientificName: string;
  image: string;
}

export interface AppState {
  animal: string;
  loading: boolean;
  error: string | null;
  data: AnimalData | null;
  imageUrls: string[] | null;
  favorites: FavoriteItem[];
  searchHistory: string[];
  streak: number;
  lastSearchDate: string | null;
}
