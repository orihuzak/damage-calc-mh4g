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
 * 武器倍率（補正）= (表示攻撃力 / 武器係数) + (攻撃UPスキル + 護符・爪 + 食事・鬼人薬 + 種・丸薬 + 太刀錬気) * 笛演奏効果 * 火事場力
 * 物理ダメージ = 武器倍率 * (モーション値 / 100) * 会心期待値 * 斬れ味 * (肉質 / 100)
 * 属性ダメージ = 属性倍率 * 斬れ味 * (耐属性 / 100) * ヒット数
 * 合計ダメージ = (物理ダメージ + 属性ダメージ) ＊端数切捨
 * 最終ダメージ = (合計ダメージ * 防御率) ＊端数切捨
***/

//
// Constants
//
                

//武器種と武器係数
const WEAPON_COEF_DICT = {
    '大剣': 4.8,
    '太刀': 3.3,
    '片手剣': 1.4,
    '双剣': 1.4,
    'ハンマー': 5.2,
    '狩猟笛': 5.2,
    'スラッシュアックス': 5.4,
    'チャージアックス': 3.6,
    'ランス': 2.3,
    'ガンランス': 2.3
};


/** 大剣 
 * */
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


/** チャージアックスのビン爆発係数
 *  榴弾ビン: 武器倍率*0.05
 *  高出力榴弾ビン: 武器倍率*0.10
 *  超高出力榴弾ビン: (武器倍率*0.335)*ビンの本数
 *  榴弾ビンのスタン値: 30（属性強化状態は40）
 *  強属性ビン: 属性値*3
 *  高出力強属性ビン: 属性値*4.5
 *  超高出力強属性ビン: (属性値*13.5)*ビンの本数
 *  盾突き・チャージ後斬り返し: 属性値*2.5
 *  属性強化状態の榴弾ビン 1.3倍
 *  属性強化状態の強属性ビン 1.35倍 */

/* チャージアックス：（CB）のモーション名とモーション倍率のマップ
 * [モーション倍率, ヒット数, 榴弾ビン爆発係数, 属性ビン爆発係数, ビン爆発回数]*/
 
const CB_DICT = {
    '【剣】突進斬り': [22, 1, 0, 0, 0],
    '【剣】牽制斬り': [14, 1, 0, 0, 0],
    '【剣】チャージ後斬り返し': [17, 1, 0.02, 2.5, 1],
    '【剣】回転斬り': [30, 1, 0, 0, 0],
    '【剣】斬り上げ': [16, 1, 0, 0, 0],
    '【剣】溜め２連斬り': [30+20, 2, 0, 0, 0],
    '【剣】盾突き': [8+12, 2, 0.05, 2.5, 1],
    '【剣】ジャンプ斬り下ろし': [22, 1, 0, 0, 0],
    '【斧】叩きつけ': [47, 1, 0, 0, 0],
    '【斧】斬り上げ': [40, 1, 0, 0, 0],
    '【斧】縦斬り': [40, 1, 0, 0, 0],
    '【斧】横斬り': [20, 1, 0, 0, 0],
    '【斧】属性解放斬りⅠ（ビン有）': [26, 1, 0.05, 3.0, 1],
    '【斧】属性解放斬りⅡ（ビン有）': [18+80, 2, 0.05, 3.0, 2],
    '【斧】高出力属性解放斬り（ビン有）': [90, 1, 0.1, 4.5, 3],
    '【斧】超高出力属性解放斬り(ビン1)': [25+99+100, 3, 0.335, 13.5, 1],
    '【斧】超高出力属性解放斬り(ビン2)': [25+99+100, 3, 0.335, 13.5, 2],
    '【斧】超高出力属性解放斬り(ビン3)': [25+99+100, 3, 0.335, 13.5, 3],
    '【斧】超高出力属性解放斬り(ビン4)': [25+99+100, 3, 0.335, 13.5, 4],
    '【斧】超高出力属性解放斬り(ビン5)': [25+99+100, 3, 0.335, 13.5, 5],
    '【斧】超高出力属性解放斬り(ビン6)': [25+99+100, 3, 0.335, 13.5, 6],
    '【斧】ジャンプ叩きつけ': [47, 1, 0, 0, 0],
    '【斧】属性解放斬りⅠ（ビン無）': [14, 1, 0, 0, 0],
    '【斧】属性解放斬りⅡ（ビン無）': [14+47, 2, 0, 0, 0],
    '【斧】高出力属性解放斬り（ビン無）': [40, 1, 0, 0, 0],
    '【斧】超高出力属性解放斬り（ビン無）':[17+90, 2, 0, 0, 0]
};

const PHIALS_TYPE_HTML = '<div>\
                            <select class=phials_types>\
                            <option>榴弾ビン</option>\
                            <option>強属性ビン</option>\
                            </select>\
                          </div>';


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

//
// Functions
//

/** １の位を切り下げ */
function truncate_ones_place(x){
    return Math.floor(x/10) * 10;
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

/** 属性倍率の計算
 *  (表示属性値 / 10) */
function calc_ele_magn(ele){ return ele / 10; }


/** 会心期待値の計算
 ** (1.0 + (会心倍率 - 1.0) * 会心率 / 100.0)
 ** 引数magnを指定すれば会心時の倍率を変えられる */
function calc_affi_exp(affi, magn=1.25){
    return (1.0 + (magn - 1.0) * affi / 100);
}

/** 合計ダメージの計算
 *  arguments:
 *      defense_rate,
 *      phys_dmg,
 *      ele_dmg,
 *      others
 *  端数切捨て（端数切捨て(物理ダメージ + 属性ダメージ) * 防御率 / 100) */
function calc_sum_damage(){
    var sum_dmg = 0,
        i;
    for(i = 1; i < arguments.length; i++){
        sum_dmg += arguments[i];
    }
    return Math.floor(Math.floor(sum_dmg) * arguments[0]);
}


/** 計算結果のoutput
 *  モーション名|ダメージ（武器毎の強化状態のダメージ）
 *  〇〇斬り   |〇〇
 *  という感じで出力させる。*/
function output_result(clicked_place, dict){
    let result_place = clicked_place.nextAll().children('.result tbody');
    result_place.empty();
    for(motion in dict){
        result_place.append(
            '<tr>' + 
            '<td>' + motion + '</td>' +
            '<td>' + dict[motion] + '</td>' +
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
        
        // 武器種依存のhtmlを削除
        weapon_class.find('.cob').hide();
        weapon_class.find('.p_type').hide();
        // 武器種ごとに処理
        switch($('option:selected', this).text()){
            case '大剣':
            case '太刀':
                // 中腹ヒットhtmlを表示
                weapon_class.find('.cob').show();
                break;
            case 'チャージアックス':
                // 武器名の次にビン選択htmlを追加
                weapon_class.find('.p_type').show();
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


        /* 乗算スキル **********************************************************/
        let mul_skills = [];
        // 火事場力（倍率系スキル）
        mul_skills.push(Number(input_section.find('.adrenaline option:selected').val()));

        // 不屈（倍率系スキル）
        mul_skills.push(Number(input_section.find('.fortify option:selected').val()));
        
        
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
                artillery_magn *= Number(artillery[0]) * Number(felyne_bomb[0]);
                break;
            case 'チャージアックス':
                if(!(artillery_txt == 'なし') && felyne_bomb_txt == 'なし'){
                    // 砲術スキルだけ発動している場合
                    artillery_magn = Number(artillery[2]);
                }else if(artillery_txt == 'なし' && felyne_bomb_txt == 'あり'){
                    // ネコ砲術だけ発動している場合
                    artillery_magn = Number(felyne_bomb[1]);
                }else if(!(artillery_txt == 'なし') 
                         && felyne_bomb_txt == 'あり'){
                    // 砲術とネコ砲術を重複発動
                    artillery_magn = 1.4;
                }
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


        /* 属性スキル **********************************************************/
        
        // 単属性強化と全属性強化
        let ind_e_text = 
        input_section.find('.ind_ele_up option:selected').text();
        let e_text = input_section.find('.ele_up option:selected').text();
        if(ind_e_text == 'なし' && e_text == 'なし'){
            // なし, なしの場合
            ;   // 何もしない
        }else if(!(ind_e_text == 'なし') && e_text == 'なし'){
            // 全属性強化だけなしの場合
            let ind_ele_up = input_section
                .find('.ind_ele_up option:selected').val().split(',');
            ele_val = truncate_ones_place(
                ele_val * ind_ele_up[0] + Number(ind_ele_up[1]));
        }else if(ind_e_text == 'なし' && e_text == 'あり'){
            // なし, ありの場合
            let ele_up = input_section.find('.ele_up option:selected').val();
            ele_val = truncate_ones_place(ele_val * ele_up);

        }else if(ind_e_text == '+1' && e_text == 'あり'){
            // +1, ありの場合
            ele_val = truncate_ones_place(ele_val * 1.15 + 40);
        }else if(ind_e_text == '+2' && e_text == 'あり'){
            // +2, ありの場合
            ele_val = truncate_ones_place(ele_val * 1.20 + 60);
        }else if(ind_e_text == '+3' && e_text == 'あり'){
            // +3, ありの場合
            ele_val = truncate_ones_place(ele_val * 1.20 + 90);
        }
        
        
        /** 会心撃【属性】 
         *  
        */
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
        // あとでやる

        // 加算スキルを武器倍率に加算
        weapon_magn += sum_array(sum_skills);
        // 乗算スキルを武器倍率に乗算
        weapon_magn *= mul_array(mul_skills);
        // 属性倍率を計算
        let ele_magn = calc_ele_magn(ele_val);
        // 会心期待値を計算
        let affi_exp = calc_affi_exp(affinity);
        // 属性会心期待値の計算
        let crit_ele_exp = calc_affi_exp(affinity, crit_ele_magn);

        // 肉質と耐属性を100で割る
        phys_weak /= 100;
        ele_weak /= 100;
        defense_rate /= 100;

        // damage_dict = {モーション名: [物理ダメージ, 属性ダメージ]}
        let damage_dict = {};
        // sum_damage_dict = {モーション名: 合計ダメージ}
        let sum_damage_dict = {};
        // 武器種別に計算をする
        switch(weapon_type){
            case '大剣':
                // 中腹ヒット倍率を取得
                let center_of_blade =  Number(input_section.find('.center_of_blade option:selected').val());
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
                        mul(weapon_magn, motion_val, center_of_blade, affi_exp,     phys_sharp_magn, phys_weak));
            
                    // 属性ダメージ計算
                    damage_dict[motion].push(
                        mul(element, ele_sharp_magn, ele_weak, crit_ele_exp));
                }
                
                // 物理と属性を加算
                // sum_damage_dict = {モーション名: 合計ダメージ}
                for(m in damage_dict){
                    // 合計ダメージを計算
                    sum_damage_dict[m] = Math.floor(
                        Math.floor(sum_array(damage_dict[m])) * defense_rate);
                }
                break;
            case 'チャージアックス':
                /** {モーション名:[通常ダメージ, 属性強化状態のダメージ, 属性ダメージ,                    通常ビン爆発ダメージ, 属性強化状態のビンダメージ]} */
                // ビンタイプを取得
                let phials_type = $(this).prev()
                    .find('.phials_types option:selected').text();
                // 榴弾ビンと強属性ビンそれぞれの変数を設定
                if(phials_type == '榴弾ビン'){
                    basic_magn = weapon_magn * artillery_magn;
                    phials_coef_address = 2;
                    boost_mode_magn = 1.3;
                }else{
                    basic_magn = ele_magn;
                    phials_coef_address = 3;
                    boost_mode_magn = 1.35;
                };
            
                // モーションdictを１つずつ計算する。
                for(motion in CB_DICT){
                    damage_dict[motion] = [];
                    // 物理ダメージの計算
                    // damage_map[motion]の0要素目に格納
                    damage_dict[motion].push(mul(weapon_magn,
                                                CB_DICT[motion][0] / 100,
                                                affi_exp,
                                                phys_sharp_magn,
                                                phys_weak));
                    
                    // 属性強化状態の物理ダメージ計算
                    // 超高出力と盾突き以外の剣モーションを除く
                    // damage_map[motion]の1要素目に格納
                    if(motion.match(/超高出力/) || motion.match(/【剣】/) && !motion.match(/盾突き/)){
                        damage_dict[motion].push(0);
                    }else{
                        damage_dict[motion].push(
                            mul(weapon_magn,                                                    (CB_DICT[motion][0] / 100) * 1.2,
                                affi_exp,
                                phys_sharp_magn,
                                phys_weak));
                    };
            
                    // 属性ダメージの計算
                    // damage_dict[motion]の2要素目に格納
                    damage_dict[motion].push(
                        mul(ele_magn, ele_sharp_magn, ele_weak, CB_DICT[motion][1],     
                            crit_ele_exp));
            
                    /** ビン爆発のダメージ計算
                     *  (武器倍率 * 榴弾or強属性ビン係数) * 爆発回数 */
                    
                    // 通常状態のビン爆発のダメージを計算
                    // 盾突き・チャージ後切り返しは除く
                    // damage_dict[motion]の3要素目に格納
                    switch(phials_type){
                        case '榴弾ビン':
                            if(motion.match(/盾突き/) || motion.match(/チャージ後斬り返し/)){
                                damage_dict[motion].push(0);
                            }else{
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address],
                                        CB_DICT[motion][4]));
                            }
                            break;
                        case '強属性ビン':
                            if(motion.match(/盾突き/) || motion.match(/チャージ後斬り返し/)){
                                damage_dict[motion].push(0);
                            }else{
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address],
                                        CB_DICT[motion][4],
                                        ele_weak));
                            }
                    }
            
                    // 属性強化状態のビン爆発ダメージ
                    // damage_dict[motion]の4要素目に格納
                    switch(phials_type){
                        case '榴弾ビン':
                            if(motion.match(/超高出力/)){
                                damage_dict[motion].push(0);
                            }else if(motion.match(/盾突き/) 
                                    || motion.match(/チャージ後斬り返し/)){
                                // 盾突きとチャージ後切り返しはboost_mode_magnを掛けない
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address],
                                        CB_DICT[motion][4]));
                            }else{
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address] * boost_mode_magn,
                                        CB_DICT[motion][4]));
                            }
                            break;
                        case '強属性ビン':
                            if(motion.match(/超高出力/)){
                                damage_dict[motion].push(0);
                            }else if(motion.match(/盾突き/)
                                    || motion.match(/チャージ後斬り返し/)){
                                // 盾突きとチャージ後切り返しはboost_mode_magnを掛けない
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address],
                                        CB_DICT[motion][4],
                                        ele_weak)
                                    );
                            }else{
                                damage_dict[motion].push(
                                    mul(basic_magn,
                                        CB_DICT[motion][phials_coef_address] * boost_mode_magn,
                                        CB_DICT[motion][4],
                                        ele_weak)
                                    );
                            }
                            break;
                    }
                };
            
            
                // 各ダメージを加算
                for(damage in damage_dict){
                    sum_damage_dict[damage] = [];
                    // 通常状態のダメージを加算（通常物理 + 属性 + ビン）
                    sum_damage_dict[damage].push(
                        calc_sum_damage(
                            defense_rate,
                            damage_dict[damage][0],
                            damage_dict[damage][2],
                            damage_dict[damage][3]));
                    // 属性強化状態のダメージを加算（属強物理 + 属性 + 属強ビン）
                    if(!damage_dict[damage][1] == 0){
                        // 属性強化状態のダメージが0でないもの
                        sum_damage_dict[damage].push(
                            calc_sum_damage(
                                defense_rate,
                                damage_dict[damage][1],
                                damage_dict[damage][2], 
                                damage_dict[damage][4]));
                    }else if(damage.match(/チャージ後斬り返し/)){
                        // チャージ後切り返しは(通常物理 + 属性 + 属強ビン)
                        sum_damage_dict[damage].push(
                            calc_sum_damage(
                                defense_rate,
                                damage_dict[damage][0],
                                damage_dict[damage][2], 
                                damage_dict[damage][4]));
                    }else{
                        sum_damage_dict[damage].push(0);
                    };
                };
                break;
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

