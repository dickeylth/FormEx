/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-19
 * Time: 下午12:36
 * To change this template use File | Settings | File Templates.
 */
// 只是展示这个插件icon
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.pageAction.show(sender.tab.id);
        sendResponse({});
    });