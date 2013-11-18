/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-21
 * Time: 下午2:24
 * To change this template use File | Settings | File Templates.
 */

// chrome优化的localStorage
var storage = chrome.storage.local;

var optApis = {

    load: function(){
        var config = {};
        storage.get('defaultOpts', function(data){
            if(data.defaultOpts){
                config = data.defaultOpts;
            }

            $.each(config, function(query, value){
                $(query).val(value);
            });

            console.log(config);
        });
    },
    save: function(){
        var config = {};
        storage.get('defaultOpts', function(data){
            if(data.defaultOpts){
                config = data.defaultOpts;
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
            storage.set({'defaultOpts':config});

            console.log(config);

            alert('保存成功！');
        });
    }
};

// 加载配置数据
optApis.load();

// 保存配置数据
$('#J_SaveConfig').click(function(){
    optApis.save();
});