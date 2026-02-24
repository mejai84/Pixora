import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Analysis = {
    id: string
    created_at: string
    product_url: string
    product_name: string | null
    product_info: ProductInfo | null
    sales_angles: SalesAngle[] | null
    chosen_angle: string | null
    description: string | null
    problems: string[] | null
    ideal_client: string | null
    target_client: string | null
    sales_channel: string | null
    adapted_copy: string | null
    template_id: string | null
}

export type ProductInfo = {
    name: string
    summary: string
    use_cases: string[]
    features: string[]
    benefits: string[]
    target_audience: string
    price?: string
    shipping?: string
    colors?: string[]
    specifications?: Record<string, string>
}

export type SalesAngle = {
    id: string
    title: string
    description: string
    hook: string
    emotion: string
}

export type Template = {
    id: string
    name: string
    industry: string
    section_type: string
    thumbnail_url: string | null
    description: string | null
}

export type ApiSettings = {
    id?: number
    updated_at?: string
    selected_model: 'gemini' | 'openai' | 'grok'
    gemini_key?: string
    openai_key?: string
    grok_key?: string
}
