
-- Pixora: Tablas de base de datos
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de análisis guardados (historial)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  product_url TEXT NOT NULL,
  product_name TEXT,
  product_info JSONB,        -- Paso 2: info del producto
  sales_angles JSONB,        -- Paso 3: ángulos de venta sugeridos
  chosen_angle TEXT,         -- Paso 3: ángulo elegido
  description TEXT,          -- Paso 4: descripción optimizada
  problems JSONB,            -- Paso 4: problemas que resuelve
  ideal_client TEXT,         -- Paso 4: cliente ideal (psicográfico)
  target_client TEXT,        -- Paso 4: cliente objetivo (demográfico)
  sales_channel TEXT,        -- Paso 5: canal de venta elegido
  adapted_copy TEXT,         -- Paso 5: copy adaptado al canal
  template_id UUID           -- Paso 6: plantilla visual elegida
);

-- 2. Tabla de plantillas visuales
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'general',
  section_type TEXT NOT NULL DEFAULT 'hero',
  thumbnail_url TEXT,
  description TEXT
);

-- 3. Insertar plantillas de ejemplo
INSERT INTO templates (name, industry, section_type, thumbnail_url, description) VALUES
  ('Hero Belleza Elegante', 'belleza', 'hero', null, 'Fondo oscuro con detalles dorados, ideal para cosméticos premium'),
  ('Oferta Salud Energía', 'salud', 'oferta', null, 'Diseño vibrante verde/blanco para suplementos y bienestar'),
  ('Hero Tech Moderno', 'tecnologia', 'hero', null, 'Diseño futurista azul/morado para gadgets y electrónica'),
  ('Beneficios Hogar', 'hogar', 'beneficios', null, 'Cálido y acogedor, ideal para productos del hogar'),
  ('Oferta Moda Premium', 'moda', 'oferta', null, 'Minimalista y elegante para ropa y accesorios'),
  ('Hero General Impacto', 'general', 'hero', null, 'Alto contraste, versátil para cualquier producto'),
  ('Antes y Después Fitness', 'deportes', 'antes_despues', null, 'Split screen dinámico para resultados deportivos'),
  ('Testimonios Confianza', 'general', 'testimonios', null, 'Diseño cálido con estrellas y fotos de clientes'),
  ('Tabla Comparativa Pro', 'general', 'comparativa', null, 'Comparación visual clara con checkmarks'),
  ('Suplementos Potencia', 'salud', 'hero', null, 'Oscuro y poderoso para suplementos deportivos')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS api_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  selected_model TEXT DEFAULT 'openai',
  gemini_key TEXT,
  openai_key TEXT,
  grok_key TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 1. Actualizar tabla de análisis para soportar multi-usuario
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Corregir RLS para 'analyses' (Solo el dueño puede ver/editar)
DROP POLICY IF EXISTS "Allow all on analyses" ON analyses;
CREATE POLICY "Los usuarios solo ven sus propios análisis" ON analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo insertan sus propios análisis" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo actualizan sus propios análisis" ON analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo eliminan sus propios análisis" ON analyses FOR DELETE USING (auth.uid() = user_id);

-- 3. Tabla para configuraciones de API por usuario (ya creada en otro paso pero aquí para referencia)
CREATE TABLE IF NOT EXISTS user_api_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  chatgpt TEXT,
  gemini TEXT,
  grok TEXT,
  active BOOLEAN DEFAULT false
);

ALTER TABLE user_api_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo ven sus propias configuraciones" ON user_api_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo insertan sus propias configuraciones" ON user_api_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo actualizan sus propias configuraciones" ON user_api_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo eliminan sus propias configuraciones" ON user_api_configs FOR DELETE USING (auth.uid() = user_id);
