const calculateSpeed = (bytes, duration) => {
  return (bytes * 8) / (duration / 1000) / 1e6;
};

export default calculateSpeed;