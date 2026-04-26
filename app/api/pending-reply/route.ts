import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ error: "idが必要です" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("replies")
    .select("id, review_id, content")
    .eq("id", id)
    .eq("is_posted", false)
    .single()

  if (error || !data) {
    return Response.json({ error: "返信案が見つかりません" }, { status: 404 })
  }

  return Response.json(data)
}
