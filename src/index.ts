import debugLibrary from 'debug';
import { UrlDevaluer } from 'devalue-url';
import { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';
import { PrometheusExpressOptions } from './prometheus-express-options';

const debug = debugLibrary('PROMEXPRESS');

/**
 * Sets up middleware for an express app which can report prometheus
 * metrics, request counts, and response times.
 * @param opts
 */
export const middleware = (
    opts?: PrometheusExpressOptions
): (
    req: Request, res: Response, next: NextFunction
) => void => {
    debug('setting up prometheus-express middleware');
    // configure middleware
    const options = parseOptions(opts);

    const routeDevaluer = new UrlDevaluer();
    if (options.collectDefaultPrometheusMetrics) {
        debug('starting prometheus default metric collection');
        collectDefaultMetrics(options.prometheusDefaultCollectorOptions);
    }

    let counter: Counter = null;
    if (options.collectRequestCounts) {
        counter = new Counter({
            name: options.requestCounterMetricName,
            help: 'Count of http requests, organized by method and route',
            labelNames: ['method', 'route']
        });
    }
    let timings: Histogram = null;
    if (options.collectRequestTimings) {
        timings = new Histogram({
            name: options.requestTimingMetricName,
            help: 'Response time of request, in milliseconds, organized by method, route, and status code group',
            labelNames: ['method', 'route', 'code'],
            buckets: options.timingHistogramBuckets
        });
    }

    // return the middleware
    return (req: Request, res: Response, next: NextFunction): void => {
        const route = routeDevaluer.devalueUrl(req.path);
        const method = req.method;

        debug(`received request: ${method} ${route}`);

        if (options.collectRequestCounts) {
            debug('incrementing request');
            counter.labels(method, route).inc();
        }

        if (options.collectRequestTimings) {
            const start = Date.now();
            res.on('finish', () => {
                const end = Date.now();
                // give 1 decimal precision in milliseconds
                const responseTime = Math.round(10.0 * (end - start)) / 10.0;
                const groupedCode = groupStatusCode(res.statusCode);
                debug(
                    `recording ${method} ${route} request with status code
                    ${res.statusCode} in status code group ${groupedCode}
                    with time ${responseTime}`
                );
                timings.labels(method, route, groupedCode).observe(responseTime);
            });
        }

        if (options.exposeMetrics && route === options.metricsRoute) {
            debug('metrics endpoint hit, returning prometheus metrics');
            res.set('Content-Type', register.contentType).send(register.metrics());
            return;
        }

        // pass along to next middleware/app
        next();
    };
};

const defaultOptions: PrometheusExpressOptions = {
    exposeMetrics: true,
    metricsRoute: '/metrics',
    collectDefaultPrometheusMetrics: true,
    collectRequestCounts: true,
    requestCounterMetricName: 'http_request_count',
    collectRequestTimings: true,
    requestTimingMetricName: 'http_response_time',
    timingHistogramBuckets: [1, 5, 10, 15, 20, 50, 100, 200, 500, 1000, 1500, 2000, 5000, 10000, 20000],
    prometheusDefaultCollectorOptions: null
};

/**
 * Splits out the logic for parsing options
 * @param opts
 * @returns nice and tidy options
 */
const parseOptions = (opts: PrometheusExpressOptions): PrometheusExpressOptions => {
    const options = defaultOptions;
    if (opts) {
        debug('parsing passed options');
        if (
            !opts.exposeMetrics
            && typeof opts.exposeMetrics !== 'undefined'
        ) {
            debug('disabling exposeMetrics');
            options.exposeMetrics = false;
        }
        if (
            opts.metricsRoute
            && typeof opts.metricsRoute === 'string'
            && opts.metricsRoute.length
        ) {
            debug('overwriting default metrics path from /metrics to ' + opts.metricsRoute);
            options.metricsRoute = opts.metricsRoute;
        }
        if (
            !opts.collectDefaultPrometheusMetrics
            && typeof opts.collectDefaultPrometheusMetrics !== 'undefined'
        ) {
            debug('disabling collection of default prometheus metrics');
            options.collectDefaultPrometheusMetrics = false;
        }
        if (
            !opts.collectRequestCounts
            && typeof opts.collectRequestCounts !== 'undefined'
        ) {
            debug('disabling collection of request counts');
            options.collectRequestCounts = false;
        }
        if (
            opts.requestCounterMetricName
            && typeof opts.requestCounterMetricName === 'string'
            && opts.requestCounterMetricName.length
        ) {
            debug('overwriting the request counter metric name to ' + opts.requestCounterMetricName);
            options.requestCounterMetricName = opts.requestCounterMetricName;
        }
        if (
            !opts.collectRequestTimings
            && typeof opts.collectRequestTimings !== 'undefined'
        ) {
            debug('disabling collection of request response times');
            options.collectRequestTimings = false;
        }
        if (
            opts.requestTimingMetricName
            && typeof opts.requestTimingMetricName === 'string'
            && opts.requestTimingMetricName.length
        ) {
            debug('overwriting the response time metric name to ' + opts.requestCounterMetricName);
            options.requestTimingMetricName = opts.requestTimingMetricName;
        }
        if (
            opts.timingHistogramBuckets
            && Array.isArray(opts.timingHistogramBuckets)
            && opts.timingHistogramBuckets.length
        ) {
            debug('overwriting request timing histogram buckets to [' + opts.timingHistogramBuckets.join(', ') + ']');
            options.timingHistogramBuckets = opts.timingHistogramBuckets;
        }
        if (opts.prometheusDefaultCollectorOptions) {
            debug('using passed prometheus default collector options');
            options.prometheusDefaultCollectorOptions = opts.prometheusDefaultCollectorOptions;
        }
    }

    return options;
};

/**
 * Groups status codes together into 1XX, 2XX, 3XX, 4XX, 5XX, and ERR categories
 * @param code {number}
 * @returns {string}
 */
const groupStatusCode = (code: number): string => {
    if (code < 100) {
        return 'ERR';
    } else if (code < 200) {
        return '1XX';
    } else if (code < 300) {
        return '2XX';
    } else if (code < 400) {
        return '3XX';
    } else if (code < 500) {
        return '4XX';
    } else if (code < 600) {
        return '5XX';
    } else {
        return 'ERR';
    }
};
