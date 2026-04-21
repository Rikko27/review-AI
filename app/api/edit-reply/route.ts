import { dummyReviews } from "@/lib/dummy-reviews"
import { getSupabaseAdmin } from "@/lib/supabase"

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

export async function POST(request: Request) {
  const { idx, comment, userId } = await request.json()

  const num = parseInt(idx)
  if (isNaN(num) || num < 1 || num > dummyReviews.length) {
    return Response.json({ error: "無効な口コミ番号" }, { status: 400 })
  }
  if (!comment || typeof comment !== "string" || comment.trim() === "") {
    return Response.json({ error: "返信文が空です" }, { status: 400 })
  }

  const review = dummyReviews[num - 1]

  // TODO: 本番では postReply(accessToken, review.name, comment) を呼ぶ
  console.log("Google返信投稿（編集後・デモ）:", { reviewName: review.name, comment })

  // Supabase に返信履歴を保存
  try {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin.from("replies").insert({
      review_id: review.name,
      content: comment,
      is_posted: false,
    })
  } catch (e) {
    console.error("Supabase保存エラー:", e)
  }

  // LINE に完了通知を Push
  if (userId) {
    try {
      await pushMessage(userId, [
        {
          type: "text",
          text: `✅ ${review.reviewer.displayName}さんへの返信を投稿しました！\n\n「${comment.slice(0, 30)}${comment.length > 30 ? "..." : ""}」`,
        },
      ])
    } catch (e) {
      console.error("LINE Push失敗:", e)
    }
  }

  return Response.json({ success: true })
}
