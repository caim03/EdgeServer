/**
 * Created by Debora on 23/10/17.
 */

var loki = require('lokijs');

var lokiDb = new loki();

exports.addNewReq = addNewReqFn;
exports.removeReq = removeReqFn;
exports.checkIfPending = checkIfPendingFn;
exports.printTable = printTableFn;

//Per ogni richiesta in attesa dopo un timeout vengono cancellate se non richiesti i guid dal client.
//Ha senso questo passaggio???????

//Richieste di scrittura file autorizzate dal master e in attesa di file dal client.
var pendingReqTable = lokiDb.addCollection('pendingReqTable');

function addNewReqFn(chunkGuid, idUser)
{
    var foundGuid_User = pendingReqTable.findObject({'chunkguid': chunkGuid, 'idUser': idUser});
    if(!foundGuid_User) {
        pendingReqTable.insert({'chunkguid': chunkGuid, 'idUser': idUser});
   //     console.log(".....AGGIUNTO IN TABELLA.....");
    }
    else console.log(chunkGuid+"-"+idUser+" già presente tra le richieste pendenti.");
}


function removeReqFn(chunkGuid, idUser) {
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingReqTable.findObject(obj);
  //  console.log("var: "+foundGuid_User);
    if(foundGuid_User)
    {
        pendingReqTable.chain().find(obj).remove();
    }
}


function checkIfPendingFn(chunkGuid, idUser) {

    var pending = false;
    var obj = {'chunkguid': chunkGuid, 'idUser': idUser};
    var foundGuid_User = pendingReqTable.findObject(obj);

    if(foundGuid_User)
        pending = true;
    return pending;
}


function printTableFn()
{
    pendingReqTable.chain().data().forEach(function (table) {
        console.log(table)
    });

}


//EXAMPLE OF USE.

//addNewReqFn("317951a9-86d5-422a-df56-56990f2419a2", "Root");
//addNewReqFn("defg", "deb");
//addNewReqFn("ciao", "mamma");
/*addNewReqFn("defg", "deb");

console.log("PRIMAAAAAAAAAAAAAAAAAAAAAAAAAA: ");
console.log(pendingReqTable.data);

removeReqFn("ciao","deb");

console.log("DOPOOOOOOOOOOOOOOOOOOOO: ");
console.log(pendingReqTable.data);

console.log("CHECKKKKKKKKKKK");
console.log(checkIfPendingFn("317951a9-86d5-422a-df56-56990f2419a2", "Root"));

console.log("TABELLA\n");
printTableFn();
*/