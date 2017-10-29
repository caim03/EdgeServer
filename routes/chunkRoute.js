/**
 * Created by Caim03 on 12/09/17.
 */
module.exports = function (app) {

    var chunkController = require('../controllers/slave/chunkController');
    var uploadControllerS = require('../controllers/slave/uploadControllerS');

    /* REST API */

    app.get('/api/chunk/read',chunkController.readFile);
    app.post('/api/chunk/write', chunkController.writeFile);
    app.delete('/api/chunk/delete', chunkController.deleteFile);
    app.put('/api/chunk/update', chunkController.updateFile);

    app.post('/api/chunk/topology', chunkController.genTopology);

    app.post('/api/chunk/heartbeat', chunkController.receiveHeartbeat);

    app.post('/api/chunk/proclamation', chunkController.receiveProclamation);
    app.get('/api/chunk/getAllChunkData',chunkController.getAllChunkData);

    app.post('/api/chunk/sendToSlave', chunkController.sendAckToMaster);


    //upload file
  //  app.post('/api/chunk/newChunk', uploadControllerS.saveFile);
    app.post('/api/chunk/newChunkGuidMaster', uploadControllerS.savePendingRequest);
    app.post('/api/chunk/newChunkGuidClient', uploadControllerS.checkIfPending);


    //upload file
    app.post('/api/chunk/newChunk', uploadControllerS.uploadFile);
  //  app.post('/api/chunk/newChunkGuid', uploadControllerS.uploadFile);
};
