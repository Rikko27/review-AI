import { createHmac } from "crypto"
import { dummyReviews, starRatingToNumber } from "@/lib/dummy-reviews"
import { getSupabaseAdmin } from "@/lib/supabase"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

async function saveAndGetId(reviewName: string, replyText: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("replies")
    .insert({ review_id: reviewName, content: replyText, is_posted: false })
    .select("id")
    .single()
  if (error || !data) throw new Error("Supabase保存失敗: " + JSON.stringify(error))
  return String(data.id)
}

async function generateReply(review: (typeof dummyReviews)[0]): Promise<string> {
  const rating = starRatingToNumber(review.starRating)
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `飲食店オーナーとして口コミへの返信文を100文字以内で書いてください。丁寧で温かみのある文体で。返信文のみ出力してください。\n投稿者:${review.reviewer.displayName}\n評価:${rating}/5\n内容:${review.comment ?? "なし"}`,
      },
    ],
  })
  return message.content[0].type === "text" ? message.content[0].text : "生成に失敗しました"
}

function buildReplyBubble(
  review: (typeof dummyReviews)[0],
  num: number,
  replyText: string,
  pendingId: string,
  userId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  const editUrl =
    baseUrl +
    `/edit?id=${pendingId}&name=${encodeURIComponent(review.reviewer.displayName)}&userId=${encodeURIComponent(userId)}`

  return {
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
          {
            type: "text",
            text: replyText,
            wrap: true,
            size: "sm",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#22C55E",
            height: "sm",
            action: {
              type: "message",
              label: "✅ 投稿する",
              text: `投稿:${num}:${replyText}`,
            },
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                height: "sm",
                flex: 1,
                action: {
                  type: "uri",
                  label: "✏️ 修正する",
                  uri: editUrl,
                },
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                flex: 1,
                action: {
                  type: "message",
                  label: "🔄 再生成",
                  text: `再生成:${num}`,
                },
              },
            ],
          },
        ],
      },
    },
  }
}

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
              label: "返信案を生成",
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

    if (text === "口コミ" || text === "口コミを見る") {
      await replyMessage(replyToken, [
        { type: "text", text: `未返信の口コミが ${dummyReviews.length} 件あります👇` },
        buildReviewCarousel(),
      ])
      continue
    }

    // 返信案を生成
    if (text.startsWith("返信:")) {
      const num = parseInt(text.replace("返信:", ""))
      if (!isNaN(num) && num >= 1 && num <= dummyReviews.length) {
        const review = dummyReviews[num - 1]

        await replyMessage(replyToken, [
          { type: "text", text: "✨ AI が返信文を生成中です..." },
        ])

        let replyText = ""
        let pendingId = ""
        try {
          replyText = await generateReply(review)
          pendingId = await saveAndGetId(review.name, replyText)
        } catch (e) {
          console.error("返信生成エラー:", e)
          await pushMessage(userId, [{ type: "text", text: "生成に失敗しました。再度お試しください。" }])
          continue
        }

        await pushMessage(userId, [buildReplyBubble(review, num, replyText, pendingId, userId)])
        continue
      }
    }

    // 再生成
    if (text.startsWith("再生成:")) {
      const num = parseInt(text.replace("再生成:", ""))
      if (!isNaN(num) && num >= 1 && num <= dummyReviews.length) {
        const review = dummyReviews[num - 1]

        await replyMessage(replyToken, [
          { type: "text", text: "🔄 別の返信文を生成中です..." },
        ])

        let replyText = ""
        let pendingId = ""
        try {
          replyText = await generateReply(review)
          pendingId = await saveAndGetId(review.name, replyText)
        } catch (e) {
          console.error("再生成エラー:", e)
          await pushMessage(userId, [{ type: "text", text: "生成に失敗しました。再度お試しください。" }])
          continue
        }

        await pushMessage(userId, [buildReplyBubble(review, num, replyText, pendingId, userId)])
        continue
      }
    }

    // 投稿（返信テキスト込み）: "投稿:番号:返信テキスト"
    if (text.startsWith("投稿:")) {
      const parts = text.split(":")
      const num = parseInt(parts[1])
      const comment = parts.slice(2).join(":")

      if (!isNaN(num) && num >= 1 && num <= dummyReviews.length) {
        const review = dummyReviews[num - 1]

        // TODO: 本番では Google API に投稿
        console.log("Google返信投稿（デモ）:", { reviewName: review.name, comment })

        await replyMessage(replyToken, [
          {
            type: "text",
            text: `✅ ${review.reviewer.displayName}さんへの返信を投稿しました！\n\n「${comment.slice(0, 30)}${comment.length > 30 ? "..." : ""}」`,
          },
        ])
        continue
      }
    }

    await replyMessage(replyToken, [
      { type: "text", text: "「口コミ」と送ると未返信の口コミ一覧を確認できます👍" },
    ])
  }

  return new Response("OK", { status: 200 })
}
