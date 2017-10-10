//ダメージ計算ページのjs
//jsのtextには''を使う。html内は""を使う。

//
// Constants
//

//武器種と武器係数
const WEAPON_TYPES = {
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

//小数点第２位までに丸める
function to_2_decimal_places(n){
    return Math.round(n * 100) / 100;
}

// 物理ダメージ計算
// (攻撃力/武器係数) * 会心期待値 * 斬れ味 * (物理肉質/100)
function phys_dmg_calc(atk, type_coef, affi, phys_sharp, phys_weak){
    return (atk / type_coef) * (1.0 + 0.25 * affi / 100.0) *          phys_sharp * (phys_weak / 100);
}

// 属性ダメージ計算
// (属性値/10) * 斬れ味 * (属性肉質/100)
function ele_dmg_calc(ele, ele_sharp, ele_weak){
    return (ele / 10) * ele_sharp * (ele_weak / 100);
}


// Main
$(function(){
    // 計算と出力
    $('.sim').on('click blur keydown keyup keypress change', function(){
        //呼び出しの確認　あとで消す
        console.log($('.sharpness option:selected').text());

        //物理ダメージの計算
        phys_dmg = phys_dmg_calc($('.attack').val(),
                                 WEAPON_TYPES[$('.weapon_types option:selected').text()],
                                 $('.affinity').val(),
                                 PHYS_SHARP_DICT[$('.sharpness option:selected').text()],
                                 $('.phys_weak').val());

        // 属性ダメージの計算
        ele_dmg = ele_dmg_calc($('.element').val(), 
                               ELE_SHARP_DICT[$('.sharpness option:selected').text()],
                               $('.ele_weak').val());
        
        //計算結果の出力
        // 物理と属性ダメは、表示ために小数点第2位までで四捨五入
        $('.phys_dmg').val(to_2_decimal_places(phys_dmg));
        $('.ele_dmg').val(to_2_decimal_places(ele_dmg));

        //物理ダメと属性ダメを合算後に小数点以下を切り捨て
        $('.sum_dmg').val(Math.floor(phys_dmg + ele_dmg));
    });
});





