declare module "@open-spaced-repetition/binding" {
  export interface FSRSItem {
    reviews: { rating: number; delta_t: number }[];
  }

  export interface ComputeParametersResult {
    w: Float64Array | number[];
    metrics: Record<string, number>;
  }

  export interface ComputeParametersOptions {
    enableShortTerm?: boolean;
    timeout?: number;
    progress?: (current: number, total: number) => void;
  }

  export function convertCsvToFsrsItems(
    csv: string,
    maxRating: number,
    timezone: string,
    offsetFn: (ms: number) => number
  ): FSRSItem[];

  export function computeParameters(
    items: FSRSItem[],
    options?: ComputeParametersOptions
  ): Promise<ComputeParametersResult>;
}
