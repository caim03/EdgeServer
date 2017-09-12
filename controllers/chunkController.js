/**
 * Created by Caim03 on 12/09/17.
 */
exports.readFile = readFileFn;
exports.writeFile = writeFileFn;
exports.deleteFile = deleteFileFn;
exports.updateFile = updateFileFn;

function readFileFn(req, res) {
    res.send("HTTP GET");
}

function writeFileFn(req, res) {
    res.send("HTTP POST");
}

function deleteFileFn(req, res) {
    res.send("HTTP DELETE");
}

function updateFileFn(req, res) {
    res.send("HTTP PUT");
}