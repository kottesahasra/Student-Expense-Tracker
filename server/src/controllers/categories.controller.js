const { successResponse } = require('../utils/response');

class CategoriesController {
  async getAll(req, res, next) {
    try {
      const { type } = req.query;
      let query = req.supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;

      return successResponse(res, data, 'Categories retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, type, icon, color } = req.body;
      const { data, error } = await req.supabase
        .from('categories')
        .insert({
          user_id: req.user.id,
          name,
          type,
          icon: icon || 'tag',
          color: color || '#4f46e5',
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;
      return successResponse(res, data, 'Category created', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoriesController();

