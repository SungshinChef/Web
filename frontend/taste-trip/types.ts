export interface Recipe {
  id: number;
  title: string;
  title_kr?: string;
  ingredients: string[];
  readyInMinutes: number;
  servings: number;
  match_percentage?: string;
}

export interface DietaryOption {
  name: string;
  apiValue: string;
} 