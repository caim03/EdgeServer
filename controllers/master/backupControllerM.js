var masterTable = require('../../model/masterTableDb');
var request = require('request');
var syncRequest = require('sync-request');
var config = require('../../config/config');
var masterController = require("./masterController");

exports.periodicBackup = periodicBackupFn;
exports.restoreGuidFromS3 = restoreGuidFromS3Fn;
exports.stopPeriodicBackup = stopPeriodicBackupFn;


var buIntervalId;

/**
 * Questa funzione permette al master di iniziare una nuova sessione di backup dei file su un bucket S3.
 *
 * @return slaveServers
 */
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


            });

            masterTable.saveMasterTableOnDynamo();

    }, config.backupPeriodicTime);

 }


/**
 * Questa funzione permette di ricostruire il guid di un file da S3
 *
 * @param guid
 * @param metadata
 * @param userId
 * @return slaveServers
 */
function restoreGuidFromS3Fn(guid, metadata, userId)
{
    //genera slaveList
    var slaveServers = masterController.buildSlaveList();
    slaveServers.forEach(function (server) {

        var obj = {
            url: 'http://' + server + ':6601/api/chunk/restoreGuid',
            method: 'POST',
            json: {
                type: "RESTORE",
                guid: guid,
                metadata: metadata,
                userId: userId
            }
        };


        var res = syncRequest(obj.method, obj.url, {json: obj.json});

        if(JSON.parse(res.getBody('utf8')).status !== "ACK")
            console.log("ERROR");
    });

    return slaveServers;
}

/**
 * Questa funzione permette di resettare il timer per il backup periodico
 */
function stopPeriodicBackupFn()
{
    clearInterval(buIntervalId);
}