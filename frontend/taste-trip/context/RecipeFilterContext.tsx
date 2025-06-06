// frontend/taste-trip/context/RecipeFilterContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, DietaryOption } from '../types';

interface RecipeFilterContextType {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
  country: string;
  setCountry: (country: string) => void;
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  matchRecipes: Recipe[];
  setMatchRecipes: (matchRecipes: Recipe[]) => void;
}

const RecipeFilterContext = createContext<RecipeFilterContextType | undefined>(undefined);

export const RecipeFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [country, setCountry] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matchRecipes, setMatchRecipes] = useState<Recipe[]>([]);

  return (
    <RecipeFilterContext.Provider value={{
      ingredients,
      setIngredients,
      country,
      setCountry,
      recipes,
      setRecipes,
      matchRecipes,
      setMatchRecipes,
    }}>
      {children}
    </RecipeFilterContext.Provider>
  );
};

export const useRecipeFilter = () => {
  const context = useContext(RecipeFilterContext);
  if (context === undefined) {
    throw new Error('useRecipeFilter must be used within a RecipeFilterProvider');
  }
  return context;
};
