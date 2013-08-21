/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-21
 * Time: 下午2:24
 * To change this template use File | Settings | File Templates.
 */
console.log(chrome);

// chrome优化的localStorage
var storage = chrome.storage.local;

$('#J_SaveConfig').click(function(){

    var config = {};
    storage.get('config', function(data){
        if(data.config){
            config = data.config;
        }
        $(':input').each(function(idx, item){
            var $node = $(item);
            var val = $.trim($node.val());
            var tagName = $node.prop('tagName').toLowerCase();
            if(val != ''){
                if(tagName == 'input'){
                    var type = $node.prop('type');
                    config['type="' + type + '"'] = val;
                }else if(tagName == 'textarea'){
                    config['textarea'] = val;
                }
            }
        });
        storage.set({'config':config});

        console.log(config);

        alert('保存成功！');
    });

});