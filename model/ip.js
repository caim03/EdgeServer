const publicIp = require('public-ip');
const privateIp = require('ip');
var ipP = null;
exports.setAddress = setAddressFn;
exports.getPublicIp = getPublicIpFn;
exports.getPrivateIp = getPrivateIpFn;

function setAddressFn(){

    var pippo = publicIp.v4().then(ip => {
        console.log("your public ip address", ip);
        return ip;
    });

    Promise.resolve(pippo).then(function(value) {
        console.log(value);
        ipP = value;  // "Success"
    }, function(value) {
        // not called
    });

}

function getPublicIpFn()
{
  return ipP;
}

function getPrivateIpFn() {
    return privateIp.address();

}