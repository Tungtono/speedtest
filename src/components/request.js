import https from "https-browserify";

const request = (options, data = "") => {
  const resultData = {
    started: 0,
    ttfb: 0,
    ended: 0,
    serverTiming: 0,
  };

  return new Promise((resolve, reject) => {
    resultData.started = performance.now();
    const req = https.request(options, (res) => {
      res.once("readable", () => {
        resultData.ttfb = performance.now();
      });
      res.on("data", () => {});
      res.on("end", () => {
        resultData.ended = performance.now();
        resultData.serverTiming = parseFloat(
          res.headers["server-timing"].split("=")[1]
        );
        resolve(resultData);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

export default request