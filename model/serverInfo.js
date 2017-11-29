/**
 * Created by Caim03 on 13/09/17.
 */
var info = {};

exports.getInfo = getInfoFn;
exports.setInfo = setInfoFn;
exports.setInfoId = setInfoIdFn;
exports.getInfoId = getInfoIdFn;
exports.setInfoMaster = setInfoMasterFn;
exports.getInfoMaster = getInfoMasterFn;
exports.setLocal = setLocalFn;
exports.getLocal = getLocalFn;

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

function setInfoMasterFn(bool) {
    info.master = bool;
}

function getInfoMasterFn() {
    return info.master;
}

function setLocalFn(bool)
{
    info.local = bool;
}

function getLocalFn()
{
    return info.local;
}