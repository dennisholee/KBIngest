/**
 * Performance Metrics Collection and Monitoring
 * 
 * Tracks query execution time, throughput, resource usage, and system health.
 */

/**
 * Metrics for a single operation
 */
export interface OperationMetrics {
  name: string;
  executionMs: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Aggregated metrics over time window
 */
export interface MetricsSnapshot {
  operationName: string;
  count: number;
  avgExecutionMs: number;
  minExecutionMs: number;
  maxExecutionMs: number;
  p50ExecutionMs: number;
  p95ExecutionMs: number;
  p99ExecutionMs: number;
  successRate: number;
  errorCount: number;
  throughput: number; // ops/sec
}

/**
 * System-wide metrics
 */
export interface SystemMetrics {
  startTime: number;
  uptime: number;
  totalOperations: number;
  successCount: number;
  errorCount: number;
  avgExecutionMs: number;
  peakThroughput: number;
  operationMetrics: Map<string, OperationMetrics[]>;
}

/**
 * PerformanceMonitor: Tracks and aggregates metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, OperationMetrics[]> = new Map();
  private startTime: number = Date.now();
  private readonly maxMetricsPerOp: number;
  private totalOperations = 0;
  private successCount = 0;
  private errorCount = 0;

  constructor(maxMetricsPerOp: number = 1000) {
    this.maxMetricsPerOp = maxMetricsPerOp;
  }

  /**
   * Record metric for an operation
   */
  recordMetric(name: string, executionMs: number, success: boolean, error?: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const opMetrics = this.metrics.get(name)!;
    opMetrics.push({
      name,
      executionMs,
      timestamp: Date.now(),
      success,
      error,
    });

    // Trim old metrics if exceeded max
    if (opMetrics.length > this.maxMetricsPerOp) {
      opMetrics.splice(0, opMetrics.length - this.maxMetricsPerOp);
    }

    this.totalOperations++;
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  /**
   * Get snapshot of metrics for operation
   */
  getOperationMetrics(operationName: string): MetricsSnapshot | null {
    const ops = this.metrics.get(operationName);
    if (!ops || ops.length === 0) {
      return null;
    }

    const times = ops.map((m) => m.executionMs).sort((a, b) => a - b);
    const errors = ops.filter((m) => !m.success).length;
    const timeWindow = (ops[ops.length - 1].timestamp - ops[0].timestamp) / 1000; // seconds

    return {
      operationName,
      count: ops.length,
      avgExecutionMs: times.reduce((a, b) => a + b, 0) / times.length,
      minExecutionMs: times[0],
      maxExecutionMs: times[times.length - 1],
      p50ExecutionMs: this._percentile(times, 0.5),
      p95ExecutionMs: this._percentile(times, 0.95),
      p99ExecutionMs: this._percentile(times, 0.99),
      successRate: ((ops.length - errors) / ops.length) * 100,
      errorCount: errors,
      throughput: timeWindow > 0 ? ops.length / timeWindow : 0,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricsSnapshot[] {
    const snapshots: MetricsSnapshot[] = [];
    for (const opName of this.metrics.keys()) {
      const snapshot = this.getOperationMetrics(opName);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }
    return snapshots;
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): SystemMetrics {
    const allMetrics = this.getAllMetrics();
    const peakThroughput = Math.max(...allMetrics.map((m) => m.throughput), 0);

    return {
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
      totalOperations: this.totalOperations,
      successCount: this.successCount,
      errorCount: this.errorCount,
      avgExecutionMs:
        this.totalOperations > 0
          ? Array.from(this.metrics.values())
              .flat()
              .reduce((sum, m) => sum + m.executionMs, 0) / this.totalOperations
          : 0,
      peakThroughput,
      operationMetrics: this.metrics,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.startTime = Date.now();
    this.totalOperations = 0;
    this.successCount = 0;
    this.errorCount = 0;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): object {
    const systemMetrics = this.getSystemMetrics();
    const allOps = this.getAllMetrics();

    return {
      system: {
        uptime: systemMetrics.uptime,
        totalOperations: systemMetrics.totalOperations,
        successCount: systemMetrics.successCount,
        errorCount: systemMetrics.errorCount,
        avgExecutionMs: systemMetrics.avgExecutionMs.toFixed(2),
        peakThroughput: systemMetrics.peakThroughput.toFixed(2),
      },
      operations: allOps.map((m) => ({
        name: m.operationName,
        count: m.count,
        avgExecutionMs: m.avgExecutionMs.toFixed(2),
        minExecutionMs: m.minExecutionMs.toFixed(2),
        maxExecutionMs: m.maxExecutionMs.toFixed(2),
        p50ExecutionMs: m.p50ExecutionMs.toFixed(2),
        p95ExecutionMs: m.p95ExecutionMs.toFixed(2),
        p99ExecutionMs: m.p99ExecutionMs.toFixed(2),
        successRate: m.successRate.toFixed(2),
        errorCount: m.errorCount,
        throughput: m.throughput.toFixed(2),
      })),
    };
  }

  /**
   * Calculate percentile
   */
  private _percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Decorator to auto-track method execution
 * Usage: @trackMetrics() searchFts() {}
 */
export function trackMetrics(monitor: PerformanceMonitor) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const executionMs = Date.now() - startTime;
        monitor.recordMetric(propertyKey, executionMs, true);
        return result;
      } catch (error) {
        const executionMs = Date.now() - startTime;
        monitor.recordMetric(propertyKey, executionMs, false, String(error));
        throw error;
      }
    };

    return descriptor;
  };
}
