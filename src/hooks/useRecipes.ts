import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Recipe } from '@/api/client'

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: api.recipes.getAll,
  })
}

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => api.recipes.getById(id),
    enabled: !!id,
  })
}

export const useCreateRecipe = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.recipes.create,
    onSuccess: (newRecipe) => {
      queryClient.setQueryData(['recipes'], (oldRecipes: Recipe[] | undefined) => {
        return oldRecipes ? [...oldRecipes, newRecipe] : [newRecipe]
      })
    },
  })
}