/**
 * Created by Caim03 on 13/09/17.
 */
var info = require('../model/serverInfo');
var request = require('request');

exports.bully = bullyFn;
exports.bullyElection = bullyElectionFn;
exports.bullyProclamation = bullyProclamationFn;

function bullyFn(){
    console.log("START BULLY FN");
    info.masterIp = findMaster();

    if (!info.masterIp) {
        startElection();
    }
}

function bullyElectionFn(req, res) {
    console.log("START BULLY ELECTION FN");
    if(req.body.id > info.id) {
        console.log('Non partecipo');
    }
    else {
        console.log('Inizio una nuova elezione');
        res.send({id: info.id});
        startElection();
    }

}

function bullyProclamationFn(req, res) {

}

function findMaster() {
    console.log("START FIND MASTER\n");
    request.get('http://10.220.215.255:6601/api/master/findMaster', function (err, res) {
        console.log(res);
        /*console.log(res.body.ip);
        if(res.body.ip){
            return res.body.ip;
        }*/
    })
}

function startElection() {
    console.log("START ELECTION\n");
    var body = {
        algorithm: 'BULLY',
        type: 'ELECTION',
        id: info.id
    };
    request.post('http://10.220.215.255:6601/api/election/election', body, function (err, res) {
        console.log(res);
        if (!res || info.id > res.body.id) {
            console.log("I'M THE MASTER");
        }
    })
}