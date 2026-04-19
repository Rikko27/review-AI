"use client"

import { useState } from "react"

type Review = {
  name: string
  reviewId: string
  reviewer: { displayName: string }
  starRating: string
  comment: string
  createTime: string
  reviewReply: null | { comment: string }
  businessName: string
}

type Props = {
  review: Review
  rating: number
}

export default function ReviewCard({ review, rating }: Props) {
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [posted, setPosted] = useState(false)

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating)

  async function generateReply() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: review.reviewer.displayName,
          rating,
          comment: review.comment,
          businessName: review.businessName,
        }),
      })
      const data = await res.json()
      setReply(data.reply)
    } catch {
      alert("返信の生成に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function postReply() {
    setLoading(true)
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewName: review.name,
          comment: reply,
        }),
      })
      if (res.ok) {
        setPosted(true)
      } else {
        alert("返信の投稿に失敗しました")
      }
    } catch {
      alert("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* 口コミ情報 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">{review.reviewer.displayName}</p>
          <p className="text-yellow-400 text-lg">{stars}</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.createTime).toLocaleDateString("ja-JP")}
        </span>
      </div>
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* 返信済みの場合 */}
      {posted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700">✓ 返信を投稿しました</p>
        </div>
      )}

      {/* 返信エリア */}
      {!posted && (
        <>
          {reply && (
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={generateReply}
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "生成中..." : "AI で返信を生成"}
            </button>
            {reply && (
              <button
                onClick={postReply}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "投稿中..." : "Google に投稿"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
