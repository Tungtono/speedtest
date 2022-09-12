import https from "https-browserify";
import { useState, useEffect } from "react";
import stats from "./stats";

const App = () => {
  const [city, setCity] = useState("");
  const [ip, setIp] = useState("");
  const [latency, setLatency] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [speed, setSpeed] = useState({
    down100Kb: 0,
    down1Mb: 0,
    down10Mb: 0,
    down25Mb: 0,
    down100Mb: 0,
    downSpeed: 0,
    upSpeed: 0,
  });
  const [progress, setProgress] = useState({
    latency: false,
    jitter: false,
    down100Kb: false,
    down1Mb: false,
    down10Mb: false,
    down25Mb: false,
    down100Mb: false,
    downAll: false,
    upAll: false,
  });

  const fetchAllServerLoc = async () => {
    const response = await fetch("https://speed.cloudflare.com/locations");
    const data = await response.json();
    return data;
  };
  const parseCdnCgiTrace = (text) => {
    const cdnCgiObj = {};
    const data = text.split("\n");
    data.forEach((item) => {
      const pair = item.split("=");
      cdnCgiObj[pair[0]] = pair[1];
    });
    return cdnCgiObj;
  };
  const fetchCdnCgiTrace = async () => {
    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
    const rawData = await response.text();
    const data = parseCdnCgiTrace(rawData);
    setIp(data.ip);
    const allServers = await fetchAllServerLoc();
    const myServer = allServers.find((item) => item.iata === data.colo);
    setCity(myServer.city);
  };

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

  const download = (bytes) => {
    const options = {
      hostname: "speed.cloudflare.com",
      path: `/__down?bytes=${bytes}`,
      method: "GET",
    };

    return request(options);
  };

  const upload = (bytes) => {
    const data = "0".repeat(bytes);
    const options = {
      hostname: "speed.cloudflare.com",
      path: "/__up",
      method: "POST",
      headers: {
        "Content-Length": Buffer.byteLength(data),
      },
    };

    return request(options, data);
  };

  const calculateSpeed = (bytes, duration) => {
    return (bytes * 8) / (duration / 1000) / 1e6;
  };

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

  const speedTest = async () => {
    const ping = await measureLatency();
    setLatency(ping.latency.toFixed(2));
    setProgress((prevState) => ({
      ...prevState,
      latency: true,
    }));
    setJitter(ping.jitter.toFixed(2));
    setProgress((prevState) => ({
      ...prevState,
      jitter: true,
    }));

    const testDown100k = await measureDownload(101000, 10);
    setSpeed((prevState) => ({
      ...prevState,
      down100Kb: stats.median(testDown100k).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down100Kb: true,
    }));

    const testDown1m = await measureDownload(1001000, 8);
    setSpeed((prevState) => ({
      ...prevState,
      down1Mb: stats.median(testDown1m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down1Mb: true,
    }));

    const testDown10m = await measureDownload(10001000, 6);
    setSpeed((prevState) => ({
      ...prevState,
      down10Mb: stats.median(testDown10m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down10Mb: true,
    }));

    const testDown25m = await measureDownload(25001000, 4);
    setSpeed((prevState) => ({
      ...prevState,
      down25Mb: stats.median(testDown25m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down25Mb: true,
    }));

    const testDown100m = await measureDownload(100001000, 1);
    setSpeed((prevState) => ({
      ...prevState,
      down100Mb: stats.median(testDown100m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down100Mb: true,
    }));

    const downloadTests = [
      ...testDown100k,
      ...testDown1m,
      ...testDown10m,
      ...testDown25m,
      ...testDown100m,
    ];
    setSpeed((prevState) => ({
      ...prevState,
      downSpeed: stats.quartile(downloadTests, 0.9).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      downAll: true,
    }));

    const testUp1 = await measureUpload(11000, 10);
    const testUp2 = await measureUpload(101000, 10);
    const testUp3 = await measureUpload(1001000, 10);
    const uploadTests = [...testUp1, ...testUp2, ...testUp3];
    setSpeed((prevState) => ({
      ...prevState,
      upSpeed: stats.quartile(uploadTests, 0.9).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      upAll: true,
    }));
  };

  useEffect(() => {
    fetchCdnCgiTrace();
    speedTest();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="text-center">
      <p>Your IP is: {ip}</p>
      <p>Fetching from the nearest server: {city}</p>
      <p>Latency: {progress.latency ? `${latency}ms` : `running tests`}</p>
      <p>Jitter: {progress.jitter ? `${jitter}ms` : `running tests`}</p>
      <p>
        100kb: {progress.down100Kb ? `${speed.down100Kb}Mbps` : `running tests`}
      </p>
      <p>1Mb: {progress.down1Mb ? `${speed.down1Mb}Mbps` : `running tests`}</p>
      <p>
        10Mb: {progress.down10Mb ? `${speed.down10Mb}Mbps` : `running tests`}
      </p>
      <p>
        25Mb: {progress.down25Mb ? `${speed.down25Mb}Mbps` : `running tests`}
      </p>
      <p>
        100Mb: {progress.down100Mb ? `${speed.down100Mb}Mbps` : `running tests`}
      </p>
      <p>
        Overall Down Speed:{" "}
        {progress.downAll ? `${speed.downSpeed}Mbps` : `running tests`}
      </p>
      <p>
        Overall Up Speed:{" "}
        {progress.upAll ? `${speed.upSpeed}Mbps` : `running tests`}
      </p>
    </div>
  );
};

export default App;
