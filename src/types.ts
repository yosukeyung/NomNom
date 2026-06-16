export interface AspectResult {
  category: string;
  score: number;
  label: string;
  quote: string;
  sentiment: string;
}

export interface ProductSensingResult {
  productName: string;
  overallScore: number;
  overallSentiment: string;
  summary: string;
  aspects: AspectResult[];
  highlights?: string[];
  isDemoMode?: boolean;
  errorOccurred?: boolean;
  errorMessage?: string;
}
