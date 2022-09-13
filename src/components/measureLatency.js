import download from "./download";
import stats from './stats'

const measureLatency = async () => {
  const measurements = [];

  for (let i = 0; i < 20; i += 1) {
    try {
      const response = await download(1000);
      // Server processing time
      measurements.push(
        response.ttfb - response.started - response.serverTiming
      );
    } catch (err) {
      console.log(err);
    }
  }

  return {
    latency: stats.median(measurements),
    jitter: stats.jitter(measurements),
  };
};

export default measureLatency;