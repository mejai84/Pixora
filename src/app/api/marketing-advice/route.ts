import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { records, profitData, model: requestedModel, apiKeys } = await req.json()

        if (!records || records.length === 0) {
            return NextResponse.json({ error: 'No hay datos suficientes para analizar' }, { status: 400 })
        }

        const statsContext = {
            totalSpend: records.reduce((acc: number, r: any) => acc + r.spend, 0),
            totalConversions: records.reduce((acc: number, r: any) => acc + r.conversions, 0),
            totalSales: profitData.reduce((acc: number, p: any) => acc + p.totalSales, 0),
            platforms: records.reduce((acc: any, r: any) => {
                const p = r.platform || 'Otros'
                if (!acc[p]) acc[p] = { spend: 0, conv: 0 }
                acc[p].spend += r.spend
                acc[p].conv += r.conversions
                return acc
            }, {}),
            topCampaigns: records.slice(0, 10).map((r: any) => ({
                name: r.campaign_name,
                platform: r.platform,
                spend: r.spend,
                cpa: r.cpa,
                roi: r.spend > 0 ? (profitData.find((p: any) => p.date === r.date)?.totalSales || 0) / r.spend : 0
            }))
        }

        const prompt = `Actúa como un experto en Media Buying y Growth Hacking para eCommerce.
        Analiza los siguientes datos de pauta y ventas reales para dar consejos de optimización y escalado.
        
        DATOS:
        - Gasto Total: $${statsContext.totalSpend}
        - Conversiones Totales: ${statsContext.totalConversions}
        - Ventas Totales (Ingresos Reales): $${statsContext.totalSales}
        - ROAS Global Real: ${(statsContext.totalSales / (statsContext.totalSpend || 1)).toFixed(2)}x
        - Rendimiento por Plataforma: ${JSON.stringify(statsContext.platforms)}
        - Campañas Recientes: ${JSON.stringify(statsContext.topCampaigns)}

        INSTRUCCIONES:
        1. Analiza el ROAS real vs gasto.
        2. Identifica cuál plataforma es más rentable.
        3. Identifica campañas que están "quemando" dinero (CPA alto).
        4. Identifica oportunidades de escalado (CPA bajo y buen ROI).
        5. Da 3 consejos accionables concretos.

        FORMATO DE RESPUESTA:
        Usa un tono profesional pero directo. Usa emojis para resaltar puntos clave (✅, ⚠️, 📈).
        Responde en español de forma concisa.`

        let advice = ''

        if (requestedModel === 'openai') {
            const apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
            if (!apiKey) throw new Error('API Key de OpenAI no configurada')

            const openai = new OpenAI({ apiKey })
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "Expert Media Buyer" }, { role: "user", content: prompt }],
            })
            advice = completion.choices[0].message.content || 'No se pudo generar el análisis.'
        }
        else if (requestedModel === 'gemini') {
            const apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY
            if (!apiKey) throw new Error('API Key de Gemini no configurada')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
            const result = await model.generateContent(prompt)
            advice = result.response.text().trim()
        }
        else if (requestedModel === 'grok') {
            const apiKey = apiKeys?.grok || process.env.GROK_API_KEY
            if (!apiKey) throw new Error('API Key de Grok no configurada')

            const xai = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" })
            const completion = await xai.chat.completions.create({
                model: "grok-2-latest",
                messages: [{ role: "system", content: "Expert Media Buyer" }, { role: "user", content: prompt }],
            })
            advice = completion.choices[0].message.content || 'No se pudo generar el análisis.'
        }

        return NextResponse.json({ advice })
    } catch (error: any) {
        console.error('ERROR en /api/marketing-advice:', error)
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
    }
}
