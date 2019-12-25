const promExpress = require('prometheus-express');
const app = require('express')();

app.use(promExpress.middleware());

app.get('/', (req, res) => {
    res.send('hit /');
});

app.get('/ids/:id', (req, res) => {
    res.send('hit /ids/:id');
});

app.put('/ids/:id', (req, res) => {
    res.send('hit /ids/:id at PUT method');
});

const server = app.listen(3000, () => {
    console.log('listening on 3000');
});

const shutdown = (signal) => {
    console.log('received shutdown signal: ' + signal);
    server.close((e) => {
        if (e) {
            console.error('error closing server: ', e);
            process.exit(1);
        } else {
            console.log('closed server!');
            process.exit(0);
        }
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
