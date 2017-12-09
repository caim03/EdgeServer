exports.periodicBackup = periodicBackupFn;


var buIntervalId;

function periodicBackupFn()
{
    buIntervalId = setInterval(function () {





    }, config.backupPeriodicTime);


    }
