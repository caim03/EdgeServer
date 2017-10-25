/**
 * Created by Caim03 on 12/09/17.
 */
module.exports = function (app) {

    var masterController = require('../controllers/master/masterController');
    var uploadControllerM = require('../controllers/master/uploadControllerM');

    /* REST API */

    app.get('/api/master/read', masterController.readFile);
    app.post('/api/master/write', masterController.writeFile);
    app.delete('/api/master/delete', masterController.deleteFile);
    app.put('/api/master/update', masterController.updateFile);

    app.post('/api/master/subscribe', masterController.subscribe);

    //NON PIU' NECESSARIO.
 //   app.post('/api/master/newChunk', masterController.sendChunkGuidToSlaves);


//    app.post('api/master/sendAck', masterController.addChunkGuidInTable);

 //   app.listen('http://172.17.0.3:6601', masterController.addChunkGuidInTable);



    //upload controller
    app.post('/api/master/newFileData', uploadControllerM.sendSlaveListAndGuid);
    app.post('/api/master/checkMetadata', uploadControllerM.checkAndSaveMetadata);


};