import https from "https-browserify";
import { useState, useEffect } from "react";
import stats from './stats'

const App = () => {
  const [city, setCity] = useState("");
  const [ip, setIp] = useState("");
  const [latency, setLatency] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [speed100Kb, setSpeed100kb] = useState(0);
  const [speed1Mb, setSpeed1Mb] = useState(0);
  const [speed10Mb, setSpeed10Mb] = useState(0);
  const [speed25Mb, setSpeed25Mb] = useState(0);
  const [speed100Mb, setSpeed100Mb] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

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
    const rightObj = allServers.find((item) => item.iata === data.colo);
    setCity(rightObj.city);
  };

  const request = (options, data = "") => {
    let started;
    let dnsLookup;
    let tcpHandshake;
    let sslHandshake;
    let ttfb;
    let ended;

    return new Promise((resolve, reject) => {
      started = performance.now();
      const req = https.request(options, (res) => {
        res.once("readable", () => {
          ttfb = performance.now();
        });
        res.on("data", () => {});
        res.on("end", () => {
          ended = performance.now();
          resolve([
            started,
            dnsLookup,
            tcpHandshake,
            sslHandshake,
            ttfb,
            ended,
            parseFloat(res.headers["server-timing"].slice(22)),
          ]);
        });
      });

      req.on("socket", (socket) => {
        socket.on("lookup", () => {
          dnsLookup = performance.now();
        });
        socket.on("connect", () => {
          tcpHandshake = performance.now();
        });
        socket.on("secureConnect", () => {
          sslHandshake = performance.now();
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
        const response = await download(1000)
        // TTFB - Server processing time
        measurements.push(response[4] - response[0] - response[6]);
      }
      catch (err) {
        console.log(err)
      }
    }

    return [
      stats.median(measurements),
      stats.jitter(measurements),
    ];
  };

  const measureDownload = async (bytes, iterations) => {
    const measurements = [];

    for (let i = 0; i < iterations; i += 1) {
      try {
        const response = await download(bytes)
        const transferTime = response[5] - response[4];
        measurements.push(calculateSpeed(bytes, transferTime));
      }
      catch (err) {
        console.log(err)
      }
    }

    return measurements;
  };

  const measureUpload = async (bytes, iterations) => {
    const measurements = [];

    for (let i = 0; i < iterations; i += 1) {
      try {
        const response = await upload(bytes)
        const transferTime = response[6];
        measurements.push(calculateSpeed(bytes, transferTime));
      }
      catch (err) {
        console.log(err)
      }
    }

    return measurements;
  };

  const speedTest = async () => {
    const ping = await measureLatency();
    setLatency(ping[0].toFixed(2));
    setJitter(ping[1].toFixed(2));

    const testDown100k = await measureDownload(101000, 10);
    setSpeed100kb(stats.median(testDown100k).toFixed(2));

    const testDown1m = await measureDownload(1001000, 8);
    setSpeed1Mb(stats.median(testDown1m).toFixed(2));

    const testDown10m = await measureDownload(10001000, 6);
    setSpeed10Mb(stats.median(testDown10m).toFixed(2));

    const testDown25m = await measureDownload(25001000, 4);
    setSpeed25Mb(stats.median(testDown25m).toFixed(2));

    const testDown100m = await measureDownload(100001000, 1);
    setSpeed100Mb(stats.median(testDown100m).toFixed(2));

    const downloadTests = [
      ...testDown100k,
      ...testDown1m,
      ...testDown10m,
      ...testDown25m,
      ...testDown100m,
    ];
    setDownloadSpeed(stats.quartile(downloadTests, 0.75).toFixed(2));

    const testUp1 = await measureUpload(11000, 10);
    const testUp2 = await measureUpload(101000, 10);
    const testUp3 = await measureUpload(1001000, 10);
    const uploadTests = [...testUp1, ...testUp2, ...testUp3];
    setUploadSpeed(stats.quartile(uploadTests, 0.9).toFixed(2));
  }

  useEffect(() => {
    fetchCdnCgiTrace();
    speedTest();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="App">
      <p>Your IP is: {ip}</p>
      <p>Fetching from the nearest server: {city}</p>
      <p>Latency: {latency}ms</p>
      <p>Jitter: {jitter}ms</p>
      <p>100kb: {speed100Kb}Mbps</p>
      <p>1Mb: {speed1Mb}Mbps</p>
      <p>10Mb: {speed10Mb}Mbps</p>
      <p>25Mb: {speed25Mb}Mbps</p>
      <p>100Mb: {speed100Mb}Mbps</p>
      <p>Overall Down Speed: {downloadSpeed}Mbps</p>
      <p>Overall Up Speed: {uploadSpeed}Mbps</p>
    </div>
  );
};

export default App;
