-- Nueva tabla para configuraciones de API por usuario
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

-- Habilitar RLS
ALTER TABLE user_api_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Los usuarios solo ven sus propias configuraciones" 
  ON user_api_configs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo insertan sus propias configuraciones" 
  ON user_api_configs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo actualizan sus propias configuraciones" 
  ON user_api_configs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo eliminan sus propias configuraciones" 
  ON user_api_configs FOR DELETE 
  USING (auth.uid() = user_id);

-- Índice para mejorar velocidad de búsqueda por usuario
CREATE INDEX IF NOT EXISTS idx_user_api_configs_user_id ON user_api_configs(user_id);
