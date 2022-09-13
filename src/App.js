import { useState, useEffect } from "react";
import stats from "./components/stats";
import measureDownload from "./components/measureDownload";
import measureUpload from "./components/measureUpload";
import measureLatency from "./components/measureLatency";
import getServers from "./components/getServers";
import parseCdnCgiTrace from "./components/parseCdnDgiTrace";

const App = () => {
  const [darkMode, setDarkMode] = useState(localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches))
  const [city, setCity] = useState("");
  const [ip, setIp] = useState("");
  const [metrics, setMetrics] = useState({
    latency: 0,
    jitter: 0,
    down100Kb: 0,
    down1Mb: 0,
    down10Mb: 0,
    down25Mb: 0,
    down100Mb: 0,
    downOverall: 0,
    upOverall: 0,
  });
  const [progress, setProgress] = useState({
    latency: false,
    jitter: false,
    down100Kb: false,
    down1Mb: false,
    down10Mb: false,
    down25Mb: false,
    down100Mb: false,
    downOverall: false,
    upOverall: false,
  });
  const tests = [
    {
      name: "latency",
      title: "latency",
      description: "multiple tests to calculate round trip time (RTT)",
    },
    {
      name: "jitter",
      title: "jitter",
      description:
        "average difference between consecutive latency measurements",
    },
    {
      name: "down100Kb",
      title: "flyweight",
      description: "multiple download tests with 100Kb file size each",
    },
    {
      name: "down1Mb",
      title: "lightweight",
      description: "multiple download tests with 1Mb file size each",
    },
    {
      name: "down10Mb",
      title: "welterweight",
      description: "multiple download tests with 10Mb file size each",
    },
    {
      name: "down25Mb",
      title: "middleweight",
      description: "multiple download tests with 25Mb file size each",
    },
    {
      name: "down100Mb",
      title: "heavyweight",
      description: "multiple download tests with 100Mb file size each",
    },
    {
      name: "upOverall",
      title: "upload",
      description: "multiple upload tests of various sizes from 10Kb to 1Mb",
    },
  ];

  const getBackgroundInfo = async () => {
    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
    const rawData = await response.text();
    const data = parseCdnCgiTrace(rawData);
    setIp(data.ip);
    const allServers = await getServers();
    const myServer = allServers.find((item) => item.iata === data.colo);
    setCity(myServer.city);
  };

  const speedTest = async () => {
    const ping = await measureLatency();
    setMetrics((prevState) => ({
      ...prevState,
      latency: ping.latency.toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      latency: true,
    }));
    setMetrics((prevState) => ({
      ...prevState,
      jitter: ping.jitter.toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      jitter: true,
    }));

    const testDown100k = await measureDownload(101000, 10);
    setMetrics((prevState) => ({
      ...prevState,
      down100Kb: stats.median(testDown100k).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down100Kb: true,
    }));

    const testDown1m = await measureDownload(1001000, 8);
    setMetrics((prevState) => ({
      ...prevState,
      down1Mb: stats.median(testDown1m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down1Mb: true,
    }));

    const testDown10m = await measureDownload(10001000, 6);
    setMetrics((prevState) => ({
      ...prevState,
      down10Mb: stats.median(testDown10m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down10Mb: true,
    }));

    const testDown25m = await measureDownload(25001000, 4);
    setMetrics((prevState) => ({
      ...prevState,
      down25Mb: stats.median(testDown25m).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      down25Mb: true,
    }));

    const testDown100m = await measureDownload(100001000, 1);
    setMetrics((prevState) => ({
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
    setMetrics((prevState) => ({
      ...prevState,
      downOverall: stats.quartile(downloadTests, 0.75).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      downOverall: true,
    }));

    const testUp1 = await measureUpload(11000, 10);
    const testUp2 = await measureUpload(101000, 10);
    const testUp3 = await measureUpload(1001000, 10);
    const uploadTests = [...testUp1, ...testUp2, ...testUp3];
    setMetrics((prevState) => ({
      ...prevState,
      upOverall: stats.quartile(uploadTests, 0.9).toFixed(2),
    }));
    setProgress((prevState) => ({
      ...prevState,
      upOverall: true,
    }));
  };

  const handleRetest = () => {
    setMetrics({
      latency: 0,
      jitter: 0,
      down100Kb: 0,
      down1Mb: 0,
      down10Mb: 0,
      down25Mb: 0,
      down100Mb: 0,
      downOverall: 0,
      upOverall: 0,
    });
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
    });
    speedTest();
  };

  const darkModeToggle = () => {
    if (darkMode) {
      localStorage.theme = 'light'
    } else {
      localStorage.theme = 'dark'
    }
    setDarkMode(prevState => !prevState)
  }

  if (darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  useEffect(() => {
    getBackgroundInfo();
    speedTest();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-full pt-8 pb-6 bg-white dark:bg-gray-900 dark:text-white overflow-y-auto">
      <div className="flex items-center mb-4">
        <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-500">
          Light
        </span>
        <label
          htmlFor="default-toggle"
          className="inline-flex relative items-center cursor-pointer"
        >
          <input
            type="checkbox"
            value=""
            id="default-toggle"
            defaultChecked={darkMode}
            className="sr-only peer"
            onChange={() => darkModeToggle()}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
        </label>
        <span className="ml-3 text-sm font-medium text-gray-400 dark:text-white">
          Dark
        </span>
      </div>
      <div className="lg:w-2/3 w-screen text-center">
        <h1 className="lg:text-4xl text-3xl font-bold">
          Your Internet speed is
        </h1>
        {progress.downOverall ? (
          <div className="flex justify-center gap-2 h-48">
            <p className="lg:text-9xl text-8xl font-bold my-auto">
              {Math.floor(metrics.downOverall)}
            </p>
            <div className="flex flex-col justify-center items-start lg:gap-2 gap-1">
              <p className="lg:text-3xl text-2xl font-medium">
                .{metrics.downOverall.toString().split(".")[1]}Mbps
              </p>
              <button
                onClick={() => handleRetest()}
                className="bg-green-600 rounded-lg flex pr-3 pl-2 py-1.5 gap-1"
              >
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
            <div className="px-4 font-semibold text-4xl text-green-600">
              ...doing magic
            </div>
            <div className="flex h-6 w-6">
              <div className="animate-ping absolute h-6 w-6 rounded-full bg-green-600 opacity-75"></div>
              <div className="relative rounded-full h-6 w-6 bg-green-600"></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center flex-wrap lg:w-3/4 w-full">
        {tests.map((item) => {
          return (
            <div key={item.name}>
              {progress[item.name] ? (
                <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-[30rem] w-full mx-4 h-24">
                  <div className="flex flex-col">
                    <div className="flex justify-start items-center">
                      <div className="flex justify-center items-center bg-green-600 rounded-full h-5 w-5 mr-3">
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
                      <p className="text-sm lg:text-lg">{item.title} tests</p>
                    </div>
                    <div className="text-[0.65rem] mt-2 font-normal">
                      {item.description}
                    </div>
                  </div>
                  <div className="ml-auto flex pl-4">
                    <p className="lg:text-3xl text-2xl font-semibold">
                      {metrics[item.name]}
                    </p>
                    <p className="text-sm">
                      {item.name === "latency" || item.name === "jitter"
                        ? "ms"
                        : "Mbps"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex border-t border-gray-500 items-center px-4 py-4 font-medium lg:w-[30rem] w-full mx-4 h-24">
                  <div className="flex flex-col">
                    <div className="flex justify-start items-center">
                      <svg
                        className="animate-spin mr-3 h-5 w-5 text-green-600"
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
                      <p className="text-sm lg:text-lg">
                        Running {item.title} tests...
                      </p>
                    </div>
                    <div className="text-[0.65rem] mt-2 font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm mt-2">
        Your IP is: <strong>{ip}</strong>
      </p>
      <p className="text-sm mt-2">
        Fetching from the nearest server: <strong>{city}</strong>
      </p>
    </div>
  );
};

export default App;
