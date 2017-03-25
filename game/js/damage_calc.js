//ダメージ計算ページのjs
//jsのtextには''を使う。html内は""を使う。

//
// Constants
//

//斬れ味メニューのhtml
// *class="色"部分はいるのか？
const SHARPNESS_MENU = 
    '<ul id="sharpness_menu">' + 
        '<li>' +
            '<ul class="child">' +
                '<li class="red" style="background-color:#FF0000"></li>' +
                '<li class="orange" style="background-color:#FF9900"></li>' +
                '<li class="yellow" style="background-color:#FFFF00"></li>' +
                '<li class="green" style="background-color:#00FF00"></li>' +
                '<li class="blue" style="background-color:#4488FF"></li>' +
                '<li class="white" style="background-color:#FFFFFF"></li>' +
                '<li class="purple" style="background-color:#CC44FF"></li>' +
            '</ul>' + 
        '</li>' + 
    '</ul>';

//ドロップダウンメニューだとわかりやすくするためのトリガー用のhtml
const MENU_TRIGGER = '<span class="trigger_panel"><span class="trigger"></span></span>';

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


//
// Functions
//

//小数点第２位までに丸める
function to_2_decimal_places(n){
    return Math.round(n * 100) / 100;
}

// 物理ダメージ計算
function phys_dmg_calc(atk, type_coef, affi, phys_sharp, phys_weak){
    return (atk / (type_coef /100.0)) * (1.0 + 0.25 * affi / 100.0) *          phys_sharp * (phys_weak / 100);
}

// 属性ダメージ計算
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
    $('.sharpness').click(function(){
        $('.trigger', this).toggleClass('close');
        if($('ul.child', this).is(':hidden')){
            $('ul.child', this).slideDown(300);
        }else{
            $('ul.child', this).slideUp(300);
        }
    });

    // 切れ味のドロップダウンリストをクリックすると、
    // その<td>の背景色が変更される。
    $('.child li').on('click', function(){
        $('.sharpness').css('background-color', $(this).css('background-color'));
    });

    $('.card').change(function(){
        //物理ダメージの計算
        phys_dmg = phys_dmg_calc($('#attack').val(),
                                 $('select#weapon_type').val(),
                                 $('#affinity').val(),
                                 PHYS_SHARP_DICT[$('.sharpness').css('background-color')],
                                 $('#phys_weak').val());

        // 属性ダメージの計算
        ele_dmg = ele_dmg_calc($('#element').val(), 
                               ELE_SHARP_DICT[$('.sharpness').css('background-color')],
                               $('#ele_weak').val());
        $('#phys_dmg').text(to_2_decimal_places(phys_dmg));
        $('#ele_dmg').text(to_2_decimal_places(ele_dmg));
    });
});





