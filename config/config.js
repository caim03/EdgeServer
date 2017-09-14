/**
 * Created by Caim03 on 13/09/17.
 */

/* File di configurazione */

var config = {
    port: 6601, // Porta di ascolto del server
    ip: '0.0.0.0', // Preleva l'indirizzo ip della macchina
    master: false, // Un server è dichiarato master se true quando la rete viene inizializzata
    balancerIp: '10.220.209.211', // Ip statico del load balancer
    balancerPort: 6602, // Porta di ascolto del load balancer
    balancerSubPath: '/api/lb/edge/subscribe', // Path di sottoscrizione del master al load balancer
    ageingTime: 3, // Scadenza dei chunkServer quando non rispondono al messaggio di heartbeat
    heartbeatTime: 10000, // Frequenza di heartbeat
    waitHeartbeat: 60000 // Tempo scaduto il quale si assume il fallimento del master per l'inizio dell'elezione

};

module.exports = config;