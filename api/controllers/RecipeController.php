<?php
/**
 * Recipe Controller
 * 
 * Handles recipe operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class RecipeController {
    
    /**
     * Get all recipes
     * GET /api/recipes
     */
    public static function index(): void {
        AuthMiddleware::requireAuth();
        
        $filters = [
            'category' => Validator::getQuery('category'),
            'diabetes_friendly' => Validator::getQuery('diabetes_friendly') !== null 
                ? Validator::getQuery('diabetes_friendly') === 'true' 
                : null,
            'glycemic_index' => Validator::getQuery('glycemic_index'),
            'search' => Validator::getQuery('search'),
            'max_calories' => Validator::getQuery('max_calories'),
            'max_prep_time' => Validator::getQuery('max_prep_time'),
        ];
        
        // Remove null values
        $filters = array_filter($filters, fn($v) => $v !== null);
        
        $pagination = Validator::getPagination();
        
        $result = Recipe::getAll($filters, $pagination['per_page'], $pagination['offset']);
        
        Response::paginated(
            $result['recipes'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Get single recipe
     * GET /api/recipes/{id}
     */
    public static function show(int $id): void {
        AuthMiddleware::requireAuth();
        
        $recipe = Recipe::findById($id);
        
        if (!$recipe) {
            Response::notFound('Recipe not found');
        }
        
        Response::success(['recipe' => $recipe]);
    }
    
    /**
     * Create new recipe (Admin only)
     * POST /api/recipes
     */
    public static function store(): void {
        $user = AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('name')
            ->maxLength('name', 200)
            ->required('description')
            ->required('prep_time')
            ->integer('prep_time')
            ->required('cook_time')
            ->integer('cook_time')
            ->required('calories')
            ->integer('calories')
            ->required('macros')
            ->required('category')
            ->in('category', ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage'])
            ->required('ingredients')
            ->required('instructions');
        
        $validator->validate();
        
        $recipeData = [
            'name' => Validator::sanitizeString($data['name']),
            'description' => Validator::sanitizeString($data['description']),
            'image' => $data['image'] ?? null,
            'prep_time' => Validator::sanitizeInt($data['prep_time']),
            'cook_time' => Validator::sanitizeInt($data['cook_time']),
            'servings' => Validator::sanitizeInt($data['servings'] ?? 4),
            'calories' => Validator::sanitizeInt($data['calories']),
            'macros' => $data['macros'],
            'category' => $data['category'],
            'tags' => $data['tags'] ?? [],
            'ingredients' => $data['ingredients'],
            'instructions' => $data['instructions'],
            'diabetes_friendly' => $data['diabetes_friendly'] ?? true,
            'glycemic_index' => $data['glycemic_index'] ?? 'low',
            'created_by' => $user['id'],
        ];
        
        try {
            $recipeId = Recipe::create($recipeData);
            $recipe = Recipe::findById($recipeId);
            
            Response::created(['recipe' => $recipe], 'Recipe created successfully');
        } catch (Exception $e) {
            error_log('Recipe create error: ' . $e->getMessage());
            Response::serverError('Failed to create recipe');
        }
    }
    
    /**
     * Update recipe (Admin only)
     * PUT /api/recipes/{id}
     */
    public static function update(int $id): void {
        AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        $recipe = Recipe::findById($id);
        
        if (!$recipe) {
            Response::notFound('Recipe not found');
        }
        
        $validator = Validator::make($data)
            ->maxLength('name', 200)
            ->integer('prep_time')
            ->integer('cook_time')
            ->integer('calories')
            ->in('category', ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage'])
            ->in('glycemic_index', ['low', 'medium', 'high']);
        
        $validator->validate();
        
        if (Recipe::update($id, $data)) {
            $recipe = Recipe::findById($id);
            Response::success(['recipe' => $recipe], 'Recipe updated successfully');
        } else {
            Response::error('No changes made', 'NO_CHANGES', 400);
        }
    }
    
    /**
     * Delete recipe (Admin only)
     * DELETE /api/recipes/{id}
     */
    public static function destroy(int $id): void {
        AuthMiddleware::requireAdmin();
        
        $recipe = Recipe::findById($id);
        
        if (!$recipe) {
            Response::notFound('Recipe not found');
        }
        
        Recipe::delete($id);
        Response::success(null, 'Recipe deleted successfully');
    }
    
    /**
     * Get recipe categories
     * GET /api/recipes/categories
     */
    public static function categories(): void {
        AuthMiddleware::requireAuth();
        
        $categories = Recipe::getCategories();
        Response::success(['categories' => $categories]);
    }
}
