/**
 * Created by Caim03 on 12/09/17.
 */
module.exports = function (app) {

    var masterController = require('../controllers/masterController');

    /* REST API */

    app.get('/api/master/read', masterController.readFile);
    app.post('/api/master/write', masterController.writeFile);
    app.delete('/api/master/delete', masterController.deleteFile);
    app.put('/api/master/update', masterController.updateFile);

    app.post('/api/master/subscribe', masterController.subscribe);

};