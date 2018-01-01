/** ダメージ計算のjs */
/*** 用語
 * 表示攻撃力：ゲーム中に表示される攻撃力 atk
 * 武器係数：武器毎に設定されている係数 atk correction
 * 武器倍率：表示攻撃力を武器係数で割った数値 true attack value
 * 加算:sum
 * 乗算:mul
 * 計算:calc calculation
 * 倍率:magn magnification
 * 割合:rate 
 * 係数:coef coefficient
 * 会心値:affi affinity
 * 期待値:exp_val expected value
 ***/

/*** 計算式
 * 武器倍率（補正）= ((表示攻撃力 / 武器係数) + (攻撃UPスキル + 護符・爪 + 食事・鬼人薬 + 種・丸薬 + 太刀錬気)) * 笛演奏効果 * 火事場力
 * 物理ダメージ = 武器倍率 * (モーション値 / 100) * 会心期待値 * 斬れ味 * (肉質 / 100)
 * 属性ダメージ = 属性倍率 * 斬れ味 * (耐属性 / 100) * 属性会心期待値 (* ヒット数) 
 * 
 * 砲撃ダメージの計算 
 * 切捨(切捨(切捨(砲撃基本ダメ * 砲撃術) * 猫の砲撃術) * 砲撃タイプ倍率) + 砲撃の火ダメ
 * （未確定）砲撃の火ダメージ: 切捨(砲撃火ダメ * (耐火属性 / 100)) * ヒット回数
 * 各乗算で端数切り捨て
 * 
 * 合計ダメージ = 端数切捨(物理ダメージ + 属性ダメージ)
 * 最終ダメージ = 端数切捨(合計ダメージ * 防御率)
***/

/**********************************************************************/
/*** Constants ********************************************************/
/**********************************************************************/

//武器係数
const ATK_CORRECTION = {
    "大剣": 4.8,
    "太刀": 3.3,
    "片手剣": 1.4,
    "双剣": 1.4,
    "ハンマー": 5.2,
    "狩猟笛": 5.2,
    "ランス": 2.3,
    "ガンランス": 2.3,
    "スラッシュアックス": 5.4,
    "チャージアックス": 3.6,
    "操虫棍": 3.1,
}

//斬れ味の色と補正値のマップ
//物理補正値
const PHYS_SHARP_OBJ = {
    "赤" : 0.5,
    "橙" : 0.75,
    "黄" : 1.0,
    "緑" : 1.05,
    "青" : 1.2,
    "白" : 1.32,
    "紫" : 1.45
}

//属性補正値
const ELE_SHARP_OBJ = {
    "赤" : 0.25,
    "橙" : 0.5,
    "黄" : 0.75,
    "緑" : 1.0,
    "青" : 1.0625,
    "白" : 1.125,
    "紫" : 1.2
}

const ELEMENT_LIST = ["火", "水", "雷", "氷", "龍"]


/**********************************************************************/
/*** モーションリスト ***************************************************/
/**********************************************************************/

/** 大剣
 *  {dmg_type: "切断or打撃or弾", motion_val: val, 
 *  斬れ味補正: val, 属性補正: val} */
const GS_LIST = [
    { name: "[抜刀]縦斬り",
      dmg_type: "切断", val: 48, sharp_up: 1, ele_up: 1},
    { name: "縦斬り",
      dmg_type: "切断", val: 48, sharp_up: 1, ele_up: 1},
    { name: "斬り上げ",
      dmg_type: "切断", val: 46, sharp_up: 1, ele_up: 1},
    { name: "なぎ払い",
      dmg_type: "切断", val: 36, sharp_up: 1, ele_up: 1},
    { name: "横殴り",
      dmg_type: "打撃", val: 18, sharp_up: 1, ele_up: 1},
    { name: "溜め1",
      dmg_type: "切断", val: 65, sharp_up: 1.1, ele_up: 1.2},
    { name: "溜め2/溜めすぎ",
      dmg_type: "切断", val: 77, sharp_up: 1.2, ele_up: 1.5},
    { name: "溜め3",
      dmg_type: "切断", val: 110, sharp_up: 1.3, ele_up: 2},
    { name: "強溜め0",
      dmg_type: "切断", val: 52, sharp_up: 1, ele_up: 1},
    { name: "強なぎ払い",
      dmg_type: "切断", val: 48, sharp_up: 1, ele_up: 1},
    { name: "強溜め1",
      dmg_type: "切断", val: 70, sharp_up: 1.1, ele_up: 1.8},
    { name: "強なぎ払い1",
      dmg_type: "切断", val: 52, sharp_up: 1, ele_up: 1},
    { name: "強溜め2",
      dmg_type: "切断", val: 85, sharp_up: 1.2, ele_up: 2.25},
    { name: "強なぎ払い2",
      dmg_type: "切断", val: 66, sharp_up: 1, ele_up: 1},
    { name: "強溜め3",
      dmg_type: "切断", val: 115, sharp_up: 1.3, ele_up: 3},
    { name: "強なぎ払い3",
      dmg_type: "切断", val: 110, sharp_up: 1, ele_up: 1},
    { name: "ジャンプ攻撃",
      dmg_type: "切断", val: 48, sharp_up: 1, ele_up: 1},
    { name: "ジャンプ後なぎ払い", 
      dmg_type: "切断", val: 66, sharp_up: 1, ele_up: 1},
]

/** 太刀 
 *  [{モーション名: [モーション値, ヒット数]}] */
const LS_LIST = [
    { name: "[抜刀]踏み込み斬り", dmg_type: "切断", arr: [26]},
    { name: "踏み込み斬り", dmg_type: "切断", arr: [26]},
    { name: "縦斬り", dmg_type: "切断", arr: [23]},
    { name: "突き", dmg_type: "切断", arr: [14]},
    { name: "斬り上げ", dmg_type: "切断", arr: [18]},
    { name: "斬り下がり/左右移動斬り", dmg_type: "切断", arr: [24]},
    { name: "気刃斬り1（錬気不足）", dmg_type: "切断", arr: [16]},
    { name: "気刃斬り1", dmg_type: "切断", arr: [28]},
    { name: "気刃斬り2", dmg_type: "切断", arr: [30]},
    { name: "気刃斬り3", dmg_type: "切断", arr: [12, 14, 34]},
    { name: "気刃大回転斬り", dmg_type: "切断", arr: [42]},
    { name: "気刃踏込斬り(錬気不足)", dmg_type: "切断", arr: [18]},
    { name: "気刃踏込斬り", dmg_type: "切断", arr: [30]},
    { name: "ジャンプ斬り", dmg_type: "切断", arr: [26]},
    { name: "ジャンプ気刃斬り", dmg_type: "切断", arr: [30]},
    { name: "ジャンプ気刃2連斬り", dmg_type: "切断", arr: [12, 36]}
]

/** 片手剣
 * [{ nameモーション名, dmg_type: ダメージタイプ, val: モーション値 }] */
const SnS_LIST = [
    { name: "【抜刀】突進斬り", dmg_type: "切断", val: 18 },
    { name: "斬り上げ", dmg_type: "切断", val: 14 },
    { name: "斬り下ろし", dmg_type: "切断", val: 14 },
    { name: "横斬り", dmg_type: "切断", val: 13 },
    // 気絶値15 減気値15
    { name: "剣盾コンボ盾", dmg_type: "打撃", val: 10 },
    { name: "剣盾コンボ剣", dmg_type: "切断", val: 20 },
    { name: "水平斬り", dmg_type: "切断", val: 21 },
    { name: "斬り返し", dmg_type: "切断", val: 19 },
    { name: "盾攻撃", dmg_type: "打撃", val: 6 },
    { name: "バックナックル", dmg_type: "打撃", val: 16 },
    { name: "ガード攻撃", dmg_type: "切断", val: 14 },
    { name: "溜め斬り盾", dmg_type: "打撃", val: 20 }, // 気絶値15 減気値25
    { name: "溜め斬り剣", dmg_type: "切断", val: 37 },
    { name: "ジャンプ斬り", dmg_type: "切断", val: 20 },
    { name: "ジャンプ突進斬り", dmg_type: "切断", val: 20 },
    { name: "ジャンプ斬り上げ", dmg_type: "切断", val: 18 },
]

/** 双剣 [
 *  {name: モーション名,
 *  dmg_type: ダメージタイプ, 
 *  motion_arr:[{val: モーション値, hits: ヒット数, duals: 両手攻撃属性補正}],
 *  demon_flag: 鬼人化フラグ}]
 *  鬼人化フラグ: 通常状態のみ:0, 鬼人化でも使える:1 鬼人化専用:2
 *  両手攻撃属性補正: 通常:1, 両手:0.7
 *  両手攻撃の属性補正はモーション全体にかかるのではなく、
 *  両手攻撃のヒット時のダメージ計算にかかる */
const DB_LIST = [
    { name: "[抜刀]斬り払い", dmg_type: "切断", 
      arr: [{val: 7, hits: 2, duals: 0.7}, 
            {val: 7, hits: 2, duals: 0.7}],
      demon_flag: 1 },
    { name: "鬼人突進連斬", dmg_type: "切断",
      arr: [{val: 7, hits: 4, duals: 1},
            {val: 9, hits: 2, duals: 0.7}],
      demon_flag: 1 }, // 46 52
    { name:"斬り上げ", dmg_type: "切断",
      arr: [{val: 18, hits: 1, duals: 1}],
      demon_flag: 1 }, // 20
    { name:"二段斬り", dmg_type: "切断",
      arr: [{val: 8, hits: 1, duals: 1},
            {val: 12, hits: 1, duals: 1}],
      demon_flag: 0 }, // 20 
    { name:"斬り返し", dmg_type: "切断",
      arr: [{val: 7, hits: 1, duals: 1},
            {val: 10, hits: 1, duals: 1}], 
      demon_flag: 0 }, // 17
    { name:"車輪斬り", dmg_type: "切断",
      arr: [{val: 10, hits: 1, duals: 1},
            {val: 12, hits: 2, duals: 0.7}],
      demon_flag: 1 }, // 34 37
    { name:"六連斬り", dmg_type: "切断",
      arr: [{val: 4, hits: 2, duals: 1},
            {val: 8, hits: 2, duals: 1},
            {val: 11, hits: 2, duals: 0.7}],
      demon_flag: 2 }, // 46 50 鬼人化専用
    { name:"右二連斬り", dmg_type: "切断", 
      arr: [{val: 7, hits: 1, duals: 1},
            {val: 10, hits: 1, duals: 1}],
      demon_flag: 0 }, // 17
    { name:"左二連斬り", dmg_type: "切断",
      arr: [{val: 9, hits: 1, duals: 1},
            {val: 12, hits: 1, duals: 1}],
      demon_flag: 0 }, // 21
    { name:"回転斬りα", dmg_type: "切断",
      arr: [{val: 16, hits: 1, duals: 1},
                {val: 6, hits: 1, duals: 1},
                {val: 8, hits: 1, duals: 1}],
      demon_flag: 1 }, // 30 33
    { name:"回転斬りβ", dmg_type: "切断",
      arr: [{val: 18, hits: 1, duals: 1},
            {val: 6, hits: 1, duals: 1},
            {val: 10, hits: 1, duals: 1}],
      demon_flag: 1 }, // 34 37
    { name:"鬼人連斬", dmg_type: "切断", 
      arr: [{val: 8, hits: 2, duals: 0.7},
            {val: 8, hits: 2, duals: 1},
            {val: 6, hits: 2, duals: 1},
            {val: 20, hits: 2, duals: 0.7}],
      demon_flag: 0 }, // 72 
    { name:"乱舞", dmg_type: "切断",
      arr: [{val: 29, hits: 1, duals: 1},
            {val: 4, hits: 8, duals: 1},
            {val: 18, hits: 2, duals: 0.7}],
      demon_flag: 2}, 
    { name:"ジャンプ二連斬り", dmg_type: "切断",
      arr: [{val: 10, hits: 1, duals: 1},
            {val: 13, hits: 1, duals: 1}],
      demon_flag: 1 }, // 23 25
    { name:"空中回転乱舞", dmg_type: "切断",
      arr: [{val: 12, hits: 2, duals: 1},
            {val: 15, hits: 2, duals: 1}],
      demon_flag: 1 }, // 54 60
    { name:"回転乱舞フィニッシュ", dmg_type: "切断",
      arr: [{val: 23, hits: 2, duals: 1}],
      demon_flag: 1 } // 46 52
]

/** ハンマー 
 *  { name: モーション名, dmg_type: 攻撃タイプ, vals: [モーション値]}} */
const HAMMER_LIST = [
    { name: "[抜刀]振り上げ", dmg_type: "打撃", vals: [20] },
    { name: "横振り", dmg_type: "打撃", vals: [15] },
    { name: "縦振り", dmg_type: "打撃", vals: [42] },
    { name: "縦振り連打", dmg_type: "打撃", vals: [20] },
    { name: "アッパー", dmg_type: "打撃", vals: [90] },
    { name: "溜めI", dmg_type: "打撃", vals: [25] },
    { name: "溜めI追加攻撃", dmg_type: "打撃", vals: [20] },
    { name: "溜めII", dmg_type: "打撃", vals: [40] },
    { name: "溜めIII", dmg_type: "打撃", vals: [15, 76] },
    // 20+10*n nはヒット数、最大6
    { name: "回転攻撃1撃目", dmg_type: "打撃", vals: [20] },
    { name: "回転攻撃2撃目以降5ヒット", dmg_type: "打撃", 
      vals: [10, 10, 10, 10, 10] },
    { name: "ぶんまわし", dmg_type: "打撃", vals: [60] },
    { name: "ジャンプ攻撃", dmg_type: "打撃", vals: [42] },
    { name: "ジャンプ溜めI", dmg_type: "打撃", vals: [65] },
    { name: "ジャンプ溜めII", dmg_type: "打撃", vals: [70] },
    { name: "ジャンプ溜めIII", dmg_type: "打撃", vals: [80] }
]

/** 狩猟笛
 *  { name: モーション名, dmg_type: 攻撃タイプ, vals: [モーション値]}}
 */
const HH_LIST = [
    { name: "[抜刀]前方攻撃", dmg_type: "打撃", val: 33 },
    { name: "ぶん回し", dmg_type: "打撃", val: 30 },
    { name: "ツカ攻撃", dmg_type: "切断", val: 10 }, //斬撃
    { name: "連音攻撃1", dmg_type: "打撃", val: 12 },
    { name: "連音攻撃2", dmg_type: "打撃", val: 22 },
    { name: "後方攻撃", dmg_type: "打撃", val: 45 },
    { name: "叩きつけ1", dmg_type: "打撃", val: 15 },
    { name: "叩きつけ2", dmg_type: "打撃", val: 45 },
    { name: "[抜刀]ジャンプ叩きつけ", dmg_type: "打撃", val: 36 },
    { name: "[抜刀]演奏", dmg_type: "打撃", val: 35 },
    { name: "演奏(前方攻撃後)", dmg_type: "打撃", val: 20 },
    { name: "演奏(ツカ攻撃後)", dmg_type: "打撃", val: 25 },
    { name: "追加演奏(後方)1", dmg_type: "打撃", val: 40 },
    { name: "追加演奏(後方)2", dmg_type: "打撃", val: 30 },
    { name: "追加演奏(左右)", dmg_type: "打撃", val: 35 },
    { name: "自分強化以外の追加演奏初撃", dmg_type: "打撃", val: 33 }
]

/** ランス
 *  {モーション名:モーション値}
 *  攻撃属性: 切断
 *  未実装 特徴:切断と打撃のうち高い方の肉質を計算に使う */
const LANCE_LIST = [
    {name:"[抜刀]武器出し攻撃", dmg_type: "突き", val: 23},
    {name:"中段突き1, 2", dmg_type: "突き", val: 20},
    {name:"中段突き3", dmg_type: "突き", val: 27},
    {name:"上段突き1, 2", dmg_type: "突き", val: 22},
    {name:"上段突き3", dmg_type: "突き", val: 27},
    {name:"なぎ払い", dmg_type: "突き", val: 20},
    {name:"突進(*n回)", dmg_type: "突き", val: 16},
    {name:"フィニッシュ突き", dmg_type: "突き", val: 50},
    {name:"突進ジャンプ突き", dmg_type: "突き", val: 50},
    {name:"振り向き攻撃", dmg_type: "突き", val: 50},
    {name:"キャンセル突き", dmg_type: "突き", val: 22},
    {name:"カウンター突き", dmg_type: "突き", val: 50},
    {name:"[抜刀]ジャンプ突き", dmg_type: "突き", val: 30},
    {name:"ジャンプ突き", dmg_type: "突き", val: 30},
    {name:"ガード突き", dmg_type: "突き", val: 20},
    // 気絶値 27, 減気値27
    {name:"盾攻撃", dmg_type: "打撃", val: 14}
]

/** ランスの突き攻撃の肉質選択における、打撃肉質への補正値 */ 
const IMPACT_WEAK_CORRECTION = 0.72

/** ガンランス */
const GL_LIST = [
   { name: "[抜刀]踏み込み突き上げ", dmg_type: "切断", val: 32 },
   { name: "踏み込み突き上げ", dmg_type: "切断", val: 32 },
   { name: "砲撃派生突き上げ", dmg_type: "切断", val: 30 },
   { name: "斬り上げ", dmg_type: "切断", val: 28 },
   { name: "上方突き", dmg_type: "切断", val: 18 },
   { name: "水平突き", dmg_type: "切断", val: 24 },
   { name: "叩きつけ", dmg_type: "切断", val: 40 },
   { name: "ジャンプ叩きつけ", dmg_type: "切断", val: 44 },
   { name: "ジャンプ突き", dmg_type: "切断", val: 25 },
   { name: "砲撃", dmg_type: "砲撃", hits: 1 },
   { name: "溜め砲撃", dmg_type: "砲撃", hits: 1 },
   { name: "フルバースト*6", dmg_type: "砲撃", hits: 6 },
   { name: "竜撃砲", dmg_type: "砲撃", hits: 4 }
]

/** ガンランスの砲撃ダメージ
 *  {砲撃タイプ: [[Lv1ダメ, 火ダメ], [Lv2ダメ, 火ダメ], ...]} */
const SHELL_ATK_OBJ = {
    "通常": [[10, 4], [14, 5], [18, 6], [21, 7], [24, 8]],
    "放射": [[15, 9], [21, 11], [28, 14], [32, 16], [36, 18]],
    "拡散": [[20, 6], [30, 8], [40, 10], [44, 11], [48, 12]],
    //最大4ヒット
    "竜撃砲": [[30, 10], [35, 11], [40, 12], [45, 13], [50, 14]]
}

/** 操虫棍 Insect Glaive
 *  {モーション名:[[通常モーション値], 通常ヒット数, 赤エキスフラグ]}
 *  赤エキスフラグ: 赤エキス時に存在するモーションかどうか。0なら不在, 1なら存在*/
const IG_DICT = {
    "突き": [[15], 1, 0],
    "突き（赤）": [[18, 12], 2, 1],
    "なぎ払い": [[36], 1, 0],
    "なぎ払い（赤）": [[18, 30], 2, 1],
    "なぎ払い斬り上げ派生時（赤）": [[18, 30, 28], 3, 1],
    "[抜刀]飛び込み斬り": [[28], 1, 1],
    "回転斬り": [[20], 1, 1],
    "叩きつけ": [[30], 1, 0], // 赤エキス時は飛燕斬り
    "飛燕斬り（赤）":[[24, 38], 2, 1],
    "連続斬り上げ": [[26, 20], 2, 0],
    "連続斬り上げ（赤）":[[28, 16, 18], 3, 1],
    "けさ斬り": [[24], 1, 0],
    "けさ斬り（赤）": [[16, 26], 2, 1],
    "二段斬り": [[18, 24], 2, 0],
    "二段斬り（赤）":[[16, 14, 28], 3, 1],
    "印当て": [[12], 1, 1],
    "ジャンプ斬り": [[24], 1, 0],
    "ジャンプ斬り（赤）":[[20, 10], 2, 1],
    "猟虫": [[45], 1, 1],
    "虫回転攻撃": [[80], 1, 1]  // 属性補正1.5倍
}

/** スラッシュアックス SA Switch Axe
 *  {モーション名: [0:[モーション値], 1:ヒット数]} */
const SA_LIST = [
    { name: "斧:[抜刀]横斬り", dmg_type: "切断", vals: [23] },
    { name: "斧:縦斬り", dmg_type: "切断", vals: [40] },
    { name: "斧:斬り上げ", dmg_type: "切断", vals: [28] },
    // 振り回しダメージはダメージ*n回
    { name: "斧:振りまわし(*n回)", dmg_type: "切断", vals: [24] },
    { name: "斧:なぎ払いフィニッシュ", dmg_type: "切断", vals: [57] },
    { name: "斧:突進斬り", dmg_type: "切断", vals: [19] },
    { name: "斧:変形斬り", dmg_type: "切断", vals: [30] },
    { name: "斧:ジャンプ斬り", dmg_type: "切断", vals: [43] },
    { name: "剣:変形斬り", dmg_type: "切断", vals: [23] },
    { name: "剣:[抜刀]縦斬り", dmg_type: "切断", vals: [30] },
    { name: "剣:斬り上げ", dmg_type: "切断", vals: [25] },
    { name: "剣:横切り", dmg_type: "切断", vals: [25] },
    { name: "剣:二連斬り", dmg_type: "切断", vals: [28, 36] },
    { name: "剣:属性解放突き", dmg_type: "切断", vals: [28] },
    { name: "剣:属性解放継続(*1~6)", dmg_type: "切断", vals: [13] },
    { name: "剣:属性解放任意フィニッシュ", dmg_type: "切断", vals: [50] },
    { name: "剣:属性解放フィニッシュ", dmg_type: "切断", vals: [80] },
    { name: "剣:ジャンプ斬り", dmg_type: "切断", vals: [43] },
    { name: "剣:ジャンプ変形斬り", dmg_type: "切断", vals: [43] },
    { name: "剣:ジャンプ属性解放突き", dmg_type: "切断", vals: [28] },
]

/** チャージアックス 全て切断属性
  *  {name: モーション名, dmg_type:攻撃タイプ, val_arr:[モーション値1, 2],
  *  imp_phial:榴弾爆発補正, 3:強属性爆発補正, num_of_expls:爆発回数 }
 * 属性強化で変化するモーションかどうかのフラグを入れてもいいかも*/
const CB_LIST = [
    { name: "剣:突進斬り", dmg_type: "切断", val_arr: [22], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:牽制斬り", dmg_type: "切断", val_arr: [14], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:斬り返し", dmg_type: "切断", val_arr: [17], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:溜め斬り上げ", dmg_type: "切断", val_arr: [16], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:溜め２連斬り", dmg_type: "切断", val_arr: [30, 20], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:回転斬り", dmg_type: "切断", val_arr: [30], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:チャージ斬り返し", dmg_type: "切断", val_arr: [17], imp_phial: 0.02, ele_phial: 2.5,
    num_of_expls: 1 },
    { name: "剣:盾突き",dmg_type: "切断", val_arr: [8, 12], imp_phial: 0.05, ele_phial: 2.5, num_of_expls: 1 },
    { name: "剣:ジャンプ斬り", dmg_type: "切断", val_arr: [22], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "剣:GP爆発", dmg_type: "切断", val_arr: [], imp_phial: 0.05, ele_phial: 2.5, num_of_expls: 1 },
    { name: "斧:叩きつけ", dmg_type: "切断", val_arr: [47], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:斬り上げ", dmg_type: "切断", val_arr: [40], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:縦斬り", dmg_type: "切断", val_arr: [40], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:横斬り", dmg_type: "切断", val_arr: [20], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:属性解放斬りI:ビン有", dmg_type: "切断", val_arr: [26], imp_phial: 0.05, ele_phial: 3.0, num_of_expls: 1},
    { name: "斧:属性解放斬りII:ビン有", dmg_type: "切断", val_arr: [18, 80],
    imp_phial: 0.05, ele_phial: 3.0,
    num_of_expls: 2},
    { name: "斧:高出力属性解放斬り:ビン有", dmg_type: "切断", val_arr: [90], imp_phial: 0.1, ele_phial: 4.5, num_of_expls: 3},
    // あえて属性強化前のモーション値をかくと [21, 83, 84] 榴弾ビン倍率は0.33かもしれない
    { name: "斧:超高出力属性解放斬り:ビン6", dmg_type: "切断", 
    val_arr: [25, 99, 100], imp_phial: 0.335, ele_phial: 13.5, num_of_expls: 6 },
    { name: "斧:ジャンプ叩きつけ", dmg_type: "切断", val_arr: [47], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:属性解放斬りI:ビン無", dmg_type: "切断", val_arr: [14], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:属性解放斬りII:ビン無", dmg_type: "切断", val_arr: [14, 47], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:高出力属性解放斬り:ビン無", dmg_type: "切断", val_arr: [40], imp_phial: 0, ele_phial: 0, num_of_expls: 0 },
    { name: "斧:超高出力属性解放斬り:ビン無", dmg_type: "切断", val_arr: [17, 90], imp_phial: 0, ele_phial: 0, num_of_expls: 0 }
]


/**********************************************************************/
/*** オブジェクト操作関連 ************************************************/
/**********************************************************************/

/** x がArray arr の要素かどうかを調べる */
const HAS_ELEMENT = (x, arr) => (arr.indexOf(x) >= 0) ? true : false

/** objをmapに変換する */
function map_from_obj(obj){
    return Object.keys(obj).reduce(
        (map, key) => map.set(key, obj[key]), new Map())
}

/** objをmapに変換 */
function obj_to_map(obj){
    return new Map(Object.entries(obj))
}

/** 指定したkeysを参照して、objからvaluesリストをつくって返す
 * 引数: obj
 *      keys */
function values_from_keys(obj, keys){
    let x = []
    keys.forEach(key => { if(key in obj){ x.push(obj[key]) }})
    return x
}

/** keysを参照してobjからvalueを取得し、key:valueの新しいobjを作る */
function new_obj_from_keys(obj, keys){
    let new_obj = {}
    keys.forEach(key => { if(key in obj){ new_obj[key] = obj[key] }})
    return new_obj
}

/** リストの要素が1つならそれをコピーして要素数を2つにする関数 */
function one_ele_to_2_eles(arr){
    let new_arr = arr.slice()
    if(new_arr.length == 1){ new_arr.push(new_arr[0]) }
    return new_arr
}

/** 渡されたobjを補完した新しいobjを返す関数
 *  keys: motionから取り出すvalのkeyを格納した配列
 *  obj: new_objの元となるobj */
function comp_obj_for_calc(motion, keys, obj){
    let new_obj = obj
    for(let i = 0; i < keys.length; i++){
        if(keys[i] in motion){ new_obj[keys[i]] = motion[keys[i]] }
    }
    return new_obj
}

/** 2つのdictが同じかどうかを調べる
 *  return bool */
function is_same_obj(a, b){
    let bool = false
    if(JSON.stringify(a) == JSON.stringify(b)){ bool = true }
    return bool
}


/**********************************************************************/
/*** 汎用的な計算関連の関数 **********************************************/
/**********************************************************************/

/** 引数を全て加算して返す */
function sum(){
    let x = 0
    for(let i = 0; i < arguments.length; i++){ x += arguments[i] }
    return x
}

/** Arrayの全要素を加算して返す */
function sum_array(x){
    let y = 0
    for (let i = 0; i < x.length; i++){ y += x[i] }
    return y
}

/** 引数を全て乗算して積を返す */
function mul(){
    let x = 1
    for(let i = 0; i < arguments.length; i++){ x *= arguments[i] }
    return x
}

/** 引数のリストの要素を全て乗算して積を返す */
function mul_array(arr){
    let x = 1
    for(let i = 0; i < arr.length; i++){ x *= arr[i] }
    return x
}

/** 引数のobjのvalueを全て乗算して積を返す */
function mul_obj_values(obj){
    let x = 1
    for(let key in obj){ x *= obj[key] }
    return x
}

/** 全ての引数を乗算し、積の端数を切り捨てて返す */
function mul_n_floor(){
    let x = 1,
        args = Array.from(arguments)
    args.forEach(e => x *= e)
    return Math.floor(x)
}

/** １の位を切り下げ */
function truncate_ones_place(x){ return Math.floor(x/10) * 10 }

/** 少数第y位より下を切り捨て
 **  x: 切り捨てられる値
 **  y: 残す位 (default=1)
 **  x=1.234の場合:
 **  yを指定しなければ少数第一位まで(1.2)になる     
 **  1.23 にしたいときは y=2 */
function truncate_decimal_place(x, y=1){ 
    return Math.floor(x*10**y) / 10**y 
}


/**********************************************************************/
/*** 武器補正に使う関数 **************************************************/
/**********************************************************************/

/** 大剣/太刀の中腹ヒット補正値 引数がtrueなら1.05を返し、falseなら1を返す */
const CENTER_OF_BLADE = bool => bool ? 1.05 : 1

/** 太刀の錬気ゲージフル時の斬れ味補正 1.13 : 1 */
const SPIRIT_FULL = bool => bool ? 1.13 : 1
/** 太刀の錬気ゲージ色でのモーション値補正 */

const SP_COLOR = { // 錬気ゲージ色オブジェ
    "白": 1.05,
    "黄": 1.1,
    "赤": 1.3
}
/** 錬気ゲージ色: モーションに乗算（端数切捨）
 ** 白: *1.05
 ** 黄: *1.1
 ** 赤: *1.3 */
const SPIRIT_COLOR = color => color ? SP_COLOR[color] : 1
/** 片手剣の切断モーションにかかる斬れ味補正 引数が"切断"なら1.06, でなければ1 */
const SnS_SHARP_COR = type => type == "切断" ? 1.06 : 1
/** 片手剣の溜め斬りでの属性値補正 引数が"溜め斬り"なら2, でなければ1 */
const SnS_ELE_COR = motion => motion.includes("溜め斬り") ? 2 : 1
/** 双剣の鬼人化状態でのモーション値補正 引数がtrueなら1.15, falseなら1 */
const DEMON_MODE = bool => bool ? 1.15 : 1
/** チャージアックスの属性強化モーション値補正を返す関数 true: 1.2, false: 1 */
const BOOST_MODE = bool => bool ? 1.2 : 1
/** CB: 属性強化状態でのビンダメージ補正を返す true: 1.3, false: 1.35 */
const BOOST_PHIAL_ATK = type => type == "榴弾" ? 1.3 : 1.35


/**********************************************************************/
/*** ダメージ計算に使う関数（共用） ****************************************/
/**********************************************************************/

/** 会心期待値の計算
 ** affi: 会心率
 ** magn: 会心倍率 (default=1.25)
 ** (1.0 + (会心倍率 - 1.0) * 会心率 / 100.0)
 ** 引数magnを指定すれば会心時の倍率を変えられる */
function calc_affi_exp(affi, magn=1.25){
    return (1.0 + (magn - 1.0) * affi / 100)
}

/** ダメージ計算の流れを扱う高階関数 
 ** weapon: weapon obj
 ** motions: 武器ごとのモーションリスト array
 ** monster: monster obj
 ** callbacks: callbackを格納した obj */
function calc_damage_flow(weapon, motions, monster, callbacks){
    let damage_obj = {}
    motions.forEach(motion => {
        // weaponに計算に使う変数を追加
        weapon = callbacks.set_vars_for_calc(weapon, motion)
        let part_dmg_obj = {}
        monster.forEach(part => {
            // 肉質と耐属性をコールバック関数で取得 obj
            let weak = callbacks.get_weak(part, motion.dmg_type,
                                          weapon.element_type)
            
            let dmg_arr = [{}, {}] // 肉質ごとのダメージを格納する配列
            for(let i = 0; i < 2; i++){
                // ダメージ計算をするコールバック関数
                dmg_arr[i] = callbacks.calc_dmg(weapon, motion, weak, i)
            }
            part_dmg_obj[part.name] = dmg_arr
        })
        damage_obj[motion.name] = part_dmg_obj
    })
    return damage_obj
}

/** weaponに何も追加しない場合の関数 */
function set_vars_for_calc(weapon, motion){ return weapon }

/** モンスターの肉質・耐属性を取得する関数
 ** part(obj): モンスターの部位obj
 ** dmg_type(str): モーションのダメージタイプ
 ** ele_type(str): 武器の属性 */
function get_weak(part, dmg_type, ele_type){
    let weak = {}
    weak.phys = get_phys_weak(part, dmg_type)
    weak.ele = get_ele_weak(part, ele_type)
    return weak
}

/** 肉質を取得して返す */
function get_phys_weak(part, dmg_type){
    return one_ele_to_2_eles(part[dmg_type]) 
}

/** 耐属性を返す */
function get_ele_weak(part, ele_type){
    try{ return one_ele_to_2_eles(part[ele_type]) }
    catch(e){ return [0, 0] } // 属性武器じゃない場合、こちらが実行される
}

/**********************************************************************/
/*** ダメージ計算 *******************************************************/
/**********************************************************************/

/** 汎用的なダメージ計算関数 */
function calc_dmg(weapon, motion, weak, i){
    dmg_obj = {}
    dmg_obj["物理"] = weapon.true_atk * weapon.sharp * weapon.affi_exp 
                     * motion.val / 100 * weak.phys[i] / 100
    dmg_obj["属性"] = weapon.true_element * weapon.ele_sharp
                     * weapon.crit_ele_exp * weak.ele[i] / 100
    return dmg_obj
}


/**********************************************************************/
/*** 大剣 *************************************************************/
/**********************************************************************/

function gs_calc_dmg(weapon, motion, weak, i){
    dmg_obj = {}
    dmg_obj["物理"] = weapon.true_atk * weapon.sharp * motion.sharp_up
        * weapon.affi_exp * motion.val / 100 * weak.phys[i] / 100
    dmg_obj["属性"] = weapon.true_element * weapon.ele_sharp 
        * motion.ele_up * weapon.crit_ele_exp * weak.ele[i] / 100
    return dmg_obj
}


/**********************************************************************/
/*** 太刀 *************************************************************/
/**********************************************************************/

function ls_calc_dmg(weapon, motion, weak, i){
    let dmg_obj = {},
        sum_phys = 0,
        sum_ele = 0
    motion.arr.forEach(val => {
        sum_phys += weapon.true_atk * 
            Math.floor(val * weapon.spirit_color) / 100 * weapon.affi_exp * weapon.sharp * weapon.spirit_full * weapon.center_of_blade * weak.phys[i] / 100
        sum_ele += weapon.true_element * weapon.ele_sharp * 
            weapon.crit_ele_exp * weak.ele[i] / 100
    })
    dmg_obj["物理"] = sum_phys
    dmg_obj["属性"] = sum_ele
    return dmg_obj
}


/**********************************************************************/
/*** 片手剣 ************************************************************/
/**********************************************************************/

/** 片手剣の切断攻撃補正と溜め斬りでの属性補正を設定する関数 */
function sns_vars_for_calc(weapon, motion){
    weapon.sharp_cor = SnS_SHARP_COR(motion.dmg_type)
    weapon.ele_cor = SnS_ELE_COR(motion.name)
    return weapon
}

/** 片手剣のダメージ計算をする関数 */
function sns_calc_dmg(weapon, motion, weak, i){
    dmg_obj = {}
    dmg_obj["物理"] = weapon.true_atk * motion.val / 100 * weapon.sharp
        * weapon.sharp_cor * weapon.affi_exp * weak.phys[i] / 100
    dmg_obj["属性"] = weapon.true_element * weapon.ele_cor 
        * weapon.ele_sharp * weapon.crit_ele_exp * weak.ele[i] / 100 
    return dmg_obj
}


/**********************************************************************/
/*** 双剣 *************************************************************/
/**********************************************************************/



/** 双剣のダメージ計算をする関数 */
function db_calc_dmg(weapon, motion, weak, i){
    let sum_phys_dmg = 0,
        sum_ele_dmg = 0,
        dmg_obj = {}

    motion.arr.forEach(e => {
        // 鬼人化フラグが0ではない（1or2）のモーションなら
        // 切捨(モーション値*weapon.demon)
        let mv = (motion.demon_flag == 0) ? e.val
                                          : Math.floor(e.val
                                            * weapon.demon)
        // 物理ダメージ計算
        sum_phys_dmg += weapon.true_atk * mv / 100 * weapon.affi_exp
                        * weapon.sharp * weak.phys[i] / 100 * e.hits
        if(weapon.has_element){
            sum_ele_dmg += weapon.true_element * weapon.ele_sharp 
                           * weapon.crit_ele_exp * weak.ele[i] / 100
                           * e.duals * e.hits
        }
    })
    dmg_obj["物理"] = sum_phys_dmg
    dmg_obj["属性"] = sum_ele_dmg
    return dmg_obj
}


/**********************************************************************/
/*** ハンマー **********************************************************/
/**********************************************************************/

function hammer_calc_dmg(weapon, motion, weak, i){
    let dmg_obj = {},
        sum_phys = 0,
        sum_ele = 0
    motion.vals.forEach( val => {
        sum_phys += weapon.true_atk * weapon.sharp * weapon.affi_exp 
            * val / 100 * weak.phys[i] / 100
        sum_ele += weapon.true_element * weapon.ele_sharp 
            * weapon.crit_ele_exp * weak.ele[i] / 100
    })
    dmg_obj["物理"] = sum_phys
    dmg_obj["属性"] = sum_ele
    return dmg_obj
}


/**********************************************************************/
/*** ランス ************************************************************/
/**********************************************************************/

/** ランス向け肉質を取得する関数。
 *  突き攻撃のときは、打撃*0.72と切断のうち高い方の肉質を採用する
 * */
function lance_get_weak(part, dmg_type, ele_type){
    let weak = {}
    try { weak = get_weak(part, dmg_type, ele_type) }
    catch(e){
        weak.phys = []
        let cut_weak = one_ele_to_2_eles(part["切断"]),
            impact_weak = one_ele_to_2_eles(part["打撃"])
        for(let i = 0; i < 2; i++){
            let imp = impact_weak[i] * IMPACT_WEAK_CORRECTION
            // 切断肉質の方が大きければ切断肉質を格納
            weak.phys.push((cut_weak[i] > imp) ? cut_weak[i] : imp)
        }
        weak.ele = get_ele_weak(part, ele_type)
    }
    return weak
}


/**********************************************************************/
/*** ガンランス ********************************************************/
/**********************************************************************/

/** 砲撃タイプ毎の各砲撃補正値 obj */
const SHELL_COR = {
    "通常": {
        "溜め砲撃": 1.2,
        "フルバースト": 1.1,
        "竜撃砲": 1
    },
    "放射": {
        "溜め砲撃": 1.2,
        "フルバースト": 1,
        "竜撃砲": 1.2
    },
    "拡散": {
        "溜め砲撃": 1.44,
        "フルバースト": 0.9,
        "竜撃砲": 1
    }
}

/** GL_LISTのフルバーストをコピーして1-6ヒットになるように追加したリストを返す */
function add_full_burst(arr){
    const MAX_SHELLS = 6
    const NAME = "フルバースト"
    let copy_arr = arr.slice()
    let fb = {}
    let pos = 0
    arr.forEach(m => {
        if(m.name.includes("フルバースト")){ 
            pos = arr.indexOf(m)
            fb = Object.assign({}, m) 
        }
    })
    for(let i = MAX_SHELLS - 1; i > 0; i--){
        fb.hits = i
        fb.name = NAME + "*" + i
        copy_arr.splice(pos, 0, Object.assign({}, fb))
    }
    return copy_arr
}

/** ガンランスのダメ計算に使う、肉質・耐属性・耐火属性を取得 */
function gl_get_weak(part, dmg_type, ele_type){
    let weak = {}
    if(dmg_type == "砲撃"){ weak.fire = one_ele_to_2_eles(part["火"])
    }else{ weak = get_weak(part, dmg_type, ele_type) }
    return weak
}

/** ガンランスのダメ計算に使う変数を取得する関数 */
function gl_vars_for_calc(weapon, motion){
    weapon.shell_cor = 1
    // モーションのダメージタイプが砲撃なら
    if(motion.name == "溜め砲撃"){
        weapon.shell_cor = SHELL_COR[weapon.shell_type][motion.name]
    }else if(motion.name.includes("フルバースト")){
        weapon.shell_cor = SHELL_COR[weapon.shell_type]["フルバースト"]
    }else if(motion.name == "竜撃砲"){
        weapon.shell_atk = SHELL_ATK_OBJ["竜撃砲"][weapon.shell_lv][0]
        weapon.fire_atk = SHELL_ATK_OBJ["竜撃砲"][weapon.shell_lv][1]
        weapon.shell_cor = SHELL_COR[weapon.shell_type][motion.name]
    }
    return weapon
}

/** ガンランスのダメージ計算 
 ** weapon:obj  武器
 ** motion:obj  各モーション 
 ** weak:obj    モンスターの各部位の肉質と耐属性
 ** i: number   各weakのindex */
function gl_calc_dmg(weapon, motion, weak, i){
    dmg_obj = {}
    if(motion.dmg_type == "砲撃"){
        dmg_obj["砲撃"] = 
            Math.floor(Math.floor(Math.floor(weapon.shell_atk 
                * weapon.artillery) * weapon.shell_cor)
            + (weapon.fire_atk * weak.fire[i] / 100)) * motion.hits
    }else{
        dmg_obj["物理"] = weapon.true_atk * motion.val / 100 
            * weapon.affi_exp * weapon.sharp * weak.phys[i] / 100
        
        dmg_obj["属性"] = weapon.true_element * weapon.ele_sharp
            * weapon.crit_ele_exp * weak.ele[i] / 100
    }
    return dmg_obj
}


/**********************************************************************/
/*** スラッシュアックス **************************************************/
/**********************************************************************/

/** 引数が"強撃"なら強撃ビンによる補正値1.2を返す。でなければ1を返す */
const POWER_PHIAL_COR = type => type == "強撃" ? 1.2 : 1
/** 引数が"強属性"なら強属性ビンによる補正値1.25を返す。でなければ1を返す */
const ELEMENT_PHIAL_COR = type => type == "強属性" ? 1.25 : 1

// スラッシュアックスのダメージ計算をする関数
function sa_calc_dmg(weapon, motion, weak, i){
    let dmg_obj = {},
        sum_phys = 0,
        sum_ele = 0,
    // 剣モーションなら強属性ビン補正をかける
        ele = motion.name.includes("剣:") 
        ? Math.floor(weapon.true_element * weapon.ele_cor) 
        : weapon.true_element
    motion.vals.forEach( val => {
        // 剣モーションならモーション値補正をかける
        let mv = motion.name.includes("剣:")
            ? Math.floor(val * weapon.power_cor) : val
        sum_phys += weapon.true_atk * weapon.affi_exp * weapon.sharp 
            * mv / 100 * weak.phys[i] / 100
        sum_ele += ele * weapon.ele_sharp * weapon.crit_ele_exp 
            * weak.ele[i] / 100
    })
    dmg_obj["物理"] = sum_phys
    dmg_obj["属性"] = sum_ele
    return dmg_obj
}

/**********************************************************************/
/*** チャージアックス ***************************************************/
/**********************************************************************/

/** 超高出力をコピーして1-6ビンになるように追加したリストを返す */
function add_ultra_burst(arr){
    const MAX_PHIALS = 6
    const NAME = "斧:超高出力属性解放斬り"
    let copy_arr = arr.slice()
    let ultra = {}
    let pos = 0
    arr.forEach(m => {
        if(m.name.includes("斧:超高出力属性解放斬り:ビン6")){
            pos = arr.indexOf(m)
            ultra = Object.assign({}, m)
        }
    })
    for(let i = MAX_PHIALS - 1; i > 0; i--){
        ultra.num_of_expls = i
        ultra.name = NAME + ":ビン" + i
        copy_arr.splice(pos, 0, Object.assign({}, ultra))
    }
    return copy_arr
}

/** CBが非属性強化ならCB_LISTから超高出力とGP爆発を削除した配列を返す関数 */
function del_boost_motion(arr){
    let new_arr = arr.slice()
    for(let i = 0; i < new_arr.length; i++){
        if(new_arr[i].name.match(/超高出力/) 
        || new_arr[i].name.match(/GP爆発/)){
            new_arr.splice(i--, 1)
        }
    }
    return new_arr
}

/** 属性強化かどうかで属性強化だけのモーションを削除したり追加する関数 */
function control_boost_motion(arr, bool){
    if(!bool){ new_arr = del_boost_motion(arr) }
    else{ new_arr = add_ultra_burst(arr) }
    return new_arr
}


/** チャージアックスのダメージ計算に使う変数を格納したobjをつくって返す */
function cb_vars_for_calc(weapon, motion){
    let phial_atk = 0,  // ビンの基礎ダメージ
        phial_type_cor = 0, // ビンタイプ補正値
        val_arr = motion.val_arr.slice()

    // 榴弾と強属性それぞれの場合の変数を設定
    weapon.phial_type == "榴弾" ? (
        phial_atk = weapon.true_atk,
        phial_type_cor = motion.imp_phial
    ) : (
        phial_atk = weapon.true_element,
        phial_type_cor = motion.ele_phial
    )

    // 超高出力以外の斧と盾突きモーション値に属性強化倍率を掛ける
    motion.val_arr.forEach( (val, i) => {
        if (motion.name.match(/斧:/) && !motion.name.match(/超高出力/) 
            || motion.name.match(/盾突き/)){
            val_arr[i] = mul_n_floor(val, weapon.boost)
        }
    })

    // 属性強化状態で超高出力を除く解放斬りなら、属性強化ビン爆発補正をかける
    if (weapon.boost == 1.2){
        if (motion.name.match(/解放斬り/) 
            && !motion.name.match(/超高出力/)){
            phial_atk *= BOOST_PHIAL_ATK(weapon.phial_type)
        }
    }else{ // 通常状態
        // 盾突き・チャージ斬り返し・GP爆発のビン爆発係数を0にする
        if (motion.name.match(/盾突き/)
            || motion.name.match(/チャージ斬り返し/)){
            phial_type_cor = 0
        }
    }
    // objをセ--ットォ!!!!
    weapon.motion_vals = val_arr
    weapon.phial_atk = phial_atk
    weapon.phial_type_cor = phial_type_cor
    return weapon
}

/** チャージアックスのダメージ計算をする関数 */
function cb_calc_dmg(weapon, motion, weak, i){
    let dmg_obj = {},
    sum_phys = 0
    // 物理・属性ダメージ計算
    weapon.motion_vals.forEach( val => {
        sum_phys += weapon.true_atk * val / 100 
            * weapon.affi_exp * weapon.sharp * weak.phys[i] / 100
    })
    dmg_obj["物理"] = sum_phys
    if(weapon.has_element){
        dmg_obj["属性"] = weapon.true_element * weapon.ele_sharp 
            * weapon.crit_ele_exp * weak.ele[i] / 100
            * weapon.motion_vals.length 
    }

    /** ビン爆発ダメージ計算
     *  榴弾: 武器倍率 * 榴弾係数 (* 属性強化倍率) * 爆発回数 
     *  強属性: 属性倍率 * 強属性係数 (* 属性強化倍率) * 爆発回数 */
    weapon.phial_type == "榴弾" ? (
        dmg_obj["ビン"] = Math.floor(weapon.phial_atk 
            * weapon.phial_type_cor * weapon.artillery)
            * motion.num_of_expls
    ) : (
        dmg_obj["ビン"] = Math.floor(weapon.phial_atk 
            * weapon.phial_type_cor * weak.ele[i] / 100)
            * motion.num_of_expls
    )
    return dmg_obj
}


/**********************************************************************/
/*** アウトプット *******************************************************/
/**********************************************************************/

/** 計算結果をresult tableに出力 */
function output_result_table(table, dict){
    let thead = $("<thead>"),
        tbody = $("<tbody>"),
        h_row = $("<tr>"),
        i = 0

    table.empty()
    h_row.append($("<th>").text("モーション"))
    for(m in dict){
        let b_row = $("<tr>")
        b_row.append($("<td>").text(m))
        for(p in dict[m]){
            if(i == 0){
                h_row.append($("<th>").text(p))
            }
            let td = $("<td>")
            let text = ""
            for(let i = 0; i < dict[m][p].length; i++){
                if(i == 0){
                    text += dict[m][p][i]["合計"]
                }else{
                    text += "\n(" + dict[m][p][i]["合計"] +")"
                }
                td.text(text)
            }
            b_row.append(td)
        }
        tbody.append(b_row)
        i++
    }
    thead.append(h_row)
    table.append(thead, tbody)
    return 0
}

/* イベント ************************************************************/

/** 武器種が変更されたら、選択された武器種の武器を武器名selectに入れる 
 *  section: section .weapon
 *  type: weapon_type */
function set_weapon_select(){
    console.log("武器種を変更")
    let type = $("option:selected", this).text(),
        section = $(this).parents().find(".weapon")
        select = section.find(".weapon_name select")
        ele_type = section.find(".ele_type select option:selected").val()
        awake = Number($(this).parents()
            .find(".awaken select option:selected").val())
    
    // 既存の.weapon_name optionを削除
    select.empty()
    
    // 武器名selectに武器名を追加
    $.getJSON("weapon_data.json", function(data){
        if(ele_type){
            // 属性指定あり
            if(awake){
                // 属性解放スキルがONなら"ele_type"か"awake_ele_type"が ele_typeと同じなら追加する
                for(let w in data[type]){
                    if(ele_type == data[type][w]["ele_type"]
                        || ele_type
                            == data[type][w]["awake_ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }else{
                // 属性解放スキルがOFFなら"ele_type"とele_typeが同じものだけ追加
                for(let w in data[type]){
                    if(ele_type == data[type][w]["ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }
        }else{
            // 属性指定なし
            for(let w in data[type]){
                let option = $("<option>")
                option.text(w)
                select.append(option)
            }
        }
        
    })
    
    // 武器種に依存するhtmlを隠す
    section.find(".center_of_blade").hide()
    section.find(".p_type").hide()
    section.find(".boost_mode").hide()
    section.find(".spirit_full").hide()
    section.find(".spirit_color").hide()
    section.find(".demon_mode").hide()
    section.find(".shell_types").hide()
    section.find(".shelling_lv").hide()
    section.find(".essences").hide()
    section.find(".sa_p_types").hide()

    // 武器種ごとに処理
    switch(type){
        case "大剣":
            // 中腹ヒットhtmlを表示
            section.find(".center_of_blade").show()
            break
        case "太刀":
            // 中腹ヒットhtmlを表示
            section.find(".center_of_blade").show()
            section.find(".spirit_full").show()
            section.find(".spirit_color").show()
            break
        case "スラッシュアックス":
            section.find(".sa_p_types").show()
            break
        case "チャージアックス":
            // ビン選択と属性強化状態のselect
            section.find(".p_type").show()
            section.find(".boost_mode").show()
            break
        case "双剣":
            section.find(".demon_mode").show()
            break
        case "ガンランス":
            section.find(".shell_types").show()
            section.find(".shelling_lv").show()
            break
        case "操虫棍":
            section.find(".essences").show()
            break
    }

    return false
}


/** 属性セレクト.ele_type selectが選択されたら、
 *  選択された属性の武器を武器名セレクトに出力 */
function select_ele_type(){
    // section .input と 属性タイプ と 武器種を取得
    let awaken = Number(
            $(this).parents().find(".awaken select option:selected").val()),
        ele_type = $("option:selected", this).val(),
        type = $(this).parents()
            .find(".weapon_types select option:selected").text()
    
    // .weapon_name select の子要素を削除
    $(this).parents().find(".weapon_name select").empty()

    // 新しい子要素を追加
    $.getJSON("weapon_data.json", function(data){
        if (ele_type){
            // ele_typeが指定された場合
            if (awaken){
                // 属性解放スキルがonの時
                for(let w in data[type]){
                    // "ele_type"か"awake_ele_type"のどちらかがele_typeなら武器名を武器selectへ
                    if(ele_type == data[type][w]["ele_type"]
                    || ele_type ==  data[type][w]["awake_ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }else{
                for(let w in data[type]){
                    // 属性解放スキルがoffの時 指定されたele_typeの武器名をselectへ
                    if (ele_type == data[type][w]["ele_type"]){
                        let option = $("<option>")
                        option.text(w)
                        select.append(option)
                    }
                }
            }
        }else{
            // 指定されなかった場合 該当武器種の全武器を出力
            for(let w in data[type]){
                let option = $("<option>")
                option.text(w)
                select.append(option)
            }
        }
    })
}


/** 武器が選択されたら動く
 *  武器データをjsonから取得し、各inputに入力する
 *  awaken: 属性解放フラグ
 *  sharp_plus: 匠スキルフラグ
 *  section: section .weapon
 *  type: weapon_type */
function input_weapon_data(){
    let input_sect = $(this).parents().find(".input"),
        type = input_sect
            .find(".weapon_types select option:selected").text(),
        name = $("option:selected", this).text(),
        ele_type = "ele_type",
        ele_val =  "ele_val",
        sharp = "sharp"

    // 属性解放スキル
    if(Number(input_sect.find(".awaken select option:selected").val())){
        // ONなら"awake_" + ele_type & ele_val
        ele_type = "awake_" + ele_type
        ele_val = "awake_" + ele_val
    }
    // 匠スキル
    if(Number(input_sect.find(".sharp_plus select option:selected").val())){
        // ONなら sharp + "+"
        sharp + "+"
    }
    
    // 武器種と武器名から各武器データを取得し、inputに入力
    $.getJSON("weapon_data.json", function(data){
        // 表示攻撃力
        input_sect.find(".attack input")
            .val(data[type][name]["atk"])
        // 属性種
        input_sect.find(".ele_type select").val(data[type][name][ele_type])

        // 特殊属性のダメージ計算には未対応なので、ele_typeが特殊属性ならele_valを0にする。対応したら消しましょう。
        if(data[type][name][ele_type] == ("麻"||"毒"||"眠"||"爆")){
            // 表示属性値
            input_sect.find(".element input").val(0)
        }else{
            // 表示属性値
            input_sect.find(".element input").val(data[type][name][ele_val])
        }
        // 斬れ味
        input_sect.find(".sharpness select").val(data[type][name][sharp])
        // 会心率
        input_sect.find(".affinity input").val(data[type][name]["affi"])

        // 武器種毎の処理
        switch(type){
            case "ガンランス": {
                input_sect.find(".shell_types select").val(data[type][name]["shell_type"])
                input_sect.find(".shelling_lv select").val(data[type][name]["shell_lv"])
                break
            }
            case "スラッシュアックス": {
                input_sect.find(".sa_p_type select")
                    .val(data[type][name]["phial"])
                break
            }
                
            case "チャージアックス": {
                input_sect.find(".p_type select")
                    .val(data[type][name]["phials"])
                break
            }
        }
    })
}


/** 匠スキルが変更されたら斬れ味を変える
 *  type: weapon_type
 *  name: weapon_name */ 
function update_sharpness(){
    let sharp,
        sharp_key = "sharp",
        weapon_sect = $(this).parents().find(".weapon"),
        type = 
            weapon_sect.find(".weapon_types select option:selected").text(),
        name = weapon_sect.find(".weapon_name option:selected").text()
    
    // 匠スキルがONかOFFか調べ、ONならsharp_keyに"+"を追加
    if(Number($("option:selected", this).val())){
        sharp_key += "+"
    }

    $.getJSON("weapon_data.json", function(data){
        weapon_sect.find(".sharpness select").val(data[type][name][sharp_key])
    })
}


/** 属性解放スキルが選択されたら、属性を更新する */
function update_element(){
    let ele_type = "ele_type",
        ele_val = "ele_val",
        section = $(this).parents().find(".input"),
        type = section.find(".weapon_types select option:selected").text(),
        name = section.find(".weapon_name option:selected").text()
    
    if(Number($("option:selected", this).val())){
        ele_type = "awake_" + ele_type
        ele_val = "awake_" + ele_val
    }

    $.getJSON("weapon_data.json", function(data){
        if(data[type][name][ele_type]){
            section.find(".ele_type select").val(data[type][name][ele_type])
            // 特殊属性のダメージ計算には未対応なので、ele_typeが特殊属性ならele_valを0にする。対応したら消しましょう。
            if(data[type][name][ele_type] == ("麻"||"毒"||"眠"||"爆")){
                // 表示属性値
                section.find(".element input").val(0)
            }else{
                // 表示属性値
                section.find(".element input").val(data[type][name][ele_val])
            }
        }else{
            // なければ0を返す
            return 0
        }
        
    })
}


/** スキルが選ばれたらlabelの文字色を変える */
function select_skills(){
    if($("option:selected", this).text() == "なし"){
        // なしが選択されたら文字色を白く
        $(this).prev().css("color", "white")
    }else{
        $(this).prev().css("color", "orange")
    }
}

/** monster_data.jsonからモンスター名を取りモンスター名セレクトに入力する関数 */
function monster_name_to_select(){
    let select = $(".monster select")
    $.getJSON("monster_data.json", function(data){
        for(m in data){
            let option = $("<option>")
            option.text(m)
            select.append(option)
        }
    })
}

/** モンスターが選択されたらモンスターデータのテーブルを表示 */
function output_monster_data_table(){
    let monster = $("option:selected", this).text(),
        table = $(this).parents().find(".monster_table")
        thead = $("<thead>"),
        tbody = $("<tbody>")
    
    // tbodyの中身をリセット
    table.empty()

    $.getJSON("monster_data.json", function(data){
        let i = 0
        // テーブルヘッド
        let h_row = $("<tr>")
        h_row.append($("<th>").text(""))
        for(part in data[monster]){
            let row = $("<tr>")
            row.append($("<td>").text(part))
            for(dmg_type in data[monster][part]){
                if(i == 0){
                    h_row.append($("<th>").text(dmg_type))
                }
                let td = $("<td>")
                // 各攻撃属性の値（配列）の要素数を確認
                if(data[monster][part][dmg_type].length == 1){
                    // 配列の長さが1の場合、0こ目の要素をそのままtdへ入力
                    td.text(String(data[monster][part][dmg_type][0]))
                }else{
                    // 配列の長さが二つ以上のなら
                    // "配列[0](配列[1])"という形でtdに入力
                    td.text(
                        String(data[monster][part][dmg_type][0]) + 
                        "("+ String(data[monster][part][dmg_type][1]) +")"
                    )
                }
                row.append(td)
            }
            tbody.append(row)
            i++
        }
        thead.append(h_row)
        table.append(thead, tbody)
    })
}


/** 計算ボタンが押されたら動く。計算する */
function click_calc_button(){
    console.log("計算ボタン")
    // section .input
    let section = $(this).parents().find(".input")

    // 武器objを作成
    let weapon = {
        name:
            section.find(".weapon_name select option:selected").text(),
        type:
            section.find(".weapon_types select option:selected").text(),
        atk: 
            Number(section.find(".attack input").val()),
        element_type:
            section.find(".ele_type select option:selected").val(),
        element: 
            Number(section.find(".element input").val()),
        affinity: 
            Number(section.find(".affinity input").val()),
        sharp: 
            PHYS_SHARP_OBJ[section.find(".sharpness select option:selected").val()],
        ele_sharp:
            ELE_SHARP_OBJ[section.find(".sharpness select option:selected").val()]
    }

    // 実際の攻撃力をweaponに追加
    weapon.true_atk = weapon.atk / ATK_CORRECTION[weapon.type]
    // 属性があるかどうかのbool値を取得
    weapon.has_element = HAS_ELEMENT(weapon.element_type, 
                                     ELEMENT_LIST)

    // 防御率の取得
    let defense_rate = Number(section.find(".defense_rate").val())
    defense_rate /= 100


    /* 加算スキル（武器倍率に加算するスキル）************************************/
    let sum_skills = []
    // 極限強化・攻撃
    sum_skills.push(Number(
        section.find(".honing option:selected").val()))

    // 攻撃up
    sum_skills.push(Number(
        section.find(".atk_up option:selected").val()))

    // 無傷（フルチャージ）
    sum_skills.push(Number(
        section.find(".peak_performance option:selected").val()))

    // 闘魂（挑戦者）
    let challenger = section.find(".challenger option:selected").val().split(",")
    sum_skills.push(Number(challenger[0]))
    weapon.affinity += Number(challenger[1])


    /* 乗算スキル 武器倍率に乗算するスキル *************************************/
    let mul_skills = []
    // 火事場力（倍率系スキル）
    mul_skills.push(Number(section.find(".adrenaline option:selected").val()))

    // 不屈（倍率系スキル）
    mul_skills.push(Number(section.find(".fortify option:selected").val()))

    // 演奏攻撃力UP
    mul_skills.push(
        Number(section.find(".hh_atk option:selected").val()))
    
    
    /** 砲術
     * ガンランス: 1.1, 1.2, 1.3
     * 徹甲榴弾: 1.15, 1.3, 1.4
     * チャージアックス: 1.3, 1.35, 1.4
     * 
     * ネコ砲術（火属性値をあげるのか不明）
     * ガンランス: 1.1
     * 徹甲榴弾: 1.15
     * チャージアックス: 1.15
     * チャージアックスの場合は砲術師+ネコ砲術で1.4が上限 */
    let artillery = 
        section.find(".artillery option:selected").val().split(",")
    let felyne_bomb_txt = 
        section.find(".felyne_bomb option:selected").text()
    let felyne_bomb = 
        section.find(".felyne_bomb option:selected").val().split(",")
    
    let artillery_magn = 1
    switch (weapon.type){
        case "ガンランス":
            // 砲撃術 * 猫砲撃 少数第2位以下を切り捨てる
            artillery_magn *= 
                truncate_decimal_place(
                    Number(artillery[0]) * Number(felyne_bomb[0]))
            break
        case "チャージアックス":
            // 砲撃術 * 猫砲術 上限1.4
            artillery_magn = Number(artillery[2]) * Number(felyne_bomb[1])
            if(artillery_magn > 1.4){artillery_magn = 1.4}
            break
        case "ライトボウガン":
        case "ヘヴィボウガン":
            artillery_magn *= Number(artillery[1]) * Number(felyne_bomb[1])
            break
    }


    /* 会心率UPスキル *******************************************************/
    // 達人
    weapon.affinity += Number(section.find(".expert option:selected").val())
    
    /** 力の解放
     *  +1: +30
     *  +2: +50*/
    weapon.affinity += Number(
        section.find(".latent_power option:selected").val())
    
    // 狂竜症克服
    weapon.affinity += Number(
        section.find(".antivirus option:selected").val())
    
    // 演奏会心UP
    weapon.affinity += 
        Number(section.find(".hh_affi option:selected").val())


    /* 属性スキル **********************************************************/
    // 表示属性値に乗算 倍率の上限は1.2
    // 単属性強化
    let ind_e_up = 
        section.find(".ind_ele_up option:selected").val().split(",")
    
    // 全属性強化
    let e_up = 
        Number(section.find(".ele_up option:selected").val())
    
    // 狩猟笛旋律 属性攻撃力強化
    let hh_e_up = 
        Number(section.find(".hh_ele option:selected").val())

    let element_up = Number(ind_e_up[0]) * e_up * hh_e_up
    // element_upが1.2を超えたら1.2にする
    if(element_up > 1.2){element_up = 1.2}
    weapon.element = 
        truncate_ones_place(weapon.element * element_up) + Number(ind_e_up[1])
    
    
    /** 会心撃【属性】*/
    let crit_ele_magn = 1
    if (section.find(".crit_element option:selected").val() == "1"){
        // 会心撃【属性】がありの場合
        switch (weapon.type){
            case "大剣":
                crit_ele_magn = 1.2
                break
            case "片手剣":
            case "双剣":
            case "弓":
                crit_ele_magn = 1.35
                break
            case "ライトボウガン":
            case "ヘヴィボウガン":
                crit_ele_magn = 1.3
                break
            default:
                crit_ele_magn = 1.25
                break
        }
    }
    
    /* 敵パラメータ補正スキル ************************************************/
    // 痛撃 （肉質へ加算）
    let weakness_exp = Number(
        section.find(".weakness_exploit option:selected").val())
    

    /* その他スキル *********************************************************/
    /** 未実装スキル
     *  抜刀会心
     *  抜刀減気
     *  薬・護符・爪
     */

    // 加算スキルを武器倍率に加算
    weapon.true_atk += sum_array(sum_skills)
    // 乗算スキルを武器倍率に乗算
    weapon.true_atk *= mul_array(mul_skills)


    /* ダメージ計算に使用する変数の宣言 ************************************/
    // モンスター名を取得
    let monster = section.find(".monster select option:selected").text()
    
    // damage_obj = {モーション名: [物理ダメージ, 属性ダメージ, etc...]}
    let damage_obj = {}
    let result_table = $(this).parents().find(".result")

    // weapon obj の構造を書いときたい
    // [武器倍率, 会心期待値, 斬れ味補正, 中腹ヒット]
    // [属性倍率, 属性会心期待値, 属性斬れ味補正]
    weapon.affi_exp = calc_affi_exp(weapon.affinity)
    weapon.true_element = weapon.element / 10
    weapon.crit_ele_exp = calc_affi_exp(weapon.affinity, 
                                        crit_ele_magn)
    
    // jsonを呼び出し
    $.ajax({
        url: "monster_data.json",
        type: "get",
        dataType: "json"
    }).then(function(data){
        // コールバックを格納するobj
        let callbacks = {},
            motions = []
        // 武器種毎の変数を準備
        switch(weapon.type){
            case "大剣": { // weaponに独自の色々を追加する
                // 中腹ヒット倍率を取得し、weapon dictに追加
                let cob_flag = Number(section.find(
                    ".center_of_blade select option:selected").val())
                weapon.center_of_blade = CENTER_OF_BLADE(cob_flag)
                motions = GS_LIST
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = gs_calc_dmg
                break
            }
            case "太刀": {
                let cob_flag = 
                    Number(section.find(".center_of_blade select option:selected").val())
                let sp_full_flag = 
                    Number(section.find(".spirit_full select option:selected").val())
                let sp_color_flag = 
                    section.find(".spirit_color select option:selected").val()
                weapon.center_of_blade = CENTER_OF_BLADE(cob_flag)
                weapon.spirit_full = SPIRIT_FULL(sp_full_flag)
                weapon.spirit_color = SPIRIT_COLOR(sp_color_flag)
                motions = LS_LIST
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = ls_calc_dmg
                break
            }
            case "片手剣": {
                /** 斬撃タイプの攻撃は、斬れ味補正 *1.06
                 *  溜め斬りは、属性補正 *2 */ 
                motions = SnS_LIST
                // callbacks
                callbacks.set_vars_for_calc = sns_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = sns_calc_dmg
                break
            }
            case "双剣": {
                motions = DB_LIST
                // 鬼人化時(非鬼人強化): モーション値*1.15（端数切捨て）
                // 両手攻撃: 属性値*0.7
                // 鬼人化状態:1.15, 通常:1
                let demon_bool = Number(section
                    .find(".demon_mode select option:selected").val())
                weapon.demon = DEMON_MODE(demon_bool)
                // コールバック関数を設定
                callbacks.get_weak = get_weak
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.calc_dmg = db_calc_dmg
                break
            }
            case "ハンマー": {
                motions = HAMMER_LIST
                // コールバック
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = hammer_calc_dmg
                break
            }
            case "狩猟笛": {
                motions = HH_LIST
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = calc_dmg
                break
            }
            case "ランス": {
                motions = LANCE_LIST
                // コールバック
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = lance_get_weak
                callbacks.calc_dmg = calc_dmg
                break
            }    
            case "ガンランス": {
                // 砲撃タイプを取得
                weapon.shell_type = section
                    .find(".shell_types select option:selected").val()
                // 砲撃レベルを取得
                weapon.shell_lv = Number(section
                    .find(".shelling_lv select option:selected").val())
                weapon.shell_atk = SHELL_ATK_OBJ[weapon.shell_type]    
                                   [weapon.shell_lv][0]
                weapon.fire_atk = SHELL_ATK_OBJ[weapon.shell_type]
                                  [weapon.shell_lv][1]
                weapon.artillery = artillery_magn
                motions = add_full_burst(GL_LIST)
                // callbacks
                callbacks.set_vars_for_calc = gl_vars_for_calc
                callbacks.get_weak = gl_get_weak
                callbacks.calc_dmg = gl_calc_dmg
                break
            }
            case "スラッシュアックス": {
                /* 剣モードだけに補正がつく
                 * 強撃と強属性ビン以外は未対応 */
                // ビンタイプを取得
                const PHIAL_TYPE = section.find(".sa_p_types select option:selected").text()
                // 強撃(power)ビン: 端数切捨(モーション値*1.2)
                weapon.power_cor = POWER_PHIAL_COR(PHIAL_TYPE)
                // 強属性(element)ビン: 一の位切捨(表示属性値*1.25)
                weapon.ele_cor = ELEMENT_PHIAL_COR(PHIAL_TYPE)
                motions = SA_LIST
                callbacks.set_vars_for_calc = set_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = sa_calc_dmg
                break
            }
            case "チャージアックス": {
                // ビンタイプ（榴弾or強属性）を取得して、weaponに追加
                weapon.phial_type =
                    section.find(".p_type select option:selected").val()
                // 属性強化倍率を取得して、weaponに追加
                let boost_flag = Number(section
                    .find(".boost_mode select option:selected").val())
                weapon.boost = BOOST_MODE(boost_flag)
                weapon.artillery = artillery_magn

                // 通常状態ならCB_LISTから超高出力とGP爆発を削除する
                motions = control_boost_motion(CB_LIST, boost_flag)

                // コールバックを設定
                callbacks.set_vars_for_calc = cb_vars_for_calc
                callbacks.get_weak = get_weak
                callbacks.calc_dmg = cb_calc_dmg
                break
            }
            case "操虫棍":
                // 赤白エキス モーション値*1.2 
                // 赤白橙エキス モーション値*1.25
                let essences = Number(section.find(".essences select option:selected").val())
                if(essences > 1){
                    // エキスが選択された時は赤エキス時に存在するモーションだけ計算
                    for(m in IG_DICT){
                        damage_dict[m] = []
                        if(IG_DICT[m][2]){
                            // 物理
                            damage_dict[m].push(
                                mul(weapon_magn, essences, sum_array(IG_DICT[m][0]) / 100, affi_exp, phys_sharp_magn, phys_weak))
                            // 属性
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn))
                        }
                    }
                }else{
                    for(m in IG_DICT){
                        damage_dict[m] = []
                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(IG_DICT[m][0])/100, affi_exp,phys_sharp_magn, phys_weak))
                        // 属性
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn))
                    }
                }
                break
        }

        // obj_calc_flowを元にダメージ計算
        damage_obj = calc_damage_flow(weapon, motions, data[monster],  
                                      callbacks)
        // console.log(damage_obj)
        // 合計ダメージを計算して各ダメージ配列の最後に入れる
        for(m in damage_obj){
            for(p in damage_obj[m]){
                // 肉質変化のない部位ならそのdictを削除
                if(is_same_obj(damage_obj[m][p][0], 
                               damage_obj[m][p][1])){
                    damage_obj[m][p].pop()
                }
                // 合計を計算
                for(let w = 0; w < damage_obj[m][p].length; w++){
                    let sum = 0
                    for(k in damage_obj[m][p][w]){
                        sum += damage_obj[m][p][w][k]
                    }
                    // 肉質変化毎の合計ダメージ
                    damage_obj[m][p][w]["合計"] = Math.floor(sum)
                }
            }
        }
        console.log(damage_obj)
        // 計算結果の出力
        output_result_table(result_table, damage_obj)
    })
    return false
}


// Main
//ページが読み込まれたら動作
$(function(){
    var card_id = 1
        
    // 「カードを追加ボタン」が押されたら発動
    function click_add_card(){
        // .cardを追加する時
        // 呼んだカードのコピーを作成
        let card = $(this).parents(".card").clone()
        let section = $(this).prevAll(".input")
        // セレクトボックスの値だけcloneしたカードに設定
        card.find(".weapon_types select").val(
            section.children(".weapon_types select option:selected")
                .text())
        card.find(".sharpness").val(
            section.children(".sharpness")
            .find("option:selected").text())
        // 呼んだカードのidを記憶
        let called_id = card.attr("id")
        // 新しいカードにidをつける
        card.attr("id", card_id)
        // 追加されたカードは元カードの次に追加
        $("#" + called_id).after(card)
        
        // 新しいカードにイベントを設定
        $("#" + card_id + " .weapon_types select")
            .on("change", set_weapon_select)
        $("#" + card_id + " .weapon_name select")
            .on("change", input_weapon_data)
        $("#" + card_id + " .ele_type select")
            .on("change", select_ele_type)
        $("#" + card_id + " .sharp_plus select")
            .on("change", update_sharpness)
        $("#" + card_id + " .awaken select")
            .on("change", update_element)
        $("#" + card_id + " .skills select").on("change", select_skills)
        $("#" + card_id + " .monster select")
            .on("change", output_monster_data_table)
        $("#" + card_id + " .calc").on("click", click_calc_button)   
        $("#" + card_id + " .add_card").on("click", click_add_card)
        // カードidを更新
        card_id++
        return false
    }


    // 最初のカードにイベントを設定
    $("#0 .weapon_types select").on("change", set_weapon_select)
    $("#0 .weapon_name select").on("change", input_weapon_data)
    $("#0 .ele_type select").on("change", select_ele_type)
    $("#0 .sharp_plus select").on("change", update_sharpness)
    $("#0 .awaken select").on("change", update_element)
    $("#0 .monster select").on("change", output_monster_data_table)
    $("#0 .calc").on("click", click_calc_button)   
    $("#0 .add_card").on("click", click_add_card)
    $("#0 .skills select").on("change", select_skills)
    

    // モンスターセレクトにmonster_data.jsonから名前を入力
    monster_name_to_select()
})

