import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { url, model: requestedModel, apiKeys } = await req.json()
        if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

        // Extraer contenido de la URL via Jina AI Reader
        console.log('Analizando URL:', url)
        const jinaUrl = `https://r.jina.ai/${url}`
        const jinaRes = await fetch(jinaUrl, { headers: { 'Accept': 'text/plain' } })

        if (!jinaRes.ok) {
            console.error('Error de Jina AI:', jinaRes.status, jinaRes.statusText)
            return NextResponse.json({ error: `No se pudo acceder al contenido de la web (${jinaRes.status})` }, { status: 502 })
        }

        const pageContent = await jinaRes.text()
        console.log('Contenido extraído, longitud:', pageContent.length)

        if (!pageContent.trim()) {
            return NextResponse.json({ error: 'La página parece estar vacía o bloqueada por un bot' }, { status: 502 })
        }

        const truncatedContent = pageContent.slice(0, 10000)

        // ... (rest of the prompt construction) ...
        const prompt = `Actúa como un analista de productos experto en eCommerce. Analiza el siguiente contenido de una página web y extrae información extremadamente detallada para usarla en campañas de marketing.
        
        Sigue exactamente este esquema y profundiza en cada punto:
        1. Identifica el nombre exacto del producto.
        2. Crea un resumen persuasivo de 2-3 frases.
        3. Lista 5-8 características técnicas/físicas clave (detalladas).
        4. Identifica 4-6 beneficios reales para el usuario (por qué comprarlo).
        5. Define 3-5 casos de uso específicos (para qué sirve).
        6. Identifica el precio, gastos de envío, colores disponibles y especificaciones (material, dimensiones, batería, material, etc.).
        7. Define el público objetivo de forma clara.

        CONTENIDO DE LA WEB:
        ${truncatedContent}

        Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
        {
          "name": "nombre del producto",
          "summary": "resumen persuasivo",
          "features": ["lista de características detalladas"],
          "benefits": ["lista de beneficios detallados"],
          "use_cases": ["lista de casos de uso detallados"],
          "target_audience": "descripción profunda del cliente ideal",
          "price": "precio con moneda o null",
          "shipping": "información de envío/devolución o null",
          "colors": ["lista de colores si existen"],
          "specifications": {
             "material": "...",
             "dimensiones": "...",
             "funcionamiento": "...",
             "extras": "..."
          }
        }

        Solo devuelve el JSON.`

        let productInfo: any = null

        if (requestedModel === 'openai') {
            const apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
            if (!apiKey) throw new Error('API Key de OpenAI no configurada')

            const openai = new OpenAI({ apiKey })
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "Expert JSON extractor" }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
            productInfo = JSON.parse(completion.choices[0].message.content || '{}')
        }
        else if (requestedModel === 'gemini') {
            const apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY
            if (!apiKey) throw new Error('API Key de Gemini no configurada')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) // Cambiado a gemini-1.5-flash que es más estable
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            productInfo = JSON.parse(cleaned)
        }
        else if (requestedModel === 'grok') {
            const apiKey = apiKeys?.grok || process.env.GROK_API_KEY
            if (!apiKey) throw new Error('API Key de Grok no configurada')

            const xai = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" })
            const completion = await xai.chat.completions.create({
                model: "grok-2-latest",
                messages: [{ role: "system", content: "Expert JSON extractor" }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
            productInfo = JSON.parse(completion.choices[0].message.content || '{}')
        }

        return NextResponse.json({ productInfo })
    } catch (error: any) {
        console.error('CRITICAL ERROR en /api/analyze:', error)
        return NextResponse.json({ error: error.message || 'Error interno del servidor al analizar' }, { status: 500 })
    }
}
