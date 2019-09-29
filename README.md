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
app.use(promExpress.middleware());

// ... your code
```

Using with TypeScrypt:

```ts
import express from 'express';
import promExpress from 'prometheus-express';
const app = express();
app.use(promExpress.middleware());

// ... your code
```
