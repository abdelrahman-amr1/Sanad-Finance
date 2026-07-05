import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

// Set runtime to nodejs for server-side environment variables access
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, query, committee, draftParams } = body;

    // Call the direct server-side implementation by bypassing the client-side check
    if (action === 'askTaxQuestion') {
      const result = await geminiService.askTaxQuestion(query, true);
      return NextResponse.json(result);
    } else if (action === 'analyzeCommittee') {
      const result = await geminiService.analyzeCommittee(committee, true);
      return NextResponse.json(result);
    } else if (action === 'generateDocumentDraft') {
      const result = await geminiService.generateDocumentDraft(
        draftParams.clientName,
        draftParams.taxCard,
        draftParams.fileNum,
        draftParams.authority,
        draftParams.stage,
        draftParams.subject,
        draftParams.disputedAmount,
        draftParams.taxYears,
        draftParams.argumentsText,
        true
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
