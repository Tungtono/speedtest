const parseCdnCgiTrace = (text) => {
  const cdnCgiObj = {};
  const data = text.split("\n");
  data.forEach((item) => {
    const pair = item.split("=");
    cdnCgiObj[pair[0]] = pair[1];
  });
  return cdnCgiObj;
};

export default parseCdnCgiTrace;