import { Request, Response, NextFunction } from 'express';
import { PrometheusExpressOptions } from './prometheus-express-options';
import { collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { UrlDevaluer } from 'devalue-url';

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

export const promExpressMiddleware = (opts?: PrometheusExpressOptions) => {
    // configure middleware
    const options: PrometheusExpressOptions = defaultOptions;
    if (opts) {
        if (!opts.exposeMetrics
            && typeof opts.exposeMetrics !== 'undefined') {
            options.exposeMetrics = false;
        }
        if (opts.metricsRoute
            && typeof opts.metricsRoute === 'string'
            && opts.metricsRoute.length) {
            options.metricsRoute = opts.metricsRoute;
        }
        if (!opts.collectDefaultPrometheusMetrics
            && typeof opts.collectDefaultPrometheusMetrics !== 'undefined') {
            options.collectDefaultPrometheusMetrics = false;
        }
        if (!opts.collectRequestCounts
            && typeof opts.collectRequestCounts !== 'undefined') {
            options.collectRequestCounts = false;
        }
        if (opts.requestCounterMetricName
            && typeof opts.requestCounterMetricName === 'string'
            && opts.requestCounterMetricName.length) {
            options.requestCounterMetricName = opts.requestCounterMetricName;
        }
        if (!opts.collectRequestTimings
            && typeof opts.collectRequestTimings !== 'undefined') {
            options.collectRequestTimings = false;
        }
        if (opts.requestTimingMetricName
            && typeof opts.requestTimingMetricName === 'string'
            && opts.requestTimingMetricName.length) {
            options.requestTimingMetricName = opts.requestTimingMetricName;
        }
        if (opts.timingHistogramBuckets
            && Array.isArray(opts.timingHistogramBuckets)
            && opts.timingHistogramBuckets.length) {
            options.timingHistogramBuckets = opts.timingHistogramBuckets;
        }
        if (opts.prometheusDefaultCollectorOptions) {
            options.prometheusDefaultCollectorOptions = opts.prometheusDefaultCollectorOptions;
        }
    }

    const routeDevaluer = new UrlDevaluer();
    if (options.collectDefaultPrometheusMetrics) {
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
    
    const collectRouteAndMethodInfo = options.collectRequestCounts || options.collectRequestTimings;

    // return the middleware
    return (req: Request, res: Response, next: NextFunction): void => {
        let route: string = null;
        let method: string = null;
        if (collectRouteAndMethodInfo) {
            route = routeDevaluer.devalueUrl(req.path);
            method = req.method;
        }

        if (options.collectRequestCounts) {
            counter.labels(method, route).inc();
        }
        if (options.collectRequestTimings) {
            const start = Date.now();
            res.on('finish', () => {
                const end = Date.now();
                // give 1 decimal precision in milliseconds
                const responseTime = Math.round(10.0 * (end - start)) / 10.0;
                const groupedCode = groupStatusCode(res.statusCode);
                timings.labels(method, route, groupedCode).observe(responseTime);
            });
        }
    };
};
