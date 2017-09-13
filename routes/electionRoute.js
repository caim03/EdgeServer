/**
 * Created by Caim03 on 13/09/17.
 */

module.exports = function(app) {

    var electionController = require('../controllers/electionController');

    app.post('/api/election/election', electionController.bullyElection);
    app.post('/api/election/proclamation', electionController.bullyProclamation);
};