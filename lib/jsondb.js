const _ = require('lodash')
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');  // 有多种适配器可选择
const defaultValue = {

}
function _serialize(data) {
  // return JSON.stringify(data).replace(/},/g,"},\n")
  // return JSON.stringify(data)
  return JSON.stringify(data, null, 2)
}

function Jsondb(name, value) {

  let adapter = new FileSync(name + '.json', {
    serialize: (data) => _serialize(data)
  }); // 申明一个适配器
  value = value || {}
  this.db = low(adapter);
  this.db.defaults(value).write();
}

Jsondb.prototype.checkIf = function (key) {

  if (!key) {
    console.log("Jsondb checkIf error: not set key ")
    return false
  }
  let now = new Date()

  let value = this.db.get(key).value();

  if (value && value.update && now - value.update < 100000) {
    return false
  } else {
    return true
  }
}


Jsondb.prototype.upsert = function (value, key) {

  if (!value) {
    console.log("Jsondb push error: not set value ")
    return false
  }
  let now = new Date()

  let original = this.db.get(key).value();
  value = _.merge(original, value)
  value.update = now.valueOf()

  this.db.set(key, value).value()
  return true
}

Jsondb.prototype.upserts = function (items) {
  // let tb = new Date()

  if (!items || !_.isArray(items)) {
    console.log("Jsondb pushs  error: not set Arrays ")
    return false
  }

  items.forEach(it => {
    // console.log(JSON.stringify(it))
    this.upsert(it.value, it.key)
  })

  // let tf = new Date()
  // console.log(tf-tb)

}

Jsondb.prototype.save = function () {
  return this.db.write()
}

Jsondb.prototype.set = function (key, value) {
  return this.db.set(key, value)
}

module.exports = Jsondb;


// let ab = new Jsondb("mfw_mdd");//通过构造函数创建对象，必须使用new 运算符
// ab.nextid()
// let ta = [
//   { key: 1, value: { id: 1, tiatt: 'lowdb is awesome 111' } },
//   { key: 2, value: { id: 2, tiatt: 'lowdb is awesome 222' } },
//   { key: 3, value: { id: 3, tiatt: 'lowdb is awesome 333' } },
//   { key: 4, value: { id: 4, tiatt: 'lowdb is awesome 444' } }
// ]
// console.log(ab.checkIf("11"))
// ab.upserts(ta)
// ab.save()
