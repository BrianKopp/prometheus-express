# Prometheus-Express

`prometheus-express` is a simple to use, extensible express plugin to serve
request statistics through prometheus.

## Getting Started

### Installation

```bash
npm install --save prometheus-express
```

### Usage

Using with JavaScript:

```js
const express = require('express');
const promExpress = require('prometheus-express');
const app = express();
app.use(promExpress.instrumentExpress());

// ... your code
```

Using with TypeScrypt:

```ts
import express from 'express';
import promExpress from 'prometheus-express';
const app = express();
app.use(promExpress.instrumentExpress());

// ... your code
```

Expose metrics on different port, different express app.

```js
const express = require('express');
const promExpress = require('prometheus-express');
const mainApp = express();
mainApp.use(promExpress.instrumentExpress({exposeMetrics: false}));
mainApp.listen(3000, (e) => {
    console.log('listening on a friendly 3000 port serving public traffic');
});

const metricsApp = express();
metricsApp.use(promExpress.exposeMetrics());
metricsApp.listen(3001, (e) => {
    console.log('exposing metrics for mainApp on port 3001, which isn\'t serving public traffic');
});
```
