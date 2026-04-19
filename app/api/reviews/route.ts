import { auth } from "@/auth"
import { dummyReviews } from "@/lib/dummy-reviews"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return Response.json({ error: "未ログイン" }, { status: 401 })
  }

  // ダミーデータを返す（実際のビジネスアカウントがある場合はここを差し替え）
  return Response.json({ reviews: dummyReviews })
}
