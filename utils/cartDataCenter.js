/*
 * 购物车数据中心
 * boye.liu
 */
const CART_NAMESPACE = "shopCart";
/*
{
    63502: {
        "sku_id": "63502",
        "count": "",
        "sku_price": "75.99",
        "order_remark": "",
        "goods_id": "63502123",
        "goods_name" "珂莱欧/CLIO",
        "logo_path":"",

        "sku_content":[
            {
                "attr_id": "101",
                "attr_name": "颜色",
                "attr_value": "白色"
            },
            {
                "attr_id": "102",
                "attr_name": "尺寸",
                "attr_value": "大瓶"
            },
            ...
        ],
        "select_status": "1",  //1选中,0未选中
        "count" : 1,
    },
    63503: {
        "sku_id": "63502",
        "count": "",
        "sku_price": "75.99",
        "order_remark": "",
        "goods_id": "63502123",
        "goods_name" "珂莱欧/CLIO",
        "logo_path":"",

        "sku_content":[
            {
                "attr_id": "101",
                "attr_name": "颜色",
                "attr_value": "红色"
            },
            {
                "attr_id": "102",
                "attr_name": "尺寸",
                "attr_value": "37号"
            },
            ...
        ],
        "select_status": "0",  //1选中,0未选中
        "count" : 1,
    },
}
 */


function _store(obj) {
    var str = JSON.stringify(obj);
    wx.setStorageSync(CART_NAMESPACE, str);
    return true;
}

function _fetch(){
    var str = wx.getStorageSync(CART_NAMESPACE);
    var rs = {};

    if (str && str.length) {
        rs = JSON.parse(str);
    }

    return rs;
}


function getAllSkuMap() {
    var rs = _fetch();
    return rs;
}

//数组形式
function getAllSkuList() {
    var skuMap = getAllSkuMap();
    var arr = [];

    for (var sku_id in skuMap) {
        arr.push(skuMap[sku_id]);
    }

    return arr;
}

function getAllSelectSkuList(){
    var skuMap = getAllSkuMap();
    var arr = [];

    for (var sku_id in skuMap) {
        var item = skuMap[sku_id];
        if(item.select_status == 1){
            arr.push(item);
        }
    }

    return arr;
}


//下单提交时候
function deleteAllSelectSkuList(){
    wx.removeStorageSync(CART_NAMESPACE);
    // var skuMap = getAllSkuMap();

    // for (var sku_id in skuMap) {
    //     var item = skuMap[sku_id];
    //     if(item.select_status == 1){
    //         delete skuMap[sku_id];
    //     }
    // }

    //return _store(skuMap);
}

function getOneSku(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    return skuOne;
}

function hasTheSku(sku_id) {
    var _bool = getOneSku(sku_id) ? true : false;
    return _bool;
}

//添加一个sku
//先判断是否有，有的话，更新数据，并加数量
//没有的话，直接添加
function saveOneSku(sku_id, sku, count) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;
    var skuCount = parseInt(count, 10);
    var select_status = 1; //默认选中
    var item = {};

    //校验----begin
    if(!sku_id){
        console.log("sku_id is empty");
        return false;
    }

    if (skuCount < 1 || !sku) {
        console.log("skuCount is empty");
        return false;
    }
    //校验----end


    if (skuOne) {
        skuCount += skuOne.count;
        select_status = skuOne.select_status; //使用购物车已经存在sku的选中状态
    }

    if(sku.select_status){
        select_status = sku.select_status; //使用最新加入时候的选中状态
    }

    item.sku_id = sku_id;
    item.count = skuCount;
    item.sku_price = sku.sku_price;
    item.goods_id = sku.goods_id;
    item.vip_price = sku.vip_price;
    item.goods_name = sku.goods_name; 
    item.logo_path = sku.logo_path;
    item.sku_content = sku.sku_content;
    item.select_status = select_status;
    item.order_remark = sku.order_remark;
    item.create_time = sku.create_time;

    //优惠信息
    //item.is_seckill = sku.is_seckill ? 1 : 0;
    //item.is_discount = sku.is_discount ?1 : 0;

    skuAll[sku_id] = item;
    return _store(skuAll);

}

//同步后端数据，更新sku信息
function updateSkuByServerData(skuData){
    if(!skuData || !skuData.length){
        return;
    }

    var skuAll = getAllSkuMap();
    // for (var item in skuData) {
    for (var i = 0; i < skuData.length; i++){
        var item = skuData[i];
//    $(skuData).each(function(index, item){
        var sku_id = item.sku_id;
        var skuOne = skuAll[sku_id] || null;

        //已经不存在，直接略过
        if(!skuOne){
            continue;
        }

        //下架删除
        if(parseInt(item.online_status) === 0){
            delete skuAll[sku_id];
            console.log("offline:" + sku_id);
            continue;
        }

        //判断限购数量
        if(item.goods_limit > 0 && skuOne.count > item.goods_limit){
            console.log("over the limit ["+ item.goods_limit +"] sku_id is: " + sku_id);
            skuOne.count = item.goods_limit;
        }

        //更新数据
        skuOne.sku_price = item.sku_price; //更新价格
        //优惠信息
        //skuOne.is_seckill = item.is_seckill;
        //skuOne.is_discount = item.is_discount;
        skuAll[sku_id] = skuOne;

    };

    return _store(skuAll);
}

//删除一个sku
function removeOneSku(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    if (skuOne) {
        delete skuAll[sku_id];
        return _store(skuAll);
    }

    return false;
}

//sku +1
function skuCountPlus(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    if (!skuOne) {
        return false;
    }

    ++skuOne.count;

    skuAll[sku_id] = skuOne;
    return _store(skuAll);

}

//sku -1
function skuCountMinus(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    if (!skuOne) {
        return false;
    }

    --skuOne.count;

    if (skuOne.count < 1) {
        delete skuAll[sku_id];
    }else{
        skuAll[sku_id] = skuOne;
    }

    return _store(skuAll);

}

//选中某个
function selectOneSku(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    if (!skuOne) {
        return false;
    }

    skuOne.select_status = 1;

    skuAll[sku_id] = skuOne;
    return _store(skuAll);

}

//反选某个
function unSelectOneSku(sku_id) {
    var skuAll = getAllSkuMap();
    var skuOne = skuAll[sku_id] || null;

    if (!skuOne) {
        return false;
    }

    skuOne.select_status = 0;

    skuAll[sku_id] = skuOne;
    return _store(skuAll);

}

//选中所有
function selectAllSku() {
    var skuAll = getAllSkuMap();

    for (var sku_id in skuAll) {
        skuAll[sku_id].select_status = 1;
    }

    return _store(skuAll);

}

//取消选中所有
function unSelectAllSku() {
    var skuAll = getAllSkuMap();

    for (var sku_id in skuAll) {
        skuAll[sku_id].select_status = 0;
    }

    return _store(skuAll);

}

//获得sku数量，去重
function getSkuNum() {
    var skuAll = getAllSkuMap();
    var len = 0;
    for (var key in skuAll) {
        len++;
    }

    return len;
}
//获取购物车商品总数
function getAllSkuCount() {
    var skuAll = getAllSkuMap();
    var count = 0;
    for (var key in skuAll) {
        var _c = parseInt(skuAll[key].count);
        count += _c;
    }

    return count;
}

module.exports = {
    saveOneSku: saveOneSku,
    removeOneSku: removeOneSku,
    skuCountMinus: skuCountMinus,
    skuCountPlus: skuCountPlus,

    getAllSkuList: getAllSkuList,
    getAllSelectSkuList: getAllSelectSkuList,
    getAllSkuMap: getAllSkuMap,

    deleteAllSelectSkuList: deleteAllSelectSkuList,

    selectOneSku: selectOneSku,
    unSelectOneSku: unSelectOneSku,

    selectAllSku: selectAllSku,
    unSelectAllSku: unSelectAllSku,

    getSkuNum: getSkuNum,
    getAllSkuCount: getAllSkuCount,

    updateSkuByServerData: updateSkuByServerData,
    _store: _store,

}
