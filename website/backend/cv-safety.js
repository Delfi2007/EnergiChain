// CV Safety stub - returns a simulated safety assessment
export function inspectImage(imageData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const outcomes = ['safe','minor_rust','critical_corrosion','valve_damage'];
      const choice = outcomes[Math.floor(Math.random()*outcomes.length)];
      resolve({ result: choice, confidence: Math.round(70 + Math.random()*30) });
    }, 400);
  });
}
