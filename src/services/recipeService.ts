/**
 * Recipe Service
 * 
 * Handles diabetes-friendly recipe management.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  calories: number;
  macros: Macros;
  category: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  diabetes_friendly: boolean;
  glycemic_index?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface RecipeCreateData {
  name: string;
  description: string;
  image?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  calories: number;
  macros: Macros;
  category: string;
  tags?: string[];
  ingredients: string[];
  instructions: string[];
  diabetes_friendly?: boolean;
  glycemic_index?: 'low' | 'medium' | 'high';
}

export interface RecipeUpdateData extends Partial<RecipeCreateData> {}

export interface RecipeListParams {
  category?: string;
  search?: string;
  diabetes_friendly?: boolean;
  page?: number;
  per_page?: number;
}

export const recipeService = {
  getAll: async (params?: RecipeListParams): Promise<ApiResponse<Recipe[]>> => {
    return api.get<Recipe[]>('/recipes', params as Record<string, string | number | boolean>);
  },

  getById: async (id: string | number): Promise<ApiResponse<Recipe>> => {
    const response = await api.get<unknown>(`/recipes/${id}`);
    if (response.success && response.data) {
      response.data = unwrapData<Recipe>(response.data, 'recipe');
    }
    return response as ApiResponse<Recipe>;
  },

  create: async (data: RecipeCreateData): Promise<ApiResponse<Recipe>> => {
    const response = await api.post<unknown>('/recipes', data);
    if (response.success && response.data) {
      response.data = unwrapData<Recipe>(response.data, 'recipe');
    }
    return response as ApiResponse<Recipe>;
  },

  update: async (id: string | number, data: RecipeUpdateData): Promise<ApiResponse<Recipe>> => {
    const response = await api.put<unknown>(`/recipes/${id}`, data);
    if (response.success && response.data) {
      response.data = unwrapData<Recipe>(response.data, 'recipe');
    }
    return response as ApiResponse<Recipe>;
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/recipes/${id}`);
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get<unknown>('/recipes/categories');
    if (response.success && response.data) {
      response.data = unwrapData<string[]>(response.data, 'categories');
    }
    return response as ApiResponse<string[]>;
  },
};

export default recipeService;
