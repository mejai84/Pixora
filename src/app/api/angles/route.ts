import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productInfo, model: requestedModel, apiKeys } = await req.json()
    if (!productInfo) return NextResponse.json({ error: 'Información del producto requerida' }, { status: 400 })

    const prompt = `Actúa como un experto en Marketing y Ventas. Basándote en la siguiente información de un producto, genera 5 ángulos de venta (Sales Angles) disruptivos y creativos.
        
        Cada ángulo debe ser único y atacar un deseo, problema o emoción diferente del cliente.
        
        PRODUCTO: ${productInfo.name}
        RESUMEN: ${productInfo.summary}
        BENEFICIOS: ${productInfo.benefits.join(', ')}
        
        Responde ÚNICAMENTE con un JSON válido que sea un array de 5 objetos con esta estructura:
        [
          {
            "id": "1",
            "title": "título corto y potente del ángulo",
            "description": "explicación de por qué este ángulo funciona",
            "hook": "un gancho/frase inicial impactante",
            "emotion": "el disparador mental que usa (escasez, urgencia, estatus, miedo, placer, etc.)"
          },
          ...
        ]
        
        Solo devuelve el JSON array, sin markdown, sin explicaciones.`

    let angles: any[] = []

    if (requestedModel === 'openai') {
      const apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
      const openai = new OpenAI({ apiKey })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Expert Sales Copywriter" }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
      const parsed = JSON.parse(completion.choices[0].message.content || '{}')
      angles = Array.isArray(parsed) ? parsed : (parsed.angles || Object.values(parsed)[0])
    }
    else if (requestedModel === 'gemini') {
      const apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY
      const genAI = new GoogleGenerativeAI(apiKey!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      angles = Array.isArray(parsed) ? parsed : (parsed.angles || Object.values(parsed)[0])
    }
    else if (requestedModel === 'grok') {
      const apiKey = apiKeys?.grok || process.env.GROK_API_KEY
      const xai = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" })
      const completion = await xai.chat.completions.create({
        model: "grok-2-latest",
        messages: [{ role: "system", content: "Expert Sales Copywriter" }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
      const parsed = JSON.parse(completion.choices[0].message.content || '{}')
      angles = Array.isArray(parsed) ? parsed : (parsed.angles || Object.values(parsed)[0])
    }

    return NextResponse.json({ angles })
  } catch (error: any) {
    console.error('Error en /api/angles:', error)
    return NextResponse.json({ error: error.message || 'Error al generar ángulos' }, { status: 500 })
  }
}
