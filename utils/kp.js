import {promisic} from "./promise";

var _ = require('./lib/underscore.js');
var MD5 = require('./lib/md5.js');
var CryptoJS = require('./lib/aes.js');
var userDC = require("./userDataCenter.js");
var Kp = {};

// const ApiHost = "https://api.cyt.csweilai.com";
const ApiHost = "https://api.psq.clboy.com";
const PrivateSecret = "9eaf1c28fc565d981fc0871c7029df50";

Kp.Req =  function(arg) {
    var option = {
        "host": ApiHost,  //host，允许为空。
        "method": "POST", //类型，有效值：OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        "url" : "", //url
        "header" : {
            'content-type': 'application/x-www-form-urlencoded'
        }, //header
        "data" : {}, //传参
        "dataType" : "json", //参数类型
        "message": "", //errno=0情况下，提示文案
        "navigateTo": "", //errno=0情况下，打开新页面
        "navigateDelay": 1500,
        "redirectTo": "", //errno=0情况下，重定向新页面
        "redirectDelay": 1500,
        "success": null,    //请求成功回调，不关心errno，优先级高，当设置此参数后，callback与errorCallback均不执行
        "callback" : null, //errno=0 回调函数
        "errorCallback" : null, //errno>0 有错误回调函数
        "complete": null //完成请求回调
    };

    option = _.extend(option, arg);

    //计算auth
    var timestamp = Kp.Utils.getTimestamp();
    var auth = MD5(PrivateSecret+"_"+timestamp);


    //得到userToken
    var userToken = userDC.getUserToken();

    var header = _.extend(option.header, {
        "X-Mall-Td": timestamp,
        "X-Mall-Ah": auth,
        "X-Mall-Od": userToken,
    });

    wx.request({
        method : option.method,
        url : option.host + option.url,
        header: header,
        data : option.data,
        dataType : option.dataType,
        success : function(res) {
            var rs = res.data,
                statusCode = res.statusCode;
            if (statusCode != 200){
                wx.showToast({
                    title: "请求错误，请稍后重试! ["+statusCode+"]",
                    icon: "none",
                });
                return;
            }
            if (_.isFunction(option.success)) {
                option.success(rs);
                return;
            }

            if(rs.errno == 0){
                console.log(rs.data)

                _.isFunction(option.callback) && option.callback(rs.data);
                option.message &&  wx.showToast({
                    title: option.message,
                    icon: "none",
                });

                option.redirectTo && setTimeout(function(){
                    wx.redirectTo({
                        url: option.redirectTo
                    })
                }, option.redirectDelay);

                option.navigateTo && setTimeout(function () {
                    wx.navigateTo({
                        url: option.navigateTo
                    })
                }, option.navigateDelay);

                return true;
            }else{
                if(rs.errno == 21){
                    //用户未知
                    userDC.clearUserToken();
                }
                wx.showToast({
                    title: rs.errmsg,
                    icon: "none",
                });
                _.isFunction(option.errorCallback) && option.errorCallback(rs);
                return false;
            }
        },

        fail: function(){
            wx.showToast({
                title: "网络异常，请稍后重试",
                icon: "none",
            });
        },

        complete: function(){
            _.isFunction(option.complete) && option.complete();
        }

    });
}

Kp.Upload = function (arg) {
    var option = {
        "host": ApiHost,  //host，允许为空。
        "url": "", //url
        "header": {
            'content-type': 'multipart/form-data'

        }, //header
        "formData": {}, //传参
        "message": "", //errno=0情况下，提示文案
        "success": null,    //请求成功回调，不关心errno，优先级高，当设置此参数后，callback与errorCallback均不执行
        "callback": null, //errno=0 回调函数
        "errorCallback": null, //errno>0 有错误回调函数
        "complete": null, //完成请求回调
        "filePath": [],
    };

    option = _.extend(option, arg);

    //计算auth
    var timestamp = Kp.Utils.getTimestamp();
    var auth = MD5(PrivateSecret + "_" + timestamp);

    //得到userToken
    var userToken = userDC.getUserToken();

    var header = _.extend(option.header, {
        "X-Mall-Td": timestamp,
        "X-Mall-Ah": auth,
        "X-Mall-Od": userToken,
    });
    wx.uploadFile({
        url: option.host + option.url,
        header: header,
        formData: option.formData,
        name: 'uploadParam',
        filePath: option.filePath,
        success: function (res) {
            var rs = res.data,
                statusCode = res.statusCode;
            if (statusCode != 200) {
                wx.showToast({
                    title: "请求错误，请稍后重试! [" + statusCode + "]",
                    icon: "none",
                });
                return;
            }

            rs = JSON.parse(rs);
            if (_.isFunction(option.success)) {
                option.success(rs);
                return;
            }

            if (rs.errno == 0) {
                console.log(rs.data)

                _.isFunction(option.callback) && option.callback(rs.data);
                option.message && wx.showToast({
                    title: option.message,
                    icon: "none",
                });

                return true;
            } else {
                if (rs.errno == 21) {
                    //用户未知
                    userDC.clearUserToken();
                }
                wx.showToast({
                    title: rs.errmsg,
                    icon: "none",
                });
                _.isFunction(option.errorCallback) && option.errorCallback(rs.data);
                return false;
            }
        },
        fail: function (res) {
            wx.showToast({
                title: "上传图片失败",
                icon: "none",
            });

        }
    })

}

Kp.getImgInfo = function (arg) {
    var that = this;
    var option = {
        "host": ApiHost,  //host，允许为空。
        "url": "", //url
        "header": {
        }, //header
        "data": {}, //传参
        "message": "", //errno=0情况下，提示文案
        "loadingMsg": "",
        "autoHideLoading": false,
        "success": null,    //请求成功回调，不关心errno，优先级高，当设置此参数后，callback与errorCallback均不执行
        "fail": null, //有错误回调函数
        "complete": null, //完成请求回调
    };

    option = _.extend(option, arg);

    //计算auth
    // var shopId = shopDC.getShopId() || Config.ShopId,
    //     shopKey = shopDC.getShopKey() || Config.ShopKey,
    //     timestamp = Kp.Utils.getTimestamp();
    // var auth = MD5(shopId + "_" + timestamp + "_" + shopKey);

    //计算auth
    var timestamp = Kp.Utils.getTimestamp();
    var auth = MD5(PrivateSecret + "_" + timestamp);

    //得到userToken
    var userToken = userDC.getUserToken();

    var header = _.extend(option.header, {
        "X-Mall-Td": timestamp,
        "X-Mall-Ah": auth,
        "X-Mall-Od": userToken,
    });


    option.loadingMsg && wx.showLoading({
        title: option.loadingMsg,
    })

    var data = _.extend(option.data, header);
    var params = Kp.Utils.JsonToUrl(data);
    var url = option.host + option.url + "?" + params;

    wx.getImageInfo({
        src: url,
        success: function (res) {
            option.autoHideLoading && wx.hideLoading();
            if (_.isFunction(option.success)) {
                option.success(res);
                return;
            }
        },
        fail: function (res) {
            if (_.isFunction(option.fail)) {
                option.fail(res);
                return;
            }
            wx.showToast({
                title: "获取图片信息失败",
                icon: "none",
                duration: 2000,
            });
        },
        complete: function () {
            _.isFunction(option.complete) && option.complete();
        }
    })

}



Kp.Utils = {

    //深度拷贝
    deepClone: function (obj) {
        let _obj = JSON.stringify(obj);
        return JSON.parse(_obj);
    },

    /*
     * 将url参数部分解析成key/value形式
     * @param {string} url，格式key=value&key=value
     * @returns {Object} json对象{key:value,key:value}
     */
    UrlToJSON: function (url) {
        if (!url) {
            return {};
        }
        if (url.indexOf('?')) {
            var pathArr = url.split('?');
            if (pathArr.length > 1) {
                url = pathArr[1];
            } else {
                return {};
            }
        }
        var result = {}, pairs = url.split('&'),
            i, keyValue, len;
        for (i = 0, len = pairs.length; i < len; i++) {
            keyValue = pairs[i].split('=');
            result[keyValue[0]] = decodeURIComponent(keyValue[1]);
        }
        return result;
    },
    /**
     * json转换为url(对象转为url)
     * @param {Object} json数据
     * @returns {string} url
     */
    JsonToUrl: function (json) {
        if (!json) {
            return '';
        }
        var arr = [],
            key;
        for (key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(key + '=' + encodeURIComponent(json[key]));
            }
        }
        return arr.join('&');
    },

    /**
     * 对Date的扩展，将 Date 转化为指定格式的String
     * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
     * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
     * eg:
     * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
     * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
     * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
     * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
     * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
     */
    dateFormat: function (__data, __format) {
        var data = __data;
        var o = {
            "M+" : data.getMonth()+1, //月份
            "d+" : data.getDate(), //日
            "h+" : data.getHours()%12 == 0 ? 12 : data.getHours()%12, //小时
            "H+" : data.getHours(), //小时
            "m+" : data.getMinutes(), //分
            "s+" : data.getSeconds(), //秒
            "q+" : Math.floor((data.getMonth()+3)/3), //季度
            "S"  : data.getMilliseconds() //毫秒
        };

        var week = {
            "0" : "日",
            "1" : "一",
            "2" : "二",
            "3" : "三",
            "4" : "四",
            "5" : "五",
            "6" : "六"
        };

        if (/(y+)/.test(__format)){
            __format = __format.replace(RegExp.$1, (data.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        if(/(E+)/.test(__format)){
            __format = __format.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "星期" : "周") : "")+week[data.getDay()+""]);
        }

        for (var k in o){
            if (new RegExp("(" + k + ")").test(__format))
                __format = __format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }

        return __format;
    },

    //时间戳转日期
    timestampFormat: function (__data, __format) {
        __data = new Date(__data*1000);
        return this.dateFormat(__data, __format);
    },

    //当前时间转日期
    curTimeFormat: function (__format) {
        var __data = new Date();
        return this.dateFormat(__data, __format);
    },

    //获取当前时间戳
    getTimestamp: function(){
        var str = (new Date()).getTime().toString().substr(0, 10);
        return parseInt(str, 10);
    },

    //阿拉伯数字转换为简写汉字
    Arabia2SimplifiedChinese: function(Num) {
        for (var i = Num.length - 1; i >= 0; i--) {
            Num = Num.replace(",", "")//替换Num中的“,”
            Num = Num.replace(" ", "")//替换Num中的空格
        }
        if (isNaN(Num)) { //验证输入的字符是否为数字
            //alert("请检查小写金额是否正确");
            return;
        }
        //字符处理完毕后开始转换，采用前后两部分分别转换
        var part = String(Num).split(".");
        var newchar = "";
        //小数点前进行转化
        for (var i = part[0].length - 1; i >= 0; i--) {
            if (part[0].length > 10) {
                //alert("位数过大，无法计算");
                return "";
            }//若数量超过拾亿单位，提示
            var tmpnewchar = ""
            var perchar = part[0].charAt(i);
            switch (perchar) {
                case "0":  tmpnewchar = "零" + tmpnewchar;break;
                case "1": tmpnewchar = "一" + tmpnewchar; break;
                case "2": tmpnewchar = "二" + tmpnewchar; break;
                case "3": tmpnewchar = "三" + tmpnewchar; break;
                case "4": tmpnewchar = "四" + tmpnewchar; break;
                case "5": tmpnewchar = "五" + tmpnewchar; break;
                case "6": tmpnewchar = "六" + tmpnewchar; break;
                case "7": tmpnewchar = "七" + tmpnewchar; break;
                case "8": tmpnewchar = "八" + tmpnewchar; break;
                case "9": tmpnewchar = "九" + tmpnewchar; break;
            }
            switch (part[0].length - i - 1) {
                case 0: tmpnewchar = tmpnewchar; break;
                case 1: if (perchar != 0) tmpnewchar = tmpnewchar + "十"; break;
                case 2: if (perchar != 0) tmpnewchar = tmpnewchar + "百"; break;
                case 3: if (perchar != 0) tmpnewchar = tmpnewchar + "千"; break;
                case 4: tmpnewchar = tmpnewchar + "万"; break;
                case 5: if (perchar != 0) tmpnewchar = tmpnewchar + "十"; break;
                case 6: if (perchar != 0) tmpnewchar = tmpnewchar + "百"; break;
                case 7: if (perchar != 0) tmpnewchar = tmpnewchar + "千"; break;
                case 8: tmpnewchar = tmpnewchar + "亿"; break;
                case 9: tmpnewchar = tmpnewchar + "十"; break;
            }
            newchar = tmpnewchar + newchar;
        }
        //替换所有无用汉字，直到没有此类无用的数字为止
        while (newchar.search("零零") != -1 || newchar.search("零亿") != -1 || newchar.search("亿万") != -1 || newchar.search("零万") != -1) {
            newchar = newchar.replace("零亿", "亿");
            newchar = newchar.replace("亿万", "亿");
            newchar = newchar.replace("零万", "万");
            newchar = newchar.replace("零零", "零");
        }
        //替换以“一十”开头的，为“十”
        if (newchar.indexOf("一十") == 0) {
            newchar = newchar.substr(1);
        }
        //替换以“零”结尾的，为“”
        if (newchar.lastIndexOf("零") == newchar.length - 1) {
            newchar = newchar.substr(0, newchar.length - 1);
        }
        return newchar;
    },

    /**
     * 判断变量是否为空
    */
    isBlank: function(str){
        if (Object.prototype.toString.call(str) === '[object Undefined]') {//空
            return true
        } else if (
            Object.prototype.toString.call(str) === '[object String]' ||
            Object.prototype.toString.call(str) === '[object Array]') { //字条串或数组
            return str.length == 0 ? true : false
        } else if (Object.prototype.toString.call(str) === '[object Object]') {
            return JSON.stringify(str) == '{}' ? true : false
        } else {
            return true
        }

    },

    _aesConf: function(){
        return {
            KEY: "D8866CE817751CD6",
            IV: "8A2DC842D7C89578",
        };
    },

    /**
     * 加密
     * 1. aes加密 2.base64 3.encodeURIComponent
     */
    encrypt: function(str){
        let conf = this._aesConf();
        let key = CryptoJS.enc.Utf8.parse(conf.KEY); //十六进制加密密钥  必须16位长度
        let iv = CryptoJS.enc.Utf8.parse(conf.IV); //十六进制矢量  必须16位长度

        //let srcs = CryptoJS.enc.Utf8.parse(str);
        let encrypted = CryptoJS.AES.encrypt(str, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });

        let data = CryptoJS.enc.Utf8.parse(encrypted);//转为utf8
        let dataBase64 = CryptoJS.enc.Base64.stringify(data).toString();//base64加密
        return encodeURIComponent(dataBase64);//encodeURIComponent加密

    },

    /**
     * 解密
     * 1. decodeURIComponent 2.base64解码 3. aes解密
     */
    decrypt: function (str) {
        let conf = this._aesConf();
        let key = CryptoJS.enc.Utf8.parse(conf.KEY); //十六进制加密密钥  必须16位长度
        let iv = CryptoJS.enc.Utf8.parse(conf.IV); //十六进制矢量  必须16位长度

        let data = decodeURIComponent(str); //decodeURIComponent解码
        let dataBase64 = CryptoJS.enc.Base64.parse(decodeURIComponent(str)); //base64解码
        let ciphertext = dataBase64.toString(CryptoJS.enc.Utf8); //转为utf8

        let decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    },

    request: async function ({ url, data, method = 'GET'}) {
        const timestamp =  Kp.Utils.getTimestamp()
        const auth  =  MD5(PrivateSecret+"_"+timestamp)
        const userToken = userDC.getUserToken()
        const res = await promisic(wx.request)(({
            method,
            url : `${ApiHost}${url}`,
            header: {
                'content-type': 'application/x-www-form-urlencoded',
                "X-Mall-Td": timestamp,
                "X-Mall-Ah": auth,
                "X-Mall-Od": userToken,
            },
            data : data,
        }))
        return res.data
    }
}

module.exports = Kp
