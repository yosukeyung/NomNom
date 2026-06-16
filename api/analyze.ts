import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env

const HF_SPACE_URL = process.env['HF_SPACE_URL'] || 'https://mpricillia-nomnom-ai.hf.space';

// Helper for model fallback due to varying API key access rights
async function generateContentWithFallback(ai: any, prompt: string) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      return await ai.models.generateContent({
        model: model,
        contents: prompt,
      });
    } catch (e: any) {
      console.warn(`Model ${model} failed, trying next...`);
      lastError = e;
    }
  }
  throw lastError;
}

// Helper to extract the actual sentence containing the aspect and opinion
function findOriginalQuote(text: string, aspect: string, opinion: string): string {
  if (!text) return "";
  
  // Clean punctuation-based split for sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  const aspLower = (aspect || "").toLowerCase().trim();
  const opLower = (opinion || "").toLowerCase().trim();
  
  // 1. Try to find a sentence containing both aspect and opinion
  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    if (sLower.includes(aspLower) && sLower.includes(opLower)) {
      return sentence.trim();
    }
  }
  
  // 2. Try to find a sentence containing aspect
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(aspLower)) {
      return sentence.trim();
    }
  }
  
  // 3. Try to find a sentence containing opinion
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(opLower)) {
      return sentence.trim();
    }
  }
  
  // Fallback to a clean snippet of the text
  return text.length > 100 ? text.substring(0, 100).trim() + "..." : text.trim();
}

// Unified response format
function formatUnifiedResponse(text: string, aspects: any[], model: string) {
  let positiveCount = 0;
  let negativeCount = 0;
  
  const formattedAspects = aspects.map(asp => {
    let sentiment = asp.sentimen || asp.sentiment || "positif";
    sentiment = sentiment.toLowerCase() === 'positif' || sentiment.toLowerCase() === 'positive' ? 'positive' : 'negative';
    
    if (sentiment === 'positive') positiveCount++;
    else negativeCount++;
    
    let score = 0.95; // default confidence
    if (asp.keyakinan && typeof asp.keyakinan === 'string' && asp.keyakinan.includes('%')) {
      score = parseFloat(asp.keyakinan.replace('%', '')) / 100;
    } else if (typeof asp.keyakinan === 'number') {
      score = asp.keyakinan;
    }
    
    if (sentiment === 'negative') score = -score;

    return {
      category: asp.aspek || asp.aspect || "General",
      label: asp.opini || asp.opinion || "neutral",
      score: score,
      sentiment: sentiment,
      quote: findOriginalQuote(text, asp.aspek || asp.aspect, asp.opini || asp.opinion)
    };
  });

  // Calculate actual overall score (average score of all aspects)
  const overallScore = formattedAspects.length > 0 
    ? parseFloat((formattedAspects.reduce((sum, asp) => sum + asp.score, 0) / formattedAspects.length).toFixed(2))
    : 0.0;
    
  const overallSentiment = overallScore >= 0 ? "Positive" : "Negative";

  // Generate dynamic summary
  const summary = formattedAspects.length > 0
    ? `Extracted ${formattedAspects.length} aspect-opinion pair${formattedAspects.length !== 1 ? 's' : ''} using ${model}. We detected ${positiveCount} positive sentiment aspect${positiveCount !== 1 ? 's' : ''} and ${negativeCount} negative sentiment aspect${negativeCount !== 1 ? 's' : ''}.`
    : `No aspect-opinion pairs could be extracted from the text using ${model}.`;

  // Generate dynamic highlights
  const highlights: string[] = [];
  const positives = formattedAspects.filter(a => a.sentiment === 'positive').map(a => `${a.category} (${a.label})`);
  const negatives = formattedAspects.filter(a => a.sentiment === 'negative').map(a => `${a.category} (${a.label})`);

  if (positives.length > 0) {
    highlights.push(`Positive aspects: ${positives.slice(0, 2).join(', ')}`);
  }
  if (negatives.length > 0) {
    highlights.push(`Negative aspects: ${negatives.slice(0, 2).join(', ')}`);
  }
  if (highlights.length === 0) {
    highlights.push("No distinct sentiment indicators were isolated.");
  }

  // Extract a clean product/item name suggestion from text (first 3 words)
  let productName = "Food Review";
  const cleanText = text.replace(/[^\w\s]/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    const titleReference = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    productName = `${titleReference}...`;
  }

  return {
    productName: productName,
    overallScore: overallScore,
    overallSentiment: overallSentiment,
    summary: summary,
    aspects: formattedAspects,
    highlights: highlights
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Initialize inside handler so dotenv is guaranteed to be loaded
    const { text, model = 'Hybrid', apiKey } = req.body;
    const GEMINI_API_KEY = apiKey || process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY'] || '';
    const HF_API_TOKEN = process.env['HF_API_TOKEN'] || process.env['VITE_HF_API_TOKEN'] || '';
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (HF_API_TOKEN) {
      headers['Authorization'] = `Bearer ${HF_API_TOKEN}`;
    }

    if (model === 'DistilBERT') {
      const response = await fetch(`${HF_SPACE_URL}/predict-bert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error(`HF Space Error: ${response.statusText}`);
      const data = await response.json();
      return res.json(formatUnifiedResponse(text, data.results || [], 'DistilBERT'));
    } 
    else if (model === 'LLM') {
      const prompt = `
        Kamu adalah asisten AI ahli Aspect-Based Sentiment Analysis (ABSA).
        Tugasmu adalah membaca teks ulasan pengguna, lalu mengekstrak Aspek, Opini, dan langsung menentukan Sentimennya.
        
        Aturan ketat:
        1. Ekstrak SEGALA aspek yang memiliki opini (makanan, minuman, pelayanan, suasana, kebersihan, dll).
        2. Pisahkan aspek yang dirangkai dengan kata hubung.
        3. Tangkap opini secara utuh (termasuk kata penegas/negasi seperti "too sweet", "not good").
        4. Tentukan sentimen dari opini tersebut. Pilihan Sentimen HANYA: "Positif" atau "Negatif".
        5. Kembalikan HANYA dalam format JSON array. Tidak boleh ada teks pengantar atau penutup.
        
        Contoh Output:
        [
            {"aspek": "cake", "opini": "too sweet", "sentimen": "Negatif"},
            {"aspek": "waiter", "opini": "very friendly", "sentimen": "Positif"}
        ]

        Teks Ulasan: "${text}"
      `;
      const response = await generateContentWithFallback(ai, prompt);
      const aiResponseText = response.text || '';
      const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const results = parsed.map((item: any) => ({
        aspek: item.aspek,
        opini: item.opini,
        sentimen: item.sentimen,
        keyakinan: "95.0%" // Simulated high confidence for LLM
      }));
      
      return res.json(formatUnifiedResponse(text, results, 'LLM'));
    }
    else {
      // Hybrid
      const prompt = `
        Kamu adalah asisten AI ahli ekstraksi informasi tata bahasa.
        Tugasmu HANYA mengekstrak Aspek (segala hal yang dikomentari pengguna) dan Opini (penilaian) dari ulasan pengguna.
        
        Aturan ketat:
        1. Ekstrak SEGALA aspek yang memiliki opini.
        2. Pisahkan aspek yang dirangkai dengan kata hubung.
        3. Tangkap kata penegas/negasi secara lengkap pada opini.
        4. Jika opini berupa kata kerja, anggap itu sebagai opini.
        5. Kembalikan HANYA dalam format JSON array seperti contoh. TIDAK BOLEH menebak sentimen.
        
        Contoh Output:
        [
            {"aspek": "cake", "opini": "too sweet"},
            {"aspek": "restaurant vibe", "opini": "very cozy"}
        ]

        Teks Ulasan: "${text}"
      `;
      const aiResponse = await generateContentWithFallback(ai, prompt);
      const aiResponseText = aiResponse.text || '';
      const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedPairs = JSON.parse(cleanJson);
      
      const response = await fetch(`${HF_SPACE_URL}/predict-sentiment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pairs: extractedPairs })
      });
      if (!response.ok) throw new Error(`HF Space Error: ${response.statusText}`);
      const hfData = await response.json();
      
      return res.json(formatUnifiedResponse(text, hfData.results || [], 'Hybrid'));
    }
  } catch (error: any) {
    console.error("API Analyze Error:", error);
    return res.status(500).json({ 
      errorOccurred: true, 
      errorMessage: error.message,
      isDemoMode: true 
    });
  }
}
