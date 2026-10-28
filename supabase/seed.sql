-- ====================================================================
-- Default Seed Data for Student Expense Tracker
-- ====================================================================

-- Temporarily disable RLS so seed data can be inserted without auth context
SET LOCAL row_security = off;

-- Default Expense Categories tailored for College / University Students
INSERT INTO public.categories (name, type, icon, color, is_default) VALUES
  ('Food & Groceries',         'expense', 'shopping-cart', '#ef4444', TRUE),
  ('Tuition & Fees',           'expense', 'graduation-cap','#f97316', TRUE),
  ('Books & Courseware',       'expense', 'book-open',     '#f59e0b', TRUE),
  ('Housing & Rent',           'expense', 'home',          '#eab308', TRUE),
  ('Transportation',           'expense', 'bus',           '#10b981', TRUE),
  ('Entertainment & Social',   'expense', 'film',          '#06b6d4', TRUE),
  ('Utilities & Internet',     'expense', 'wifi',          '#3b82f6', TRUE),
  ('Campus Dining / Cafeteria','expense', 'coffee',        '#8b5cf6', TRUE),
  ('Healthcare & Fitness',     'expense', 'heart-pulse',   '#ec4899', TRUE),
  ('Personal & Clothing',      'expense', 'tag',           '#6b7280', TRUE),
  ('Emergency / Miscellaneous','expense', 'alert-circle',  '#64748b', TRUE)
ON CONFLICT DO NOTHING;

-- Default Income Categories for Students
INSERT INTO public.categories (name, type, icon, color, is_default) VALUES
  ('Part-time Job',             'income', 'briefcase',   '#10b981', TRUE),
  ('Student Loan / Allowance',  'income', 'wallet',      '#3b82f6', TRUE),
  ('Scholarship / Grant',       'income', 'award',       '#f59e0b', TRUE),
  ('Freelancing / Tutoring',    'income', 'laptop',      '#8b5cf6', TRUE),
  ('Family Support / Gift',     'income', 'gift',        '#ec4899', TRUE),
  ('Other Income',              'income', 'plus-circle', '#64748b', TRUE)
ON CONFLICT DO NOTHING;
