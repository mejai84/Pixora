import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { productInfo, chosenAngle, copy, salesChannel, model: requestedModel, apiKeys } = await req.json()
        if (!copy || !salesChannel) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

        const prompt = `Adapta el siguiente copy de ventas al canal: ${salesChannel.toUpperCase()}.
        
        PRODUCTO: ${productInfo?.name || ''}
        ÁNGULO: ${chosenAngle?.title || ''}
        COPY ORIGINAL: ${copy.description}
        ENFOQUE: ${copy.main_focus}
        
        Instrucciones por canal:
        - Instagram/Facebook/TikTok: Usa emojis, hooks cortos, lenguaje casual y hashtags. Focus en lo visual/emocional.
        - WhatsApp: Directo, personal, con llamadas a la acción claras y escuetas.
        - Email: Asunto impactante + cuerpo persuasivo con estructura de storytelling.
        - Amazon/Landing: Profesional pero enfocado en beneficios y resolución de dudas.
        
        Responde ÚNICAMENTE con un JSON válido con esta estructura:
        {
          "adapted_copy": "el texto adaptado al canal",
          "tips": ["consejo 1 para este canal", "consejo 2 para este canal"]
        }
        
        Solo devuelve el JSON.`

        let data: any = null

        if (requestedModel === 'openai') {
            const apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
            const openai = new OpenAI({ apiKey })
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "Expert Omnichannel Strategy" }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
            data = JSON.parse(completion.choices[0].message.content || '{}')
        }
        else if (requestedModel === 'gemini') {
            const apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY
            const genAI = new GoogleGenerativeAI(apiKey!)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            data = JSON.parse(cleaned)
        }
        else if (requestedModel === 'grok') {
            const apiKey = apiKeys?.grok || process.env.GROK_API_KEY
            const xai = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" })
            const completion = await xai.chat.completions.create({
                model: "grok-2-latest",
                messages: [{ role: "system", content: "Expert Omnichannel Strategy" }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
            data = JSON.parse(completion.choices[0].message.content || '{}')
        }

        return NextResponse.json({ adapted: data })
    } catch (error: any) {
        console.error('Error en /api/adapt:', error)
        return NextResponse.json({ error: error.message || 'Error al adaptar el copy' }, { status: 500 })
    }
}
