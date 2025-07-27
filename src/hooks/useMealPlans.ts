import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, MealPlan } from '@/api/client'

export const useMealPlans = () => {
  return useQuery({
    queryKey: ['mealPlans'],
    queryFn: api.mealPlans.getAll,
  })
}

export const useMealPlansByDate = (date: string) => {
  return useQuery({
    queryKey: ['mealPlans', date],
    queryFn: () => api.mealPlans.getByDate(date),
    enabled: !!date,
  })
}

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.mealPlans.create,
    onSuccess: (newPlan) => {
      queryClient.setQueryData(['mealPlans'], (oldPlans: MealPlan[] | undefined) => {
        return oldPlans ? [...oldPlans, newPlan] : [newPlan]
      })
      
      // Also update the date-specific query
      queryClient.setQueryData(['mealPlans', newPlan.date], (oldPlans: MealPlan[] | undefined) => {
        return oldPlans ? [...oldPlans, newPlan] : [newPlan]
      })
    },
  })
}