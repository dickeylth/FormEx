/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-19
 * Time: 下午12:34
 * To change this template use File | Settings | File Templates.
 */

// 扩展默认隐藏在地址栏了。。需要执行sendMessage触发background.js的监听时间show。。
chrome.runtime.sendMessage({}, function(response) {});

// chrome优化的localStorage
var storage = chrome.localStorage;
console.log(storage);

/**
 * 汇总api
 * @type {{snapshot: Function, recovery: Function, autofill: Function}}
 */
var apis = {

    /**
     * 公用过滤输入节点的方法
     * @returns {{}}
     */
    filterInput: function(){

        var validTags = ['input', 'textarea', 'select'];
        var allInputs = $(validTags.join(',')).filter(':visible');
        var excludeInputs = ['button', 'file', 'hidden', 'image', 'reset', 'submit'];
        var filtedInputs = {};

        $.each(validTags, function(idx, item){
            filtedInputs[item] = {};
        });

        allInputs.each(function(idx, item){

            var $item = $(item);

            // tagName 属性永远返回 UPPERCASE
            var id = $item.prop('id');
            var name = $item.prop('name');
            var tagName = $item.prop('tagName').toLowerCase();
            var inpType = $item.prop('type');
            var value = $.trim($item.val());

            if(tagName == 'input' && inpType && ($.inArray(inpType, excludeInputs) == -1)){


                var checkArr = filtedInputs[tagName][inpType];
                var key = (id && ("id=" + id)) || (name && ("name=" + name));
                if(!checkArr){
                    checkArr = {};
                    checkArr[key] = {};
                }

                if(inpType == 'checkbox'){

                    // 对于checkbox，收集所有选中的value
                    if($item.prop('checked')){

                        if($.isEmptyObject(checkArr[key])){
                            // 还没有该类型的键值对
                            var val = id ? $item.val() : [value];
                            checkArr[key] = val;
                        }else{
                            // 已有此键值对数组，直接放入
                            if(id){
                                checkArr[key] = $item.val();
                            }else{
                                checkArr[key].push(value);
                            }

                        }

                    }

                }else if(inpType == 'radio'){

                    // 对于radio，只保留第一个被选中的值即可
                    if($item.prop('checked')){
                        checkArr[key] = value;
                    }

                }else{

                    // 对于普通input，根据type及id存放到对应的映射数组中
                    if($.trim($item.val()) != ''){
                        checkArr[key] = value;
                    }
                }
                // 非引用，需赋回值
                filtedInputs[tagName][inpType] = checkArr;
            }else{
                // 对于select和textarea，优先按id保存值

                if(id){
                    filtedInputs[tagName]["id=" + id] = value;
                }else if(name){
                    filtedInputs[tagName]["name=" + name] = value;
                }
            }

        });
        return filtedInputs;
    },

    /**
     * 创建快照
     */
    snapshot: function(){
        var filtedInputs = apis.filterInput();
        console.log(filtedInputs);
    },

    /**
     * 数据恢复
     */
    recovery: function(){

    },

    /**
     * 自动填充
     */
    autofill: function(){

    }
}

$(document).ready(function(){
    var inputs = $('input');
    console.log(inputs);
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? "来自内容脚本：" + sender.tab.url : "来自扩展程序");
    /*if (request.greeting == "您好"){
        sendResponse({farewell: "再见"});
    }*/
    console.log(request.action);

    apis[request.action].call();

    sendResponse({msg: "快照已生成！"});
});