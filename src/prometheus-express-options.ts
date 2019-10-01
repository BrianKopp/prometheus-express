import { DefaultMetricsCollectorConfiguration } from 'prom-client';

export interface PrometheusExpressOptions {
    exposeMetrics?: boolean;
    metricsRoute?: string;
    collectDefaultPrometheusMetrics?: boolean;
    collectRequestCounts?: boolean;
    requestCounterMetricName?: string;
    collectRequestTimings?: boolean;
    requestTimingMetricName?: string;
    timingHistogramBuckets?: number[];
    prometheusDefaultCollectorOptions?: DefaultMetricsCollectorConfiguration;
}
