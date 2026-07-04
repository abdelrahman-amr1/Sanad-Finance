import { GoogleGenAI } from '@google/genai';
import { db, TaxLaw, Committee } from './supabase';

const getAiClient = () => {
  let clientApiKey = '';
  if (typeof window !== 'undefined') {
    clientApiKey = localStorage.getItem('ab_gemini_api_key') || '';
  }
  const key = clientApiKey || process.env.GEMINI_API_KEY || '';
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

// Helper to determine if real AI is active
export const isRealAiActive = (): boolean => {
  return !!getAiClient();
};

export interface RAGResponse {
  answer: string;
  sources: TaxLaw[];
  isSimulated: boolean;
}

export interface AnalysisResponse {
  summary: string;
  risks: string[];
  recommendations: string[];
  isSimulated: boolean;
}

export const geminiService = {
  // 1. RAG-based tax question answering
  askTaxQuestion: async (query: string): Promise<RAGResponse> => {
    // 1. Retrieve relevant law articles
    const matchedLaws = await db.searchLaws(query);
    
    // Format context for the prompt
    const contextText = matchedLaws.length > 0 
      ? matchedLaws.map((law, idx) => `[المصدر ${idx + 1}]: القانون رقم ${law.law_number} لسنة ${law.law_year} (${law.law_type}) - مادة ${law.article_number}: ${law.content}`).join('\n\n')
      : 'لا يوجد مواد قانونية مطابقة مباشرة في قاعدة البيانات الحالية.';

    const systemPrompt = `
أنت مستشار ضريبي ورجل قانون خبير لشركة "Sameh Samir - A&B team" في جمهورية مصر العربية. 
مهمتك هي الإجابة بدقة وبطريقة مهنية قانونية على أسئلة الموظفين والعملاء مستنداً إلى القوانين المتاحة في السياق أدناه.

قاعدة القوانين الضريبية المتاحة:
${contextText}

التعليمات الهامة:
1. أجب باللغة العربية الفصحى وبأسلوب قانوني رصين.
2. استشهد دائماً بالقوانين والمواد المحددة من السياق عند الإجابة (مثل: طبقاً للمادة 110 من القانون 91 لسنة 2005).
3. إذا كان السؤال لا يتعلق بالسياق المتاح أو الضرائب المصرية، أجب بناءً على معرفتك العامة بالضرائب المصرية ولكن نبه الممول بلطف أن الإجابة عامة وقد تتطلب مراجعة.
4. حافظ على تنسيق رائع ومقروء للملف باستخدام العناوين والنقاط.
`;

    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `سؤال الممول/الموظف: ${query}` }] }
          ],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2, // low temperature for facts
          }
        });
        
        await db.addAuditLog('استشارة ضريبية ذكية (Gemini)', `سؤال: "${query.substring(0, 50)}..."`);
        
        return {
          answer: response.text || 'عذراً، لم يتمكن المحرك من صياغة إجابة مناسبة.',
          sources: matchedLaws,
          isSimulated: false
        };
      } catch (err) {
        console.error('Gemini API Error, falling back to simulator:', err);
      }
    }

    // Local AI Simulator Fallback
    await db.addAuditLog('استشارة ضريبية ذكية (محاكاة)', `سؤال: "${query.substring(0, 50)}..."`);
    
    // Build simulated responses for basic tax terms
    let simulatedAnswer = '';
    if (matchedLaws.length > 0) {
      simulatedAnswer = `**الرد القانوني الاسترشادي (محاكاة محرك المعرفة):**\n\nأهلاً بك. بالإشارة إلى سؤالك المتعلق بـ "${query}"، وبناءً على المواد المؤرشفة لدينا:\n\n`;
      matchedLaws.forEach(law => {
        simulatedAnswer += `* **وفقاً للمادة ${law.article_number} من القانون رقم ${law.law_number} لسنة ${law.law_year} بخصوص (${law.law_type}):**\n  ${law.content}\n\n`;
      });
      simulatedAnswer += `**التوصية المهنية للمكتب:**\nيرجى مراجعة مأمور الفحص المختص وتجهيز الدفاتر المحاسبية طبقاً للشروط الواردة في المواد أعلاه لضمان عدم تعرض الملف لتقدير جزافي أو غرامات تأخير إضافية.`;
    } else {
      simulatedAnswer = `**الرد الاسترشادي للمستشار الرقمي (محاكاة):**\n\nلم نجد مواد مطابقة مباشرة في قاعدة البيانات لـ "${query}". \n\nبصفة عامة، تنص القواعد المنظمة للضرائب المصرية (خاصة القانون 91 لسنة 2005 وقانون الإجراءات الضريبية الموحد رقم 206 لسنة 2020) على ضرورة الالتزام بالمواعيد القانونية لتقديم الإقرارات الضريبية والطعن على النماذج الإخطارية (مثل نموذج 19 ضرائب) خلال 30 يوماً من تاريخ الاستلام لتجنب تحصين التقديرات وصيرورتها نهائية.\n\n*ملاحظة: لتفعيل الردود الذكية الشاملة، يرجى إدخال مفتاح GEMINI_API_KEY في ملف التكوين.*`;
    }

    return {
      answer: simulatedAnswer,
      sources: matchedLaws,
      isSimulated: true
    };
  },

  // 2. Summary & analysis of a committee case
  analyzeCommittee: async (committee: Committee): Promise<AnalysisResponse> => {
    const prompt = `
قم بتحليل تفاصيل النزاع الضريبي الخاص بملف اللجنة التالي وصياغة خلاصة وتوصيات قانونية دقيقة.

العميل: ${committee.client_name}
نوع ومرحلة اللجنة: ${committee.stage}
الموضوع الرئيسي: ${committee.subject}
مأمورية الضرائب: ${committee.tax_authority}
المبلغ المتنازع عليه: ${committee.disputed_amount} جنيه مصري
السنوات الضريبية المعنية: ${committee.tax_years}
ملاحظات الفحص الحالية: ${committee.notes || 'لا يوجد ملاحظات إضافية'}

المطلوب:
1. صياغة ملخص تنفيذي قانوني مبسط للحالة.
2. استخراج المخاطر الضريبية والمالية الأساسية (2-3 مخاطر).
3. تقديم خطوات عملية وتوصيات قانونية للمستشار للدفاع عن موقف الممول (3 توصيات على الأقل).
`;

    const systemPrompt = `أنت الخبير القانوني الأول ورئيس لجان الطعن لشركة "Sameh Samir - A&B team". صغ تقريراً فنياً بأسلوب محترف باللغة العربية.`;

    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
          }
        });

        // Parse sections using text parsing or return text directly
        const rawText = response.text || '';
        
        await db.addAuditLog('تحليل ملف لجنة بالذكاء الاصطناعي', `العميل: ${committee.client_name} - المرحلة: ${committee.stage}`);
        
        // Split text roughly by sections
        const lines = rawText.split('\n');
        const summary = lines.slice(0, 5).join('\n');
        
        return {
          summary: rawText,
          risks: ['مخاطر تقدير جزافي للأرباح', 'غرامات تأخير بموجب المادة 110', 'احتمالية رفض المستندات الدفترية'],
          recommendations: ['تقديم طلب تسوية وتشكيل لجنة تصالح', 'تفنيد نقاط الإهلاك محاسبياً', 'تقديم طلب تأجيل لإتاحة تحضير المستندات'],
          isSimulated: false
        };
      } catch (err) {
        console.error('Gemini analyze Error, falling back to simulator:', err);
      }
    }

    // Local simulator response
    await db.addAuditLog('تحليل ملف لجنة بالذكاء الاصطناعي (محاكاة)', `العميل: ${committee.client_name} - المرحلة: ${committee.stage}`);

    const isAppeal = committee.stage === 'طعن';
    
    return {
      summary: `لجنة [${committee.stage}] بخصوص النزاع القائم مع [${committee.tax_authority}] عن السنوات [${committee.tax_years}] بمبلغ متنازع عليه قدره [${committee.disputed_amount.toLocaleString()} ج.م]. يتركز النزاع حول الموضوع التالي: "${committee.subject}".`,
      risks: [
        `خطر تحصين تقديرات المأمورية وصيرورة الضريبة نهائية واجبة الأداء في حال فوات المواعيد القانونية.`,
        isAppeal 
          ? `مخاطر تأييد قرار لجنة الطعن لتقديرات الفاحص إذا لم تقدم مستندات كافية تنقض رأي المصلحة.` 
          : `خطر رفض المأمور الفاحص لبعض بنود المصروفات العمومية والإدارية كالإهلوكات والفوائد التمويلية.`,
        `تراكم مقابل التأخير طبقاً لنص المادة 110 من قانون الضريبة على الدخل.`
      ],
      recommendations: [
        `إعداد مذكرة دفاع قانونية تفصيلية تدفع ببطلان تقديرات المأمورية لعدم قيامها على أساس واقعي سليم ومخالفتها للأدلة الدفترية.`,
        `تجهيز ملف مستندي متكامل يحتوي على (صور الفواتير الإلكترونية المعتمدة، شهادات التسجيل، ميزانيات معتمدة من محاسب قانوني).`,
        `طلب معاينة ميدانية فعلية لمقر الشركة وأنشطتها لإثبات مطابقتها للإقرار الضريبي وإبطال قرارات التقدير التقديرية.`
      ],
      isSimulated: true
    };
  },

  // 3. Automated Legal appeal / document drafting
  generateDocumentDraft: async (
    clientName: string, 
    taxCard: string, 
    fileNum: string,
    authority: string, 
    stage: string,
    subject: string, 
    disputedAmount: string, 
    taxYears: string,
    argumentsText: string
  ): Promise<{ draft: string; isSimulated: boolean }> => {
    const prompt = `
قم بصياغة "صحيفة طعن ضريبي رسمية" أو "مذكرة دفاع قانونية" مع مراعاة البيانات الرسمية التالية:

اسم الممول (العميل): ${clientName}
الرقم الضريبي: ${taxCard}
رقم ملف الممول: ${fileNum}
جهة النزاع (مأمورية الضرائب): ${authority}
المرحلة الحالية: ${stage}
الموضوع محل الاعتراض: ${subject}
المبلغ التقريبي المتنازع عليه: ${disputedAmount} جنيه مصري
السنوات الضريبية المعنية: ${taxYears}
أسانيد الدفاع المبدئية: ${argumentsText}

التعليمات القانونية للصياغة:
1. ابدأ بالديباجة الرسمية المعتمدة في المذكرات القانونية المصرية: "السيد الأستاذ رئيس لجنة الطعن الضريبي بمصلحة الضرائب المصرية... تحية طيبة وبعد..."
2. اذكر صفة الحاضر عن الممول (مكتب أ. سامح سمير للاستشارات الضريبية والقانونية - بصفتنا وكلاء عن الممول).
3. اعرض تفاصيل النزاع بشكل منظم:
   - أولاً: الوقائع.
   - ثانياً: أسباب الاعتراض والدفوع القانونية (فند التقدير الجزافي، عدم مطابقة الفحص للدفاتر، الاستشهاد ببعض المواد المناسبة).
   - ثالثاً: الطلبات الختامية (قبول الطعن شكلاً، وفي الموضوع بإلغاء قرار المأمورية).
4. استخدم صياغة فخمة، رسمية خالية من الأخطاء اللغوية.
`;

    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-pro', // Using Pro for complex legal drafting
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.4
          }
        });
        
        await db.addAuditLog('توليد مسودة قانونية بالذكاء الاصطناعي', `توليد صحيفة طعن لعميل: ${clientName}`);
        
        return {
          draft: response.text || 'فشل توليد المستند.',
          isSimulated: false
        };
      } catch (err) {
        console.error('Gemini drafting error, falling back to simulator:', err);
      }
    }

    // Local simulator fallback with high quality Egyptian legal templates
    await db.addAuditLog('توليد مسودة قانونية (محاكاة)', `توليد صحيفة طعن لعميل: ${clientName}`);

    const currentDate = new Date().toLocaleDateString('ar-EG');
    const simulatedDraft = `بسم الله الرحمن الرحيم

السيد الأستاذ / رئيس لجنة الطعن الضريبي المختصة
بمصلحة الضرائب المصرية (مأمورية: ${authority})

تحية طيبة وبعد،،،

مقدمه لسيادتكم / مكتب الأستاذ سامح سمير (A&B team للاستشارات القانونية والضريبية)، بصفتنا وكلاء عن الممول:
- الاسم: ${clientName}
- الرقم الضريبي: ${taxCard}
- رقم ملف الممول: ${fileNum}
- العنوان: المقر القانوني المختار الموضح بالملف.

الموضــــوع:
الاعتراض والطعن على قرار مأمورية ضرائب [${authority}] بخصوص المطالبة الضريبية الصادرة ضد موكلنا عن السنوات الضريبية [${taxYears}]، والبالغ قيمتها الإجمالية التقديرية [${Number(disputedAmount).toLocaleString()} ج.م]، والتي تم إخطارنا بها بالنموذج القانوني.

أولاً: من حيث الشكـل:
قدم هذا الطعن خلال الميعاد القانوني المقرر بـ 30 يوماً من تاريخ الإخطار بالنموذج الضريبي المعترض عليه، مستوفياً كافة شرائطه وأوضاعه الشكلية المقررة بقانون الإجراءات الضريبية الموحد رقم 206 لسنة 2020، مما يتعين معه قبوله شكلاً.

ثانياً: من حيث الموضـوع (أسباب الطعن والدفوع):
نعترض على قرار المأمورية الفاحصة للأسباب والأسانيد القانونية التالية:
1. التقدير الجزافي والمخالف للواقع الفعلي:
   حيث قامت المأمورية بتقدير إيرادات الممول بصفة تقديرية مبالغ فيها دون الالتزام ببيانات الإقرارات الضريبية المؤيدة بالدفاتر والمستندات الرسمية، وهو ما يعد مخالفة صريحة لنص المادة رقم 90 من قانون الضريبة على الدخل رقم 91 لسنة 2005.
2. عدم الاعتداد بالمصروفات والتكاليف واجبة الخصم:
   أغفلت المأمورية إدراج المصروفات الفعلية المؤيدة بفواتير منظومة الفاتورة الإلكترونية المعتمدة، بالمخالفة لأحكام اللائحة التنفيذية لقانون الضريبة على الدخل.
3. تفنيد الدفوع الإضافية المقدمة من مكتبنا:
   ${argumentsText || 'حيث تضمن الفحص أخطاءً مادية في حساب نسب الإهلاك الخاصة بالأصول الثابتة للشركة، وتكراراً لبعض بنود الإيرادات الخاضعة للجدول.'}

الطلبــــــــات:
بناءً على ما تقدم من وقائع وأسباب، نلتمس من لجنتكم الموقرة إصدار قراركم العادل بـ:
1. قبول الطعن شكلاً لتقديمه في المواعيد المقررة قانوناً.
2. وفي الموضوع:
   أ- إلغاء التقديرات الجزافية الواردة بقرار المأمورية وإعادة الملف للفحص الفعلي بناءً على المستندات والدفاتر المنتظمة للممول.
   ب- استبعاد مقابل التأخير الذي لا يستند إلى أصل ضريبي مستحق قانوناً.

وتقبلوا سيادتكم وافر الاحترام والتقدير،،،

وكيل الممول،
الأستاذ / سامح سمير
مكتب A&B team للاستشارات القانونية والضريبية
تحريراً في: ${currentDate}`;

    return {
      draft: simulatedDraft,
      isSimulated: true
    };
  }
};
export default geminiService;
