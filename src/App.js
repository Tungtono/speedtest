import { useState, useEffect } from "react";
import stats from "./components/stats";
import measureDownload from "./components/measureDownload";
import measureUpload from "./components/measureUpload";
import measureLatency from "./components/measureLatency";

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
      downSpeed: stats.quartile(downloadTests, 0.75).toFixed(2),
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

  const handleRetest = () => {
    setSpeed({
      down100Kb: 0,
      down1Mb: 0,
      down10Mb: 0,
      down25Mb: 0,
      down100Mb: 0,
      downSpeed: 0,
      upSpeed: 0,
    })
    setProgress({
      latency: false,
      jitter: false,
      down100Kb: false,
      down1Mb: false,
      down10Mb: false,
      down25Mb: false,
      down100Mb: false,
      downAll: false,
      upAll: false,
    })
    speedTest()
  }
  useEffect(() => {
    fetchCdnCgiTrace();
    speedTest();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="lg:w-2/3 w-screen mt-12 text-center">
        <h1 className="text-4xl font-bold">Your Internet speed is</h1>
        {progress.downAll ? (
          <div className="flex justify-center gap-2 h-48">
            <p className="text-9xl font-bold my-auto">
              {Math.floor(speed.downSpeed)}
            </p>
            <div className="flex flex-col justify-center items-start gap-2">
              <p className="text-3xl font-medium">
                .{speed.downSpeed.toString().split(".")[1]}Mbps
              </p>
              <button onClick={() => handleRetest()} className="bg-green-600 rounded-lg flex pr-3 pl-2 py-1.5 gap-1">
                <svg
                  className="m-auto"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.1459 11.0499L12.9716 9.05752L15.3462 8.84977C14.4471 7.98322 13.2242 7.4503 11.8769 7.4503C9.11547 7.4503 6.87689 9.68888 6.87689 12.4503C6.87689 15.2117 9.11547 17.4503 11.8769 17.4503C13.6977 17.4503 15.2911 16.4771 16.1654 15.0224L18.1682 15.5231C17.0301 17.8487 14.6405 19.4503 11.8769 19.4503C8.0109 19.4503 4.87689 16.3163 4.87689 12.4503C4.87689 8.58431 8.0109 5.4503 11.8769 5.4503C13.8233 5.4503 15.5842 6.24474 16.853 7.52706L16.6078 4.72412L18.6002 4.5498L19.1231 10.527L13.1459 11.0499Z"
                    fill="white"
                  />
                </svg>
                <p className="text-white">retest</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-48 flex justify-center items-center">
            <div class="px-4 font-semibold text-4xl text-green-600">
              ...doing magic
            </div>
            <div class="flex h-6 w-6">
              <div class="animate-ping absolute h-6 w-6 rounded-full bg-green-600 opacity-75"></div>
              <div class="relative rounded-full h-6 w-6 bg-green-600"></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center flex-wrap lg:w-2/3 w-full">
        {progress.latency ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Latency</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{latency}</p>
              <p className=" text-sm">ms</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Calculating latency...
          </div>
        )}
        {progress.jitter ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Jitter</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{jitter}</p>
              <p className=" text-sm">ms</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Calculating jitter...
          </div>
        )}
        {progress.down100Kb ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Flyweight tests</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.down100Kb}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running flyweight tests...
          </div>
        )}
        {progress.down1Mb ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Lightweight tests</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.down1Mb}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running lightweight tests...
          </div>
        )}
        {progress.down10Mb ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Welterweight tests</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.down10Mb}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running welterweight tests...
          </div>
        )}
        {progress.down25Mb ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Middleweight tests</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.down25Mb}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running middleweight tests...
          </div>
        )}
        {progress.down100Mb ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Heavyweight tests</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.down100Mb}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running heavyweight tests...
          </div>
        )}
        {progress.upAll ? (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 text-xl mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 16 16"
              >
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </div>
            <p>Upload speed</p>
            <div className="ml-auto flex">
              <p className=" text-3xl font-semibold">{speed.upSpeed}</p>
              <p className=" text-sm">Mbps</p>
            </div>
          </div>
        ) : (
          <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-96 w-full mx-4 h-24">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running upload tests...
          </div>
        )}
      </div>
      <p className="text-sm">Your IP is: {ip}</p>
      <p className="text-sm">Fetching from the nearest server: {city}</p>
    </div>
  );
};

export default App;
