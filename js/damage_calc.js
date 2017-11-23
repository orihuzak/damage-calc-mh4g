//ダメージ計算ページのjs
//jsのtextには''を使う。html内は""を使う。

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
    '大剣': 4.8,
    '太刀': 3.3,
    '片手剣': 1.4,
    '双剣': 1.4,
    'ハンマー': 5.2,
    '狩猟笛': 5.2,
    'ランス': 2.3,
    'ガンランス': 2.3,
    'スラッシュアックス': 5.4,
    'チャージアックス': 3.6,
    '操虫棍': 3.1,
};


/** 大剣 */
const GS_DICT = {
    '縦斬り': 48,
    '斬り上げ': 46,
    '縦斬り': 48,
    '斬り上げ': 46,
    'なぎ払い': 36,
    '横殴り（打撃）': 18,
    '溜め1': 65,
    '溜め2': 77,
    '溜め3': 110,
    '溜めすぎ': 77,
    '強溜め0': 52,
    '強なぎ払い': 48,
    '強溜め1': 70,
    '強なぎ払い1': 52,
    '強溜め2': 85,
    '強なぎ払い2': 66,
    '強溜め3': 115,
    '強なぎ払い3': 110,
    'ジャンプ攻撃': 48,
    'ジャンプ後なぎ払い': 66
}


/** 太刀 
 *  {モーション名: [モーション値, ヒット数]}
 *  錬気ゲージ点滅: 斬れ味*1.13
 *  白ゲージ: モーション値*1.05
 *  黄ゲージ: モーション値*1.1
 *  赤ゲージ: モーション値*1.3 */
const LS_DICT = {
    '踏込斬り': [26, 1],
    '縦斬り': [23, 1],
    '突き': [14, 1],
    '斬り上げ': [18, 1],
    '斬り下がり・左右移動斬り': [24, 1],
    '気刃斬り1（錬気不足）': [16, 1],
    '気刃斬り1': [28, 1],
    '気刃斬り2': [32, 1],
    '気刃斬り3': [60, 3], //12+14+34
    '気刃大回転斬り': [42, 1],
    '気刃踏込斬り(錬気不足)': [18, 1],
    '気刃踏込斬り': [30, 1],
    'ジャンプ斬り': [26, 1],
    'ジャンプ気刃斬り': [30, 1],
    'ジャンプ気刃２連斬り': [12+36, 2]
}

/** 片手剣
 * {モーション名: [モーション値, ヒット数]} */
const SnS_DICT = {
    '【抜刀】突進斬り': [18, 1],
    '斬り上げ': [14, 1],
    '斬り下ろし': [14, 1],
    '横斬り': [13, 1],
    '剣盾コンボ': [30, 2], // 10+20 気絶値 15 減気値15
    '水平斬り': [21, 1],
    '斬り返し': [19, 1],
    '盾攻撃': [8, 1],
    'バックナックル': [16, 1],
    'ガード攻撃': [14, 1],
    '溜め斬り': [57, 2], // 20 + 37 気絶値 15 減気値25
    'ジャンプ斬り': [20, 1],
    'ジャンプ突進斬り': [20, 1],
    'ジャンプ斬り上げ': [18, 1]
}

/** 双剣 
 *  {モーション名:[0モーション値配列, 1ヒット数, 2鬼人化フラグ, 3両手モーションフラグ]} 
 *  モーション値にかけ算を含むものは両手攻撃 
 *  鬼人化フラグ: 通常状態のみ:0, 鬼人化でも使える:1 鬼人化専用:2
 *  両手モーションフラグ: 通常:0, 両手:1 */
const DB_DICT = {
    '[抜刀]斬り払い': [[7,7,7,7], 4, 1, 1], // 28 32
    '鬼人突進連斬':[[7,7,7,7,9,9], 6, 2, 1], // 46 52
    '斬り上げ': [[18], 1, 1, 0], // 20
    '二段斬り': [[8,12], 2, 0, 0], // 20 
    '斬り返し': [[7,10], 2, 0, 0], // 17
    '車輪斬り': [[10,12,12], 3, 1, 1], // 34 37
    '六連斬り': [[4,8,4,8,11,11], 6, 2, 1], // 46 50 鬼人化専用
    '右二連斬り': [[7,10], 2, 0, 0], // 17
    '左二連斬り': [[9,12], 2, 0, 0], // 21
    '回転斬りα': [[16,6,8], 3, 1, 0], // 30 33
    '回転斬りβ': [[18,6,10], 3, 1, 0], // 34 37
    '鬼人連斬': [[8,8,8,8,6,6,20,20], 6, 0, 1], // 72 
    '乱舞': [[29,4,4,4,4,4,4,4,4,18,18], 11, 2, 1], // 97 105鬼人化専用
    'ジャンプ二連斬り': [[10,13], 2, 1, 0], // 23 25
    '空中回転乱舞': [[12,15,15,12], 4, 1, 0], // 54 60
    '回転乱舞フィニッシュ': [[23,23], 2, 1, 0] // 46 52
}

/** ハンマー 
 *  {モーション名: [モーション値, ヒット数]} */
const HAMMER_DICT = {
    '[抜刀]振り上げ': [20, 1],
    '横振り': [15, 1],
    '縦振り': [42, 1],
    '縦振り連打': [20, 1],
    'アッパー': [90, 1],
    '溜めI': [25, 1],
    '溜めI追加攻撃': [20, 1],
    '溜めII': [40, 1],
    '溜めIII': [91, 2], // 15 + 76
    '回転攻撃': [[20, 10], 6], // 20+10*n nはヒット数、最大6
    'ぶんまわし': [60, 1],
    'ジャンプ攻撃': [42, 1],
    'ジャンプ溜めI': [65, 1],
    'ジャンプ溜めII': [70, 1],
    'ジャンプ溜めIII': [80, 1]
}

const HH_DICT = {
    '[抜刀]前方攻撃':33,
    'ぶん回し':30,
    'ツカ攻撃':10, //斬撃
    '連音攻撃1':12,
    '連音攻撃2':22,
    '後方攻撃':45,
    '叩きつけ1':15,
    '叩きつけ2':45,
    '[抜刀]ジャンプ叩きつけ':36,
    '[抜刀]演奏':35,
    '演奏(前方攻撃後)':20,
    '演奏(ツカ攻撃後)':25,
    '追加演奏(後方)1':40,
    '追加演奏(後方)2':30,
    '追加演奏(左右)':35,
    '自分強化以外の追加演奏初撃':33,
}

/** ランス
 *  {モーション名:モーション値}
 *  攻撃属性: 切断
 *  未実装 特徴:切断と打撃のうち高い方の肉質を計算に使う */
const LANCE_DICT = {
    '[抜刀]抜槍突き': 27,
    '中段突き１・２': 20,
    '中段突き３': 27,
    '上段突き１・２': 22,
    '上段突き３': 27,
    'ガード突き': 20,
    'なぎ払い': 20,
    '盾攻撃': 14, // 気絶値 27, 減気値27
    'ジャンプ突き': 30,
    '突進': 16,
    'フィニッシュ突き': 50,
    '突進ジャンプ突き': 50,
    '振り向き攻撃': 50,
    'キャンセル突き': 22,
    'カウンター突き': 50
}

/** ガンランス */
const GL_DICT = {
    '[抜刀]踏み込み突き上げ': 32,
    '砲撃派生突き上げ': 30,
    '斬り上げ': 28,
    '上方突き': 18,
    '水平突き': 24,
    '叩きつけ': 40,
    'ジャンプ叩きつけ': 44,
    'ジャンプ突き': 25,
    '砲撃': 0,
    '溜め砲撃': 0,
    'フルバースト': 0,
    '竜撃砲': 0
}

/** ガンランスの砲撃ダメージ
 *  {砲撃タイプ: [[Lv1ダメ, 火ダメ], [Lv2ダメ, 火ダメ], ...]} */
const GL_SHELL_TYPES = {
    '通常': [[10, 4], [14, 5], [18, 6], [21, 7], [24, 8]],
    '放射': [[15, 9], [21, 11], [28, 14], [32, 16], [36, 18]],
    '拡散': [[20, 6], [30, 8], [40, 10], [44, 11], [48, 12]],
    '竜撃砲': [[[30,30,30,30], [10,10,10,10]],
              [[35,35,35,35], [11,11,11,11]], 
              [[40,40,40,40], [12,12,12,12]],
              [[45,45,45,45], [13,13,13,13]],
              [[50,50,50,50], [14,14,14,14]]]
}

/** 操虫棍 Insect Glaive
 *  {モーション名:[[通常モーション値], 通常ヒット数, 赤エキスフラグ]}
 *  赤エキスフラグ: 赤エキス時に存在するモーションかどうか。0なら不在, 1なら存在*/
const IG_DICT = {
    '突き': [[15], 1, 0],
    '突き（赤）': [[18, 12], 2, 1],
    'なぎ払い': [[36], 1, 0],
    'なぎ払い（赤）': [[18, 30], 2, 1],
    'なぎ払い斬り上げ派生時（赤）': [[18, 30, 28], 3, 1],
    '[抜刀]飛び込み斬り': [[28], 1, 1],
    '回転斬り': [[20], 1, 1],
    '叩きつけ': [[30], 1, 0], // 赤エキス時は飛燕斬り
    '飛燕斬り（赤）':[[24, 38], 2, 1],
    '連続斬り上げ': [[26, 20], 2, 0],
    '連続斬り上げ（赤）':[[28, 16, 18], 3, 1],
    'けさ斬り': [[24], 1, 0],
    'けさ斬り（赤）': [[16, 26], 2, 1],
    '二段斬り': [[18, 24], 2, 0],
    '二段斬り（赤）':[[16, 14, 28], 3, 1],
    '印当て': [[12], 1, 1],
    'ジャンプ斬り': [[24], 1, 0],
    'ジャンプ斬り（赤）':[[20, 10], 2, 1],
    '猟虫': [[45], 1, 1],
    '虫回転攻撃': [[80], 1, 1]  // 属性補正1.5倍
}

/** スラッシュアックス SA Switch Axe
 *  {モーション名: [0:[モーション値], 1:ヒット数]} */
const SA_DICT = {
    '斧:抜刀:横斬り':[[23], 1],
    '斧:縦斬り':[[40], 1],
    '斧:斬り上げ':[[28], 1],
    '斧:振りまわし(回数分)':[[24], 1], // 振り回しのヒット回数は上限がないからどうしよ
    '斧:なぎ払いフィニッシュ':[[57], 1],
    '斧:突進斬り':[[19], 1],
    '斧:変形斬り':[[30], 1],
    '剣:変形斬り':[[23], 1],
    '剣:抜刀:縦斬り':[[30], 1],
    '剣:斬り上げ':[[25], 1],
    '剣:横切り':[[25], 1],
    '剣:二連斬り':[[28, 36], 2],
    '剣:属性解放突き':[[28], 1],
    '剣:属性解放継続':[[13,13,13,13,13,13], 6], // 1~6ヒットで計算する
    '剣:属性解放任意フィニッシュ':[[50], 1],
    '剣:属性解放フィニッシュ':[[80], 1],
    '剣:ジャンプ斬り':[[30], 1]
}

 /** チャージアックス
  *  [0:[モーション値], 1:ヒット数, 2:榴弾爆発係数, 3:強属性爆発係数, 4:爆発回数] */
const CB_DICT = {
    '【剣】突進斬り': [[22], 1, 0, 0, 0],
    '【剣】牽制斬り': [[14], 1, 0, 0, 0],
    '【剣】チャージ後斬り返し': [[17], 1, 0.02, 2.5, 1],
    '【剣】回転斬り': [[30], 1, 0, 0, 0],
    '【剣】斬り上げ': [[16], 1, 0, 0, 0],
    '【剣】溜め２連斬り': [[30, 20], 2, 0, 0, 0],
    '【剣】盾突き': [[8, 12], 2, 0.05, 2.5, 1],
    '【剣】ジャンプ斬り下ろし': [[22], 1, 0, 0, 0],
    '【斧】叩きつけ': [[47], 1, 0, 0, 0],
    '【斧】斬り上げ': [[40], 1, 0, 0, 0],
    '【斧】縦斬り': [[40], 1, 0, 0, 0],
    '【斧】横斬り': [[20], 1, 0, 0, 0],
    '【斧】属性解放斬りI:ビン有': [[26], 1, 0.05, 3.0, 1],
    '【斧】属性解放斬りII:ビン有': [[18, 80], 2, 0.05, 3.0, 2],
    '【斧】高出力属性解放斬り:ビン有': [[90], 1, 0.1, 4.5, 3],
    // あえて属性強化前のモーション値をかくと 21 83 84
    '【斧】超高出力属性解放斬り:ビン1': [[25, 99, 100], 3, 0.335, 13.5, 1],
    '【斧】超高出力属性解放斬り:ビン2': [[25, 99, 100], 3, 0.335, 13.5, 2],
    '【斧】超高出力属性解放斬り:ビン3': [[25, 99, 100], 3, 0.335, 13.5, 3],
    '【斧】超高出力属性解放斬り:ビン4': [[25, 99, 100], 3, 0.335, 13.5, 4],
    '【斧】超高出力属性解放斬り:ビン5': [[25, 99, 100], 3, 0.335, 13.5, 5],
    '【斧】超高出力属性解放斬り:ビン6': [[25, 99, 100], 3, 0.335, 13.5, 6], 
    '【斧】ジャンプ叩きつけ': [[47], 1, 0, 0, 0],
    '【斧】属性解放斬りI:ビン無': [[14], 1, 0, 0, 0],
    '【斧】属性解放斬II:ビン無': [[14, 47], 2, 0, 0, 0],
    '【斧】高出力属性解放斬り:ビン無': [[40], 1, 0, 0, 0],
    '【斧】超高出力属性解放斬り:ビン無':[[17, 90], 2, 0, 0, 0]
};


//斬れ味の色と補正値のマップ
//物理補正値
const PHYS_SHARP_DICT = {
    '赤' : 0.5,
    '橙' : 0.75,
    '黄' : 1.0,
    '緑' : 1.05,
    '青' : 1.2,
    '白' : 1.32,
    '紫' : 1.45
};

//属性補正値
const ELE_SHARP_DICT = {
    '赤' : 0.25,
    '橙' : 0.5,
    '黄' : 0.75,
    '緑' : 1.0,
    '青' : 1.0625,
    '白' : 1.125,
    '紫' : 1.2
};


/* Functions ******************************************************************/

/** １の位を切り下げ */
function truncate_ones_place(x){
    return Math.floor(x/10) * 10;
}

/** 少数第y位より下を切り捨て
 *  x: 切り捨てられる値
 *  y: 残す位 default=1
 *  例:1.234
 *     yを指定しなければ少数第一位までになる     
 *     1.23 にしたいときは y=2 */
function truncate_decimal_place(x, y=1){
    return Math.floor(x*10**y) / 10**y; 
}

/** 引数を全て加算して返す */
function sum(){
    let x = 0,
        i;
    for(i = 0; i < arguments.length; i++){
        x += arguments[i];
    }
    return x;
}

/** Arrayの全要素を加算して返す */
function sum_array(x){
    let y = 0,
        i;
    for (i = 0; i < x.length; i++){
        y += x[i];
    }
    return y;
}

/** 引数を全て乗算して積を返す */
function mul(){
    let x = 1,
        i;
    for(i = 0; i < arguments.length; i++){
        x *= arguments[i];
    }
    return x;
}

function mul_array(x){
    let y = 1,
        i;
    for (i = 0; i < x.length; i++){
        y *= x[i];
    }
    return y;
}


/** 武器倍率の計算
 * (表示攻撃力 / 武器係数) */
function calc_weapon_magn(atk, weapon_coef){
    return atk / weapon_coef;
}

/** 会心期待値の計算
 ** (1.0 + (会心倍率 - 1.0) * 会心率 / 100.0)
 ** 引数magnを指定すれば会心時の倍率を変えられる */
function calc_affi_exp(affi, magn=1.25){
    return (1.0 + (magn - 1.0) * affi / 100);
}

/** 計算結果のoutput
 *  モーション名|ダメージ（武器毎の強化状態のダメージ）
 *  〇〇斬り   |〇〇
 *  という感じで出力させる。*/
function output_result(clicked_place, dict){
    let result_place = clicked_place.nextAll().children('.result tbody');
    result_place.empty();
    for(k in dict){
        result_place.append(
            '<tr>' + 
            '<td>' + k + '</td>' +
            '<td>' + dict[k] + '</td>' +
            '</tr>');
    }   
}

/* イベント ************************************************************/


// Main
//ページが読み込まれたら動作
$(function(){
    var card_id = 1;  
        

    // 「カードを追加ボタン」が押されたら発動
    function click_add_card(){
        // .cardを追加する時
        // 呼んだカードのコピーを作成
        let card = $(this).parents('.card').clone();
        let input_section = $(this).prevAll('.input');
        // セレクトボックスの値だけcloneしたカードに設定
        card.find('.weapon_types').val(
            input_section.children('.weapon_types')
                .find('option:selected').text());
        card.find('.sharpness').val(
            input_section.children('.sharpness')
            .find('option:selected').text());
        // 呼んだカードのidを記憶
        let called_id = card.attr('id');
        // 新しいカードにidをつける
        card.attr('id', card_id);
        // 追加されたカードは元カードの次に追加
        $('#' + called_id).after(card);
        
        
        // 新しいカードにイベントを設定
        $('#' + card_id + ' .weapon_types').on('change', select_weapon_type);
        $('#' + card_id + ' .skills select').on('change', select_skills);
        $('#' + card_id + ' .calc').on('click', click_calc_botton);   
        $('#' + card_id + ' .add_card').on('click', click_add_card);
        // カードidを更新
        card_id++;
        return false;
    }

    // 武器種が変更されたら動く
    function select_weapon_type(){
        console.log('武器種を変更');
        weapon_class = $(this).parents().find('.weapon');
        
        // 武器種依存のhtmlを隠す
        weapon_class.find('.cob').hide();
        weapon_class.find('.p_type').hide();
        weapon_class.find('.boost_mode').hide();
        weapon_class.find('.sb_full').hide();
        weapon_class.find('.sb_color').hide();
        weapon_class.find('.demon_mode').hide();
        weapon_class.find('.shell_types').hide();
        weapon_class.find('.shelling_lv').hide();
        weapon_class.find('.essences').hide();
        weapon_class.find('.sa_p_types').hide();
        // 武器種ごとに処理
        switch($('option:selected', this).text()){
            case '大剣':
                // 中腹ヒットhtmlを表示
                weapon_class.find('.cob').show();
                break;
            case '太刀':
                // 中腹ヒットhtmlを表示
                weapon_class.find('.cob').show();
                weapon_class.find('.sb_full').show();
                weapon_class.find('.sb_color').show();
                break;
            case 'スラッシュアックス':
                weapon_class.find('.sa_p_types').show();
                break;
            case 'チャージアックス':
                // ビン選択と属性強化状態のselect
                weapon_class.find('.p_type').show();
                weapon_class.find('.boost_mode').show();
                break;
            case '双剣':
                weapon_class.find('.demon_mode').show();
                break;
            case 'ガンランス':
                weapon_class.find('.shell_types').show();
                weapon_class.find('.shelling_lv').show();
                break;
            case '操虫棍':
                weapon_class.find('.essences').show();
                break;
        }

        return false;
    }

    // スキルが選ばれたらlabelの文字色を変える
    function select_skills(){
        if($('option:selected', this).text() == 'なし'){
            // なしが選択されたら文字色を白く
            $(this).prev().css('color', 'white');
        }else{
            $(this).prev().css('color', 'orange');
        }
    }

    // 計算ボタンが押されたら働く
    function click_calc_botton(){
        console.log('計算ボタン');
        let input_section = $(this).prev();
        // 入力値を取得
        // 武器種を取得
        let weapon_type = 
            input_section.find('.weapon_types option:selected').text();
        // 武器倍率を取得
        let weapon_magn = calc_weapon_magn(
            input_section.find('.attack').val(),
            WEAPON_COEF_DICT[weapon_type]);
        // 属性倍率を取得
        let ele_val = Number(input_section.find('.element').val());
        // 会心率を取得
        let affinity = Number(input_section.find('.affinity').val());
        // 斬れ味物理補正値を取得
        let phys_sharp_magn = PHYS_SHARP_DICT[
            input_section.find('.sharpness option:selected').text()
        ];
        //斬れ味属性補正値を取得
        let ele_sharp_magn = ELE_SHARP_DICT[
            input_section.find('.sharpness option:selected').text()
        ];

        // 物理肉質を取得
        let phys_weak = Number(input_section.find('.phys_weak').val());
        // 耐属性を取得
        let ele_weak = Number(input_section.find('.ele_weak').val());
        // 防御率の取得
        let defense_rate = Number(input_section.find('.defense_rate').val());


        /* 加算スキル（武器倍率に加算するスキル）************************************/
        let sum_skills = [];
        // 極限強化・攻撃
        sum_skills.push(Number(
            input_section.find('.honing option:selected').val()));

        // 攻撃up
        sum_skills.push(Number(
            input_section.find('.atk_up option:selected').val()));

        // 無傷（フルチャージ）
        sum_skills.push(Number(
            input_section.find('.peak_performance option:selected').val()));

        // 闘魂（挑戦者）
        let challenger = input_section.find('.challenger option:selected').val().split(',');
        sum_skills.push(Number(challenger[0]));
        affinity += Number(challenger[1]);


        /* 乗算スキル 武器倍率に乗算するスキル *************************************/
        let mul_skills = [];
        // 火事場力（倍率系スキル）
        mul_skills.push(Number(input_section.find('.adrenaline option:selected').val()));

        // 不屈（倍率系スキル）
        mul_skills.push(Number(input_section.find('.fortify option:selected').val()));

        // 演奏攻撃力UP
        mul_skills.push(
            Number(input_section.find('.hh_atk option:selected').val()));
        
        
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
            input_section.find('.artillery option:selected').text();
        let artillery = 
            input_section.find('.artillery option:selected').val().split(',');
        let felyne_bomb_txt = 
            input_section.find('.felyne_bomb option:selected').text();
        let felyne_bomb = 
            input_section.find('.felyne_bomb option:selected').val().split(',');
        
        let artillery_magn = 1;
        switch (weapon_type){
            case 'ガンランス':
                // 砲撃術 * 猫砲撃 少数第2位以下を切り捨てる
                artillery_magn *= 
                    truncate_decimal_place(
                        Number(artillery[0]) * Number(felyne_bomb[0]));
                break;
            case 'チャージアックス':
                // 砲撃術 * 猫砲術 上限1.4
                artillery_magn = Number(artillery[2]) * Number(felyne_bomb[1]);
                if(artillery_magn > 1.4){artillery_magn = 1.4}
                break;
            case 'ライトボウガン':
            case 'ヘヴィボウガン':
                artillery_magn *= Number(artillery[1]) * Number(felyne_bomb[1]);
                break;
        }

    
        /* 会心率UPスキル *******************************************************/
        // 達人
        affinity += Number(input_section.find('.expert option:selected').val());
        
        /** 力の解放
         *  +1: +30
         *  +2: +50*/
        affinity += Number(
            input_section.find('.latent_power option:selected').val());
        
        // 狂竜症克服
        affinity += Number(
            input_section.find('.antivirus option:selected').val());
        
        // 演奏会心UP
        affinity += 
            Number(input_section.find('.hh_affi option:selected').val());


        /* 属性スキル **********************************************************/
        // 表示属性値に乗算 倍率の上限は1.2
        // 単属性強化
        let ind_e_up = 
            input_section.find('.ind_ele_up option:selected').val().split(',');
        
        // 全属性強化
        let e_up = 
            Number(input_section.find('.ele_up option:selected').val());
        
        // 狩猟笛旋律 属性攻撃力強化
        let hh_e_up = 
            Number(input_section.find('.hh_ele option:selected').val());

        let element_up = Number(ind_e_up[0]) * e_up * hh_e_up;
        // element_upが1.2を超えたら1.2にする
        if(element_up > 1.2){element_up = 1.2}
        ele_val = 
            truncate_ones_place(ele_val * element_up) + Number(ind_e_up[1]);
        
        
        /** 会心撃【属性】*/
        let crit_ele_magn = 1;
        if (input_section.find('.crit_element option:selected').val() == '1'){
            // 会心撃【属性】がありの場合
            switch (weapon_type){
                case '大剣':
                    crit_ele_magn = 1.2;
                    break;
                case '片手剣':
                case '双剣':
                case '弓':
                    crit_ele_magn = 1.35;
                    break;
                case 'ライトボウガン':
                case 'ヘヴィボウガン':
                    crit_ele_magn = 1.3;
                default:
                    crit_ele_magn = 1.25;
            }
        }
        

        /* 敵パラメータ補正スキル ************************************************/
        // 痛撃 （肉質へ加算）
        let weakness_exp = Number(
            input_section.find('.weakness_exploit option:selected').val());
        if (phys_weak >= 45){
            //肉質が45%以上なら肉質を+5%
            phys_weak += weakness_exp;
        }

        /* その他スキル *********************************************************/
        /** 未実装スキル
         *  匠
         *  抜刀会心
         *  抜刀減気
         *  属性解放
         *  薬・護符・爪
         */

        // 加算スキルを武器倍率に加算
        weapon_magn += sum_array(sum_skills);
        // 乗算スキルを武器倍率に乗算
        weapon_magn *= mul_array(mul_skills);
        // 属性倍率を計算
        let ele_magn = ele_val / 10;
        // 会心期待値を計算
        let affi_exp = calc_affi_exp(affinity);
        // 属性会心期待値の計算
        let crit_ele_exp = calc_affi_exp(affinity, crit_ele_magn);

        // 肉質と耐属性を100で割る
        phys_weak /= 100;
        ele_weak /= 100;
        defense_rate /= 100;

        // damage_dict = {モーション名: [物理ダメージ, 属性ダメージ, etc...]}
        let damage_dict = {};
        
        // 武器種別に計算をする
        switch(weapon_type){
            case '大剣':
                // 中腹ヒット倍率を斬れ味補正にかける
                phys_sharp_magn *= Number(input_section
                    .find('.center_of_blade option:selected').val());
                for(motion in GS_DICT){
                    damage_dict[motion] = [];
            
                    let motion_val = GS_DICT[motion] / 100;
                    // モーションごとの補正を入れる
                    if(motion.match(/溜め1/) || motion == '強なぎ払い1'){
                        //(強)溜め1 と 強なぎ払い1 はモーション値を1.1倍
                        motion_val *= 1.1;
                    }else if(motion.match(/溜め2/) || motion == '強なぎ払い2'){
                        //(強)溜め2 と 強なぎ払い2 はモーション値を1.2倍
                        motion_val *= 1.2;
                    }else if(motion.match(/溜め3/) || motion == '強なぎ払い3'){
                        //(強)溜め3 と 強なぎ払い3 はモーション値を1.3倍
                        motion_val *= 1.3;
                    }
            
                    // モーションごとの属性値補正を入れる
                    let element = ele_magn;
                    switch(motion){
                        case '溜め1':
                            element *= 1.2;
                            break;
                        case '溜め2':
                            element *= 1.5;
                            break;
                        case '溜め3':
                            element *= 2.0;
                            break;
                        case '強溜め1':
                            element *= 1.8;
                            break;
                        case '強溜め2':
                            element *= 2.25;
                            break;
                        case '強溜め3':
                            element *= 3.00;
                            break;
                    }
            
                    // 物理ダメージ計算
                    damage_dict[motion].push(
                        mul(weapon_magn, motion_val, affi_exp,     phys_sharp_magn, phys_weak));
            
                    // 属性ダメージ計算
                    damage_dict[motion].push(
                        mul(element, ele_sharp_magn, ele_weak, crit_ele_exp));
                }
                break;

            case '太刀':
                // 斬れ味に乗算 中腹ヒットと錬気ゲージ点滅
                phys_sharp_magn *= Number(input_section
                .find('.center_of_blade option:selected').val());
                phys_sharp_magn *= Number(input_section
                    .find('.sb_full select option:selected').val());
                
                // 錬気ゲージ色倍率 モーションに乗算（端数切捨）
                let sb_color = Number(input_section
                    .find('.sb_color select option:selected').val());
                
                // モーションごとにダメージを計算
                for(m in LS_DICT){
                    damage_dict[m] = [];
                    // 錬気ゲージ色倍率をモーションに掛ける
                    let motion_val = Math.floor(LS_DICT[m][0] * sb_color) / 100;

                    // 物理ダメ計算
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak));

                    // 属性ダメ計算
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, LS_DICT[m][1], ele_weak, crit_ele_exp));
                }
                break;
            
            case '片手剣':
                // 片手剣は常時は斬れ味補正 *1.06
                phys_sharp_magn *= 1.06;
                for(m in SnS_DICT){
                    damage_dict[m] = [];
                    let motion_val = SnS_DICT[m][0] / 100;

                    // 溜め斬りは属性値 * 2
                    let element;
                    if(m == '溜め斬り'){
                        element = ele_magn * 2;
                    }else{
                        element = ele_magn;
                    }

                    // 物理ダメージ
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak));

                    // 属性ダメージ
                    damage_dict[m].push(
                        mul(element, ele_sharp_magn, SnS_DICT[m][1], ele_weak, crit_ele_exp));
                }
                break;
            
            case '双剣':
                // 鬼人化時: モーション値*1.15（端数切捨て）(鬼人強化では変化なし)
                // 両手攻撃: 属性値*0.7 (モーション値に乗算を含むもの)
                let demon = input_section
                    .find('.demon_mode select option:selected').val();
                let demon_flag = input_section
                    .find('.demon_mode select option:selected').text();
                
                switch(demon_flag){
                    // 鬼人化状態のダメージ
                    case 'あり':
                        for(m in DB_DICT){
                            damage_dict[m] = [];
                            let element;
                            // 鬼人化専用と鬼人化共用のモーションに*1.15(切捨)
                            if ((DB_DICT[m][2] == 1) || (DB_DICT[m][2] == 2)){
                                let m_arr = [],
                                    i;
                                for(i = 0; i < DB_DICT[m][0].length; i++){
                                    m_arr.push(Math.floor(DB_DICT[m][0][i] * 1.15));
                                }
                                let motion_val = sum_array(m_arr) / 100;

                                // 物理
                                damage_dict[m].push(
                                    mul(weapon_magn, motion_val, affi_exp,
                                        phys_sharp_magn, phys_weak));
                                // 属性 両手モーションなら属性値*0.7
                                if(DB_DICT[m][3] == 1){
                                    element = ele_magn * 0.7;
                                }else{
                                    element = ele_magn;
                                }
                                damage_dict[m].push(
                                    mul(element, ele_sharp_magn, DB_DICT[m][1],     ele_weak, crit_ele_exp));
                            }
                        }
                        break;
                    case 'なし':
                        for(m in DB_DICT){
                            damage_dict[m] = [];
                            let element;
                            let motion_val = sum_array(DB_DICT[m][0]) / 100;
                            // 通常状態のみと鬼人化共用のモーションだけ
                            if ((DB_DICT[m][2] == 0) || (DB_DICT[m][2] == 1)){
                                damage_dict[m].push(
                                    mul(weapon_magn, motion_val, affi_exp,
                                        phys_sharp_magn, phys_weak));
                                // 属性 両手モーションは属性値*0.7
                                if(DB_DICT[m][3] == 1){
                                    element = ele_magn * 0.7;
                                }else{
                                    element = ele_magn;
                                }
                                damage_dict[m].push(
                                    mul(element, ele_sharp_magn, DB_DICT[m][1],     ele_weak, crit_ele_exp));
                            }
                        }
                        break;
                }
                break;
            
            case 'ハンマー':
                for(m in HAMMER_DICT){
                    if(m == '回転攻撃'){
                        // モーション値を取得
                        let mv = HAMMER_DICT[m][0][0];
                        for(let i = 1; i < HAMMER_DICT[m][1]+1; i++){
                            // 回転攻撃は1回転~6回転目まで１個ずつ計算
                            damage_dict[m+i] = [];
                            // 物理ダメ
                            damage_dict[m+i].push(
                                mul(weapon_magn, mv / 100, affi_exp, 
                                    phys_sharp_magn, phys_weak));
                            // 属性ダメ
                            damage_dict[m+i].push(
                                mul(ele_magn, ele_sharp_magn, i,
                                    ele_weak, crit_ele_exp));
                            mv += HAMMER_DICT[m][0][1];
                            
                        }
                    }else{
                        damage_dict[m] = [];
                        // 物理ダメ
                        damage_dict[m].push(
                            mul(weapon_magn, HAMMER_DICT[m][0]/100, affi_exp, 
                                phys_sharp_magn, phys_weak));
                        // 属性ダメ
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, HAMMER_DICT[m][1],
                                ele_weak, crit_ele_exp));
                    }
                }
                break;
            case '狩猟笛':
                for(m in HH_DICT){
                    damage_dict[m] = [];
                    // 物理ダメ
                    damage_dict[m].push(
                        mul(weapon_magn, HH_DICT[m]/100, affi_exp, phys_sharp_magn, phys_weak));
                    
                    // 属性ダメ
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, crit_ele_exp));
                }
                break;
            case 'ランス':
                // 未実装 切断と打撃肉質のうち大きい方を計算に使う
                for(m in LANCE_DICT){
                    damage_dict[m] = [];
                    let motion_val = LANCE_DICT[m] / 100;
                    // 物理
                    damage_dict[m].push(
                        mul(weapon_magn, motion_val, affi_exp, 
                            phys_sharp_magn, phys_weak));
                    // 属性
                    damage_dict[m].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, crit_ele_magn));
                }
                break;
            case 'ガンランス':
                // 砲撃タイプを取得
                let shell_type = input_section
                    .find('.shell_types select option:selected').text();
                // 砲撃レベルを取得
                let lv = Number(input_section
                    .find('.shelling_lv select option:selected').val());
                
                // 砲撃タイプ毎に各砲撃の倍率を設定
                // charged shelling, full burst, wyvern's fire
                let cs, fb, wf; 
                switch(shell_type){
                    case '通常':
                        cs = 1.2;
                        fb = 1.1;
                        wf = 1.0;
                        break;
                    case '放射':
                        cs = 1.2;
                        fb = 1;
                        wf = 1.2;
                        break;
                    case '拡散':
                        cs = 1.44;
                        fb = 0.9;
                        wf = 1;
                        break;
                }

                /** 砲撃ダメージの計算 
                 *  切捨(砲撃の基本ダメ * 切捨(切捨(砲撃術 * 猫の砲撃術) * 砲撃タイプ倍率)) + 砲撃の火ダメ
                 *  （未確定）砲撃の火ダメージ: 砲撃基本火ダメ * (未対応)耐火属性
                 *  各乗算で端数切り捨て */
                for(m in GL_DICT){
                    switch (m){
                        case '砲撃':
                            damage_dict[m] = [];
                            damage_dict[m].push(
                                Math.floor(
                                    GL_SHELL_TYPES[shell_type][lv][0]
                                    * artillery_magn)
                                + (GL_SHELL_TYPES[shell_type][lv][1]
                                    * ele_weak));
                            
                            break;
                        case '溜め砲撃':
                            damage_dict[m] = [];
                            damage_dict[m].push(
                                Math.floor(Math.floor(
                                    GL_SHELL_TYPES[shell_type][lv][0]
                                    * artillery_magn)
                                * cs)
                                + GL_SHELL_TYPES[shell_type][lv][1]
                                    * ele_weak);
                            break;
                        case 'フルバースト':
                            // フルバーストの装填数1~6(6は装填数UP)まで計算する
                            for(let i = 1; i < 7; i++){
                                damage_dict[m+i] = [];
                                damage_dict[m+i].push((
                                    Math.floor(Math.floor(
                                        GL_SHELL_TYPES[shell_type][lv][0]
                                        * artillery_magn)
                                    * fb)
                                    + (GL_SHELL_TYPES[shell_type][lv][1])
                                        * ele_weak)
                                    * i);
                            }
                            break;
                        case '竜撃砲':
                            damage_dict[m] = [];
                            let d = 0,
                                fd = 0;
                            for(let i = 0; i < 4; i++){
                                // 砲撃基本ダメージの計算
                                d += (Math.floor(Math.floor(
                                    GL_SHELL_TYPES['竜撃砲'][lv][0][i]
                                    * artillery_magn)
                                * wf));
                                // 砲撃火属性ダメージの計算
                                fd += (GL_SHELL_TYPES['竜撃砲'][lv][1][i]
                                        * ele_weak);
                            }
                            damage_dict[m].push(d+fd);
                            break;
                        default:
                            damage_dict[m] = [];
                            // 物理
                            damage_dict[m].push(
                                mul(weapon_magn, GL_DICT[m] / 100, affi_exp, 
                                    phys_sharp_magn, phys_weak));
                            
                            // 属性
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, 
                                    ele_weak, crit_ele_magn));
                            break;
                    }
                }
                break;
            

            case 'スラッシュアックス':
                // 強撃と強属性ビン以外は未対応
                // ビンタイプを取得
                let phial = Number(input_section
                    .find('.sa_p_types select option:selected').val());
                if(phial==1.2){
                    // 強撃ビンの場合
                    for(m in SA_DICT){
                        damage_dict[m]=[];
                        // phailをかけて端数を切り捨てたモーション値を格納
                        let m_arr = []; 
                        // 各モーション値に強撃ビン倍率をかけ、端数を切捨て
                        for(let i = 0; i < SA_DICT[m][0].length; i++){
                            m_arr.push(Math.floor(SA_DICT[m][0][i]) * phial);
                        }

                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(m_arr) / 100, affi_exp,
                                phys_sharp_magn, phys_weak));
                        // 属性
                        damage_dict[m].push(
                            mul(ele_magn, phial, ele_weak, ele_sharp_magn, crit_ele_exp, SA_DICT[m][1]));
                    }
                      
                }else{
                    // 強属性ビン
                    ele_magn = Math.floor(ele_magn * phial);
                    for(m in SA_DICT){
                        damage_dict[m] = [];
                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(SA_DICT[m][0]) / 100,
                                affi_exp, phys_sharp_magn, phys_weak));
                        //属性
                        damage_dict[m].push(
                            mul(ele_magn, phial, ele_weak, ele_sharp_magn, crit_ele_exp, SA_DICT[m][1]));
                    }
                }
                break;

            
            case 'チャージアックス':
                /** ビン爆発ダメージ計算
                 *  (武器倍率 * 榴弾or強属性ビン係数) * 爆発回数 
                 *  damage_dict {モーション名:
                 *      [物理ダメージ, 属性ダメージ, ビン爆発ダメージ]} */
                // ビンタイプを取得
                let phials_type = $(this).prev()
                    .find('.phials_types option:selected').text();
                // 属性強化倍率を取得
                let boost = Number(input_section
                    .find('.boost_mode select option:selected').val());

                // 属性強化状態かどうかで処理を分ける
                if(boost == 1.2){
                    //属性強化状態
                    // 属性強化状態の処理
                    for(m in CB_DICT){
                        damage_dict[m] = [];
                        let motion_val;
                        if (m.match(/超高出力/) || m.match(/【剣】/) && !m.match(/盾突き/)){
                            // 超高出力と、盾突きを除く剣モーションは属性強化倍率を掛けない
                            motion_val = sum_array(CB_DICT[m][0]) / 100;
                        }else{
                            // モーション値に属性強化倍率をかける(端数切捨)
                            let m_arr = [];
                            for (let i = 0; i < CB_DICT[m][0].length; i++){
                                m_arr.push(
                                    Math.floor(CB_DICT[m][0][i] * boost));
                            }
                            motion_val = sum_array(m_arr) / 100;
                        }

                        // 物理ダメージ
                        damage_dict[m].push(
                            mul(weapon_magn, motion_val, affi_exp,
                                phys_sharp_magn, phys_weak));

                        // 属性ダメージ
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, ele_weak, 
                                CB_DICT[m][1], crit_ele_exp));
                        
                        // 属性強化状態のビン爆発ダメージ
                        // damage_dict[motion]の4要素目に格納
                        switch(phials_type){
                            case '榴弾ビン':
                                if (m.match(/盾突き/) 
                                    || m.match(/チャージ後斬り返し/)){
                                    // 盾突きとチャージ後切り返しは属性強化ビン倍率を掛けない
                                    damage_dict[m].push(
                                        mul(weapon_magn, CB_DICT[m][2],
                                            CB_DICT[m][4]));
                                }else{
                                    damage_dict[m].push(
                                        mul(weapon_magn,
                                            CB_DICT[m][2] * 1.3,
                                            CB_DICT[m][4]));
                                }
                                break;
                            case '強属性ビン':
                                if (m.match(/盾突き/)
                                    || m.match(/チャージ後斬り返し/)){
                                    // 盾突きとチャージ後切り返しは属性強化ビン倍率を掛けない
                                    damage_dict[m].push(
                                        mul(ele_magn, CB_DICT[m][3],
                                            CB_DICT[m][4], ele_weak));
                                }else{
                                    damage_dict[m].push(
                                        mul(ele_magn, CB_DICT[m][3] * 1.35,
                                            CB_DICT[m][4], ele_weak));
                                }
                                break;
                        }
                    }
                }else{
                    //通常状態
                    // 非属性強化状態
                    for(m in CB_DICT){
                        damage_dict[m] = [];
                        let motion_val = sum_array(CB_DICT[m][0]) / 100;
                        
                        // 武器ダメージ
                        if(m.match(/超高出力/)){
                            // 超高出力なら0
                            damage_dict[m].push(0);
                        }else{
                            // 物理ダメージ
                            damage_dict[m].push(
                                mul(weapon_magn, motion_val, affi_exp, 
                                    phys_sharp_magn, phys_weak));
                            
                            // 属性ダメージ
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, ele_weak,         CB_DICT[m][1], crit_ele_exp));
                        }
                        
                        //ビンダメージ
                        switch(phials_type){
                            case '榴弾ビン':
                                if (m.match(/盾突き/)
                                    || m.match(/チャージ後斬り返し/)){
                                    // 盾突きとチャージ後斬り返しは0
                                    damage_dict[m].push(0);
                                }else{
                                    damage_dict[m].push(
                                        mul(weapon_magn, CB_DICT[m][2],
                                            CB_DICT[m][4], artillery_magn));
                                }
                                break;
                            case '強属性ビン':
                                if (m.match(/盾突き/)
                                    || m.match(/チャージ後斬り返し/)){
                                    damage_dict[m].push(0);
                                }else{
                                    damage_dict[m].push(
                                        mul(ele_magn, CB_DICT[m][3],
                                            CB_DICT[m][4], ele_weak));
                                }
                                break;
                        }
                    }
                }
                break;    
            

            case '操虫棍':
                // 赤白エキス モーション値*1.2 
                // 赤白橙エキス モーション値*1.25
                let essences = Number(input_section.find('.essences select option:selected').val());
                if(essences > 1){
                    // エキスが選択された時は赤エキス時に存在するモーションだけ計算
                    for(m in IG_DICT){
                        damage_dict[m] = [];
                        if(IG_DICT[m][2]){
                            // 物理
                            damage_dict[m].push(
                                mul(weapon_magn, essences, sum_array(IG_DICT[m][0]) / 100, affi_exp, phys_sharp_magn, phys_weak));
                            // 属性
                            damage_dict[m].push(
                                mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn));
                        }
                    }
                }else{
                    for(m in IG_DICT){
                        damage_dict[m] = [];
                        // 物理
                        damage_dict[m].push(
                            mul(weapon_magn, sum_array(IG_DICT[m][0])/100, affi_exp,phys_sharp_magn, phys_weak));
                        // 属性
                        damage_dict[m].push(
                            mul(ele_magn, ele_sharp_magn, IG_DICT[m][1], ele_weak, crit_ele_magn));
                    }}
                break;


            
        }

        // 合計ダメージの計算
        // sum_damage_dict = {モーション名: 合計ダメージ}
        let sum_damage_dict = {};
        for(m in damage_dict){
            // 端数切捨(端数切捨(物理+属性+etc) * 防御率)
            sum_damage_dict[m] = Math.floor(
                Math.floor(sum_array(damage_dict[m])) * defense_rate);
        }

        //計算結果の出力
        output_result($(this), sum_damage_dict);
        return false;
    }

    // 最初のカードにイベントを設定
    $('#0 .weapon_types').on('change', select_weapon_type);
    $('#0 .calc').on('click', click_calc_botton);   
    $('#0 .add_card').on('click', click_add_card);
    $('#0 .skills select').on('change', select_skills);
});

