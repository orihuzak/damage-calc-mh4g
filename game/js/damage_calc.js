$(function(){
    card = '<form class="card" style="background-color:#ff9;">' +
           '<input type="text" value="武器名を入力して下さい。"/>' +
           '<table border="1">' +
           '<thead>' +
           // テーブルヘッド 
           '<tr>' +
           '<th>表示攻撃力</th><th>基本攻撃力</th><th>会心率</th><th>斬れ味補正</th><th>武器係数</th><th>物理肉質</th><th>物理ダメ期待値</th>' +
           '</tr>' +
           '</thead>' + 
           '<tbody>' +
           // テーブルデータ
           '<tr>' + 
           '<td>' + 

           '</td>' +
           '</tr>' +
           '</tbody>' +
           '</table>' +
           '</form>';
    $(card).appendTo('main');
});

