// Lyrics transcribed from the on-screen subtitles of the original video (プレイバック feat. 初音ミク, 雨衣),
// with start/end times detected frame-by-frame, plus a short English gloss taken from the timed captions.

export type Line = { s: number; e: number; jp: string; en: string; hot?: boolean };

export const LYRICS: Line[] = [
  { s: 2.8, e: 7.25, jp: "大脳からフラッシュバックしてく最低な感触は", en: "That awful sensation, flashing back from my brain…" },
  { s: 7.25, e: 8.9, jp: "忘れちゃいない", en: "…I haven't forgotten it" },
  { s: 8.9, e: 11.15, jp: "錆びた鉄の香りと", en: "The scent of rusty iron, and" },
  { s: 11.15, e: 13.3, jp: "アンニュイなメロディーに", en: "that melancholy melody —" },
  { s: 13.3, e: 15.65, jp: "馳せて噛み砕く", en: "I let my anger race, and chew it to pieces" },
  { s: 15.65, e: 18.95, jp: "愛想笑いで生きていたくない", en: "I don't want to live my life with fake smiles" },
  { s: 18.95, e: 20.65, jp: "強く儚く", en: "Strong, yet fleeting" },
  { s: 20.65, e: 22.85, jp: "どんなに暗い過去でも", en: "No matter how dark the past" },
  { s: 22.85, e: 24.95, jp: "いつもの通り歌うの", en: "I'll sing, just as I always do" },
  { s: 24.95, e: 27.3, jp: "まだ息をしてるんだよ", en: "I'm still breathing, you know" },
  { s: 27.3, e: 33.15, jp: "最後の晩餐は1人がいいの", en: "I'd rather have my last supper alone" },
  { s: 33.15, e: 36.5, jp: "真っ暗な過去から先　脳裏焼きつくらしい", en: "The pitch-black past is seared into my mind" },
  { s: 36.5, e: 39.1, jp: "それでも", en: "Even so" },

  { s: 39.1, e: 40.55, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 40.55, e: 41.65, jp: "Playback! Playback! が止まらない", en: "Won't stop — look", hot: true },
  { s: 41.65, e: 43.45, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 43.45, e: 44.9, jp: "呼び起こせ", en: "Bring it back — wake it up", hot: true },
  { s: 44.9, e: 48.4, jp: "こんな記憶もぎゅっと抱きしめて", en: "I want to hold even these memories tight" },
  { s: 48.4, e: 50.75, jp: "照らしてあげたいな", en: "and shine a light on them" },
  { s: 50.75, e: 52.25, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 52.25, e: 53.3, jp: "Playback! Playback! は止まらない", en: "Won't stop — again", hot: true },
  { s: 53.3, e: 55.15, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 55.15, e: 56.85, jp: "悪魔を宿して", en: "Harboring a demon" },
  { s: 56.85, e: 60.1, jp: "こんな世界はぎゅっと捻り潰す", en: "I'll twist and crush a world like this" },
  { s: 60.1, e: 62.45, jp: "覚悟はできてるかい？", en: "Are you ready?" },
  { s: 62.45, e: 64.65, jp: "ショータイムといきましょう", en: "Now — it's showtime" },

  { s: 65.45, e: 68.65, jp: "ワンツー&ワンツーで進んでく", en: "Moving forward — one-two, one-two" },
  { s: 68.65, e: 70.35, jp: "だけど呼吸が", en: "But why does my breath" },
  { s: 70.35, e: 72.6, jp: "すぐに浅くなるのは", en: "get shallow so quickly?" },
  { s: 72.6, e: 77.15, jp: "私の心臓がまだ白いからなの？", en: "Is it because my heart is still pure white?" },
  { s: 77.45, e: 80.4, jp: "ターゲットは射止めるものよ", en: "A target is something you bring down" },
  { s: 80.4, e: 82.05, jp: "狙いを絞り", en: "Set your sights" },
  { s: 82.05, e: 84.25, jp: "気持ちは大きく抱いて", en: "Hold your feelings big and strong" },
  { s: 84.25, e: 86.45, jp: "さあさ十字を描け", en: "Now — draw a cross" },
  { s: 86.45, e: 88.85, jp: "君を救うため", en: "to save you" },
  { s: 88.85, e: 91.4, jp: "レッツゴーレッツゴー雨衣デビル！", en: "Let's go, let's go, Ui Devil!", hot: true },
  { s: 91.8, e: 94.3, jp: "負けるな強いぞ雨衣デビル！", en: "Don't give up — you're strong, Ui Devil!", hot: true },
  { s: 94.65, e: 97.25, jp: "プレイバックプレイバックミクデビル！", en: "Playback, Playback, Miku Devil!", hot: true },
  { s: 97.65, e: 100.55, jp: "負けるな強いぞミクデビル！", en: "Don't give up — you're strong, Miku Devil!", hot: true },
  { s: 100.55, e: 106.4, jp: "最後の晩餐は1人がいいの", en: "I'd rather have my last supper alone" },
  { s: 106.4, e: 109.65, jp: "見てない関係ないって　残酷もいいとこじゃんか", en: "“I didn't see it, none of my business” — how cruel" },
  { s: 109.65, e: 112.25, jp: "それでも", en: "Even so" },

  { s: 112.25, e: 113.75, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 113.75, e: 114.8, jp: "Playback! Playback! が止まらない", en: "Won't stop — look", hot: true },
  { s: 114.8, e: 116.65, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 116.65, e: 118.05, jp: "呼び起こせ", en: "Bring it back — wake it up", hot: true },
  { s: 118.05, e: 121.55, jp: "こんな記憶もぎゅっと抱きしめて", en: "I want to hold even these memories tight" },
  { s: 121.55, e: 123.9, jp: "照らしてあげたいな", en: "and shine a light on them" },
  { s: 123.9, e: 125.35, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 125.35, e: 126.45, jp: "Playback! Playback! は止まらない", en: "Won't stop — again", hot: true },
  { s: 126.45, e: 128.25, jp: "Playback! Playback!", en: "Playback! Playback!", hot: true },
  { s: 128.25, e: 129.95, jp: "悪魔を宿して", en: "Harboring a demon" },
  { s: 129.95, e: 133.25, jp: "こんな世界はぎゅっと捻り潰す", en: "I'll twist and crush a world like this" },
  { s: 133.25, e: 136.25, jp: "愛情殺して歌っている", en: "I'm singing, while killing my love" },
];

export const lineAt = (t: number, lines: Line[] = LYRICS): Line | null => {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (t >= l.s && t < l.e) return l;
  }
  return null;
};
