$(function(){
    /* 採取の種類とアイテムをhtmlに入力する */
    var data = [{interact: "釣り",
                items: ["キレアジ", "ハリマグロ"]},
                ];

    data.forEach(function(v){
        html = "<tr><td>" + v.interact + "</td>";
        html += "<td><ul>";
        for(var i = 0; i < v.items.length; i++){
            html += "<li>" + v.items[i] + "</li>";
        }
        html += "</ul></td></tr>";
        $("#bc tbody").append(html);
    });
  });
