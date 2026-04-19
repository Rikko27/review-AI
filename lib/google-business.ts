const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1"
const BUSINESS_API = "https://mybusiness.googleapis.com/v4"

// Googleビジネスアカウント一覧を取得
export async function getAccounts(accessToken: string) {
  const res = await fetch(`${ACCOUNT_API}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`アカウント取得失敗: ${error}`)
  }

  const data = await res.json()
  return data.accounts ?? []
}

// ビジネスのロケーション（店舗）一覧を取得
export async function getLocations(accessToken: string, accountName: string) {
  const res = await fetch(
    `${BUSINESS_API}/${accountName}/locations?pageSize=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`ロケーション取得失敗: ${error}`)
  }

  const data = await res.json()
  return data.locations ?? []
}

// 口コミ一覧を取得
export async function getReviews(accessToken: string, locationName: string) {
  const res = await fetch(
    `${BUSINESS_API}/${locationName}/reviews?pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`口コミ取得失敗: ${error}`)
  }

  const data = await res.json()
  return data.reviews ?? []
}

// 口コミに返信を投稿
export async function postReply(
  accessToken: string,
  reviewName: string,
  comment: string
) {
  const res = await fetch(`${BUSINESS_API}/${reviewName}/reply`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`返信投稿失敗: ${error}`)
  }

  return await res.json()
}
