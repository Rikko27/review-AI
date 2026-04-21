import { dummyReviews, starRatingToNumber } from "@/lib/dummy-reviews"

async function pushMessage(userId: string, messages: object[]) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LINE Push失敗: ${err}`)
  }
}

function buildReviewCarousel(baseUrl: string) {
  const unreplied = dummyReviews.filter((r) => !r.reviewReply)

  const bubbles = unreplied.slice(0, 10).map((r, i) => {
    const rating = starRatingToNumber(r.starRating)
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating)
    const index = dummyReviews.indexOf(r) + 1

    return {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: stars, color: "#FFB800", size: "md" },
          {
            type: "text",
            text: r.reviewer.displayName,
            weight: "bold",
            size: "sm",
          },
          {
            type: "text",
            text: r.comment ? r.comment.slice(0, 50) + "..." : "（コメントなし）",
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
              text: `返信:${index}`,
            },
          },
        ],
      },
    }
  })

  return {
    type: "flex",
    altText: `未返信の口コミ ${unreplied.length}件`,
    contents: { type: "carousel", contents: bubbles },
  }
}

export async function GET(request: Request) {
  // Vercel Cron の認証
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = process.env.LINE_OWNER_USER_ID
  if (!userId) {
    console.error("LINE_OWNER_USER_ID が設定されていません")
    return new Response("LINE_OWNER_USER_ID not set", { status: 500 })
  }

  const unreplied = dummyReviews.filter((r) => !r.reviewReply)

  if (unreplied.length === 0) {
    await pushMessage(userId, [
      { type: "text", text: "今日の未返信口コミはありません！お疲れ様でした🎉" },
    ])
    return new Response("OK", { status: 200 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""

  await pushMessage(userId, [
    {
      type: "text",
      text: `📋 本日の未返信口コミ：${unreplied.length}件\n\n返信したい口コミの「返信案を生成」を押してください👇`,
    },
    buildReviewCarousel(baseUrl),
  ])

  return new Response("OK", { status: 200 })
}
