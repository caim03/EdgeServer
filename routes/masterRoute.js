/**
 * Created by Caim03 on 12/09/17.
 * Questo file contiene tutte le rotte per le richieste effettuate al master.
 */
module.exports = function (app) {

    var masterController = require('../controllers/master/masterController');
    var topologyController = require('../controllers/master/topologyController');
    var uploadControllerM = require('../controllers/master/uploadControllerM');
    var readFileControllerM = require('../controllers/master/readFileControllerM');

    /* REST API */

    app.post('/api/master/subscribe', topologyController.subscribe);

    //  NON PIU' NECESSARIO.
    //  app.post('/api/master/newChunk', masterController.sendChunkGuidToSlaves);


    //  app.post('api/master/sendAck', masterController.addChunkGuidInTable);

    //  app.listen('http://172.17.0.3:6601', masterController.addChunkGuidInTable);


    /* Upload controller API */

    app.post('/api/master/newFileData', uploadControllerM.sendSlaveListAndGuid);
    app.post('/api/master/checkMetadata', uploadControllerM.checkAndSaveMetadata);
    app.post('/api/master/getDirectoryTree', readFileControllerM.getAllMetadata);
    app.post('/api/master/readFile', readFileControllerM.getReadSlaves);


};