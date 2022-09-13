import request from "./request";

const download = (bytes) => {
  const options = {
    hostname: "speed.cloudflare.com",
    path: `/__down?bytes=${bytes}`,
    method: "GET",
  };

  return request(options);
};

export default download;