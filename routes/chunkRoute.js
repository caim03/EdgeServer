/**
 * Created by Caim03 on 12/09/17.
 */
module.exports = function (app) {

    var chunkController = require('../controllers/slave/chunkController');
    var uploadControllerS = require('../controllers/slave/uploadControllerS');
    var topologyController = require('../controllers/slave/topologyController');
    var electionController = require('../controllers/slave/electionController');
    var deleteController = require('../controllers/slave/deleteControllerS');
    var backupController = require('../controllers/slave/backupControllerS')


    /* REST API */

    app.post('/api/chunk/write', chunkController.writeFile);
    app.delete('/api/chunk/delete', chunkController.deleteFile);
    app.put('/api/chunk/update', chunkController.updateFile);

    app.post('/api/chunk/topology', topologyController.genTopology);
    app.post('/api/chunk/heartbeat', topologyController.receiveHeartbeat);

    app.post('/api/chunk/proclamation', electionController.receiveProclamation);

    app.get('/api/chunk/getAllChunkData',chunkController.getAllChunkData);
    app.post('/api/chunk/sendToSlave', chunkController.sendAckToMaster);


    // upload file
    // app.post('/api/chunk/newChunk', uploadControllerS.saveFile);
    app.post('/api/chunk/newChunkGuidMaster', uploadControllerS.savePendingRequest);
    app.post('/api/chunk/newChunkGuidClient', uploadControllerS.checkIfPending);


    // upload file
    app.post('/api/chunk/newChunk', uploadControllerS.uploadFile);

    // app.post('/api/chunk/newChunkGuid', uploadControllerS.uploadFile);
    app.post('/api/chunk/fileDistributionReq', uploadControllerS.sendFile);
    app.post('/api/chunk/newDistributedChunk', uploadControllerS.saveChunk);

    app.post('/api/chunk/readFile', chunkController.readFile);
    app.post('/api/chunk/removeChunk', deleteController.removeChunk);

    app.post('/api/chunk/periodicBackup',backupController.periodicBackup);
};
