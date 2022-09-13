import request from "./request";

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

export default upload;