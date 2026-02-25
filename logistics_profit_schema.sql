-- Tablas para Logística y Control de Profit
-- Ejecutar en el Editor SQL de Supabase

-- 1. Tabla para Reportes Logísticos
CREATE TABLE IF NOT EXISTS logistics_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  report_date TEXT NOT NULL, -- Fecha formateada del reporte
  name TEXT NOT NULL,        -- Nombre del archivo/reporte
  stats JSONB NOT NULL,      -- Objeto LogisticsStats
  raw_data JSONB NOT NULL    -- Array de OrderData
);

-- RLS para reportes logísticos
ALTER TABLE logistics_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver sus propios reportes" ON logistics_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus propios reportes" ON logistics_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus propios reportes" ON logistics_reports FOR DELETE USING (auth.uid() = user_id);

-- 2. Tabla para Registros de Profit (DailyRecords)
CREATE TABLE IF NOT EXISTS profit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  record_id TEXT NOT NULL,   -- ID interno de la aplicación
  date TEXT NOT NULL,        -- Fecha del registro
  type TEXT NOT NULL,        -- Testeo, Estable, etc.
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

-- RLS para registros de profit
ALTER TABLE profit_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver sus propios registros de profit" ON profit_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus propios registros de profit" ON profit_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus propios registros de profit" ON profit_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus propios registros de profit" ON profit_records FOR DELETE USING (auth.uid() = user_id);
