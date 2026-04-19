export const dummyReviews = [
  {
    name: "accounts/123/locations/456/reviews/001",
    reviewId: "001",
    reviewer: {
      displayName: "田中 太郎",
      profilePhotoUrl: "",
    },
    starRating: "FIVE",
    comment: "スタッフの対応がとても丁寧で、料理も美味しかったです。また来たいと思います！",
    createTime: "2024-03-01T10:00:00Z",
    updateTime: "2024-03-01T10:00:00Z",
    reviewReply: null,
    businessName: "テストカフェ 渋谷店",
  },
  {
    name: "accounts/123/locations/456/reviews/002",
    reviewId: "002",
    reviewer: {
      displayName: "佐藤 花子",
      profilePhotoUrl: "",
    },
    starRating: "FOUR",
    comment: "雰囲気が良くて居心地が良かったです。ただ少し混んでいて待ち時間がありました。",
    createTime: "2024-03-05T14:30:00Z",
    updateTime: "2024-03-05T14:30:00Z",
    reviewReply: null,
    businessName: "テストカフェ 渋谷店",
  },
  {
    name: "accounts/123/locations/456/reviews/003",
    reviewId: "003",
    reviewer: {
      displayName: "鈴木 一郎",
      profilePhotoUrl: "",
    },
    starRating: "THREE",
    comment: "普通でした。特別良くも悪くもない印象です。",
    createTime: "2024-03-10T09:15:00Z",
    updateTime: "2024-03-10T09:15:00Z",
    reviewReply: null,
    businessName: "テストカフェ 渋谷店",
  },
  {
    name: "accounts/123/locations/456/reviews/004",
    reviewId: "004",
    reviewer: {
      displayName: "山田 美咲",
      profilePhotoUrl: "",
    },
    starRating: "TWO",
    comment: "注文してから料理が来るまでとても時間がかかりました。改善してほしいです。",
    createTime: "2024-03-12T19:00:00Z",
    updateTime: "2024-03-12T19:00:00Z",
    reviewReply: null,
    businessName: "テストカフェ 渋谷店",
  },
  {
    name: "accounts/123/locations/456/reviews/005",
    reviewId: "005",
    reviewer: {
      displayName: "伊藤 健",
      profilePhotoUrl: "",
    },
    starRating: "FIVE",
    comment: "何度来ても毎回満足しています。特にランチセットがおすすめです！",
    createTime: "2024-03-15T12:00:00Z",
    updateTime: "2024-03-15T12:00:00Z",
    reviewReply: null,
    businessName: "テストカフェ 渋谷店",
  },
]

export function starRatingToNumber(starRating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }
  return map[starRating] ?? 0
}
