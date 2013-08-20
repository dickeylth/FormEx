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
var storage = chrome.storage.local;

//  href, get url without query
var href = window.location.href.split('?')[0];

/**
 * 汇总api
 * @type {{snapshot: Function, recovery: Function, autofill: Function}}
 */
var apis = {
    /**
     * 公用过滤输入节点的方法
     * @returns {{}}
     */
    filterNodes: function(){
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

                var typeObj = filtedInputs[tagName][inpType];
                var key = (id && ("#" + id)) || (name && ("input[name=" + name + "]"));
                if(!typeObj){
                    typeObj = {};
                    typeObj[key] = {};
                }

                if(inpType == 'checkbox'){

                    // 对于checkbox，收集所有选中的value
                    if($item.prop('checked')){

                        if($.isEmptyObject(typeObj[key])){
                            // 还没有该类型的键值对
                            var val = id ? $item : [$item];
                            typeObj[key] = val;
                        }else{
                            // 已有此键值对数组，直接放入
                            if(id){
                                typeObj[key] = $item;
                            }else{
                                typeObj[key].push($item);
                            }

                        }

                    }

                }else if(inpType == 'radio'){

                    // 对于radio，只保留第一个被选中的值即可
                    if($item.prop('checked')){
                        typeObj[key] = $item;
                    }

                }else{

                    // 对于普通input，根据type及id存放到对应的映射数组中
                    if($.trim($item.val()) != ''){
                        typeObj[key] = $item;
                    }
                }
                // 非引用，需赋回值
                filtedInputs[tagName][inpType] = typeObj;
            }else{
                // 对于select和textarea，优先按id保存值

                if(id){
                    filtedInputs[tagName]["#" + id] = $item;
                }else if(name){
                    filtedInputs[tagName][tagName + "[name=" + name + "]"] = $item;
                }
            }

        });
        return filtedInputs;
    },

    /**
     * recusively transform filtedNodes into its value
     * @param filtedNodes
     * @returns {*}
     */
    transNodeToVal: function(filtedNodes){

        var self = arguments.callee;

        $.each(filtedNodes, function(idx, item){
            if(!(item instanceof $)){
                self.call(this, item);
            }else{
                filtedNodes[idx] = $.trim(item.val());
            }
        });

        return filtedNodes;
    },

    transValToNode: function(storedData){

        var self = arguments.callee;

        $.each(storedData, function(selector, value){

            var valueType = $.type(value);

            if(valueType === "string" || valueType === "array"){

                var $item = $(selector);
                var tagName = $item.prop('tagName').toLowerCase();
                var type = $item.prop('type');

                if(valueType === "string"){

                    if(tagName == 'input'){

                        if(type == 'radio'){
                            $item.filter('[value=' + value + ']').click();
                        }else{
                            $item.val(value);
                        }

                    }
                }else if(valueType === "array"){

                    if(tagName == 'input' && type == 'checkbox'){
                        $.each(value, function(val){
                            $item.filter('[value=' + val + ']').click();
                        });
                    }
                }

            }else{
                self.call(this, value);
            }
        });
    },

    /**
     * 创建快照
     */
    snapshot: function(){

        var filtedNodes = apis.filterNodes();
        var filtedValues = apis.transNodeToVal(filtedNodes);
        console.log(filtedValues);

        var obj = {};
        obj[href] = filtedValues;

        storage.set(obj);
        return "成功创建快照！";
    },

    /**
     * 快照恢复
     */
    recovery: function(){

        return storage.get(href, function(storedData){
            storedData = storedData[href];
            if(storedData){
                console.log(storedData);

                apis.transValToNode(storedData);


                return "快照已成功恢复！";
            }else{
                return "对不起，当前页面尚未创建过快照！";
            }
        });

    },

    /**
     * 自动填充
     */
    autofill: function(){

    }
};



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? "来自内容脚本：" + sender.tab.url : "来自扩展程序");
    /*if (request.greeting == "您好"){
        sendResponse({farewell: "再见"});
    }*/
    console.log(request.action);

    var msg = apis[request.action].call();

    sendResponse({msg: msg});
});