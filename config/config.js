/**
 * Created by Caim03 on 13/09/17.
 */

/* File di configurazione */

var config = {
    port: 6601, // Porta di ascolto del server
    ip: '0.0.0.0', // Preleva l'indirizzo ip della macchina
    balancerIp: "34.195.19.72", //'34.195.19.72', // Ip statico del load balancer.
    balancerPort: 6602, // Porta di ascolto del load balancer
    balancerSubPath: '/api/lb/edge/subscribe', // Path di sottoscrizione del master al load balancer
    balancerNotify: '/api/lb/edge/notifyDelete', // Path per notificare la delete alle altre fog
    ageingTime: 3, // Scadenza dei chunkServer quando non rispondono al messaggio di heartbeat
    heartbeatTime: 10000, // Frequenza di heartbeat
    waitHeartbeat: 20000, // Tempo scaduto il quale si assume il fallimento del master per l'inizio dell'elezione
    randomGuidTime: 15000,   //Tempo scaduto il quale viene simulato l'arrivo di un nuovo guid per il chunk al master.
    backupPeriodicTime: 30000, // Frequenza di backup su S3
    replicationNumber:3 // Numero di replice per file
};

module.exports = config;
