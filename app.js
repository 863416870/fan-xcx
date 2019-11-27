//app.js
const _ = require('./utils/lib/underscore.js');
const Kp = require('./utils/kp.js');
const userDC = require('./utils/userDataCenter.js');
const MD5 = require('./utils/lib/md5.js');
const socket = require('./utils/socket.js');

var maxRetryTimes = 10;
var socketConnecting = false;
var mySocketTask;

App({
    Const: {
        IMG_HOST: "https://qxkx01.cdn.clboy.com/",
        IMG_STYLE_COMMON: "@!common",
    },
    Kp: Kp,
    GData: {
        userImg: "",
        nickName: "",
        description: "",
        configData: {},
        commonDataMap: {},
        shareCouponValue: 0,
        tableNo: "",
        showTableNo: "",
        mealsNumber: "",
        cartList: [],
        authFlag: 0,//默认表示没有弹出过
    },
    setGData: function (mix, value) {
        if (!mix) {
            console.log("参数错误，mix is" + mix);
            return false;
        }
        if (_.isString(mix)) {
            this.GData[mix] = value;
            return true;
        }

        for (var key in mix) {
            this.GData[key] = mix[key];
        }

        return true;

    },
    onLaunch: function (option) {
        console.log(option);
        this._initCommonInfo();
    },

    onShow(){
        var tableNo = this.GData.tableNo;
        //tableNo && this.startWebSocket();
    },

    goToEntry: function (path, query) {
        var entryPage = "pages/entry/entry";
        var url = "";
        var queryStr = Kp.Utils.JsonToUrl(query);

        if (queryStr && queryStr.length) {
            url += "?" + queryStr;
        }

        url = encodeURIComponent(url);
        wx.redirectTo({
            url: entryPage + "?url=" + url,
        })
    },

    //初始化配置信息
    //包括shopInfo  userInfo
    _initCommonInfo: async function () {
        var that = this;
        // Kp.Req({
        //     url: "/commoninfo",
        //     callback: function (data) {
        //         that.setGData({
        //             configData: data.config_data || {},
        //             commonDataMap: data.common_data_map || {},
        //             shareCouponValue: data.common_data_map.share_coupon_value || 0,
        //         });
        //         console.log(that.GData.commonDataMap)
        //         that.globalData.setDataCommonStatus = true;
        //     }
        // });
        const data =  await this.req()
        that.setGData({
            configData: data.config_data || {},
            commonDataMap: data.common_data_map || {},
            shareCouponValue: data.common_data_map.share_coupon_value || 0,
        });
        console.log(data);
    },
    async req(){
      var res = await Kp.Utils.request(
          {url:"/commoninfo"})
        return res.data;
    },
    // 请求commonInfo状态
    globalData: {
        setDataCommonStatus: false
    },
    //更新服务端用户信息
    //参数为getUserInfo的detail值
    updateOnlineUserInfo: function (detail, cb) {
        var USER_UPDATE_URL = "/userupdate";
        var that = this;
        Kp.Req({
            url: USER_UPDATE_URL,
            data: {
                encryptedData: detail.encryptedData,
                iv: detail.iv,
                isEncrypt: 1
            },
            callback: function () {
                that.refreshToken();
                if (_.isFunction(cb)) {
                    cb(detail.userInfo);
                }
            }
        });
    },

    //静默获取openId，用户无感知
    //发送服务端，换取token
    //静默更新用户信息
    refreshToken: function (cb) {
        var that = this;
        wx.login({
            success: function (res) {
                if (res.code) {
                    Kp.Req({
                        url: "/userlogin",
                        data: { code: res.code },
                        callback: function (data) {
                            var userImg = data.user_img;
                            var nickName = data.nick_name;
                            var userId = data.user_id;
                            userDC.saveUserInfo(userImg, nickName, userId);
                            that.setGData({
                                userImg: userImg,
                                nickName: nickName
                            });

                            var token = data.token;
                            userDC.saveUserToken(token);
                        }
                    });
                } else {
                    wx.showToast({
                        title: '登陆失败，请稍后重试',
                        icon: 'none'
                    });
                }
            }
        })
    },

    shareUrlGen: function (url) {
        var entryPage = "pages/entry/entry";
        url = encodeURIComponent(url);
        return entryPage + "?url=" + url;
    },


    saveFormId: function (e) {
        var formId = e.detail.formId;
        console.log(formId)
        Kp.Req({
            url: "/saveformid",
            data: { formid: formId }
        });
    },

    startWebSocket: function (cb) {
        var that = this;
        maxRetryTimes = 10;//重置重试次数
        //连接成功回调，需要在连接websocket之前设置
        wx.onSocketOpen(function (res) {
            console.log(res);
            maxRetryTimes = 10;//重置重试次数
            cb && setTimeout(function () {
                cb();
            }, 0);
        })
        //错误回调，需要在连接websocket之前设置
        wx.onSocketError(function (res) {
            console.log(res);
            console.error("websocket error-----------------")
            that.connectSocket();
        })

        //关闭回调，需要在连接websocket之前设置
        //nginx的超时设置，长时间不操作，会自动关闭连接
        wx.onSocketClose(function (res) {
            console.log(res);
            if(res.code ==1000){
                that.connectSocket();
            }
            console.error("websocket close-----------------")
        });

        that.connectSocket();

    },



    //连接websocket
    connectSocket: function () {
        if (socketConnecting){
            return;
        }
        socketConnecting = true;
        var that = this;
        var tableNo = this.GData.tableNo;
        var userInfo = userDC.getUserInfo();

        var data = "user_id=" + userInfo.userId  + "&round_num=" + Math.floor(Math.random() * 10 + 1) + "&t=" + new Date().getTime();
        var _data = data + "&secret_key=555a337e612479d85";
        var sn = MD5(_data);
        data = data + "&sn=" + sn;
        //var url = "ws://192.168.0.119:8088/user/dish?table_no=" + tableNo + "&nick_name=" + encodeURI(userInfo.nickName) + "&user_img=" + userInfo.userImg + data;
        var url = "wss://api.cyt.csweilai.com/wss/user/dish?table_no=" + tableNo + "&nick_name=" + encodeURI(userInfo.nickName) + "&user_img=" + userInfo.userImg + "&" + data;
        // var url = "wss://api.psq.clboy.com/wss/user/dish?table_no=" + tableNo + "&nick_name=" + encodeURI(userInfo.nickName) + "&user_img=" + userInfo.userImg + "&" + data;

        if(maxRetryTimes > 0){
            --maxRetryTimes;
            console.log("retry--------------" + maxRetryTimes);
            this.connectMySocket(url);
        }

    },

    connectMySocket: function(url){
        mySocketTask = wx.connectSocket({
            url: url,
            data: {},
            method: 'GET',
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                socketConnecting = false;
                socket.heartCheck();
                console.log("connect发送成功");
            },
            fail: function (res) {
                socketConnecting = false;
                console.log("connect发送失败");
            }
        })
    },

    onHide: function () {
        wx.closeSocket();
        socket.heartStop();
        // wx.onSocketClose(function (res) {
        //     console.log(res);
        //     console.log('WebSocket 已关闭！')
        // })

    }

})
