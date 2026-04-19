import { auth } from "@/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return Response.json({ error: "未ログイン" }, { status: 401 })
  }

  const { reviewName, comment } = await request.json()

  // ダミーモード：実際には Google API に投稿する
  // 本番では postReply(session.accessToken, reviewName, comment) を呼ぶ
  console.log("返信投稿（デモ）:", { reviewName, comment })

  // Supabase に返信履歴を保存
  await supabaseAdmin.from("replies").insert({
    review_id: reviewName,
    content: comment,
    is_posted: false, // デモなので false
  })

  return Response.json({ success: true })
}
