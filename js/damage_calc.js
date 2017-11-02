//ダメージ計算ページのjs
//jsのtextには''を使う。html内は""を使う。

/*** 用語
 * 計算:calc calculation
 * 倍率:magn magnification
 * 割合:rate 
 * 係数:coef coefficient
 * 会心値:affi affinity
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

/* チャージアックス：（CB）のモーション名とモーション倍率のマップ
 * [モーション倍率, 属性強化状態のモーション倍率, ヒット数, 榴弾ビン爆発係数, 属性ビン爆発係数, ビン爆発回数] 
 * チャージアックスのビン爆発の計算
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
const CB_MOTION_VALUE = {
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
    '【斧】超高出力属性解放斬り(ビン1)': [25+99+100, 3, 0.335, 13.35, 1],
    '【斧】超高出力属性解放斬り(ビン2)': [25+99+100, 3, 0.335, 13.35, 2],
    '【斧】超高出力属性解放斬り(ビン3)': [25+99+100, 3, 0.335, 13.35, 3],
    '【斧】超高出力属性解放斬り(ビン4)': [25+99+100, 3, 0.335, 13.35, 4],
    '【斧】超高出力属性解放斬り(ビン5)': [25+99+100, 3, 0.335, 13.35, 5],
    '【斧】超高出力属性解放斬り(ビン6)': [25+99+100, 3, 0.335, 13.35, 6],
    '【斧】ジャンプ叩きつけ': [47, 1, 0, 0, 0],
    '【斧】属性解放斬りⅠ（ビン無）': [14, 1, 0, 0, 0],
    '【斧】属性解放斬りⅡ（ビン無）': [14+47, 2, 0, 0, 0],
    '【斧】高出力属性解放斬り（ビン無）': [40, 1, 0, 0, 0],
    '【斧】超高出力属性解放斬り（ビン無）':[17+90, 2, 0, 0, 0]
};

const PHIALS_TYPE_HTML = '<select class="phials_types">\
                          <option>榴弾ビン</option>\
                          <option>強属性ビン</option>\
                          </select>';

/** 砲術師スキル 榴弾のみ
 *  砲術師: 1.3倍
 *  砲術王: 1.35倍
 *  砲術マスター: 1.4倍
 *  猫の砲撃術: 1.15倍
*/

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

/** 小数点第２位までに丸める */
function to_2_decimal_places(n){
    return Math.round(n * 100) / 100;
}


/** 武器倍率の計算
 * (表示攻撃力 / 武器係数) */
function calc_weapon_magn(atk, weapon_coef){
    return (atk / weapon_coef);
}

/** 属性倍率の計算
 *  (表示属性値 / 10) */
function calc_ele_magn(ele){ return ele / 10 };

/** 物理ダメージ計算
 * 武器倍率 * モーション値 / 100 * 会心期待値 * 斬れ味 * 物理肉質/100 */
function calc_phys_dmg(weapon_magn, motion_val, affi, phys_sharp, phys_weak){
    return weapon_magn * motion_val / 100 * calc_affi_exp_val(affi) * phys_sharp * phys_weak / 100;
}

/** 会心期待値の計算
 ** (1.0 + 0.25 * 会心値 / 100.0) */
function calc_affi_exp_val(affi){
    return (1.0 + 0.25 * affi / 100.0);
}

/** 属性ダメージ計算
 ** 属性倍率 * 斬れ味 * (属性肉質/100) */
function calc_ele_dmg(ele_magn, ele_sharp, ele_weak){
    return ele_magn * ele_sharp * (ele_weak / 100);
}

/** 合計ダメージの計算
 *  arguments:
 *      defense_rate,
 *      phys_dmg,
 *      ele_dmg,
 *      others
 *  端数切捨て（端数切捨て(物理ダメージ + 属性ダメージ) * 防御率 / 100) */
function calc_sum_damage(defense_rate){
    var sum_dmg = 0,
        i;
    for(i = 1; i < arguments.length; i++){
        sum_dmg += arguments[i];
    }
    return Math.floor(Math.floor(sum_dmg) * defense_rate / 100);
}


/* チャージアックス *****************************************************/
/** チャージアックスのダメージ計算
 *  damage_dictを返す
 *  {モーション名:[通常ダメージ,
 *               属性強化状態のダメージ,
 *               属性ダメージ,              
 *               通常ビン爆発ダメージ,
 *               属性強化状態のビンダメージ]} */
function calc_cb_damage(motion_dict, phials_type, weapon_magn, ele_magn,                        affinity, phys_sharp_magn, ele_sharp_magn,                              phys_weak, ele_weak, defense_rate){
    let damage_dict = {};
    
    // 榴弾ビンと強属性ビンそれぞれの変数を設定
    if(phials_type == '榴弾ビン'){
        basic_magn = weapon_magn;
        phials_coef_address = 2;
        boost_mode_magn = 1.3;
    }else{
        basic_magn = ele_magn;
        phials_coef_address = 3;
        boost_mode_magn = 1.35;
    };

    // モーションdictを１つずつ計算する。
    for(motion in motion_dict){
        damage_dict[motion] = [];
        // 物理ダメージの計算
        // damage_map[motion]の0要素目に格納
        damage_dict[motion].push(calc_phys_dmg(weapon_magn,
                                               motion_dict[motion][0],
                                               affinity,
                                               phys_sharp_magn,
                                               phys_weak));
        
        // 属性強化状態の物理ダメージ計算
        // 超高出力と盾突き以外の剣モーションを除く
        // damage_map[motion]の1要素目に格納
        if(motion.match(/超高出力/) || motion.match(/【剣】/) && !motion.match(/盾突き/)){
            damage_dict[motion].push(0);
        }else{
            damage_dict[motion].push(
                calc_phys_dmg(weapon_magn,                                            motion_dict[motion][0] * 1.2,
                              affinity,
                              phys_sharp_magn,                          phys_weak));
        };

        // 属性ダメージの計算
        // damage_dict[motion]の2要素目に格納
        damage_dict[motion].push(
            calc_ele_dmg(ele_magn, ele_sharp_magn, ele_weak) * motion_dict[motion][1]);
        
        // 通常状態のビン爆発のダメージを計算
        // 盾突き・チャージ後切り返しは除く
        // damage_dict[motion]の3要素目に格納
        if(motion.match(/盾突き/) || motion.match(/チャージ後斬り返し/)){
            damage_dict[motion].push(0);
        }else{damage_dict[motion].push(
            calc_phials_damage(
                basic_magn,
                motion_dict[motion][phials_coef_address],
                motion_dict[motion][4]));
        };

        // 属性強化状態のビン爆発ダメージ
        // damage_dict[motion]の4要素目に格納
        // 盾突きとチャージ後切り返しはboost_mode_magnを掛けない
        if(motion.match(/超高出力/)){
            damage_dict[motion].push(0);
        }else if(motion.match(/盾突き/) || motion.match(/チャージ後斬り返し/)){
            damage_dict[motion].push(
            calc_phials_damage(
                basic_magn,
                motion_dict[motion][phials_coef_address],
                motion_dict[motion][4]));
        }else{
            damage_dict[motion].push(
            calc_phials_damage(
                basic_magn,
                motion_dict[motion][phials_coef_address] * boost_mode_magn,
                motion_dict[motion][4]));
        };
    };

    // 各ダメージを加算
    let sum_damage_dict = {};
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
        // チャージ後切り返しだけ(通常物理 + 属性 + 属強ビン)
        if(damage.match(/チャージ後斬り返し/)){
            sum_damage_dict[damage].push(
                calc_sum_damage(
                    defense_rate,
                    damage_dict[damage][0],
                    damage_dict[damage][2], 
                    damage_dict[damage][4]));
        }else{
            sum_damage_dict[damage].push(
                calc_sum_damage(
                    defense_rate,
                    damage_dict[damage][1],
                    damage_dict[damage][2], 
                    damage_dict[damage][4]));
        };
    };
    return sum_damage_dict;
};


/** チャージアックス：ビン爆発のダメージ計算
 *  (武器倍率 * 榴弾ビン係数) * 爆発回数
 *  (属性倍率 * 強属性ビン係数) * 爆発回数
*/
function calc_phials_damage(magn, phials_coef, num_of_explosions){
    return (magn * phials_coef) * num_of_explosions;
};


/** 計算結果のoutput
 *  モーション名|ダメージ（武器毎の強化状態のダメージ）
 *  〇〇斬り   |〇〇
 *  という感じで出力させる。*/
function output_result(dict){
    $('.result tbody').empty();
    for(motion in dict){
        $('.result tbody').append('<tr>' + 
                            '<td>' + motion + '</td>' +
                            '<td>' + dict[motion][0] + 
                            '(' + dict[motion][1] + ')' + '</td>' 
                            + '</tr>');
    }   
}


// Main
//ページが読み込まれたら動作
$(function(){
    var motion_dict = {};
    var weapon_type;
    // 武器種が変更されたら動く
    $('.weapon_types').change(function(){
        // 武器種依存のhtmlを削除
        $('.phials_types').remove();
        // 武器種を取得
        weapon_type = $('.weapon_types option:selected').text();
        if (weapon_type == 'チャージアックス'){
            // チャージアックスの場合
            // ビン選択htmlを追加
            $('.weapon_name').after(PHIALS_TYPE_HTML);
            // モーションデータベースを取得
            motion_dict = CB_MOTION_VALUE;
        };
    });
    

    // 計算ボタンが押されたら働く
    $('.calc').click(function(){
        // 入力値を取得
        // 武器倍率を取得
        weapon_magn = calc_weapon_magn($('.attack').val(),                                             WEAPON_COEF_DICT[weapon_type]);
        // 属性倍率を取得
        ele_magn = calc_ele_magn($('.element').val());
        // 会心率を取得
        affinity = $('.affinity').val();
        // 斬れ味物理補正値を取得
        phys_sharp_magn = PHYS_SHARP_DICT[$('.sharpness                                   option:selected').text()];
        //斬れ味属性補正値を取得
        ele_sharp_magn = ELE_SHARP_DICT[$('.sharpness option:selected').text()];
        // 物理肉質を取得
        phys_weak = $('.phys_weak').val();
        // 属性肉質を取得
        ele_weak = $('.ele_weak').val();
        // 防御率の取得
        defense_rate = $('.defense_rate').val();
        
        // 武器別に計算をする
        switch(weapon_type){
            case 'チャージアックス':
                // ビンタイプを取得
                phials_type = $('.phials_types option:selected').text();
                //ダメージ計算
                sum_damage_dict = calc_cb_damage(motion_dict,
                                                 phials_type,                                                            weapon_magn,
                                                 ele_magn,
                                                 affinity,
                                                 phys_sharp_magn,
                                                 ele_sharp_magn,
                                                 phys_weak,
                                                 ele_weak,
                                                 defense_rate);
                //計算結果の出力
                output_result(sum_damage_dict);
                break;
        }; 
        
        //output_result(damage);
        // 物理と属性ダメは、表示ために小数点第2位までで四捨五入
        //$('.phys_dmg').val(to_2_decimal_places(phys_dmg));
        //$('.ele_dmg').val(to_2_decimal_places(ele_dmg));

        //物理ダメと属性ダメを合算後に小数点以下を切り捨て
        //$('.sum_dmg').val(Math.floor(phys_dmg + ele_dmg));
        return false;
    });
});
