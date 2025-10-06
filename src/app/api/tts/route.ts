import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '請提供要轉換的文字' },
        { status: 400 }
      );
    }

    // 使用 OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1', // 使用標準模型（更快更便宜）
      voice: 'nova', // nova 是最自然的女聲
      input: text,
      speed: 0.9, // 稍慢一點，更適合學習
    });

    // 將音檔轉換為 Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 返回音檔
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable', // 瀏覽器快取一年
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: '語音生成失敗' },
      { status: 500 }
    );
  }
}
