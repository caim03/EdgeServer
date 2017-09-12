/**
 * Created by Caim03 on 12/09/17.
 */
module.exports = function (app) {

    var chunkController = require('../controllers/chunkController');

    app.get('/api/chunk/read',chunkController.readFile);
    app.post('/api/chunk/write', chunkController.writeFile);
    app.delete('/api/chunk/delete', chunkController.deleteFile);
    app.put('/api/chunk/update', chunkController.updateFile);
}
