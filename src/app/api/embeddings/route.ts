import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a simulated mock vector for local sandbox testing
      const mockVector = Array.from({ length: 1536 }, () => Math.random() - 0.5);
      return NextResponse.json({ embedding: mockVector, note: 'Mock vector generated' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });

    const resAny = response as any;
    const values = resAny.embedding?.values || resAny.embeddings?.values;

    if (values) {
      return NextResponse.json({ embedding: values });
    } else {
      throw new Error('Failed to extract embedding values from Gemini response');
    }
  } catch (error: any) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
