import { createHmac } from "crypto"
import { dummyReviews, starRatingToNumber } from "@/lib/dummy-reviews"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// LINE にメッセージを返信する
async function replyMessage(replyToken: string, messages: object[]) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("x-line-signature") ?? ""

  // 署名検証
  const hash = createHmac("SHA256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64")

  if (hash !== signature) {
    return new Response("Unauthorized", { status: 401 })
  }

  const events = JSON.parse(body).events

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue

    const text = event.message.text.trim()
    const replyToken = event.replyToken

    // 「口コミ」と送ったら口コミ一覧を返す
    if (text === "口コミ" || text === "口コミを見る") {
      const list = dummyReviews
        .slice(0, 5)
        .map((r, i) => {
          const stars = "★".repeat(starRatingToNumber(r.starRating))
          return `${i + 1}. ${stars} ${r.reviewer.displayName}\n「${r.comment?.slice(0, 25)}...」`
        })
        .join("\n\n")

      await replyMessage(replyToken, [
        {
          type: "text",
          text: `未返信の口コミが ${dummyReviews.length} 件あります。\n返信したい番号を送ってください👇\n\n${list}`,
        },
      ])
      continue
    }

    // 番号を送ったらAI返信案を生成
    const num = parseInt(text)
    if (!isNaN(num) && num >= 1 && num <= dummyReviews.length) {
      const review = dummyReviews[num - 1]
      const rating = starRatingToNumber(review.starRating)

      const prompt = `あなたは「${review.businessName}」のオーナーです。
以下のGoogle マップの口コミに対して、丁寧で温かみのある返信文を日本語で書いてください。

投稿者：${review.reviewer.displayName}
評価：${rating}点（5点満点）
内容：${review.comment ?? "（コメントなし）"}

200文字以内で返信文のみを出力してください。`

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      })

      const replyText =
        message.content[0].type === "text" ? message.content[0].text : ""

      await replyMessage(replyToken, [
        {
          type: "text",
          text: `【${review.reviewer.displayName}さんへの返信案】\n\n${replyText}\n\n✅「送信」と返信すると Google に投稿します。`,
        },
      ])
      continue
    }

    // 「送信」で投稿（デモ）
    if (text === "送信") {
      await replyMessage(replyToken, [
        {
          type: "text",
          text: "✅ Google に返信を投稿しました！",
        },
      ])
      continue
    }

    // その他
    await replyMessage(replyToken, [
      {
        type: "text",
        text: "「口コミ」と送ると未返信の口コミ一覧を確認できます👍",
      },
    ])
  }

  return new Response("OK", { status: 200 })
}
