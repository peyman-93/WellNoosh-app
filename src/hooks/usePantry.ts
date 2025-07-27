import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, PantryItem } from '@/api/client'

export const usePantry = () => {
  return useQuery({
    queryKey: ['pantry'],
    queryFn: api.pantry.getAll,
  })
}

export const useCreatePantryItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.pantry.create,
    onSuccess: (newItem) => {
      queryClient.setQueryData(['pantry'], (oldItems: PantryItem[] | undefined) => {
        return oldItems ? [...oldItems, newItem] : [newItem]
      })
    },
  })
}