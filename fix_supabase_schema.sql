-- ============================================================
-- PIXORA: MASTER SCHEMA PATCH (VERSION 2.0)
-- ============================================================
-- Ejecuta este script en el Editor SQL de Supabase.
-- Corregirá faltantes y preparará la App para datos reales.
-- ============================================================

-- 1. TABLA: profit_records (Control Diario)
ALTER TABLE IF EXISTS profit_records 
ADD COLUMN IF NOT EXISTS tiktok_spend FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_spend FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancel_rate FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_rate FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Testeo',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CO',
ADD COLUMN IF NOT EXISTS return_shipping FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_costs FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS record_id TEXT;

-- 2. TABLA: marketing_spend (Pauta & Marketing)
CREATE TABLE IF NOT EXISTS marketing_spend (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Meta',
    campaign_name TEXT DEFAULT 'Nueva Campaña',
    ad_account TEXT DEFAULT '',
    spend FLOAT DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr FLOAT DEFAULT 0,
    cpc FLOAT DEFAULT 0,
    cpa FLOAT DEFAULT 0,
    creative_url TEXT,
    status TEXT DEFAULT 'active'
);

-- 3. TABLA: campaign_records (Seguimiento de Campañas)
CREATE TABLE IF NOT EXISTS campaign_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    campaign_id TEXT,
    date TEXT,
    store TEXT,
    developer TEXT,
    product_name TEXT,
    process TEXT DEFAULT 'Producto nuevo',
    category TEXT,
    variations TEXT,
    tt_date TEXT,
    fb_date TEXT,
    supplier TEXT DEFAULT 'Dropi',
    platform_code TEXT,
    supplier_cost FLOAT DEFAULT 0,
    selling_price FLOAT DEFAULT 0,
    revised BOOLEAN DEFAULT false,
    ad_account TEXT,
    fan_page TEXT,
    landing_link TEXT
);

-- 4. TABLA: productivity_tasks (Checklist)
CREATE TABLE IF NOT EXISTS productivity_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- 5. TABLA: competitor_monitor (Espía de Competencia)
CREATE TABLE IF NOT EXISTS competitor_monitor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    last_status TEXT,
    color TEXT DEFAULT '#94a3b8'
);

-- 6. TABLA: creative_pipeline (Kanban de Assets)
CREATE TABLE IF NOT EXISTS creative_pipeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    platform TEXT,
    author TEXT,
    status TEXT NOT NULL, -- 'pending', 'filming', 'editing', 'ready'
    priority TEXT DEFAULT 'medium'
);

-- 7. TABLA: user_settings (Configuración General)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile JSONB DEFAULT '{}',
    proxy_config JSONB DEFAULT '{}',
    regional JSONB DEFAULT '{"country": "CO", "currency": "COP", "language": "es"}',
    stores JSONB DEFAULT '[]',
    ad_platforms JSONB DEFAULT '[]',
    suppliers JSONB DEFAULT '[]'
);

-- 8. TABLA: user_api_configs (Llaves API IA)
CREATE TABLE IF NOT EXISTS user_api_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    chatgpt TEXT,
    gemini TEXT,
    grok TEXT,
    active BOOLEAN DEFAULT false
);

-- 9. TABLA: logistics_reports (Auditoría)
CREATE TABLE IF NOT EXISTS logistics_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    report_date TEXT NOT NULL,
    name TEXT NOT NULL,
    stats JSONB NOT NULL DEFAULT '{}',
    raw_data JSONB NOT NULL DEFAULT '[]'
);

-- 10. TABLA: operation_stats (Operaciones & Checklist)
CREATE TABLE IF NOT EXISTS operation_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_invoiced FLOAT DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    investment_testing FLOAT DEFAULT 0,
    profits FLOAT DEFAULT 0,
    testeos_tiktok INTEGER DEFAULT 0,
    testeos_meta INTEGER DEFAULT 0,
    category_shares JSONB DEFAULT '[]',
    questions JSONB DEFAULT '[]',
    found_products JSONB DEFAULT '{}',
    retrospective TEXT DEFAULT ''
);

-- 11. TABLA: decision_logs (Registro de Decisiones)
CREATE TABLE IF NOT EXISTS decision_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    impact TEXT DEFAULT 'neutral' -- 'positive', 'neutral', 'negative'
);

-- ============================================================
-- HABILITAR RLS Y POLÍTICAS (Para seguridad de tus datos)
-- ============================================================

-- Función helper para crear políticas sin que den error si ya existen
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('marketing_spend', 'campaign_records', 'productivity_tasks', 
                               'competitor_monitor', 'creative_pipeline', 'user_settings', 
                               'user_api_configs', 'logistics_reports', 'operation_stats') 
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "User Access %s" ON %I', t, t);
        -- Caso especial para user_settings donde el id es user_id
        IF t = 'user_settings' THEN
            EXECUTE format('CREATE POLICY "User Access %s" ON %I FOR ALL USING (auth.uid() = user_id)', t, t);
        ELSE
            EXECUTE format('CREATE POLICY "User Access %s" ON %I FOR ALL USING (auth.uid() = user_id)', t, t);
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('profit_records', 'marketing_spend', 'campaign_records', 'creative_pipeline')
ORDER BY table_name, ordinal_position;
