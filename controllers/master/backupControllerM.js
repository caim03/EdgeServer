var masterTable = require('../../model/masterTableDb');
var request = require('request');
var config = require('../../config/config');

exports.periodicBackup = periodicBackupFn;


var buIntervalId;

function periodicBackupFn()
{
    buIntervalId = setInterval(function () {

            console.log("STARTING BACKUP LIST");

            var backupList = masterTable.createBackupList();

            backupList.forEach(function (list) {

                if(list.guidToBackup.length !== 0) {
                    var obj = {
                        url: 'http://' + list.slaveIp + ':' + config.port + '/api/chunk/periodicBackup',
                        method: 'POST',
                        json: {
                            type: "BACKUP",
                            guids: list.guidToBackup
                        }
                    };

                    request(obj, function (err, res) {

                        if (res.body.status === "ACK") {
                            console.log("BACKUP COMPLETE BY: " + list.slaveIp + " FOR " + list.guidToBackup);
                            masterTable.setCloudToGuids(list.guidToBackup,true);
                        }
                        else if (err)
                            console.log(err);

                    });

                }


            })

            //TODO SALVARE MASTERTABLE SU DYNAMO


    }, config.backupPeriodicTime);


    }
