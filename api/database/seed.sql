-- Diabetes Prevention and Control Application Seed Data
-- Run this after schema.sql to populate initial data

USE diabetes_app;

-- =====================================================
-- USERS (passwords are bcrypt hashed, all = 'password123')
-- Hash generated with cost 12
-- =====================================================
INSERT INTO users (email, password_hash, name, role, verified, created_at, last_login) VALUES
('admin@diabetescare.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FEIwGJwFBMOWLXi', 'Dr. Sarah Johnson', 'admin', TRUE, '2024-01-15 10:00:00', '2024-01-25 14:30:00'),
('patient@example.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FEIwGJwFBMOWLXi', 'Michael Chen', 'infected', TRUE, '2024-01-20 09:00:00', '2024-01-26 08:15:00'),
('user@example.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FEIwGJwFBMOWLXi', 'Emily Rodriguez', 'non-infected', TRUE, '2024-01-22 11:00:00', '2024-01-26 07:45:00'),
('pending@example.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FEIwGJwFBMOWLXi', 'James Wilson', 'infected', FALSE, '2024-01-25 16:00:00', NULL);

-- =====================================================
-- MEDICATIONS (for patient@example.com - user_id = 2)
-- =====================================================
INSERT INTO medications (user_id, name, dosage, frequency, times, instructions, color, start_date, refill_date, prescribed_by) VALUES
(2, 'Metformin', '500mg', 'Twice daily', '["08:00", "20:00"]', 'Take with meals to reduce stomach upset', 'blue', '2024-01-01', '2024-02-15', 'Dr. Sarah Johnson'),
(2, 'Lisinopril', '10mg', 'Once daily', '["09:00"]', 'Take at the same time each day', 'green', '2024-01-01', '2024-02-20', 'Dr. Sarah Johnson'),
(2, 'Atorvastatin', '20mg', 'Once daily', '["21:00"]', 'Take in the evening', 'red', '2024-01-10', '2024-03-01', 'Dr. Sarah Johnson'),
(2, 'Vitamin D3', '2000 IU', 'Once daily', '["08:00"]', 'Take with breakfast', 'yellow', '2024-01-15', NULL, 'Dr. Sarah Johnson');

-- =====================================================
-- MEDICATION SCHEDULE (for today and recent days)
-- =====================================================
INSERT INTO medication_schedule (medication_id, scheduled_time, scheduled_date, status, taken_at) VALUES
-- Metformin morning doses
(1, '08:00:00', CURDATE(), 'taken', CONCAT(CURDATE(), ' 08:15:00')),
(1, '20:00:00', CURDATE(), 'pending', NULL),
(1, '08:00:00', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'taken', CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:10:00')),
(1, '20:00:00', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'taken', CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 20:05:00')),
-- Lisinopril
(2, '09:00:00', CURDATE(), 'taken', CONCAT(CURDATE(), ' 09:00:00')),
(2, '09:00:00', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'taken', CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:15:00')),
-- Atorvastatin
(3, '21:00:00', CURDATE(), 'pending', NULL),
(3, '21:00:00', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'taken', CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 21:00:00')),
-- Vitamin D3
(4, '08:00:00', CURDATE(), 'taken', CONCAT(CURDATE(), ' 08:20:00')),
(4, '08:00:00', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'missed', NULL);

-- =====================================================
-- GLUCOSE READINGS (for patient - user_id = 2)
-- =====================================================
INSERT INTO glucose_readings (user_id, value, reading_type, reading_time, notes) VALUES
(2, 95.0, 'fasting', DATE_SUB(NOW(), INTERVAL 6 HOUR), 'Good fasting level'),
(2, 142.0, 'after_meal', DATE_SUB(NOW(), INTERVAL 4 HOUR), 'After breakfast'),
(2, 118.0, 'before_meal', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Before lunch'),
(2, 88.0, 'fasting', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(2, 156.0, 'after_meal', DATE_SUB(NOW(), INTERVAL 22 HOUR), 'After dinner - slightly high'),
(2, 102.0, 'bedtime', DATE_SUB(NOW(), INTERVAL 20 HOUR), NULL),
(2, 92.0, 'fasting', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
(2, 135.0, 'after_meal', DATE_SUB(NOW(), INTERVAL 46 HOUR), NULL),
(2, 98.0, 'fasting', DATE_SUB(NOW(), INTERVAL 3 DAY), 'Great reading'),
(2, 128.0, 'after_meal', DATE_SUB(NOW(), INTERVAL 70 HOUR), NULL);

-- =====================================================
-- RECIPES
-- =====================================================
INSERT INTO recipes (name, description, image, prep_time, cook_time, servings, calories, macros, category, tags, ingredients, instructions, diabetes_friendly, glycemic_index) VALUES
('Greek Yogurt Parfait', 'A delicious and healthy breakfast parfait with layers of creamy Greek yogurt, fresh berries, and crunchy granola.', '/placeholder.svg', 10, 0, 2, 285, '{"protein": 18, "carbs": 32, "fat": 8, "fiber": 4}', 'breakfast', '["high-protein", "low-sugar", "quick"]', '[{"name": "Greek yogurt", "amount": "2 cups", "notes": "plain, non-fat"}, {"name": "Mixed berries", "amount": "1 cup"}, {"name": "Low-sugar granola", "amount": "1/2 cup"}, {"name": "Honey", "amount": "1 tbsp", "notes": "optional"}, {"name": "Chia seeds", "amount": "1 tbsp"}]', '["Layer 1/2 cup yogurt in each glass", "Add a layer of mixed berries", "Sprinkle granola on top", "Repeat layers", "Drizzle with honey if desired", "Top with chia seeds"]', TRUE, 'low'),

('Grilled Salmon with Vegetables', 'Heart-healthy grilled salmon served with a colorful medley of roasted vegetables.', '/placeholder.svg', 15, 25, 4, 420, '{"protein": 35, "carbs": 18, "fat": 22, "fiber": 6}', 'dinner', '["high-protein", "omega-3", "low-carb"]', '[{"name": "Salmon fillets", "amount": "4 pieces", "notes": "6 oz each"}, {"name": "Zucchini", "amount": "2 medium"}, {"name": "Bell peppers", "amount": "2 large"}, {"name": "Olive oil", "amount": "3 tbsp"}, {"name": "Lemon", "amount": "1"}, {"name": "Garlic", "amount": "3 cloves"}, {"name": "Fresh herbs", "amount": "2 tbsp", "notes": "dill or parsley"}]', '["Preheat grill to medium-high", "Season salmon with salt, pepper, and lemon juice", "Toss vegetables with olive oil and garlic", "Grill salmon 4-5 minutes per side", "Grill vegetables until tender", "Serve salmon over vegetables", "Garnish with fresh herbs"]', TRUE, 'low'),

('Quinoa Buddha Bowl', 'A nourishing bowl packed with quinoa, roasted chickpeas, fresh vegetables, and tahini dressing.', '/placeholder.svg', 20, 30, 4, 380, '{"protein": 14, "carbs": 48, "fat": 15, "fiber": 10}', 'lunch', '["vegan", "high-fiber", "meal-prep"]', '[{"name": "Quinoa", "amount": "1 cup", "notes": "dry"}, {"name": "Chickpeas", "amount": "1 can", "notes": "drained"}, {"name": "Sweet potato", "amount": "2 medium"}, {"name": "Kale", "amount": "4 cups"}, {"name": "Avocado", "amount": "1"}, {"name": "Tahini", "amount": "3 tbsp"}, {"name": "Lemon juice", "amount": "2 tbsp"}]', '["Cook quinoa according to package", "Roast chickpeas and sweet potato at 400°F for 25 min", "Massage kale with olive oil", "Make dressing: whisk tahini, lemon, water, salt", "Assemble bowls with quinoa base", "Top with vegetables and chickpeas", "Drizzle with tahini dressing"]', TRUE, 'medium'),

('Cauliflower Fried Rice', 'A low-carb alternative to traditional fried rice using riced cauliflower and plenty of vegetables.', '/placeholder.svg', 15, 15, 4, 195, '{"protein": 12, "carbs": 14, "fat": 10, "fiber": 5}', 'dinner', '["low-carb", "keto-friendly", "quick"]', '[{"name": "Cauliflower", "amount": "1 large head"}, {"name": "Eggs", "amount": "3"}, {"name": "Carrots", "amount": "2 medium"}, {"name": "Peas", "amount": "1/2 cup"}, {"name": "Green onions", "amount": "4"}, {"name": "Soy sauce", "amount": "3 tbsp", "notes": "low-sodium"}, {"name": "Sesame oil", "amount": "2 tbsp"}, {"name": "Garlic", "amount": "3 cloves"}]', '["Rice the cauliflower in food processor", "Scramble eggs and set aside", "Sauté garlic, carrots, and peas", "Add cauliflower rice, cook 5-7 min", "Add soy sauce and sesame oil", "Mix in scrambled eggs", "Top with green onions"]', TRUE, 'low'),

('Berry Smoothie Bowl', 'A thick, creamy smoothie bowl topped with fresh fruit, nuts, and seeds for a nutritious breakfast.', '/placeholder.svg', 10, 0, 1, 320, '{"protein": 12, "carbs": 45, "fat": 10, "fiber": 8}', 'breakfast', '["high-fiber", "antioxidants", "quick"]', '[{"name": "Frozen mixed berries", "amount": "1.5 cups"}, {"name": "Banana", "amount": "1/2", "notes": "frozen"}, {"name": "Almond milk", "amount": "1/2 cup"}, {"name": "Protein powder", "amount": "1 scoop", "notes": "optional"}, {"name": "Almond butter", "amount": "1 tbsp"}, {"name": "Chia seeds", "amount": "1 tbsp"}, {"name": "Sliced almonds", "amount": "2 tbsp"}]', '["Blend frozen berries, banana, and almond milk", "Add protein powder if using", "Blend until thick and smooth", "Pour into a bowl", "Top with fresh berries, almonds, chia seeds", "Drizzle with almond butter"]', TRUE, 'low'),

('Mediterranean Chickpea Salad', 'A refreshing and filling salad with chickpeas, cucumber, tomatoes, and feta cheese.', '/placeholder.svg', 15, 0, 4, 290, '{"protein": 10, "carbs": 32, "fat": 14, "fiber": 8}', 'lunch', '["vegetarian", "no-cook", "meal-prep"]', '[{"name": "Chickpeas", "amount": "2 cans"}, {"name": "Cucumber", "amount": "1 large"}, {"name": "Cherry tomatoes", "amount": "2 cups"}, {"name": "Red onion", "amount": "1/2"}, {"name": "Feta cheese", "amount": "1/2 cup"}, {"name": "Kalamata olives", "amount": "1/2 cup"}, {"name": "Olive oil", "amount": "3 tbsp"}, {"name": "Red wine vinegar", "amount": "2 tbsp"}]', '["Drain and rinse chickpeas", "Dice cucumber, halve tomatoes, slice onion", "Combine vegetables in large bowl", "Add crumbled feta and olives", "Whisk olive oil and vinegar for dressing", "Toss salad with dressing", "Season with salt, pepper, oregano"]', TRUE, 'low');

-- =====================================================
-- EXERCISES
-- =====================================================
INSERT INTO exercises (name, description, duration, calories_burned, category, difficulty, equipment, instructions, benefits, precautions, image) VALUES
('Morning Walk', 'A gentle 30-minute morning walk to start your day with light activity and fresh air.', 30, 150, 'walking', 'beginner', '["comfortable shoes"]', '["Start with 5 min warm-up at slow pace", "Increase to brisk walking pace", "Maintain steady breathing", "Swing arms naturally", "Cool down last 5 minutes", "Stretch after completion"]', '["Improves cardiovascular health", "Helps regulate blood sugar", "Boosts mood and energy", "Low impact on joints"]', 'Wear supportive footwear. Stay hydrated. Avoid walking in extreme heat.', '/placeholder.svg'),

('Chair Yoga', 'Gentle yoga poses modified for seated practice, perfect for beginners or those with limited mobility.', 20, 80, 'flexibility', 'beginner', '["sturdy chair"]', '["Sit tall with feet flat on floor", "Seated cat-cow stretches", "Seated twists left and right", "Shoulder rolls and neck stretches", "Seated forward fold", "Ankle circles and leg extensions", "Finish with deep breathing"]', '["Improves flexibility", "Reduces stress", "Can be done anywhere", "Gentle on joints"]', 'Use a sturdy chair without wheels. Move slowly and never force a stretch.', '/placeholder.svg'),

('Resistance Band Workout', 'Full-body strength training using resistance bands, suitable for home workouts.', 25, 180, 'strength', 'intermediate', '["resistance bands", "exercise mat"]', '["Warm up with arm circles", "Bicep curls - 12 reps", "Tricep extensions - 12 reps", "Squats with band - 15 reps", "Lateral band walks - 10 each side", "Seated rows - 12 reps", "Glute bridges with band - 15 reps", "Cool down stretches"]', '["Builds muscle strength", "Improves insulin sensitivity", "Portable equipment", "Adjustable resistance"]', 'Start with lighter resistance. Maintain proper form to avoid injury.', '/placeholder.svg'),

('Water Aerobics', 'Low-impact cardiovascular exercise performed in the pool, gentle on joints while providing resistance.', 45, 300, 'swimming', 'beginner', '["pool access", "swimwear"]', '["Water walking for 5 min warm-up", "Leg kicks holding pool edge", "Arm circles underwater", "Water jogging in place", "Cross-country skiing motion", "Flutter kicks", "Cool down with gentle floating"]', '["Low impact on joints", "Full body workout", "Cooling in hot weather", "Great for arthritis"]', 'Never swim alone. Be aware of pool depth. Take breaks as needed.', '/placeholder.svg'),

('HIIT for Beginners', 'A modified high-intensity interval training workout designed for those new to HIIT.', 20, 200, 'hiit', 'beginner', '["exercise mat"]', '["30 sec jumping jacks, 30 sec rest", "30 sec high knees, 30 sec rest", "30 sec bodyweight squats, 30 sec rest", "30 sec mountain climbers, 30 sec rest", "Repeat circuit 3 times", "5 min cool down stretches"]', '["Burns calories efficiently", "Improves cardiovascular fitness", "Boosts metabolism", "Time-efficient workout"]', 'Monitor blood sugar before and after. Have fast-acting glucose available. Stop if feeling dizzy.', '/placeholder.svg'),

('Balance and Stability', 'Exercises focused on improving balance and core stability, important for fall prevention.', 15, 60, 'balance', 'beginner', '["chair for support"]', '["Single leg stands - 30 sec each", "Heel-to-toe walking", "Standing leg swings", "Weight shifts side to side", "Toe raises", "Heel raises", "Standing marches"]', '["Reduces fall risk", "Improves core strength", "Enhances coordination", "Builds confidence"]', 'Keep a chair nearby for support. Practice on a non-slip surface.', '/placeholder.svg');

-- =====================================================
-- ACTIVITY LOGS (for patient - user_id = 2)
-- =====================================================
INSERT INTO activity_logs (user_id, exercise_id, activity_type, activity_name, value, calories_burned, activity_date, start_time, end_time, notes) VALUES
(2, 1, 'exercise', 'Morning Walk', 30, 150, CURDATE(), '07:00:00', '07:30:00', 'Nice weather today'),
(2, NULL, 'steps', NULL, 8500, NULL, CURDATE(), NULL, NULL, NULL),
(2, 3, 'exercise', 'Resistance Band Workout', 25, 180, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:00:00', '18:25:00', 'Felt strong'),
(2, NULL, 'steps', NULL, 10200, NULL, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, NULL, 'Hit 10k goal!'),
(2, 2, 'exercise', 'Chair Yoga', 20, 80, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00', '08:20:00', NULL),
(2, NULL, 'steps', NULL, 6800, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, NULL, NULL),
(2, 1, 'exercise', 'Morning Walk', 35, 175, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:15:00', '07:50:00', 'Extra long walk'),
(2, NULL, 'steps', NULL, 9100, NULL, DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, NULL, NULL);

-- =====================================================
-- EDUCATION CONTENT
-- =====================================================
INSERT INTO education_content (title, description, content, category, content_type, target_audience, author, read_time, status, published_at, views) VALUES
('Understanding Type 2 Diabetes', 'Learn the basics of Type 2 diabetes, including causes, symptoms, and how it affects your body.', '<h2>What is Type 2 Diabetes?</h2><p>Type 2 diabetes is a chronic condition that affects how your body metabolizes sugar (glucose). With this condition, your body either resists the effects of insulin or doesn''t produce enough insulin to maintain normal glucose levels.</p><h2>Common Symptoms</h2><ul><li>Increased thirst and frequent urination</li><li>Increased hunger</li><li>Weight loss</li><li>Fatigue</li><li>Blurred vision</li></ul><h2>Risk Factors</h2><p>Several factors can increase your risk of developing Type 2 diabetes, including obesity, age, family history, and sedentary lifestyle.</p>', 'basics', 'article', '["infected", "non-infected", "admin"]', 'Dr. Sarah Johnson', 8, 'published', '2024-01-15 10:00:00', 1250),

('Blood Sugar Monitoring Guide', 'A comprehensive guide to monitoring your blood glucose levels effectively.', '<h2>Why Monitor Blood Sugar?</h2><p>Regular blood sugar monitoring is essential for managing diabetes. It helps you understand how food, activity, and medications affect your glucose levels.</p><h2>When to Test</h2><ul><li>Before meals</li><li>2 hours after meals</li><li>Before bedtime</li><li>Before and after exercise</li></ul><h2>Target Ranges</h2><p>Work with your healthcare team to determine your personal target ranges. General guidelines suggest fasting levels of 80-130 mg/dL and post-meal levels under 180 mg/dL.</p>', 'monitoring', 'guide', '["infected", "admin"]', 'Dr. Sarah Johnson', 10, 'published', '2024-01-18 14:00:00', 890),

('Diabetes-Friendly Meal Planning', 'Practical tips for creating balanced, diabetes-friendly meals that help manage blood sugar.', '<h2>The Plate Method</h2><p>A simple way to plan meals is the plate method: fill half your plate with non-starchy vegetables, a quarter with lean protein, and a quarter with whole grains or starchy foods.</p><h2>Carbohydrate Counting</h2><p>Learning to count carbohydrates can help you better manage blood sugar levels. Work with a dietitian to determine your daily carb goals.</p><h2>Healthy Food Choices</h2><ul><li>Choose whole grains over refined grains</li><li>Eat plenty of vegetables</li><li>Select lean proteins</li><li>Limit added sugars and processed foods</li></ul>', 'nutrition', 'article', '["infected", "non-infected", "admin"]', 'Nutrition Team', 12, 'published', '2024-01-20 09:00:00', 2100),

('Exercise and Diabetes', 'How physical activity helps manage diabetes and tips for getting started safely.', '<h2>Benefits of Exercise</h2><p>Regular physical activity can help lower blood sugar, improve insulin sensitivity, maintain a healthy weight, and reduce cardiovascular risk.</p><h2>Types of Exercise</h2><ul><li>Aerobic exercise: walking, swimming, cycling</li><li>Resistance training: weights, resistance bands</li><li>Flexibility exercises: stretching, yoga</li></ul><h2>Safety Tips</h2><p>Check blood sugar before exercise. Carry fast-acting glucose. Stay hydrated. Wear proper footwear.</p>', 'exercise', 'article', '["infected", "non-infected", "admin"]', 'Fitness Team', 7, 'published', '2024-01-22 11:00:00', 1560),

('Preventing Type 2 Diabetes', 'Evidence-based strategies for reducing your risk of developing Type 2 diabetes.', '<h2>Prevention is Possible</h2><p>Research shows that lifestyle changes can significantly reduce the risk of developing Type 2 diabetes, even if you have prediabetes.</p><h2>Key Prevention Strategies</h2><ul><li>Maintain a healthy weight</li><li>Stay physically active</li><li>Eat a balanced diet rich in fiber</li><li>Limit sugary drinks and processed foods</li><li>Get regular health screenings</li></ul><h2>Know Your Risk</h2><p>Talk to your doctor about your risk factors and get tested for prediabetes if recommended.</p>', 'prevention', 'article', '["non-infected", "admin"]', 'Prevention Team', 6, 'published', '2024-01-23 15:00:00', 980),

('Managing Diabetes Medications', 'Information about common diabetes medications and how to take them effectively.', '<h2>Types of Diabetes Medications</h2><p>There are several classes of medications used to manage Type 2 diabetes, each working in different ways to help control blood sugar.</p><h2>Common Medications</h2><ul><li>Metformin - reduces glucose production</li><li>Sulfonylureas - stimulate insulin release</li><li>GLP-1 agonists - improve insulin secretion</li><li>SGLT2 inhibitors - increase glucose excretion</li></ul><h2>Taking Medications Safely</h2><p>Always take medications as prescribed. Never skip doses without consulting your doctor. Report side effects promptly.</p>', 'medication', 'guide', '["infected", "admin"]', 'Dr. Sarah Johnson', 15, 'published', '2024-01-24 10:00:00', 720);

-- =====================================================
-- USER PROGRESS
-- =====================================================
INSERT INTO user_progress (user_id, content_id, progress, completed, completed_at) VALUES
(2, 1, 100, TRUE, '2024-01-16 14:00:00'),
(2, 2, 75, FALSE, NULL),
(2, 3, 50, FALSE, NULL),
(2, 4, 100, TRUE, '2024-01-23 10:00:00'),
(2, 6, 30, FALSE, NULL),
(3, 1, 100, TRUE, '2024-01-24 09:00:00'),
(3, 3, 80, FALSE, NULL),
(3, 4, 60, FALSE, NULL),
(3, 5, 100, TRUE, '2024-01-25 11:00:00');

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
(2, 'medication', 'Medication Reminder', 'Time to take your evening dose of Metformin', '/medication', FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 'glucose', 'Log Your Glucose', 'Don''t forget to log your post-dinner glucose reading', '/medication', FALSE, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(2, 'education', 'New Content Available', 'Check out our new article on managing stress with diabetes', '/education', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'achievement', 'Goal Reached!', 'Congratulations! You''ve logged 7 consecutive days of activity', '/activity', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'system', 'Welcome to DiabetesCare', 'Thank you for joining. Explore our resources to get started.', '/', TRUE, '2024-01-20 09:00:00'),
(3, 'education', 'New Prevention Tips', 'Learn about 5 simple habits to reduce your diabetes risk', '/education', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'system', 'Complete Your Profile', 'Add more details to personalize your experience', '/settings', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 'system', 'Account Pending Verification', 'Your account is awaiting admin approval', '/', FALSE, '2024-01-25 16:00:00');
