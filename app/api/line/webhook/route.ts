import { createHmac } from "crypto"
import { after } from "next/server"
import { dummyReviews, starRatingToNumber } from "@/lib/dummy-reviews"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// LINE にメッセージを返信する（reply token 使用・30秒以内）
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

// LINE に Push メッセージを送る（userId 宛・時間制限なし）
async function pushMessage(userId: string, messages: object[]) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })
}

// 口コミ一覧をカルーセル形式で返す
function buildReviewCarousel() {
  const bubbles = dummyReviews.slice(0, 5).map((r, i) => {
    const rating = starRatingToNumber(r.starRating)
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating)

    return {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: stars, color: "#FFB800", size: "md" },
          { type: "text", text: r.reviewer.displayName, weight: "bold", size: "sm" },
          {
            type: "text",
            text: r.comment ? r.comment.slice(0, 40) + "..." : "（コメントなし）",
            size: "xs",
            color: "#666666",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#3B82F6",
            height: "sm",
            action: {
              type: "message",
              label: "AIで返信を生成",
              text: `返信:${i + 1}`,
            },
          },
        ],
      },
    }
  })

  return {
    type: "flex",
    altText: "未返信の口コミ一覧",
    contents: { type: "carousel", contents: bubbles },
  }
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
    const userId = event.source.userId

    // 「口コミ」と送ったらカルーセルで表示
    if (text === "口コミ" || text === "口コミを見る") {
      await replyMessage(replyToken, [
        { type: "text", text: `未返信の口コミが ${dummyReviews.length} 件あります👇` },
        buildReviewCarousel(),
      ])
      continue
    }

    // 「返信:番号」でAI返信案を生成
    if (text.startsWith("返信:")) {
      const num = parseInt(text.replace("返信:", ""))
      if (!isNaN(num) && num >= 1 && num <= dummyReviews.length) {
        const review = dummyReviews[num - 1]
        const rating = starRatingToNumber(review.starRating)

        // 即座に「生成中...」と返信
        await replyMessage(replyToken, [
          { type: "text", text: "✨ AI が返信文を生成中です..." },
        ])

        // レスポンス後にバックグラウンドで処理
        after(async () => {
          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `あなたは「${review.businessName}」のオーナーです。
以下のGoogle マップの口コミに対して、丁寧で温かみのある返信文を日本語で書いてください。

投稿者：${review.reviewer.displayName}
評価：${rating}点（5点満点）
内容：${review.comment ?? "（コメントなし）"}

200文字以内で返信文のみを出力してください。`,
              },
            ],
          })

          const replyText =
            message.content[0].type === "text" ? message.content[0].text : ""

          await pushMessage(userId, [
            {
              type: "flex",
              altText: "返信案",
              contents: {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "md",
                  contents: [
                    {
                      type: "text",
                      text: `${review.reviewer.displayName}さんへの返信案`,
                      weight: "bold",
                      size: "sm",
                      color: "#666666",
                    },
                    { type: "text", text: replyText, wrap: true, size: "sm" },
                  ],
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      color: "#22C55E",
                      action: {
                        type: "message",
                        label: "✅ Google に投稿する",
                        text: `投稿:${num}`,
                      },
                    },
                  ],
                },
              },
            },
          ])
        })

        continue
      }
    }

    // 「投稿:番号」で投稿（デモ）
    if (text.startsWith("投稿:")) {
      const num = parseInt(text.replace("投稿:", ""))
      const review = dummyReviews[num - 1]
      await replyMessage(replyToken, [
        { type: "text", text: `✅ ${review?.reviewer.displayName}さんへの返信を Google に投稿しました！` },
      ])
      continue
    }

    // その他
    await replyMessage(replyToken, [
      { type: "text", text: "「口コミ」と送ると未返信の口コミ一覧を確認できます👍" },
    ])
  }

  return new Response("OK", { status: 200 })
}
