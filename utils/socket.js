var MD5 = require('./lib/md5.js');
var userDC = require("./userDataCenter.js");

//心跳监测间隔，这里必须小于nginx配置proxy_read_timeout;
const HEART_CHECK_DURATION = 50*1000;
var socketConnecting = false;
var maxRetryTimes = 10;
var heartTimer;

function sendMessage(obj, tableNo, action) {
    var that = this;
    var params = {
        dish: obj,
        tableNo: tableNo,
        action: action,
    }
   
    var str = JSON.stringify(params);
    wx.sendSocketMessage({
        data: str,
        success: function (res) {
        },
        fail: function (res) {
            //重新连接websocket
            // connectSocket(tableNo);
            // wx.showToast({
            //     title: '连接失败！',
            //     icon: 'none',
            // });
        }
    })
}

function resiverMessage(context) {
    console.log(context)
    wx.onSocketMessage(function (data) {
        console.log("onSocketMessag+++++++++++++ ", data);
        context.onMessage(JSON.parse(data.data));//这里定义一个onMessage方法，用于每个页面的回调
        
    })
}

function heartCheck(){
    heartTimer = setTimeout(function () { 
        heartSend();
    }, HEART_CHECK_DURATION);
}

function heartSend(){
    sendMessage("","", "ping");
    heartCheck();
}
function heartStop(){
    clearTimeout(heartTimer);
}

function connectMySocket(url) {
    wx.connectSocket({
        url: url,
        data: {},
        method: 'GET',
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            socketConnecting = false;
            heartCheck();
            console.log("connect发送成功");
        },
        fail: function (res) {
            socketConnecting = false;
            console.log("connect发送失败");
        }
    })
}


module.exports = { 
    sendMessage: sendMessage, 
    resiverMessage: resiverMessage,
    heartCheck: heartCheck,
    heartStop: heartStop,
}

