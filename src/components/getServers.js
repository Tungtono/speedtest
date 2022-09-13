const getServers = async () => {
  const response = await fetch("https://speed.cloudflare.com/locations");
  const data = await response.json();
  return data;
};

export default getServers;