/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-19
 * Time: 下午12:34
 * To change this template use File | Settings | File Templates.
 */

// 扩展默认隐藏在地址栏了。。需要执行sendMessage触发background.js的监听时间show。。
chrome.runtime.sendMessage({}, function (response) {
});

// chrome优化的localStorage
var storage = chrome.storage.local;

//  href, get url without query
var href = window.location.href.split('?')[0].split('#')[0];

/**
 * 汇总api
 * @type {{snapshot: Function, recovery: Function, autofill: Function}}
 */
var apis = {

    /**
     * 监听页面事件
     */
    delegateDoc: function(){
        /*$(document).delegate(':input[type!="radio"][type!="checkbox"]', 'change', function(e){
            console.log(e);
            var $target = $(e.currentTarget);
            console.log($target.prop('tagName') + '->' + $target.val());
        }).delegate('input[type="radio"], input[type="checkbox"]', 'click', function(e){
            console.log(e);
            var $target = $(e.currentTarget);
            console.log($target.prop('tagName') + '->' + $target.val());
        }).delegate('a', 'click', function(e){
            console.log(e);
            var $target = $(e.currentTarget);
            console.log($target.prop('tagName') + '->' + $target.val());


            storage.set({'testNode': $target});
        });*/
        $(document).delegate('*', 'click', function(e){
            console.log(e);
            var $target = $(e.currentTarget);
            console.log($target.prop('tagName') + '->' + $target.val());
            var pageX = e.pageX;
            var pageY = e.pageY;


            storage.set({'click': {clientX: pageX, clientY: pageY}});
        });
    },

    imitateClick: function (oElement, iClientX, iClientY) {
        var oEvent = document.createEvent("MouseEvents");
        oEvent.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0,
            iClientX, iClientY/*, false, false, false, false, 0, null*/);
        oElement.dispatchEvent(oEvent);
    },


    /**
     * 公用过滤输入节点的方法
     * @returns {{}}
     */
    filterNodes: function () {
        var validTags = ['input', 'textarea', 'select'];
        var allInputs = $(validTags.join(',')).filter(':visible');
        var excludeInputs = ['button', 'file', 'hidden', 'image', 'reset', 'submit'];
        var filtedInputs = {};

        $.each(validTags, function (idx, item) {
            filtedInputs[item] = {};
        });

        allInputs.each(function (idx, item) {

            var $item = $(item);

            // tagName 属性永远返回 UPPERCASE
            var id = $item.prop('id');
            var name = $item.prop('name');
            var tagName = $item.prop('tagName').toLowerCase();
            var inpType = $item.prop('type');
            var value = $.trim($item.val());

            if (tagName == 'input' && inpType && ($.inArray(inpType, excludeInputs) == -1)) {

                var typeObj = filtedInputs[tagName][inpType] || {};
                var key = (id && ("#" + id)) || (name && ("input[name='" + name + "']"));

                if (inpType == 'checkbox') {

                    // 对于checkbox，收集所有选中的value
                    if ($item.is(':checked')) {

                        if ($.isEmptyObject(typeObj[key])) {
                            // 还没有该类型的键值对
                            var val = id ? $item : [$item];
                            typeObj[key] = val;
                        } else {
                            // 已有此键值对数组，直接放入
                            if (id) {
                                typeObj[key] = $item;
                            } else {
                                typeObj[key].push($item);
                            }

                        }

                    }

                } else if (inpType == 'radio') {

                    // 对于radio，只保留第一个被选中的值即可
                    if ($item.is(':checked')) {
                        var key = "input[name='" + name + "']";
                        typeObj[key] = $item;
                    }

                } else {

                    // 对于普通input，根据type及id存放到对应的映射数组中
                    if ($.trim($item.val()) != '') {
                        typeObj[key] = $item;
                    }
                }
                // 非引用，需赋回值
                filtedInputs[tagName][inpType] = typeObj;
            } else {
                // 对于select和textarea，优先按id保存值

                if (id) {
                    filtedInputs[tagName]["#" + id] = $item;
                } else if (name) {
                    filtedInputs[tagName][tagName + "[name='" + name + "']"] = $item;
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
    transNodeToVal: function (filtedNodes) {

        var self = arguments.callee;

        $.each(filtedNodes, function (idx, item) {
            if (!(item instanceof $)) {
                self.call(this, item);
            } else {
                filtedNodes[idx] = $.trim(item.val());
            }
        });

        return filtedNodes;
    },

    transValToNode: function (storedData) {

        var self = arguments.callee;

        $.each(storedData, function (selector, value) {

            var valueType = $.type(value);

            if (valueType === "string" || valueType === "array") {

                var $item = $(selector);
                if ($item.length > 0) {
                    var tagName = $item.prop('tagName').toLowerCase();
                    var type = $item.prop('type');

                    if (valueType === "string") {

                        if (tagName == 'input') {

                            if (type == 'radio' || type == 'checkbox'){

                                var ele = $item.filter(function(idx){
                                    return $(this).val() == value;
                                });
                                ele.click();
                            } else {
                                $item.focus().val(value).blur();
                                apis.dispatch($item[0], 'change');
                            }

                        } else if (tagName == 'select') {
                            $item.focus().val(value).blur();
                            apis.dispatch($item[0], 'change');
                        }
                    } else if (valueType === "array") {

                        if (tagName == 'input' && type == 'checkbox') {

                            $.each(value, function (idx, val) {
                                var ele = $item.filter(function(idx){
                                    return $(this).val() == value;
                                });
                                ele.click();
                            });
                        }
                    }

                }

            } else {
                self.call(this, value);
            }
        });
    },

    /**
     * 原生dispatch事件
     * @param el  元素
     * @param type event type
     */
    dispatch: function (el, type) {
        try {
            var evt = document.createEvent('Event');
            evt.initEvent(type, true, true);
            el.dispatchEvent(evt);
        } catch (e) {
            alert(e);
        }
    },

    /**
     * 创建快照
     */
    snapshot: function (callback) {

        var filtedNodes = apis.filterNodes();
        var filtedValues = apis.transNodeToVal(filtedNodes);
        console.log(filtedValues);

        var obj = {};
        obj[href] = filtedValues;

        storage.set(obj);
        var msg = "成功创建快照！";
        callback({msg: msg});
    },

    /**
     * 快照恢复
     */
    recovery: function (callback) {

        var msg = '';
        storage.get(href, function (storedData) {
            storedData = storedData[href];
            if (storedData) {
                console.log(storedData);

                //apis.transValToNode(storedData);

                msg = "快照已成功恢复！";
            } else {
                msg = "对不起，当前页面尚未创建过快照！";
            }


            // TODO
            storage.get('click', function(cor){
                cor = cor.click;
                console.log(cor);

                var node = document.elementFromPoint(cor.pageX - window.pageXOffset,cor.pageY - window.pageYOffset);
                console.log($(node));

                setTimeout(function(){
                    node.focus();
                }, 10);

                //node.click();
                //apis.imitateClick(document.body, cor.clientX, cor.clientY);

                callback({msg: msg});
                return msg;
            });



        });

        return msg;
    },

    /**
     * 自动填充
     */
    autofill: function (callback) {
        var config = {};
        var msg = '';
        storage.get('defaultOpts', function(data){
            if(data.defaultOpts){
                config = data.defaultOpts;
            }

            $.each(config, function(query, value){
                $(query).each(function(idx, item){
                    item.value= value;
                    apis.dispatch(item, 'change');
                });
            });

            msg = '自动填充成功！';
            callback({msg: msg});
            return msg;
        });

        return msg;
    }
};

apis.delegateDoc();

// 自动填充默认选项
var defaultOpts = {
    'input[type="text"]'            : '张三',
    'input[type="tel"]'             : '18012345678',
    'input[type="email"]'           : 'test@taobao.com',
    'input[type="password"]'        : 'Taobao1234',
    'input[type="date"]'            : '2013-09-26',
    'input[type="datetime-local"]'  : '2013-09-27T01:00',
    'input[type="time"]'            : '00:01',
    'input[type="month"]'           : '2013-09',
    'input[type="week"]'            : '2013-W38',
    'input[type="number"]'          : '31415926535',
    'input[type="color"]'           : '#FFFFFF',
    'input[type="url"]'             : 'http://www.taobao.com',
    'textarea'                      : '淘宝测试淘宝测试淘宝测试淘宝测试'
};
storage.set({'defaultOpts': defaultOpts});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    apis[request.action].call(apis, sendResponse);

    return true;
    //sendResponse({msg: msg});
});