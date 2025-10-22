/**
 * Data Processing and Analytics Utilities
 * Advanced data manipulation, analysis, and visualization helpers
 */

class DataProcessor {
  /**
   * Calculate moving average
   */
  static movingAverage(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Calculate exponential moving average
   */
  static exponentialMovingAverage(data, period) {
    const multiplier = 2 / (period + 1);
    const result = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
    
    return result;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(data) {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sum, value) => {
      return sum + Math.pow(value - mean, 2);
    }, 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Normalize data to 0-1 range
   */
  static normalize(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    return data.map(value => (value - min) / range);
  }

  /**
   * Group data by key
   */
  static groupBy(data, key) {
    return data.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }

  /**
   * Calculate percentile
   */
  static percentile(data, p) {
    const sorted = [...data].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate correlation coefficient
   */
  static correlation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return numerator / denominator;
  }

  /**
   * Linear regression
   */
  static linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  /**
   * Polynomial regression
   */
  static polynomialRegression(x, y, degree) {
    const matrix = [];
    const vector = [];
    
    for (let i = 0; i <= degree; i++) {
      const row = [];
      for (let j = 0; j <= degree; j++) {
        let sum = 0;
        for (let k = 0; k < x.length; k++) {
          sum += Math.pow(x[k], i + j);
        }
        row.push(sum);
      }
      matrix.push(row);
      
      let sum = 0;
      for (let k = 0; k < x.length; k++) {
        sum += y[k] * Math.pow(x[k], i);
      }
      vector.push(sum);
    }
    
    return this.gaussianElimination(matrix, vector);
  }

  /**
   * Gaussian elimination for solving linear equations
   */
  static gaussianElimination(matrix, vector) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);
    
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }
      
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        for (let k = i; k <= n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
    
    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }
    
    return solution;
  }

  /**
   * K-means clustering
   */
  static kMeans(data, k, maxIterations = 100) {
    const centroids = data.slice(0, k).map(point => [...point]);
    let assignments = new Array(data.length);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      
      // Assign points to nearest centroid
      for (let i = 0; i < data.length; i++) {
        let minDist = Infinity;
        let cluster = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            cluster = j;
          }
        }
        
        if (assignments[i] !== cluster) {
          changed = true;
          assignments[i] = cluster;
        }
      }
      
      if (!changed) break;
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = this.calculateCentroid(clusterPoints);
        }
      }
    }
    
    return { centroids, assignments };
  }

  /**
   * Euclidean distance
   */
  static euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  /**
   * Calculate centroid of points
   */
  static calculateCentroid(points) {
    const dims = points[0].length;
    const centroid = new Array(dims).fill(0);
    
    for (const point of points) {
      for (let i = 0; i < dims; i++) {
        centroid[i] += point[i];
      }
    }
    
    return centroid.map(val => val / points.length);
  }

  /**
   * Time series decomposition
   */
  static decomposeTimeSeries(data, period) {
    const trend = this.movingAverage(data, period);
    const detrended = data.map((val, i) => trend[i] ? val - trend[i] : null);
    
    const seasonal = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    
    for (let i = 0; i < detrended.length; i++) {
      if (detrended[i] !== null) {
        seasonal[i % period] += detrended[i];
        counts[i % period]++;
      }
    }
    
    for (let i = 0; i < period; i++) {
      seasonal[i] = counts[i] > 0 ? seasonal[i] / counts[i] : 0;
    }
    
    const seasonalFull = data.map((_, i) => seasonal[i % period]);
    const residual = data.map((val, i) => {
      return trend[i] ? val - trend[i] - seasonalFull[i] : null;
    });
    
    return { trend, seasonal: seasonalFull, residual };
  }

  /**
   * Forecast using exponential smoothing
   */
  static exponentialSmoothing(data, alpha, periods = 1) {
    const forecast = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      forecast.push(alpha * data[i - 1] + (1 - alpha) * forecast[i - 1]);
    }
    
    for (let i = 0; i < periods; i++) {
      const nextValue = alpha * data[data.length - 1] + (1 - alpha) * forecast[forecast.length - 1];
      forecast.push(nextValue);
    }
    
    return forecast;
  }

  /**
   * Detect anomalies using Z-score
   */
  static detectAnomalies(data, threshold = 3) {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const std = this.standardDeviation(data);
    
    return data.map((value, index) => {
      const zScore = Math.abs((value - mean) / std);
      return {
        index,
        value,
        zScore,
        isAnomaly: zScore > threshold
      };
    });
  }

  /**
   * Calculate ROI (Return on Investment)
   */
  static calculateROI(initialInvestment, finalValue) {
    return ((finalValue - initialInvestment) / initialInvestment) * 100;
  }

  /**
   * Calculate CAGR (Compound Annual Growth Rate)
   */
  static calculateCAGR(beginningValue, endingValue, years) {
    return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
  }

  /**
   * Calculate Sharpe Ratio
   */
  static sharpeRatio(returns, riskFreeRate = 0) {
    const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
    const std = this.standardDeviation(returns);
    return (avgReturn - riskFreeRate) / std;
  }

  /**
   * Monte Carlo simulation
   */
  static monteCarloSimulation(mean, stdDev, steps, simulations) {
    const results = [];
    
    for (let i = 0; i < simulations; i++) {
      const path = [100]; // Starting value
      
      for (let j = 0; j < steps; j++) {
        const random = this.boxMullerTransform();
        const return_ = mean + stdDev * random;
        const nextValue = path[j] * (1 + return_);
        path.push(nextValue);
      }
      
      results.push(path);
    }
    
    return results;
  }

  /**
   * Box-Muller transform for normal distribution
   */
  static boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Calculate moving sum
   */
  static movingSum(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum);
    }
    return result;
  }

  /**
   * Interpolate missing values
   */
  static interpolate(data) {
    const result = [...data];
    
    for (let i = 0; i < result.length; i++) {
      if (result[i] === null || result[i] === undefined) {
        let prev = i - 1;
        let next = i + 1;
        
        while (prev >= 0 && (result[prev] === null || result[prev] === undefined)) prev--;
        while (next < result.length && (result[next] === null || result[next] === undefined)) next++;
        
        if (prev >= 0 && next < result.length) {
          const weight = (i - prev) / (next - prev);
          result[i] = result[prev] * (1 - weight) + result[next] * weight;
        } else if (prev >= 0) {
          result[i] = result[prev];
        } else if (next < result.length) {
          result[i] = result[next];
        }
      }
    }
    
    return result;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataProcessor;
}
