// 物理ダメージ計算
function phys_dmg_calc(atk, type_coef, affi, phys_sharp, phys_weak){
    console.log(atk);
    console.log(type_coef);
    console.log(affi);
    console.log(phys_sharp);
    console.log(phys_weak);

    // 丸め
    phys_dmg_pure = (atk / (type_coef /100.0)) * (1.0 + 0.25 * affi / 100.0) * phys_sharp * (phys_weak / 100);
    return Math.round(phys_dmg_pure * 100) / 100;
}

// 属性ダメージ計算
function ele_dmg_calc(ele, ele_sharp, ele_weak){
    return (ele / 10) * ele_sharp * ele_weak;
}

$(function(){
    card = '<form class="card">' +
           '<input id="weapon_name" type="text" value="武器名">' + 
           '<select id="weapon_type">' +
                '<option value=480>大剣</option>' +
                '<option value=330>太刀</option>' +
                '<option value=140>片手剣</option>' +
                '<option value=140>双剣</option>' +
                '<option value=520>ハンマー</option>' +
                '<option value=520>狩猟笛</option>' +
                '<option value=540>スラッシュアックス</option>' +
                '<option value=360>チャージアックス</option>' +
                '<option value=230>ランス</option>' +
                '<option value=230>ガンランス</option>' +
                '<option value=130>ライトボウガン</option>' +
                '<option value=150>ヘヴィボウガン</option>' +
                '<option value=120>弓</option>' +
            '</select>' +
           // 物理ダメージテーブル
           '<table>' +
           '<thead>' +
           // テーブルヘッド 
           '<tr>' +
           '<th>表示力</th>' +
           '<th>会心率</th>' + 
           '<th>斬れ味</th>' +
           '<th>物理肉質</th>' + 
           '<th>期待ダメージ</th>' +
           '</tr>' +
           '</thead>' + 
           // テーブルボディ
           '<tbody>' +
           '<tr>' + 
           '<td><input id="attack" type="text" value=1000 ></td>' +
           '<td><input id="affinity" type="text" value=0 ></td>' +
           '<td id="phys_sharp">' +
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
           '</ul>' + 
           '</td>' +
           '<td><input id="phys_weak" value=100 ></td>' +
           '<td id="phys_dmg"></td>' +
           '</tr>' +
           '</tbody>' +
           '</table>' +
           //属性ダメージテーブル
           '<table class="element">' +
           '<thead>' +
           // テーブルヘッド 
           '<tr>' +
           '<th>属性値</th>' +
           '<th>斬れ味</th>' +
           '<th>属性肉質</th>' + 
           '<th>属性ダメージ</th>' +
           '</tr>' +
           '</thead>' + 
           // テーブルボディ
           '<tbody>' +
           '<tr>' + 
           '<td><input id="element" type="text" value=0 ></td>' +
           '<td><input id="ele_sharp" type="text"></td>' +
           '<td><input id="ele_weak" type="text" value=1 ></td>' +
           '<td id="ele_dmg"></td>' +
           '</tr>' +
           '</tbody>' +
           '</table>' +
           '</form>';
    $(card).appendTo('main');

    //ドロップダウンメニュー
    $('#sharpness_menu li').hover(function(){
        $('ul:not(:animated)', this).slideDown();
    }, function(){
        $('ul.child', this).slideUp();
    });

    //斬れ味の色と補正値のマップ
    phys_sharp_dict = {
        'rgb(255, 0, 0)': 0.5, //赤
        'rgb(255, 153, 0)': 0.75, //橙
        'rgb(255, 255, 0)': 1.00, //黄
        'rgb(0, 255, 0)': 1.05, //緑
        'rgb(68, 136, 255)': 1.2, //青
        'rgb(255, 255, 255)': 1.32, //白
        'rgb(204, 68, 255)': 1.44 //紫
    };

    // 切れ味のドロップダウンリストをクリックすると、
    // <td pyhs_sharp>の背景色が変更される。
    $('.child li').on('click', function(){
        $('#phys_sharp').css('background-color', $(this).css('background-color'));
    });



    $('.card').change(function(){
        //物理ダメージの計算
        phys_dmg = phys_dmg_calc($('#attack').val(),
                                 $('select#weapon_type').val(),
                                 $('#affinity').val(),
                                 phys_sharp_dict[$('#phys_sharp').css('background-color')],
                                 $('#phys_weak').val());

        // 属性ダメージの計算
        ele_dmg = ele_dmg_calc($('#element').val(), 
                               $('#ele_sharp').val(),
                               $('#ele_weak').val());
        console.log('よばれた。');
        $('#phys_dmg').text(phys_dmg);
        $('#ele_dmg').text(ele_dmg);
    });

});





