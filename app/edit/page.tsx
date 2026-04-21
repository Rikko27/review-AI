"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function EditForm() {
  const params = useSearchParams()
  const idx = params.get("idx") ?? ""
  const name = params.get("name") ?? ""
  const userId = params.get("userId") ?? ""
  const initialReply = params.get("reply") ?? ""

  const [text, setText] = useState(initialReply)
  const [status, setStatus] = useState<"idle" | "posting" | "done" | "error">("idle")

  async function handlePost() {
    setStatus("posting")
    try {
      const res = await fetch("/api/edit-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idx, comment: text, userId }),
      })
      if (!res.ok) throw new Error("投稿失敗")
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <div className="text-5xl">✅</div>
        <p className="text-xl font-bold text-gray-800">投稿しました！</p>
        <p className="text-gray-500 text-sm">{name}さんへの返信を Google に投稿しました。</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <p className="text-xs text-gray-500">返信先</p>
        <p className="font-bold text-gray-800">{name}さんへの返信</p>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        <textarea
          className="w-full flex-1 min-h-48 p-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="返信文を入力..."
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right">{text.length} / 500</p>

        {status === "error" && (
          <p className="text-red-500 text-sm text-center">投稿に失敗しました。もう一度お試しください。</p>
        )}
      </main>

      <footer className="p-4 bg-white border-t">
        <button
          onClick={handlePost}
          disabled={status === "posting" || text.trim() === ""}
          className="w-full py-3 rounded-xl font-bold text-white text-base transition-colors disabled:opacity-50"
          style={{ backgroundColor: status === "posting" ? "#86efac" : "#22C55E" }}
        >
          {status === "posting" ? "投稿中..." : "📤 この内容で投稿する"}
        </button>
      </footer>
    </div>
  )
}

export default function EditPage() {
  return (
    <Suspense>
      <EditForm />
    </Suspense>
  )
}
