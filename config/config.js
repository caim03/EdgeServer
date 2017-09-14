/**
 * Created by Caim03 on 13/09/17.
 */
var config = {
    port: 6601,
    ip: '0.0.0.0',
    master: false,
    balancerIp: '10.220.209.211',
    balancerPort: 6602,
    balancerSubPath: '/api/lb/edge/subscribe',
    ageingTime: 3,
    heartbeatTime: 10000,
    waitHeartbeat: 60000

};

module.exports = config;