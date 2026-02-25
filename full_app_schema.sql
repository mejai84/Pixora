-- Tablas para Pixora: Logística, Profit, Campañas y Operación
-- Ejecutar en el Editor SQL de Supabase

-- 1. Tabla para Reportes Logísticos (Ya definida antes, pero agrupada aquí)
CREATE TABLE IF NOT EXISTS logistics_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  report_date TEXT NOT NULL,
  name TEXT NOT NULL,
  stats JSONB NOT NULL,
  raw_data JSONB NOT NULL
);

-- 2. Tabla para Registros de Profit (DailyRecords)
CREATE TABLE IF NOT EXISTS profit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  record_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  cancel_rate FLOAT DEFAULT 0,
  return_rate FLOAT DEFAULT 0,
  product_cost FLOAT DEFAULT 0,
  base_shipping FLOAT DEFAULT 0,
  return_shipping FLOAT DEFAULT 0,
  admin_costs FLOAT DEFAULT 0,
  shopify_sales FLOAT DEFAULT 0,
  ad_spend FLOAT DEFAULT 0,
  selling_price FLOAT DEFAULT 0,
  country TEXT DEFAULT 'CO'
);

-- 3. Tabla para Seguimiento de Campañas
CREATE TABLE IF NOT EXISTS campaign_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id TEXT NOT NULL, -- ID interno de la app
  date TEXT,
  store TEXT,
  developer TEXT,
  product_name TEXT,
  process TEXT,
  category TEXT,
  variations TEXT,
  tt_date TEXT,
  fb_date TEXT,
  supplier TEXT,
  platform_code TEXT,
  supplier_cost FLOAT DEFAULT 0,
  selling_price FLOAT DEFAULT 0,
  revised BOOLEAN DEFAULT false,
  ad_account TEXT,
  fan_page TEXT,
  landing_link TEXT
);

-- 4. Tabla para Análisis de Operación (Stats y Checklist)
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
  questions JSONB DEFAULT '[]', -- Estado del checklist diario
  found_products JSONB DEFAULT '{}',
  retrospective TEXT
);

-- 5. Tabla para Análisis de Producto Ganador
CREATE TABLE IF NOT EXISTS winning_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  product_id TEXT NOT NULL, -- ID interno de la app
  name TEXT NOT NULL,
  ad_links JSONB DEFAULT '[]',
  supplier_price FLOAT DEFAULT 0,
  selling_price FLOAT DEFAULT 0,
  dropi_id TEXT,
  angles JSONB DEFAULT '{}',
  competitor JSONB DEFAULT '{}',
  technical JSONB DEFAULT '{}'
);

-- 6. Tabla para Ajustes de Usuario
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  profile JSONB DEFAULT '{}',
  proxy_config JSONB DEFAULT '{}',
  regional JSONB DEFAULT '{}',
  stores JSONB DEFAULT '[]',
  ad_platforms JSONB DEFAULT '[]',
  suppliers JSONB DEFAULT '[]'
);

-- 7. Tabla para Productos Genéricos (Banner/Landing Studio)
CREATE TABLE IF NOT EXISTS user_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT
);

-- 8. Tabla para Tiendas del Usuario
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  url TEXT,
  platform TEXT DEFAULT 'shopify',
  is_active BOOLEAN DEFAULT false
);

-- Habilitar RLS en todas
ALTER TABLE logistics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
CREATE POLICY "RLS_Logistics" ON logistics_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Profit" ON profit_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Campaigns" ON campaign_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Operations" ON operation_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_Winning_Products" ON winning_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_User_Settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_User_Products" ON user_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "RLS_User_Stores" ON user_stores FOR ALL USING (auth.uid() = user_id);
