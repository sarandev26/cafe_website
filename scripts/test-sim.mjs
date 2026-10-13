function simulate() {
  const FIXED_STEP = 1 / 120;
  const k = 7.5;
  const decay = 1 - Math.exp(-FIXED_STEP * k);
  const maxVelocity = 180; // frames per sec
  const maxStepDelta = maxVelocity * FIXED_STEP;

  let pos = 0;
  let target = 0;
  let accumulator = 0;

  const samples = [];

  // Simulate scrolling from 0 to 192 frames over 2.5 seconds (76.8 fps target)
  const dtSim = 1 / 60; // 60Hz display
  for (let t = 0; t <= 2.5; t += dtSim) {
    target = Math.min(192, (t / 2.5) * 192);

    accumulator += Math.min(dtSim, 1 / 30);
    while (accumulator >= FIXED_STEP) {
      accumulator -= FIXED_STEP;
      let delta = (target - pos) * decay;
      if (Math.abs(delta) > maxStepDelta) {
        delta = Math.sign(delta) * maxStepDelta;
      }
      pos += delta;
    }

    samples.push({ t: Math.round(t * 1000), target: Math.round(target * 100) / 100, pos: Math.round(pos * 100) / 100, error: Math.round(Math.abs(target - pos) * 100) / 100 });
  }

  const maxError = Math.max(...samples.map((s) => s.error));
  console.log("Max Error:", maxError);
  console.log("Sample at 1.0s:", samples.find((s) => s.t === 1000));
}

simulate();
