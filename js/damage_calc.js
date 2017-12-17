//ダメージ計算ページのjs
//jsのtextには""を使う。html内は""を使う。

/*** 日本語-英語
 * 加算:sum
 * 乗算:mul
 * 計算:calc calculation
 * 倍率:magn magnification
 * 割合:rate 
 * 係数:coef coefficient
 * 会心値:affi affinity
 * 期待値:exp_val expected value
***/

/*** 用語
 * 表示攻撃力：ゲーム中に表示される攻撃力
 * 武器係数：武器毎に設定されている係数
 * 武器倍率：表示攻撃力を武器係数で割った数値 true attack value
 ***/

/*** 計算式
 * 武器倍率（補正）= ((表示攻撃力 / 武器係数) + (攻撃UPスキル + 護符・爪 + 食事・鬼人薬 + 種・丸薬 + 太刀錬気)) * 笛演奏効果 * 火事場力
 * 物理ダメージ = 武器倍率 * (モーション値 / 100) * 会心期待値 * 斬れ味 * (肉質 / 100)
 * 属性ダメージ = 属性倍率 * 斬れ味 * (耐属性 / 100) * ヒット数
 * 合計ダメージ = (物理ダメージ + 属性ダメージ) ＊端数切捨
 * 最終ダメージ = (合計ダメージ * 防御率) ＊端数切捨
***/


/* Constants ******************************************************************/

//武器係数
const WEAPON_COEF_DICT = {
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


/** 大剣 */
const GS_DICT = {
    "縦斬り": 48,
    "斬り上げ": 46,
    "縦斬り": 48,
    "斬り上げ": 46,
    "なぎ払い": 36,
    "横殴り（打撃）": 18,
    "溜め1": 65,
    "溜め2": 77,
    "溜め3": 110,
    "溜めすぎ": 77,
    "強溜め0": 52,
    "強なぎ払い": 48,
    "強溜め1": 70,
    "強なぎ払い1": 52,
    "強溜め2": 85,
    "強なぎ払い2": 66,
    "強溜め3": 115,
    "強なぎ払い3": 110,
    "ジャンプ攻撃": 48,
    "ジャンプ後なぎ払い": 66
}


/** 太刀 
 *  {モーション名: [モーション値, ヒット数]}
 *  錬気ゲージ点滅: 斬れ味*1.13
 *  白ゲージ: モーション値*1.05
 *  黄ゲージ: モーション値*1.1
 *  赤ゲージ: モーション値*1.3 */
const LS_DICT = {
    "踏込斬り": [26, 1],
    "縦斬り": [23, 1],
    "突き": [14, 1],
    "斬り上げ": [18, 1],
    "斬り下がり・左右移動斬り": [24, 1],
    "気刃斬り1（錬気不足）": [16, 1],
    "気刃斬り1": [28, 1],
    "気刃斬り2": [32, 1],
    "気刃斬り3": [60, 3], //12+14+34
    "気刃大回転斬り": [42, 1],
    "気刃踏込斬り(錬気不足)": [18, 1],
    "気刃踏込斬り": [30, 1],
    "ジャンプ斬り": [26, 1],
    "ジャンプ気刃斬り": [30, 1],
    "ジャンプ気刃２連斬り": [12+36, 2]
}

/** 片手剣
 * {モーション名: [モーション値, ヒット数]} */
const SnS_DICT = {
    "【抜刀】突進斬り": [18, 1],
    "斬り上げ": [14, 1],
    "斬り下ろし": [14, 1],
    "横斬り": [13, 1],
    "剣盾コンボ": [30, 2], // 10+20 気絶値 15 減気値15
    "水平斬り": [21, 1],
    "斬り返し": [19, 1],
    "盾攻撃": [8, 1],
    "バックナックル": [16, 1],
    "ガード攻撃": [14, 1],
    "溜め斬り": [57, 2], // 20 + 37 気絶値 15 減気値25
    "ジャンプ斬り": [20, 1],
    "ジャンプ突進斬り": [20, 1],
    "ジャンプ斬り上げ": [18, 1]
}

/** 双剣 
 *  {モーション名:[0モーション値配列, 1ヒット数, 2鬼人化フラグ, 3両手モーションフラグ]} 
 *  モーション値にかけ算を含むものは両手攻撃 
 *  鬼人化フラグ: 通常状態のみ:0, 鬼人化でも使える:1 鬼人化専用:2
 *  両手モーションフラグ: 通常:0, 両手:1 */
const DB_DICT = {
    "[抜刀]斬り払い": [[7,7,7,7], 4, 1, 1], // 28 32
    "鬼人突進連斬":[[7,7,7,7,9,9], 6, 2, 1], // 46 52
    "斬り上げ": [[18], 1, 1, 0], // 20
    "二段斬り": [[8,12], 2, 0, 0], // 20 
    "斬り返し": [[7,10], 2, 0, 0], // 17
    "車輪斬り": [[10,12,12], 3, 1, 1], // 34 37
    "六連斬り": [[4,8,4,8,11,11], 6, 2, 1], // 46 50 鬼人化専用
    "右二連斬り": [[7,10], 2, 0, 0], // 17
    "左二連斬り": [[9,12], 2, 0, 0], // 21
    "回転斬りα": [[16,6,8], 3, 1, 0], // 30 33
    "回転斬りβ": [[18,6,10], 3, 1, 0], // 34 37
    "鬼人連斬": [[8,8,8,8,6,6,20,20], 6, 0, 1], // 72 
    "乱舞": [[29,4,4,4,4,4,4,4,4,18,18], 11, 2, 1], // 97 105鬼人化専用
    "ジャンプ二連斬り": [[10,13], 2, 1, 0], // 23 25
    "空中回転乱舞": [[12,15,15,12], 4, 1, 0], // 54 60
    "回転乱舞フィニッシュ": [[23,23], 2, 1, 0] // 46 52
}

/** ハンマー 
 *  {モーション名: [モーション値, ヒット数]} */
const HAMMER_DICT = {
    "[抜刀]振り上げ": [20, 1],
    "横振り": [15, 1],
    "縦振り": [42, 1],
    "縦振り連打": [20, 1],
    "アッパー": [90, 1],
    "溜めI": [25, 1],
    "溜めI追加攻撃": [20, 1],
    "溜めII": [40, 1],
    "溜めIII": [91, 2], // 15 + 76
    "回転攻撃": [[20, 10], 6], // 20+10*n nはヒット数、最大6
    "ぶんまわし": [60, 1],
    "ジャンプ攻撃": [42, 1],
    "ジャンプ溜めI": [65, 1],
    "ジャンプ溜めII": [70, 1],
    "ジャンプ溜めIII": [80, 1]
}

const HH_DICT = {
    "[抜刀]前方攻撃":33,
    "ぶん回し":30,
    "ツカ攻撃":10, //斬撃
    "連音攻撃1":12,
    "連音攻撃2":22,
    "後方攻撃":45,
    "叩きつけ1":15,
    "叩きつけ2":45,
    "[抜刀]ジャンプ叩きつけ":36,
    "[抜刀]演奏":35,
    "演奏(前方攻撃後)":20,
    "演奏(ツカ攻撃後)":25,
    "追加演奏(後方)1":40,
    "追加演奏(後方)2":30,
    "追加演奏(左右)":35,
    "自分強化以外の追加演奏初撃":33,
}

/** ランス
 *  {モーション名:モーション値}
 *  攻撃属性: 切断
 *  未実装 特徴:切断と打撃のうち高い方の肉質を計算に使う */
const LANCE_DICT = {
    "[抜刀]抜槍突き": 27,
    "中段突き１・２": 20,
    "中段突き３": 27,
    "上段突き１・２": 22,
    "上段突き３": 27,
    "ガード突き": 20,
    "なぎ払い": 20,
    "盾攻撃": 14, // 気絶値 27, 減気値27
    "ジャンプ突き": 30,
    "突進": 16,
    "フィニッシュ突き": 50,
    "突進ジャンプ突き": 50,
    "振り向き攻撃": 50,
    "キャンセル突き": 22,
    "カウンター突き": 50
}

/** ガンランス */
const GL_DICT = {
    "[抜刀]踏み込み突き上げ": 32,
    "砲撃派生突き上げ": 30,
    "斬り上げ": 28,
    "上方突き": 18,
    "水平突き": 24,
    "叩きつけ": 40,
    "ジャンプ叩きつけ": 44,
    "ジャンプ突き": 25,
    "砲撃": 0,
    "溜め砲撃": 0,
    "フルバースト": 0,
    "竜撃砲": 0
}

/** ガンランスの砲撃ダメージ
 *  {砲撃タイプ: [[Lv1ダメ, 火ダメ], [Lv2ダメ, 火ダメ], ...]} */
const GL_SHELL_TYPES = {
    "通常": [[10, 4], [14, 5], [18, 6], [21, 7], [24, 8]],
    "放射": [[15, 9], [21, 11], [28, 14], [32, 16], [36, 18]],
    "拡散": [[20, 6], [30, 8], [40, 10], [44, 11], [48, 12]],
    "竜撃砲": [[[30,30,30,30], [10,10,10,10]],
              [[35,35,35,35], [11,11,11,11]], 
              [[40,40,40,40], [12,12,12,12]],
              [[45,45,45,45], [13,13,13,13]],
              [[50,50,50,50], [14,14,14,14]]]
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
const SA_DICT = {
    "斧:抜刀:横斬り":[[23], 1],
    "斧:縦斬り":[[40], 1],
    "斧:斬り上げ":[[28], 1],
    "斧:振りまわし(回数分)":[[24], 1], // 振り回しのヒット回数は上限がないからどうしよ
    "斧:なぎ払いフィニッシュ":[[57], 1],
    "斧:突進斬り":[[19], 1],
    "斧:変形斬り":[[30], 1],
    "剣:変形斬り":[[23], 1],
    "剣:抜刀:縦斬り":[[30], 1],
    "剣:斬り上げ":[[25], 1],
    "剣:横切り":[[25], 1],
    "剣:二連斬り":[[28, 36], 2],
    "剣:属性解放突き":[[28], 1],
    "剣:属性解放継続":[[13,13,13,13,13,13], 6], // 1~6ヒットで計算する
    "剣:属性解放任意フィニッシュ":[[50], 1],
    "剣:属性解放フィニッシュ":[[80], 1],
    "剣:ジャンプ斬り":[[30], 1]
}

/** チャージアックス 全て切断属性
  *  {dmg_type:攻撃タイプ, motion_val:[モーション値1, 2],
    boost_motion_magn: 属性強化モーション倍率,  2:榴弾爆発係数, 3:強属性爆発係数, 4:爆発回数 }
 * 属性強化で変化するモーションかどうかのフラグを入れてもいいかも*/
const CB_DICT = {
    "剣:突進斬り": 
        {dmg_type: "切断", motion_val: [22], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:牽制斬り": 
        {dmg_type: "切断", motion_val: [14], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:斬り返し": 
        {dmg_type: "切断", motion_val: [17], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:溜め斬り上げ": 
        {dmg_type: "切断", motion_val: [16], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:溜め２連斬り": 
        {dmg_type: "切断", motion_val: [30, 20], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:回転斬り": 
        {dmg_type: "切断", motion_val: [30], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:チャージ斬り返し": 
        {dmg_type: "切断", motion_val: [17], impact_phial_coef: 0.02, ele_phial_coef: 2.5,
        num_of_impacts: 1},
    "剣:盾突き": 
        {dmg_type: "切断", motion_val: [8, 12], impact_phial_coef: 0.05, ele_phial_coef: 2.5, num_of_impacts: 1},
    "剣:ジャンプ斬り":
        {dmg_type: "切断", motion_val: [22], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "剣:カウンター爆発":
        {dmg_type: "切断", motion_val: [0], impact_phial_coef: 0.05, ele_phial_coef: 2.5, num_of_impacts: 1},
    "斧:叩きつけ":
        {dmg_type: "切断", motion_val: [47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:斬り上げ": 
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:縦斬り": 
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:横斬り": 
        {dmg_type: "切断", motion_val: [20], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りI:ビン有": 
        {dmg_type: "切断", motion_val: [26], impact_phial_coef: 0.05, ele_phial_coef: 3.0, num_of_impacts: 1},
    "斧:属性解放斬りII:ビン有": 
        {dmg_type: "切断", motion_val: [18, 80],
        impact_phial_coef: 0.05, ele_phial_coef: 3.0,
        num_of_impacts: 2},
    "斧:高出力属性解放斬り:ビン有": 
        {dmg_type: "切断", motion_val: [90], impact_phial_coef: 0.1, ele_phial_coef: 4.5, num_of_impacts: 3},
    // あえて属性強化前のモーション値をかくと [21, 83, 84] 榴弾ビン倍率は0.33かもしれない
    "斧:超高出力属性解放斬り:ビン1": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 1},
    "斧:超高出力属性解放斬り:ビン2": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 2},
    "斧:超高出力属性解放斬り:ビン3": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 3},
    "斧:超高出力属性解放斬り:ビン4": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5, 
        num_of_impacts: 4},
    "斧:超高出力属性解放斬り:ビン5": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5,
        num_of_impacts: 5},
    "斧:超高出力属性解放斬り:ビン6": 
        {dmg_type: "切断", motion_val: [25, 99, 100], impact_phial_coef: 0.335, ele_phial_coef: 13.5,
        num_of_impacts: 6},
    "斧:ジャンプ叩きつけ": 
        {dmg_type: "切断", motion_val: [47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りI:ビン無": 
        {dmg_type: "切断", motion_val: [14], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:属性解放斬りII:ビン無": 
        {dmg_type: "切断", motion_val: [14, 47], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:高出力属性解放斬り:ビン無":
        {dmg_type: "切断", motion_val: [40], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0},
    "斧:超高出力属性解放斬り:ビン無":
        {dmg_type: "切断", motion_val: [17, 90], impact_phial_coef: 0, ele_phial_coef: 0, num_of_impacts: 0}
}


//斬れ味の色と補正値のマップ
//物理補正値
const PHYS_SHARP_DICT = {
    "赤" : 0.5,
    "橙" : 0.75,
    "黄" : 1.0,
    "緑" : 1.05,
    "青" : 1.2,
    "白" : 1.32,
    "紫" : 1.45
}

//属性補正値
const ELE_SHARP_DICT = {
    "赤" : 0.25,
    "橙" : 0.5,
    "黄" : 0.75,
    "緑" : 1.0,
    "青" : 1.0625,
    "白" : 1.125,
    "紫" : 1.2
}


/* Functions ******************************************************************/

/** １の位を切り下げ */
function truncate_ones_place(x){
    return Math.floor(x/10) * 10
}

/** 少数第y位より下を切り捨て
 *  x: 切り捨てられる値
 *  y: 残す位 default=1
 *  例:1.234
 *     yを指定しなければ少数第一位までになる     
 *     1.23 にしたいときは y=2 */
function truncate_decimal_place(x, y=1){
    return Math.floor(x*10**y) / 10**y 
}

/** 引数を全て加算して返す */
function sum(){
    let x = 0,
        i
    for(i = 0; i < arguments.length; i++){
        x += arguments[i]
    }
    return x
}

/** Arrayの全要素を加算して返す */
function sum_array(x){
    let y = 0,
        i
    for (i = 0; i < x.length; i++){
        y += x[i]
    }
    return y
}

/** 引数を全て乗算して積を返す */
function mul(){
    let x = 1,
        i
    for(i = 0; i < arguments.length; i++){
        x *= arguments[i]
    }
    return x
}

function mul_array(x){
    let y = 1,
        i
    for (i = 0; i < x.length; i++){
        y *= x[i]
    }
    return y
}


/** 武器倍率の計算
 * (表示攻撃力 / 武器係数) */
function calc_weapon_magn(atk, weapon_coef){
    return atk / weapon_coef
}

/** 会心期待値の計算
 ** (1.0 + (会心倍率 - 1.0) * 会心率 / 100.0)
 ** 引数magnを指定すれば会心時の倍率を変えられる */
function calc_affi_exp(affi, magn=1.25){
    return (1.0 + (magn - 1.0) * affi / 100)
}

/** 計算結果をresult tableに出力 */
function output_result_table(table, dict){
    let thead = $("<thead>"),
        tbody = $("<tbody>"),
        h_row = $("<tr>"),
        i = 0

    table.empty()
    h_row.append($("<th>").text(""))
    for(m in dict){
        let b_row = $("<tr>")
        b_row.append($("<td>").text(m))
        for(p in dict[m]){
            if(i == 0){
                h_row.append($("<th>").text(p))
            }
            
            b_row.append($("<td>").text(
                dict[m][p][0][3] + ":"
                + dict[m][p][0][0] + ":"
                + dict[m][p][0][1] + ":"
                + dict[m][p][0][2] + "\n("
                + dict[m][p][1][3] + ":"
                + dict[m][p][1][0] + ":"
                + dict[m][p][1][1] + ":"
                + dict[m][p][1][2] + ")"))
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
    section.find(".cob").hide()
    section.find(".p_type").hide()
    section.find(".boost_mode").hide()
    section.find(".sb_full").hide()
    section.find(".sb_color").hide()
    section.find(".demon_mode").hide()
    section.find(".shell_types").hide()
    section.find(".shelling_lv").hide()
    section.find(".essences").hide()
    section.find(".sa_p_types").hide()

    // 武器種ごとに処理
    switch(type){
        case "大剣":
            // 中腹ヒットhtmlを表示
            section.find(".cob").show()
            break
        case "太刀":
            // 中腹ヒットhtmlを表示
            section.find(".cob").show()
            section.find(".sb_full").show()
            section.find(".sb_color").show()
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
            case "チャージアックス":
                input_sect.find(".p_type select")
                    .val(data[type][name]["phials"])
                break
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
function click_calc_botton(){
    console.log("計算ボタン")
    // section .input
    let section = $(this).parents().find(".input")
    // 入力値を取得
    // 武器種を取得
    let weapon_type = 
        section.find(".weapon_types select option:selected").text()
    // 武器倍率を取得
    let weapon_magn = calc_weapon_magn(
        section.find(".attack input").val(),
        WEAPON_COEF_DICT[weapon_type])
    // 属性倍率を取得
    let ele_val = Number(section.find(".element input").val())
    // 会心率を取得
    let affinity = Number(section.find(".affinity input").val())
    // 斬れ味物理補正値を取得
    let phys_sharp_magn = PHYS_SHARP_DICT[
        section.find(".sharpness select option:selected").val()
    ]
    //斬れ味属性補正値を取得
    let ele_sharp_magn = ELE_SHARP_DICT[
        section.find(".sharpness select option:selected").val()
    ]

    // 肉質関連の変数
    // 肉質はモーションごとに取得する必要がある
    // 耐属性も部位ごとに取得
    
    // 属性タイプを取得
    let ele_type = 
        section.find(".ele_type select option:selected").val()
    // モンスター名を取得
    let monster = section.find(".monster select option:selected").text()
    // 肉質, 耐属性用の変数を宣言
    let phys_weak, ele_weak
    
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
    affinity += Number(challenger[1])


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
    let artillery_txt = 
        section.find(".artillery option:selected").text()
    let artillery = 
        section.find(".artillery option:selected").val().split(",")
    let felyne_bomb_txt = 
        section.find(".felyne_bomb option:selected").text()
    let felyne_bomb = 
        section.find(".felyne_bomb option:selected").val().split(",")
    
    let artillery_magn = 1
    switch (weapon_type){
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
    affinity += Number(section.find(".expert option:selected").val())
    
    /** 力の解放
     *  +1: +30
     *  +2: +50*/
    affinity += Number(
        section.find(".latent_power option:selected").val())
    
    // 狂竜症克服
    affinity += Number(
        section.find(".antivirus option:selected").val())
    
    // 演奏会心UP
    affinity += 
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
    ele_val = 
        truncate_ones_place(ele_val * element_up) + Number(ind_e_up[1])
    
    
    /** 会心撃【属性】*/
    let crit_ele_magn = 1
    if (section.find(".crit_element option:selected").val() == "1"){
        // 会心撃【属性】がありの場合
        switch (weapon_type){
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
    if (phys_weak >= 45){
        //肉質が45%以上なら肉質を+5%
        phys_weak += weakness_exp
    }

    /* その他スキル *********************************************************/
    /** 未実装スキル
     *  抜刀会心
     *  抜刀減気
     *  薬・護符・爪
     */

    // 加算スキルを武器倍率に加算
    weapon_magn += sum_array(sum_skills)
    // 乗算スキルを武器倍率に乗算
    weapon_magn *= mul_array(mul_skills)
    // 属性倍率を計算
    let ele_magn = ele_val / 10
    // 会心期待値を計算
    let affi_exp = calc_affi_exp(affinity)
    // 属性会心期待値の計算
    let crit_ele_exp = calc_affi_exp(affinity, crit_ele_magn)
    

    // damage_dict = {モーション名: [物理ダメージ, 属性ダメージ, etc...]}
    let damage_dict = {}
    let result_table = $(this).parents().find(".result")

    // jsonを呼び出し
    $.ajax({
        url: "monster_data.json",
        type: "get",
        dataType: "json"
    }).then(function(data){
        // 武器種別に計算をする
        switch(weapon_type){
            case "大剣":
                // 中腹ヒット倍率を斬れ味補正にかける
                phys_sharp_magn *= Number(section
                    .find(".center_of_blade option:selected").val())
                for(motion in GS_DICT){
                    damage_dict[motion] = []
            
                    let motion_val = GS_DICT[motion] / 100
                    // モーションごとの補正を入れる
                    if(motion.match(/溜め1/) || motion == "強なぎ払い1"){
                        //(強)溜め1 と 強なぎ払い1 はモーション値を1.1倍
                        motion_val *= 1.1
                    }else if(motion.match(/溜め2/) || motion == "強なぎ払い2"){
                        //(強)溜め2 と 強なぎ払い2 はモーション値を1.2倍
                        motion_val *= 1.2
                    }else if(motion.match(/溜め3/) || motion == "強なぎ払い3"){
                        //(強)溜め3 と 強なぎ払い3 はモーション値を1.3倍
                        motion_val *= 1.3
                    }
            
                    // モーションごとの属性値補正を入れる
                    let element = ele_magn
                    switch(motion){
                        case "溜め1":
                            element *= 1.2
                            break
                        case "溜め2":
                            element *= 1.5
                            break
                        case "溜め3":
                            element *= 2.0
                            break
                        case "強溜め1":
                            element *= 1.8
                            break
                        case "強溜め2":
                            element *= 2.25
                            break
                        case "強溜め3":
                            element *= 3.00
                            break
                    }
            
                    // 物理ダメージ計算
                    damage_dict[motion].push(
                        mul(weapon_magn, motion_val, affi_exp,     phys_sharp_magn, phys_weak))
            
                    // 属性ダメージ計算
                    damage_dict[motion].push(
                        mul(element, ele_sharp_magn, ele_weak, crit_ele_exp))
                }
                break

            case "太刀":
                // 斬れ味に乗算 中腹ヒットと錬気ゲージ点滅
                phys_sharp_magn *= Number(section
                .find(".center_of_blade option:selected").val())
                phys_sharp_magn *= Number(section
                    .find(".sb_full select option:selected").val())
                
                // 錬気ゲージ色倍率 モーションに乗算（端数切捨）
                let sb_color = Number(section
                    .find(".sb_color select option:selected").val())
                
                // モーションごとにダメージを計算
                for(m in LS_DICT){
                    damage_dict[m] = []
                    // 錬気ゲージ色倍率をモーションに掛ける
                    let motion_val = Math.floor(LS_DICT[m][0] * sb_color) / 100

                    // 物理ダメ計算
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak))

                    // 属性ダメ計算
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, LS_DICT[m][1], ele_weak, crit_ele_exp))
                }
                break
            
            case "片手剣":
                // 片手剣は常時は斬れ味補正 *1.06
                phys_sharp_magn *= 1.06
                for(m in SnS_DICT){
                    damage_dict[m] = []
                    let motion_val = SnS_DICT[m][0] / 100

                    // 溜め斬りは属性値 * 2
                    let element
                    if(m == "溜め斬り"){
                        element = ele_magn * 2
                    }else{
                        element = ele_magn
                    }

                    // 物理ダメージ
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak))

                    // 属性ダメージ
                    damage_dict[m].push(
                        mul(element, ele_sharp_magn, SnS_DICT[m][1], ele_weak, crit_ele_exp))
                }
                break
            
            case "双剣":
                // 鬼人化時: モーション値*1.15（端数切捨て）(鬼人強化では変化なし)
                // 両手攻撃: 属性値*0.7 (モーション値に乗算を含むもの)
                let demon = section
                    .find(".demon_mode select option:selected").val()
                let demon_flag = section
                    .find(".demon_mode select option:selected").text()
                
                switch(demon_flag){
                    // 鬼人化状態のダメージ
                    case "あり":
                        for(m in DB_DICT){
                            damage_dict[m] = []
                            let element
                            // 鬼人化専用と鬼人化共用のモーションに*1.15(切捨)
                            if ((DB_DICT[m][2] == 1) || (DB_DICT[m][2] == 2)){
                                let m_arr = [],
                                    i
                                for(i = 0; i < DB_DICT[m][0].length; i++){
                                    m_arr.push(Math.floor(DB_DICT[m][0][i] * 1.15))
                                }
                                let motion_val = sum_array(m_arr) / 100

                                // 物理
                                damage_dict[m].push(
                                    mul(weapon_magn, motion_val, affi_exp,
                                        phys_sharp_magn, phys_weak))
                                // 属性 両手モーションなら属性値*0.7
                                if(DB_DICT[m][3] == 1){
                                    element = ele_magn * 0.7
                                }else{
                                    element = ele_magn
                                }
                                damage_dict[m].push(
                                    mul(element, ele_sharp_magn, DB_DICT[m][1],     ele_weak, crit_ele_exp))
                            }
                        }
                        break
                    case "なし":
                        for(m in DB_DICT){
                            damage_dict[m] = []
                            let element
                            let motion_val = sum_array(DB_DICT[m][0]) / 100
                            // 通常状態のみと鬼人化共用のモーションだけ
                            if ((DB_DICT[m][2] == 0) || (DB_DICT[m][2] == 1)){
                                damage_dict[m].push(
                                    mul(weapon_magn, motion_val, affi_exp,
                                        phys_sharp_magn, phys_weak))
                                // 属性 両手モーションは属性値*0.7
                                if(DB_DICT[m][3] == 1){
                                    element = ele_magn * 0.7
                                }else{
                                    element = ele_magn
                                }
                                damage_dict[m].push(
                                    mul(element, ele_sharp_magn, DB_DICT[m][1],     ele_weak, crit_ele_exp))
                            }
                        }
                        break
                }
                break
            
            case "ハンマー":
                for(m in HAMMER_DICT){
                    if(m == "回転攻撃"){
                        // モーション値を取得
                        let mv = HAMMER_DICT[m][0][0]
                        for(let i = 1; i < HAMMER_DICT[m][1]+1; i++){
                            // 回転攻撃は1回転~6回転目まで１個ずつ計算
                            damage_dict[m+i] = []
                            // 物理ダメ
                            damage_dict[m+i].push(
                                mul(weapon_magn, mv / 100, affi_exp, 
                                    phys_sharp_magn, phys_weak))
                            // 属性ダメ
                            damage_dict[m+i].push(
                                mul(ele_magn, ele_sharp_magn, i,
                                    ele_weak, crit_ele_exp))
                            mv += HAMMER_DICT[m][0][1]
                            
                        }
                    }else{
                        damage_dict[m] = []
                        // 物理ダメ
                        damage_dict[m].push(
                            mul(weapon_magn, HAMMER_DICT[m][0]/100, affi_exp, 
                                phys_sharp_magn, phys_weak))
                        // 属性ダメ
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, HAMMER_DICT[m][1],
                                ele_weak, crit_ele_exp))
                    }
                }
                break
            case "狩猟笛":
                for(m in HH_DICT){
                    damage_dict[m] = []
                    // 物理ダメ
                    damage_dict[m].push(
                        mul(weapon_magn, HH_DICT[m]/100, affi_exp, phys_sharp_magn, phys_weak))
                    
                    // 属性ダメ
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, crit_ele_exp))
                }
                break
            case "ランス":
                // 未実装 切断と打撃肉質のうち大きい方を計算に使う
                for(m in LANCE_DICT){
                    damage_dict[m] = []
                    let motion_val = LANCE_DICT[m] / 100
                    // 物理
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak))
                    // 属性
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, crit_ele_magn))
                }
                break
            case "ガンランス":
                // 砲撃タイプを取得
                let shell_type = section
                    .find(".shell_types select option:selected").text()
                // 砲撃レベルを取得
                let lv = Number(section
                    .find(".shelling_lv select option:selected").val())
                
                // 砲撃タイプ毎に各砲撃の倍率を設定
                // charged shelling, full burst, wyvern"s fire
                let cs, fb, wf 
                switch(shell_type){
                    case "通常":
                        cs = 1.2
                        fb = 1.1
                        wf = 1.0
                        break
                    case "放射":
                        cs = 1.2
                        fb = 1
                        wf = 1.2
                        break
                    case "拡散":
                        cs = 1.44
                        fb = 0.9
                        wf = 1
                        break
                }

                /** 砲撃ダメージの計算 
                 *  切捨(砲撃の基本ダメ * 切捨(切捨(砲撃術 * 猫の砲撃術) * 砲撃タイプ倍率)) + 砲撃の火ダメ
                 *  （未確定）砲撃の火ダメージ: 砲撃基本火ダメ * (未対応)耐火属性
                 *  各乗算で端数切り捨て */
                for(m in GL_DICT){
                    switch (m){
                        case "砲撃":
                            damage_dict[m] = []
                            damage_dict[m].push(
                                Math.floor(
                                    GL_SHELL_TYPES[shell_type][lv][0]
                                    * artillery_magn)
                                + (GL_SHELL_TYPES[shell_type][lv][1]
                                    * ele_weak))
                            
                            break
                        case "溜め砲撃":
                            damage_dict[m] = []
                            damage_dict[m].push(
                                Math.floor(Math.floor(
                                    GL_SHELL_TYPES[shell_type][lv][0]
                                    * artillery_magn)
                                * cs)
                                + GL_SHELL_TYPES[shell_type][lv][1]
                                    * ele_weak)
                            break
                        case "フルバースト":
                            // フルバーストの装填数1~6(6は装填数UP)まで計算する
                            for(let i = 1; i < 7; i++){
                                damage_dict[m+i] = []
                                damage_dict[m+i].push((
                                    Math.floor(Math.floor(
                                        GL_SHELL_TYPES[shell_type][lv][0]
                                        * artillery_magn)
                                    * fb)
                                    + (GL_SHELL_TYPES[shell_type][lv][1])
                                        * ele_weak)
                                    * i)
                            }
                            break
                        case "竜撃砲":
                            damage_dict[m] = []
                            let d = 0,
                                fd = 0
                            for(let i = 0; i < 4; i++){
                                // 砲撃基本ダメージの計算
                                d += (Math.floor(Math.floor(
                                    GL_SHELL_TYPES["竜撃砲"][lv][0][i]
                                    * artillery_magn)
                                * wf))
                                // 砲撃火属性ダメージの計算
                                fd += (GL_SHELL_TYPES["竜撃砲"][lv][1][i]
                                        * ele_weak)
                            }
                            damage_dict[m].push(d+fd)
                            break
                        default:
                            damage_dict[m] = []
                            // 物理
                            damage_dict[m].push(
                                mul(weapon_magn, GL_DICT[m] / 100, affi_exp, 
                                    phys_sharp_magn, phys_weak))
                            
                            // 属性
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, 
                                    ele_weak, crit_ele_magn))
                            break
                    }
                }
                break
            

            case "スラッシュアックス":
                // 強撃と強属性ビン以外は未対応
                // ビンタイプを取得
                let phial = Number(section
                    .find(".sa_p_types select option:selected").val())
                if(phial==1.2){
                    // 強撃ビンの場合
                    for(m in SA_DICT){
                        damage_dict[m]=[]
                        // phailをかけて端数を切り捨てたモーション値を格納
                        let m_arr = [] 
                        // 各モーション値に強撃ビン倍率をかけ、端数を切捨て
                        for(let i = 0; i < SA_DICT[m][0].length; i++){
                            m_arr.push(Math.floor(SA_DICT[m][0][i]) * phial)
                        }

                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(m_arr) / 100, affi_exp,
                                phys_sharp_magn, phys_weak))
                        // 属性
                        damage_dict[m].push(
                            mul(ele_magn, phial, ele_weak, ele_sharp_magn, crit_ele_exp, SA_DICT[m][1]))
                    }
                    
                }else{
                    // 強属性ビン
                    ele_magn = Math.floor(ele_magn * phial)
                    for(m in SA_DICT){
                        damage_dict[m] = []
                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(SA_DICT[m][0]) / 100,
                                affi_exp, phys_sharp_magn, phys_weak))
                        //属性
                        damage_dict[m].push(
                            mul(ele_magn, phial, ele_weak, ele_sharp_magn, crit_ele_exp, SA_DICT[m][1]))
                    }
                }
                break

            
            case "チャージアックス":
                /** ビン爆発ダメージ計算
                 *  榴弾: 武器倍率 * 榴弾係数 * 爆発回数 (* 属性強化倍率)
                 *  強属性: 属性倍率 * 強属性係数 * 爆発回数 (* 属性強化倍率)
                 *  damage_dict 
                 * {モーション名: {部位1:[[通常物理ダメ,怒り物理ダメ], 属性ダメ, ビンダメ], 怒り[...],
                 *               部位2:[...]}}*/
                // ビンタイプを取得
                let phials_type = 
                    section.find(".p_type select option:selected").val()
                // 属性強化倍率を取得
                let boost = Number(section
                    .find(".boost_mode select option:selected").val())
                
                for(m in CB_DICT){
                    // ダメージタイプを取得
                    let dmg_type = CB_DICT[m]["dmg_type"],
                        // モーション値配列をコピー
                        motion_val = CB_DICT[m]["motion_val"],
                        part_dmg_dict = {} // 部位毎のダメージを格納するdict
                    
                    // ビン爆発計算に使う変数を定義
                    let basic_phial_atk, phial_coef,
                        num_of_impacts = CB_DICT[m]["num_of_impacts"]
                    if (phials_type == "榴弾"){
                        basic_phial_atk = weapon_magn
                        phial_coef = CB_DICT[m]["impact_phial_coef"]
                    }else{ 
                        basic_phial_atk = ele_magn
                        phial_coef = CB_DICT[m]["ele_phial_coef"]
                    }
                    
                    // 属性強化ビン爆発補正をかける
                    if (boost == 1.2){
                        // 超高出力を除く解放斬り
                        if (m.match(/解放斬り/) && !m.match(/超高出力/)){
                            if(phials_type == "榴弾"){
                                basic_phial_atk *= 1.3
                            }else{
                                basic_phial_atk *= 1.35
                            }
                        }
                    }else{ // 通常状態
                        // 盾突き・チャージ斬り返し・カウンター爆発のビン爆発係数を0にする
                        if(m.match(/盾突き/)
                        || m.match(/チャージ斬り返し/)
                        || m.match(/カウンター爆発/)){
                            phial_coef = 0
                        }
                        // 通常状態なら超高出力は計算自体を飛ばす
                        if(m.match(/超高出力/)){ continue }
                    }

                    // 属性強化倍率をモーションに掛ける
                    for (let i = 0; i < motion_val.length; i++){
                        // 超高出力以外の斧と盾突きモーション値にboostをかける
                        if(m.match(/斧:/) && !m.match(/超高出力/)
                        || m.match(/盾突き/)){
                            motion_val[i] = 
                                Math.floor(motion_val[i] * boost)
                        }
                    }

                    for(part in data[monster]){
                        // ダメージタイプ肉質を取得
                        let weak = data[monster][part][dmg_type],
                            // 肉質ごとにダメージを格納
                            dmg_arr = [[], []]
                        
                        // 肉質変化しない場合、怒り肉質を通常肉質と同じ値にする
                        if(weak.length == 1){ weak.push(weak[0]) }

                        // 物理ダメージを計算
                        // 肉質変化があればそれぞれ計算
                        for(let i = 0; i < weak.length; i++){
                            // 複数ヒットモーションのそれぞれのダメージの合計
                            let sum_motion_dmg = 0 
                            for(let n = 0; n < motion_val.length;
                                n++){
                                // 物理ダメージ計算
                                sum_motion_dmg += mul(weapon_magn,
                                    motion_val[n] / 100, affi_exp, phys_sharp_magn, weak[i] / 100)
                            }
                            dmg_arr[i].push(sum_motion_dmg)
        
                        }
                        
                        // 属性ダメージの計算 無属性なら計算しない
                        if(ele_type == "" || ele_type == "無"){
                            
                        }else{
                            // モンスターの耐属性を取得
                            weak = data[monster][part][ele_type]
                            // 耐属性変化しない場合、怒りを通常と同じ値にする
                            if(weak.length == 1){ weak.push(weak[0]) }

                            // 耐属性変化があればそれぞれを計算
                            for(let i = 0; i < weak.length; i++){
                                dmg_arr[i].push(
                                    mul(ele_magn, ele_sharp_magn,
                                        motion_val.length,
                                        weak[i] / 100,
                                        crit_ele_exp))
                                // 強属性ビンのダメージ計算
                                // 未確定だけど計算後に端数切り捨て
                                if(phials_type == "強属性"){
                                    dmg_arr[i].push(
                                        Math.floor(mul(basic_phial_atk,
                                            phial_coef, num_of_impacts,
                                            weak[i] / 100)))
                                }
                            }
                        }
                        // 部位毎の物理・属性ダメージを格納
                        part_dmg_dict[part] = dmg_arr
                    }
                    
                    // 榴弾は肉質に依存しないので、
                    // 計算回数を増やさないために後から追加
                    // 未確定だけど計算後に端数切り捨て
                    if(phials_type == "榴弾"){
                        let impact_phial_dmg = 
                            Math.floor(mul(weapon_magn, phial_coef,
                                num_of_impacts, artillery_magn))
                        for(p in part_dmg_dict){
                            for(let i = 0; i < part_dmg_dict[p].length; i++){
                                if(part_dmg_dict[p][i]){
                                    part_dmg_dict[p][i]
                                        .push(impact_phial_dmg)
                                }
                            }
                        }
                    }
                    damage_dict[m] = part_dmg_dict
                }
                break
            
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

        // 合計ダメージを計算して各ダメージ配列の最後に入れる
        for(let m in damage_dict){
            for(let p in damage_dict[m]){
                for(let w = 0; w < damage_dict[m][p].length; w++){
                    // 肉質変化毎の合計ダメージ
                    damage_dict[m][p][w].push(
                        Math.floor(sum_array(damage_dict[m][p][w])))
                }
            }
        }
        console.log(damage_dict)
        // 計算結果の出力
        output_result_table(result_table, damage_dict)
    })
    
    //計算結果の出力
    // output_result($(this), sum_damage_dict)
    
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
        $("#" + card_id + " .calc").on("click", click_calc_botton)   
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
    $("#0 .calc").on("click", click_calc_botton)   
    $("#0 .add_card").on("click", click_add_card)
    $("#0 .skills select").on("change", select_skills)
    

    // モンスターセレクトにmonster_data.jsonから名前を入力
    monster_name_to_select()
    
})

