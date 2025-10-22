/**
 * Machine Learning Utilities for EnergiChain
 * Client-side ML models for demand forecasting and pattern recognition
 */

class MLPredictor {
  constructor() {
    this.models = {};
    this.scaler = null;
  }

  /**
   * Simple Neural Network implementation
   */
  static createNeuralNetwork(inputSize, hiddenSize, outputSize) {
    return {
      weightsIH: this.randomMatrix(inputSize, hiddenSize),
      weightsHO: this.randomMatrix(hiddenSize, outputSize),
      biasH: new Array(hiddenSize).fill(0).map(() => Math.random() - 0.5),
      biasO: new Array(outputSize).fill(0).map(() => Math.random() - 0.5),
      learningRate: 0.1
    };
  }

  /**
   * Create random matrix for neural network weights
   */
  static randomMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = Math.random() - 0.5;
      }
    }
    return matrix;
  }

  /**
   * Sigmoid activation function
   */
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Sigmoid derivative
   */
  static sigmoidDerivative(x) {
    return x * (1 - x);
  }

  /**
   * ReLU activation function
   */
  static relu(x) {
    return Math.max(0, x);
  }

  /**
   * ReLU derivative
   */
  static reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }

  /**
   * Softmax activation
   */
  static softmax(values) {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  /**
   * Forward propagation
   */
  static forwardPropagation(network, inputs) {
    // Hidden layer
    const hidden = [];
    for (let i = 0; i < network.weightsIH[0].length; i++) {
      let sum = network.biasH[i];
      for (let j = 0; j < inputs.length; j++) {
        sum += inputs[j] * network.weightsIH[j][i];
      }
      hidden.push(this.sigmoid(sum));
    }

    // Output layer
    const output = [];
    for (let i = 0; i < network.weightsHO[0].length; i++) {
      let sum = network.biasO[i];
      for (let j = 0; j < hidden.length; j++) {
        sum += hidden[j] * network.weightsHO[j][i];
      }
      output.push(this.sigmoid(sum));
    }

    return { hidden, output };
  }

  /**
   * Back propagation
   */
  static backPropagation(network, inputs, targets, hidden, output) {
    const lr = network.learningRate;

    // Calculate output errors
    const outputErrors = output.map((o, i) => targets[i] - o);
    const outputGradients = output.map((o, i) => 
      outputErrors[i] * this.sigmoidDerivative(o) * lr
    );

    // Update weights hidden -> output
    for (let i = 0; i < hidden.length; i++) {
      for (let j = 0; j < output.length; j++) {
        network.weightsHO[i][j] += hidden[i] * outputGradients[j];
      }
    }

    // Update output bias
    for (let i = 0; i < output.length; i++) {
      network.biasO[i] += outputGradients[i];
    }

    // Calculate hidden errors
    const hiddenErrors = hidden.map((_, i) => {
      let error = 0;
      for (let j = 0; j < output.length; j++) {
        error += outputErrors[j] * network.weightsHO[i][j];
      }
      return error;
    });

    const hiddenGradients = hidden.map((h, i) =>
      hiddenErrors[i] * this.sigmoidDerivative(h) * lr
    );

    // Update weights input -> hidden
    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < hidden.length; j++) {
        network.weightsIH[i][j] += inputs[i] * hiddenGradients[j];
      }
    }

    // Update hidden bias
    for (let i = 0; i < hidden.length; i++) {
      network.biasH[i] += hiddenGradients[i];
    }
  }

  /**
   * Train neural network
   */
  static trainNeuralNetwork(network, trainingData, epochs = 1000) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const { input, output: target } of trainingData) {
        const { hidden, output } = this.forwardPropagation(network, input);
        this.backPropagation(network, input, target, hidden, output);
      }
    }
    return network;
  }

  /**
   * Predict using neural network
   */
  static predict(network, inputs) {
    const { output } = this.forwardPropagation(network, inputs);
    return output;
  }

  /**
   * Decision Tree Node
   */
  static createDecisionTreeNode(feature = null, threshold = null, left = null, right = null, value = null) {
    return { feature, threshold, left, right, value };
  }

  /**
   * Calculate Gini impurity
   */
  static giniImpurity(groups) {
    const total = groups.reduce((sum, group) => sum + group.length, 0);
    let gini = 0;

    for (const group of groups) {
      if (group.length === 0) continue;
      const proportion = group.length / total;
      const classes = {};
      
      for (const item of group) {
        classes[item.label] = (classes[item.label] || 0) + 1;
      }

      let impurity = 1;
      for (const count of Object.values(classes)) {
        const p = count / group.length;
        impurity -= p * p;
      }

      gini += proportion * impurity;
    }

    return gini;
  }

  /**
   * Split dataset
   */
  static splitDataset(data, feature, threshold) {
    const left = data.filter(item => item.features[feature] < threshold);
    const right = data.filter(item => item.features[feature] >= threshold);
    return [left, right];
  }

  /**
   * Find best split
   */
  static findBestSplit(data, features) {
    let bestGini = Infinity;
    let bestSplit = null;

    for (const feature of features) {
      const values = [...new Set(data.map(item => item.features[feature]))].sort((a, b) => a - b);
      
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const groups = this.splitDataset(data, feature, threshold);
        const gini = this.giniImpurity(groups);

        if (gini < bestGini) {
          bestGini = gini;
          bestSplit = { feature, threshold, groups };
        }
      }
    }

    return bestSplit;
  }

  /**
   * Build decision tree
   */
  static buildDecisionTree(data, features, maxDepth = 10, minSamples = 2, depth = 0) {
    const labels = data.map(item => item.label);
    const uniqueLabels = [...new Set(labels)];

    // Stopping criteria
    if (uniqueLabels.length === 1 || depth >= maxDepth || data.length < minSamples) {
      const counts = {};
      for (const label of labels) {
        counts[label] = (counts[label] || 0) + 1;
      }
      const value = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      return this.createDecisionTreeNode(null, null, null, null, value);
    }

    // Find best split
    const split = this.findBestSplit(data, features);
    if (!split) {
      const counts = {};
      for (const label of labels) {
        counts[label] = (counts[label] || 0) + 1;
      }
      const value = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      return this.createDecisionTreeNode(null, null, null, null, value);
    }

    // Recursive build
    const left = this.buildDecisionTree(split.groups[0], features, maxDepth, minSamples, depth + 1);
    const right = this.buildDecisionTree(split.groups[1], features, maxDepth, minSamples, depth + 1);

    return this.createDecisionTreeNode(split.feature, split.threshold, left, right);
  }

  /**
   * Predict with decision tree
   */
  static predictDecisionTree(tree, features) {
    if (tree.value !== null) {
      return tree.value;
    }

    if (features[tree.feature] < tree.threshold) {
      return this.predictDecisionTree(tree.left, features);
    } else {
      return this.predictDecisionTree(tree.right, features);
    }
  }

  /**
   * K-Nearest Neighbors
   */
  static knnPredict(trainingData, testPoint, k = 3) {
    const distances = trainingData.map(item => ({
      distance: this.euclideanDistance(item.features, testPoint),
      label: item.label
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const neighbors = distances.slice(0, k);

    const votes = {};
    for (const neighbor of neighbors) {
      votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
    }

    return Object.entries(votes).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  /**
   * Euclidean distance
   */
  static euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  /**
   * LSTM Cell (simplified)
   */
  static lstmCell(input, prevHidden, prevCell, weights) {
    // Forget gate
    const forget = this.sigmoid(
      input * weights.forgetInput + prevHidden * weights.forgetHidden + weights.forgetBias
    );

    // Input gate
    const inputGate = this.sigmoid(
      input * weights.inputGateInput + prevHidden * weights.inputGateHidden + weights.inputGateBias
    );

    // Cell candidate
    const cellCandidate = Math.tanh(
      input * weights.cellInput + prevHidden * weights.cellHidden + weights.cellBias
    );

    // New cell state
    const newCell = forget * prevCell + inputGate * cellCandidate;

    // Output gate
    const outputGate = this.sigmoid(
      input * weights.outputInput + prevHidden * weights.outputHidden + weights.outputBias
    );

    // New hidden state
    const newHidden = outputGate * Math.tanh(newCell);

    return { hidden: newHidden, cell: newCell };
  }

  /**
   * Time series forecast using simple LSTM
   */
  static forecastTimeSeries(data, steps = 10) {
    // Simple LSTM-inspired forecast
    const weights = {
      forgetInput: 0.5, forgetHidden: 0.5, forgetBias: 0,
      inputGateInput: 0.5, inputGateHidden: 0.5, inputGateBias: 0,
      cellInput: 0.5, cellHidden: 0.5, cellBias: 0,
      outputInput: 0.5, outputHidden: 0.5, outputBias: 0
    };

    let hidden = 0;
    let cell = 0;

    // Process historical data
    for (const value of data) {
      const result = this.lstmCell(value, hidden, cell, weights);
      hidden = result.hidden;
      cell = result.cell;
    }

    // Generate forecast
    const forecast = [];
    let lastValue = data[data.length - 1];

    for (let i = 0; i < steps; i++) {
      const result = this.lstmCell(lastValue, hidden, cell, weights);
      hidden = result.hidden;
      cell = result.cell;
      lastValue = hidden * (data[data.length - 1] - data[data.length - 2]) + data[data.length - 1];
      forecast.push(lastValue);
    }

    return forecast;
  }

  /**
   * Feature scaling (Min-Max)
   */
  static minMaxScale(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    return {
      scaled: data.map(val => (val - min) / range),
      min,
      max,
      inverse: (scaled) => scaled * range + min
    };
  }

  /**
   * Feature scaling (Standard)
   */
  static standardScale(data) {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    return {
      scaled: data.map(val => (val - mean) / std),
      mean,
      std,
      inverse: (scaled) => scaled * std + mean
    };
  }

  /**
   * Cross-validation split
   */
  static kFoldSplit(data, k = 5) {
    const folds = [];
    const foldSize = Math.floor(data.length / k);
    
    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = i === k - 1 ? data.length : (i + 1) * foldSize;
      folds.push(data.slice(start, end));
    }
    
    return folds;
  }

  /**
   * Calculate accuracy
   */
  static calculateAccuracy(predictions, actuals) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === actuals[i]) correct++;
    }
    return correct / predictions.length;
  }

  /**
   * Calculate MSE (Mean Squared Error)
   */
  static calculateMSE(predictions, actuals) {
    let sumSquaredError = 0;
    for (let i = 0; i < predictions.length; i++) {
      sumSquaredError += Math.pow(predictions[i] - actuals[i], 2);
    }
    return sumSquaredError / predictions.length;
  }

  /**
   * Calculate RMSE (Root Mean Squared Error)
   */
  static calculateRMSE(predictions, actuals) {
    return Math.sqrt(this.calculateMSE(predictions, actuals));
  }

  /**
   * Calculate MAE (Mean Absolute Error)
   */
  static calculateMAE(predictions, actuals) {
    let sumAbsError = 0;
    for (let i = 0; i < predictions.length; i++) {
      sumAbsError += Math.abs(predictions[i] - actuals[i]);
    }
    return sumAbsError / predictions.length;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLPredictor;
}
