import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  const { reviewerName, rating, comment, businessName } = await request.json()

  const prompt = `あなたは「${businessName}」のオーナーです。
以下のGoogle マップの口コミに対して、丁寧で温かみのある返信文を日本語で書いてください。

【口コミ情報】
投稿者：${reviewerName}
評価：${rating}点（5点満点）
内容：${comment ?? "（コメントなし）"}

【返信のルール】
- 投稿者の名前を含めて呼びかける
- 評価に応じたトーンにする（高評価は感謝、低評価は謝罪と改善の意思を示す）
- 200文字以内にまとめる
- 「オーナーより」などの署名は不要
- 返信文のみを出力する`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  })

  const reply =
    message.content[0].type === "text" ? message.content[0].text : ""

  return Response.json({ reply })
}
