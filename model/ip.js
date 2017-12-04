const publicIp = require('public-ip');
const privateIp = require('ip');
var ipP = null;
var info = require('../model/serverInfo');
exports.setAddress = setAddressFn;
exports.getPublicIp = getPublicIpFn;
exports.getPrivateIp = getPrivateIpFn;

function setAddressFn(){

    var publicPromise = publicIp.v4().then(ip => {
        return ip;
    });

    Promise.resolve(publicPromise).then(function(value) {
        ipP = value;  // "Success"
    }, function(value) {
        // not called
    });

}

function getPublicIpFn()
{

  if(info.getLocal())
    return privateIp.address();
  else
    return ipP;
}

function getPrivateIpFn() {
    return privateIp.address();

}