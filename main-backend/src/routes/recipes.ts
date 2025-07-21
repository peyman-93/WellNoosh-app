import { Router } from 'express';
import { recipeController } from '../controllers/recipeController';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validateRecipe } from '../middleware/validation';

const router = Router();

// Public recipe routes (with optional auth for personalization)
router.get('/', optionalAuth, recipeController.getRecipes);
router.get('/featured', optionalAuth, recipeController.getFeaturedRecipes);
router.get('/trending', optionalAuth, recipeController.getTrendingRecipes);
router.get('/search', optionalAuth, recipeController.searchRecipes);
router.get('/categories', recipeController.getCategories);
router.get('/:id', optionalAuth, recipeController.getRecipe);

// Protected recipe routes
router.use(requireAuth);

// User recipe management
router.post('/', validateRecipe, recipeController.createRecipe);
router.put('/:id', validateRecipe, recipeController.updateRecipe);
router.delete('/:id', recipeController.deleteRecipe);

// Recipe interactions
router.post('/:id/favorite', recipeController.toggleFavorite);
router.post('/:id/rate', recipeController.rateRecipe);
router.post('/:id/cook', recipeController.markAsCooked);
router.post('/:id/share', recipeController.shareRecipe);

// User's recipe collections
router.get('/user/favorites', recipeController.getFavoriteRecipes);
router.get('/user/cooked', recipeController.getCookedRecipes);
router.get('/user/created', recipeController.getUserRecipes);

// Recipe recommendations
router.get('/recommendations/personal', recipeController.getPersonalRecommendations);
router.get('/recommendations/mood', recipeController.getMoodBasedRecommendations);

export { router as recipeRoutes };