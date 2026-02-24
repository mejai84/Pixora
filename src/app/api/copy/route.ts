import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productInfo, chosenAngle, model: requestedModel, apiKeys } = await req.json()
    if (!productInfo || !chosenAngle) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const prompt = `Actúa como un Copywriter de respuesta directa experto en eCommerce. 
        Tu objetivo es generar un copy de ventas maestro basado en un ángulo específico.
        
        PRODUCTO: ${productInfo.name}
        ÁNGULO DE VENTA: ${chosenAngle.title} - ${chosenAngle.description}
        HOOK: ${chosenAngle.hook}
        EMOCIÓN: ${chosenAngle.emotion}
        
        Genera lo siguiente:
        1. Una descripción persuasiva optimizada para conversión.
        2. El enfoque principal del anuncio.
        3. Una lista de 3-5 problemas profundos que este producto soluciona.
        4. Una definición del cliente ideal (psicográfica).
        5. Una definición del cliente objetivo (demográfica).
        
        Responde ÚNICAMENTE con un JSON válido con esta estructura:
        {
          "description": "copy persuasivo largo",
          "main_focus": "el gancho central del copy",
          "problems": ["problema 1", "problema 2", "problema 3"],
          "ideal_client": "perfil psicográfico",
          "target_client": "perfil demográfico"
        }
        
        Solo devuelve el JSON.`

    let copy: any = null

    if (requestedModel === 'openai') {
      const apiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
      const openai = new OpenAI({ apiKey })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Expert Conversion Copywriter" }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
      copy = JSON.parse(completion.choices[0].message.content || '{}')
    }
    else if (requestedModel === 'gemini') {
      const apiKey = apiKeys?.gemini || process.env.GEMINI_API_KEY
      const genAI = new GoogleGenerativeAI(apiKey!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      copy = JSON.parse(cleaned)
    }
    else if (requestedModel === 'grok') {
      const apiKey = apiKeys?.grok || process.env.GROK_API_KEY
      const xai = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" })
      const completion = await xai.chat.completions.create({
        model: "grok-2-latest",
        messages: [{ role: "system", content: "Expert Conversion Copywriter" }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
      copy = JSON.parse(completion.choices[0].message.content || '{}')
    }

    return NextResponse.json({ copy })
  } catch (error: any) {
    console.error('Error en /api/copy:', error)
    return NextResponse.json({ error: error.message || 'Error al generar el copy' }, { status: 500 })
  }
}
