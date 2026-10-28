class GoalsService {
  async getGoals(scopedClient, userId) {
    const { data, error } = await scopedClient
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = (data || []).map(goal => {
      const current = Number(goal.current_amount || 0);
      const target = Number(goal.target_amount || 0);
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const isCompleted = current >= target;

      return {
        ...goal,
        progress,
        isCompleted
      };
    });

    return enriched;
  }

  async createGoal(scopedClient, userId, payload) {
    const { data, error } = await scopedClient
      .from('savings_goals')
      .insert({
        user_id: userId,
        title: payload.title,
        target_amount: payload.target_amount,
        current_amount: payload.current_amount || 0,
        target_date: payload.target_date || null,
        category: payload.category || 'General',
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGoal(scopedClient, userId, id, payload) {
    const { data, error } = await scopedClient
      .from('savings_goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async contributeToGoal(scopedClient, userId, id, amount) {
    // 1. Get current goal
    const { data: goal, error: fetchErr } = await scopedClient
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !goal) throw new Error('Savings goal not found');

    const newAmount = Number(goal.current_amount) + Number(amount);
    const isCompleted = newAmount >= Number(goal.target_amount);

    const { data, error } = await scopedClient
      .from('savings_goals')
      .update({
        current_amount: newAmount,
        status: isCompleted ? 'completed' : goal.status
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoal(scopedClient, userId, id) {
    const { error } = await scopedClient
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { id, deleted: true };
  }
}

module.exports = new GoalsService();

