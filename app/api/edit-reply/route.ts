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
  const { id, comment, userId } = await request.json()

  if (!id) {
    return Response.json({ error: "idが必要です" }, { status: 400 })
  }
  if (!comment || typeof comment !== "string" || comment.trim() === "") {
    return Response.json({ error: "返信文が空です" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 返信内容を更新して投稿済みにする
  const { data, error } = await supabase
    .from("replies")
    .update({ content: comment, is_posted: true })
    .eq("id", id)
    .select("review_id")
    .single()

  if (error || !data) {
    console.error("Supabase更新エラー:", error)
    return Response.json({ error: "更新に失敗しました" }, { status: 500 })
  }

  // TODO: 本番では postReply(accessToken, data.review_id, comment) を呼ぶ
  console.log("Google返信投稿（編集後・デモ）:", { reviewId: data.review_id, comment })

  // LINE に完了通知を Push
  if (userId) {
    try {
      await pushMessage(userId, [
        {
          type: "text",
          text: `✅ 返信を投稿しました！\n\n「${comment.slice(0, 30)}${comment.length > 30 ? "..." : ""}」`,
        },
      ])
    } catch (e) {
      console.error("LINE Push失敗:", e)
    }
  }

  return Response.json({ success: true })
}
