# Installazione

Installare `npm`, `nodejs` 

## Configurazione

Accedere alla cartella principale del progetto e digitare: `npm install`

Configurare i parametri dell'architettura master slave tramite il file: `config/config.js`

Aggiungere i file di configurazione di S3 e DynamoDB (`config/s3Configuration.js` e `config/dynamoConfiguration.js`)

## Parametri di configurazione

  - `Port`: indica la porta di ascolto del server
  - `balancerIp`: indica l'indirizzo IP del gateway
  - `balancerPort`: indica la porta di ascolto del gateway
  - `ageingTime`: indica il tempo di scadenza degli slave, oltre il quale si assume che lo slave abbia riscontrato un fallimento
  - `heartbeatTime`: indica la frequenza di invio dei messaggi di heartbeat
  - `waitHeartbeat`: indica il tempo di scadenza del master, oltre il quale si assume che il master sia fallito
  - `backupPeriodicTime`: indica la frequenza di backup dei file su S3
  - `replicationNumber`: indica il grado di replicazione dell'architettura

## Start della fog computing

  1. Lanciare un server master digitando: `node app.js master`
  2. Lanciare uno o più server slave digitando: `node app.js slave`


