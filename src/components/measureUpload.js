import upload from "./upload";
import calculateSpeed from "./calculateSpeed";

const measureUpload = async (bytes, iterations) => {
  const measurements = [];

  for (let i = 0; i < iterations; i += 1) {
    try {
      const response = await upload(bytes);
      const transferTime = response.serverTiming;
      measurements.push(calculateSpeed(bytes, transferTime));
    } catch (err) {
      console.log(err);
    }
  }

  return measurements;
};

export default measureUpload;