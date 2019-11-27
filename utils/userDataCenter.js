/**
 * 用户信息中心
 * boye.liu
 */
const USER_TOKEN_NAMESPACE = "userToken";
const USER_INFO_NAMESPACE = "userInfo";
const USER_EXPIRE_NAMESPACE = "userExpire";
const GOOD_END_CREATED_TIME = "goodsEndCreatTime";
const USER_EXPIRE_DAY = 1;

function getTimestamp(){
    var str = (new Date()).getTime().toString().substr(0, 10);
    return parseInt(str, 10);
}
module.exports = {
    getUserImg: function(){
        var userInfo = this.getUserInfo();
        return userInfo.userImg || "";
    },
    getNickName: function () {
        var userInfo = this.getUserInfo();
        return userInfo.nickName || "";
    },
    getUserId: function () {
        var userInfo = this.getUserInfo();
        return userInfo.userId || 0;
    },
    getUserInfo: function(){
        var str = wx.getStorageSync(USER_INFO_NAMESPACE);
        var rs = {};

        if (str && str.length) {
            rs = JSON.parse(str);
        }

        return rs;
    },
    saveUserInfo: function (userImg, nickName,userId) {
        if (userImg) {
            var str = JSON.stringify({
                userImg: userImg,
                nickName: nickName,
                userId: userId,
            });

            return wx.setStorageSync(USER_INFO_NAMESPACE, str);
        }

        return true;
    },

    clearUserToken: function(){
        wx.setStorageSync(USER_TOKEN_NAMESPACE, '');
    },

    getUserToken: function(){
        return wx.getStorageSync(USER_TOKEN_NAMESPACE) || "";
    },
    saveUserToken: function (value){
        wx.setStorageSync(USER_TOKEN_NAMESPACE, value);
        this.setExpireTime();
    },

    // 商品加入购物车时间
    clearGoodsTime: function () {
      wx.setStorageSync(GOOD_END_CREATED_TIME, 0);
    },
    getGoodsTime: function () {
      return wx.getStorageSync(GOOD_END_CREATED_TIME) || 0;
    },
    saveGoodsTime: function (value) {
      wx.setStorageSync(GOOD_END_CREATED_TIME, value);
    },


    getExpireTime: function(){
        return parseInt(wx.getStorageSync(USER_EXPIRE_NAMESPACE), 10);
    },

    setExpireTime: function() {
        var timestamp = getTimestamp();
        var expireTime = timestamp + USER_EXPIRE_DAY * 86400;
        return wx.setStorageSync(USER_EXPIRE_NAMESPACE, expireTime);
    },

    isExpire: function(){
        //1. 判断是否存在
        var userToken = this.getUserToken();
        if(!userToken){
            return true;
        }
        
        //2. 判断是否过期
        var expireTime = this.getExpireTime();
        var timestamp = getTimestamp();
        //10分钟过期前，即认为过期，防止请求正好卡在过期点
        if(expireTime <= timestamp - 10*60){
            return true;
        }

        return false;
    }

    

}
