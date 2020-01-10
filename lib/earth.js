const SCALE = [5000000, 2000000, 1000000, 500000, 200000, 100000, 50000, 25000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5]

function _inShape(point, shape) {
    for (var c = false, i = -1, l = shape.length, j = l - 1; ++i < l; j = i)
        ((shape[i].lat <= point.lat && point.lat < shape[j].lat) || (shape[j].lat <= point.lat && point.lat < shape[i].lat)) &&
        (point.lon < (shape[j].lon - shape[i].lon) * (point.lat - shape[i].lat) / (shape[j].lat - shape[i].lat) + shape[i].lon) &&
        (c = !c);
    return c;
}

function _shape(shape) {
    var loc = shape.split(";");
    var path = [];
    for (var i in loc) {
        var l = loc[i].split(",");
        path.push({
            lon: parseFloat(l[0]),
            lat: parseFloat(l[1])
        });
    }
    return path
}

function _bounds(lon, lat, radius) {
    //地球周长
    lon = parseFloat(lon)
    lat = parseFloat(lat)
    let perimeter = 2 * Math.PI * 6378137;
    //纬度latitude的地球周长：latitude
    let perimeter_lat = perimeter * Math.cos((Math.PI * lat) / 180);

    //一米对应的经度（东西方向）1M实际度
    let lon_per_mi = 360 / perimeter_lat;
    let lat_per_mi = 360 / perimeter;

    let bound = {
        top: lat + radius * lat_per_mi,
        left: lon - radius * lon_per_mi,
        bottom: lat - radius * lat_per_mi,
        right: lon + radius * lon_per_mi,
    }


    return bound
}

function _distance(lon1, lat1, lon2, lat2) {
    let a = (lat1 - lat2) * Math.PI / 180.0,
        b = (lon1 - lon2) * Math.PI / 180.0,
        s = 2 * Math.asin(
            Math.sqrt(
                Math.pow(Math.sin(a / 2), 2) +
                Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
            )
        );
    s = s * 6378137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return Math.floor(s);
}

const earth = {

    // 计算两坐标点的距离
    distance: (point1, point2) => {
        return _distance(point1.lon, point1.lat, point2.lon, point2.lat)
    },
    //计算坐标中心一定距离的矩形边界
    bounds: (point, radius) => {
        return _bounds(point.lon, point.lat, radius)
    },
    // 计算坐标点是否在形状内
    inShape: (point, shape) => {
        if (typeof (shape) == 'string') shape = _shape(shape)
        return _inShape(point, shape)
    },
    //图形边界点数据处理
    shape2list: (str) => {
        if (typeof (shape) == 'string') return _shape(shape)
        else return str
    },
    SCALE: [5000000, 2000000, 1000000, 500000, 200000, 100000, 50000, 25000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5]

};

module.exports = earth

// let points = [{
//         lat: 39.938698,
//         lon: 116.275177
//     },
//     {
//         lat: 39.966069,
//         lon: 118.289253
//     },
//     {
//         lat: 39.90759116,
//         lon: 116.596688
//     },
//     {
//         lat: 26.696195,
//         lon: 106.619456
//     }

// ]

// let shape = "106.619456,26.696394;106.618957,26.696188;106.618566,26.695958;106.618217,26.695708;106.617874,26.695387;106.6176,26.69509;106.617524,26.694966;106.61749,26.69487;106.617454,26.694726;106.617456,26.694625;106.617478,26.694526;106.617503,26.694447;106.617554,26.694359;106.61767,26.694211;106.617774,26.694103;106.618241,26.693808;106.618614,26.693569;106.619054,26.693303;106.619268,26.693154;106.619515,26.693025;106.619703,26.693096;106.61981,26.693231;106.619848,26.69337;106.619633,26.693537;106.619628,26.694026;106.619579,26.694769;106.620097,26.695085;106.619537,26.696255;106.619456,26.696394"
// let shapes = earth.shape2list(shape)
// console.log(earth.distance(points[1], points[0]))
// console.log(earth.inShape(points[1], shapes))
// console.log(earth.inShape(points[2], shapes))
// console.log(earth.inShape(points[3], shapes))

// console.log(earth.bounds(points[0],1000))