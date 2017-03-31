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
    'rgb(255, 0, 0)'    : 0.5, //赤
    'rgb(255, 153, 0)'  : 0.75, //橙
    'rgb(255, 255, 0)'  : 1.0, //黄
    'rgb(0, 255, 0)'    : 1.05, //緑
    'rgb(68, 136, 255)' : 1.2, //青
    'rgb(255, 255, 255)': 1.32, //白
    'rgb(204, 68, 255)' : 1.45 //紫
};

//属性補正値
const ELE_SHARP_DICT = {
    'rgb(255, 0, 0)'    : 0.25, //赤
    'rgb(255, 153, 0)'  : 0.5, //橙
    'rgb(255, 255, 0)'  : 0.75, //黄
    'rgb(0, 255, 0)'    : 1.0, //緑
    'rgb(68, 136, 255)' : 1.0625, //青
    'rgb(255, 255, 255)': 1.125, //白
    'rgb(204, 68, 255)' : 1.2 //紫
};

//斬れ味メニューのhtml
const SHARPNESS_MENU = 
    '<ul class="sharpness_menu">' + 
        '<li>' +
            '<ul class="child">' +
                '<li style="background-color:#FF0000"></li>' +
                '<li style="background-color:#FF9900"></li>' +
                '<li style="background-color:#FFFF00"></li>' +
                '<li style="background-color:#00FF00"></li>' +
                '<li style="background-color:#4488FF"></li>' +
                '<li style="background-color:#FFFFFF"></li>' +
                '<li style="background-color:#CC44FF"></li>' +
            '</ul>' + 
        '</li>' + 
    '</ul>';

//ドロップダウンメニューだとわかりやすくするためのトリガー用のhtml
const MENU_TRIGGER = '<span class="trigger_panel"><span class="trigger"></span></span>';



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
    card = $('.card')

    //
    //斬れ味ドロップダウンメニューの追加
    //

    // メニューの追加
    $('.sharpness').append(SHARPNESS_MENU);
    
    // メニュートリガーの追加
    $('.sharpness').append(MENU_TRIGGER);

    // 斬れ味リストとトリガーのアニメーション
    $('.sharpness_menu,.trigger_panel').click(function(){
        $('.trigger').toggleClass('close');
        if($('ul.child').is(':hidden')){
            $('ul.child').slideDown(300);
        }else{
            $('ul.child').slideUp(300);
        }
    });

    // 切れ味のドロップダウンリストをクリックすると、
    // ul.sharpness_menuの背景色が変更される。
    $('.child li').on('click', function(){
        $('.sharpness_menu').css('background-color', $(this).css('background-color'));
    });

    // 計算と出力
    $('.card').on('click blur keydown keyup keypress change', function(){
        //物理ダメージの計算
        phys_dmg = phys_dmg_calc($('.attack').val(),
                                 WEAPON_TYPES[$('select.weapon_types option:selected').text()],
                                 $('.affinity').val(),
                                 PHYS_SHARP_DICT[$('.sharpness_menu').css('background-color')],
                                 $('.phys_weak').val());

        // 属性ダメージの計算
        ele_dmg = ele_dmg_calc($('.element').val(), 
                               ELE_SHARP_DICT[$('.sharpness_menu').css('background-color')],
                               $('.ele_weak').val());
        
        //計算結果の出力
        // 物理と属性ダメは、表示ために小数点第2位までで四捨五入
        $('.phys_dmg').text(to_2_decimal_places(phys_dmg));
        $('.ele_dmg').text(to_2_decimal_places(ele_dmg));

        //物理ダメと属性ダメを合算後に小数点以下を切り捨て
        $('.sum_dmg').text(Math.floor(phys_dmg + ele_dmg));
    });
});





