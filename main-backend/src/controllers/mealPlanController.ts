import { Request, Response } from 'express';
import OpenAI from 'openai';
import { asyncHandler, createError } from '../middleware/errorHandler';

// Python recommendation API URL (DSPy meal planner)
const PYTHON_API_URL = process.env.RECOMMENDATION_API_URL || 'http://localhost:8000';

// Support both Replit integration (for Replit environment) and direct OpenAI API key (for local development)
let openai: OpenAI;

if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  // Replit environment - use Replit's OpenAI integration
  openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  });
  console.log('🤖 Using Replit OpenAI integration');
} else if (process.env.OPENAI_API_KEY) {
  // Local development - use direct OpenAI API key
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('🤖 Using direct OpenAI API key');
} else {
  console.warn('⚠️ No OpenAI API key configured. AI features will not work.');
  openai = new OpenAI({ apiKey: 'dummy' }); // Will fail gracefully when called
}

console.log('🍽️ Python API URL for DSPy meal planner:', PYTHON_API_URL);

interface UserHealthContext {
  allergies?: string[];
  medicalConditions?: string[];
  dietStyle?: string;
  healthGoals?: string[];
  dailyCalorieGoal?: number;
  cookingSkill?: string;
  fastingSchedule?: string;
  mealsPerDay?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'snack_am' | 'snack_pm' | 'snack_evening';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner', 'snack_evening', 'snack'];

function buildSystemPrompt(healthContext: UserHealthContext): string {
  const parts = [
    `You are a helpful nutritionist and meal planning assistant. You help users plan healthy, delicious meals for the week.`,
    ``,
    `User Health Profile:`
  ];

  if (healthContext.dietStyle) {
    parts.push(`- Diet Style: ${healthContext.dietStyle}`);
  }

  if (healthContext.allergies && healthContext.allergies.length > 0) {
    parts.push(`- Allergies/Intolerances: ${healthContext.allergies.join(', ')}`);
  }

  if (healthContext.medicalConditions && healthContext.medicalConditions.length > 0) {
    parts.push(`- Medical Conditions: ${healthContext.medicalConditions.join(', ')}`);
  }

  if (healthContext.healthGoals && healthContext.healthGoals.length > 0) {
    parts.push(`- Health Goals: ${healthContext.healthGoals.join(', ')}`);
  }

  if (healthContext.dailyCalorieGoal) {
    parts.push(`- Daily Calorie Target: ${healthContext.dailyCalorieGoal} calories`);
  }

  if (healthContext.cookingSkill) {
    parts.push(`- Cooking Skill Level: ${healthContext.cookingSkill}`);
  }

  parts.push(``);
  parts.push(`Important Guidelines:`);
  parts.push(`- Always respect the user's allergies and dietary restrictions`);
  parts.push(`- Suggest meals appropriate for their cooking skill level`);
  parts.push(`- Consider their health goals when making recommendations`);
  parts.push(`- Be conversational and helpful`);
  parts.push(`- When asked to generate a meal plan, provide practical, easy-to-follow suggestions`);

  return parts.join('\n');
}

class MealPlanController {
  getMealPlans = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  createMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  updateMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  deleteMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getMealPlansByDate = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getWeeklyMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getMonthlyMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  generateMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  autoGenerateMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getMealPlanTemplates = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  createMealPlanTemplate = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  generateGroceryList = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  generateGroceryListForPeriod = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  shareMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getSharedMealPlan = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  aiChat = asyncHandler(async (req: Request, res: Response) => {
    console.log('📝 AI Chat request received');
    
    const { messages, healthContext } = req.body as {
      messages: ChatMessage[];
      healthContext: UserHealthContext;
    };

    if (!messages || !Array.isArray(messages)) {
      throw createError('Messages array is required', 400);
    }

    console.log('📝 Processing chat with', messages.length, 'messages');
    const systemPrompt = buildSystemPrompt(healthContext || {});

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_completion_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';

    res.json({ content });
  });

  aiGeneratePlan = asyncHandler(async (req: Request, res: Response) => {
    console.log('🍽️ AI Generate Plan request received');
    
    const { messages, healthContext, startDate, numberOfDays = 7 } = req.body as {
      messages: ChatMessage[];
      healthContext: UserHealthContext;
      startDate: string;
      numberOfDays?: number;
    };

    console.log('🍽️ Request params:', { messagesCount: messages?.length, startDate, numberOfDays });

    if (!messages || !Array.isArray(messages)) {
      throw createError('Messages array is required', 400);
    }

    if (!startDate) {
      throw createError('startDate is required', 400);
    }

    // Validate startDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      throw createError('startDate must be in YYYY-MM-DD format', 400);
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw createError('startDate is not a valid date', 400);
    }

    const systemPrompt = buildSystemPrompt(healthContext || {});

    const dates: string[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0] as string;
      dates.push(dateStr);
    }

    const generationPrompt = `
Based on our conversation, please generate a ${numberOfDays}-day meal plan.

Return your response as valid JSON with this exact structure:
{
  "summary": "A brief 1-2 sentence summary of the meal plan",
  "meals": [
    {
      "date": "YYYY-MM-DD",
      "slot": "breakfast" | "lunch" | "dinner" | "snack",
      "title": "Meal name",
      "calories": 350,
      "protein_g": 25,
      "carbs_g": 30,
      "fat_g": 15,
      "notes": "Include ingredients and instructions in this format:\\n\\nIngredients:\\n- 2 eggs\\n- 1 cup spinach\\n- 1/4 avocado\\n- salt and pepper\\n\\nInstructions:\\n1. Heat a pan over medium heat\\n2. Whisk eggs and pour into pan\\n3. Add spinach and cook until wilted\\n4. Top with sliced avocado and season"
    }
  ]
}

The dates to plan for are: ${dates.join(', ')}
The meal slots are: breakfast, lunch, dinner, snack (snack is optional)

Important:
- Make sure all meals respect the user's dietary restrictions and allergies
- Include variety across the week
- Consider the user's cooking skill level
- ALWAYS include the full ingredients list and step-by-step instructions in the notes field
- Include realistic calorie, protein, carbs, and fat estimates for each meal
- Return ONLY valid JSON, no markdown or additional text
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: generationPrompt }
      ],
      max_completion_tokens: 4000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    console.log('🍽️ Raw AI response:', content?.substring(0, 500));
    
    if (!content) {
      throw createError('Failed to generate meal plan', 500);
    }

    try {
      const parsed = JSON.parse(content);
      console.log('🍽️ Parsed meals count:', parsed.meals?.length);
      if (parsed.meals?.[0]) {
        console.log('🍽️ First meal example:', JSON.stringify(parsed.meals[0], null, 2));
      }
      
      const meals: Array<{
        plan_date: string;
        meal_slot: MealSlot;
        custom_title: string;
        notes?: string;
        servings: number;
        calories?: number;
        protein_g?: number;
        carbs_g?: number;
        fat_g?: number;
      }> = [];
      
      if (parsed.meals && Array.isArray(parsed.meals)) {
        for (const meal of parsed.meals) {
          if (meal.date && meal.slot && meal.title) {
            const slot = meal.slot.toLowerCase() as MealSlot;
            if (MEAL_SLOTS.includes(slot)) {
              meals.push({
                plan_date: meal.date,
                meal_slot: slot,
                custom_title: meal.title,
                notes: meal.notes || undefined,
                servings: 1,
                calories: meal.calories || undefined,
                protein_g: meal.protein_g || undefined,
                carbs_g: meal.carbs_g || undefined,
                fat_g: meal.fat_g || undefined
              });
            }
          }
        }
      }

      res.json({
        meals,
        summary: parsed.summary || 'Your personalized meal plan is ready!'
      });
    } catch (error) {
      console.error('Error parsing meal plan response:', error);
      throw createError('Failed to parse meal plan response', 500);
    }
  });

  // New DSPy-powered meal plan generation with full recipe details
  aiGeneratePlanDSPy = asyncHandler(async (req: Request, res: Response) => {
    console.log('🍽️ DSPy AI Generate Plan request received');

    const { 
      messages, 
      healthContext, 
      startDate, 
      numberOfDays = 7,
      mealsPerDay = 3,
      fastingOption = 'none'
    } = req.body as {
      messages: ChatMessage[];
      healthContext: UserHealthContext;
      startDate: string;
      numberOfDays?: number;
      mealsPerDay?: number;
      fastingOption?: string;
    };

    console.log('🍽️ DSPy Request params:', { 
      messagesCount: messages?.length, 
      startDate, 
      numberOfDays,
      mealsPerDay,
      fastingOption
    });

    if (!messages || !Array.isArray(messages)) {
      throw createError('Messages array is required', 400);
    }

    if (!startDate) {
      throw createError('startDate is required', 400);
    }

    try {
      // Call the Python DSPy service
      const response = await fetch(`${PYTHON_API_URL}/api/meal-plans/dspy-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: req.body.user_id || 'anonymous',
          messages: messages,
          healthContext: {
            allergies: healthContext?.allergies || [],
            medicalConditions: healthContext?.medicalConditions || [],
            dietStyle: healthContext?.dietStyle || 'balanced',
            healthGoals: healthContext?.healthGoals || [],
            dailyCalorieGoal: healthContext?.dailyCalorieGoal || 2000,
            cookingSkill: healthContext?.cookingSkill || 'beginner',
            fastingSchedule: fastingOption !== 'none' ? fastingOption : undefined,
            mealsPerDay: mealsPerDay
          },
          startDate: startDate,
          numberOfDays: numberOfDays,
          mealsPerDay: mealsPerDay,
          fastingOption: fastingOption
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DSPy API error:', response.status, errorText);
        throw createError(`DSPy service error: ${response.status}`, 500);
      }

      const data = await response.json() as {
        meals?: any[];
        summary?: string;
        stats?: any;
      };
      console.log('✅ DSPy Generated', data.meals?.length || 0, 'meals with full details');

      // Return the full meal data with ingredients and instructions
      res.json({
        meals: data.meals || [],
        summary: data.summary || 'Your personalized meal plan is ready!',
        stats: data.stats
      });

    } catch (error: any) {
      console.error('❌ Error calling DSPy service:', error);

      // Fallback to OpenAI if DSPy service is unavailable
      if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
        console.log('⚠️ DSPy service unavailable, falling back to OpenAI...');
        // You could call the existing aiGeneratePlan method here as fallback
        throw createError('DSPy meal planner service is not available. Please start the Python service.', 503);
      }

      throw error;
    }
  });
}

export const mealPlanController = new MealPlanController();
