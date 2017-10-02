/**
 * Created by Caim03 on 13/09/17.
 */
var info = {};

exports.getInfo = getInfoFn;
exports.setInfo = setInfoFn;
exports.setInfoId = setInfoIdFn;
exports.getInfoId = getInfoIdFn;

function getInfoFn() {
    return info;
}

function setInfoFn(data) {
    info = data;
}

function setInfoIdFn(id) {
    info.id = id;
}

function getInfoIdFn() {
    return info.id;
}