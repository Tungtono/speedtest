import download from "./download";
import calculateSpeed from "./calculateSpeed";

const measureDownload = async (bytes, iterations) => {
  const measurements = [];

  for (let i = 0; i < iterations; i += 1) {
    try {
      const response = await download(bytes);
      const transferTime = response.ended - response.ttfb;
      measurements.push(calculateSpeed(bytes, transferTime));
    } catch (err) {
      console.log(err);
    }
  }

  return measurements;
};

export default measureDownload;
