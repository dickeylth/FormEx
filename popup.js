/**
 * Created with JetBrains WebStorm.
 * User: dickey
 * Date: 13-8-19
 * Time: 下午3:54
 * To change this template use File | Settings | File Templates.
 */

function procAction(){

    var action = $(this).attr('id');
    console.log(action);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "您好", action: action}, function(response) {
            alert(response.msg);
            window.close();
        });
    });
}

function openConfig(e){
    e.preventDefault();
    var url = $(this).attr('href');
    chrome.tabs.create({url:url,selected:true})
    window.close();
}

$(document).ready(function(){
    $('.op-list button').on('click', procAction);
    $('#modifyDefault').on('click', openConfig);
});

