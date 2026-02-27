-- PIXORA PRODUCTIVITY ENHANCEMENTS

-- 12. PRODUCTIVITY TASKS
CREATE TABLE IF NOT EXISTS productivity_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, archived
    priority TEXT DEFAULT 'medium', -- low, medium, high
    category TEXT DEFAULT 'general', -- research, creative, ads, logistics
    due_date TIMESTAMPTZ,
    pomodoro_sessions INTEGER DEFAULT 0,
    estimated_pomodoros INTEGER DEFAULT 1
);

-- 13. CREATIVE ASSETS PIPELINE
CREATE TABLE IF NOT EXISTS creative_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- image, video, gif, landing
    status TEXT DEFAULT 'idea', -- idea, production, review, live, scaled
    thumbnail_url TEXT,
    source_url TEXT,
    performance_score FLOAT DEFAULT 0
);

-- 14. COMPETITOR MONITORING
CREATE TABLE IF NOT EXISTS competitor_monitor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    last_check TIMESTAMPTZ,
    last_snapshot TEXT, -- HTML snapshot or summary
    changes_detected BOOLEAN DEFAULT false,
    alert_type TEXT DEFAULT 'price' -- price, copy, inventory
);

-- Enable RLS
ALTER TABLE productivity_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_monitor ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "RLS_Tasks" ON productivity_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Assets" ON creative_assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Monitor" ON competitor_monitor FOR ALL USING (auth.uid() = user_id);
