import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { dummyReviews, starRatingToNumber } from "@/lib/dummy-reviews"
import ReviewCard from "@/app/dashboard/ReviewCard"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Review AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user?.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>

        {/* 口コミ一覧 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            口コミ一覧（{dummyReviews.length}件）
          </h2>
          <p className="text-sm text-gray-400">※ 現在はデモデータを表示しています</p>
        </div>

        <div className="flex flex-col gap-4">
          {dummyReviews.map((review) => (
            <ReviewCard
              key={review.reviewId}
              review={review}
              rating={starRatingToNumber(review.starRating)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
