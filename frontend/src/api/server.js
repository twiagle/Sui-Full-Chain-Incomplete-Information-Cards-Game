const DOMAIN_MAP = {
    development: "http://localhost:3002",
    production: "",
  };
  const ENV = process.env.NODE_ENV;
  export const get = function (url, params) {
    const domain = new URL(`${DOMAIN_MAP[ENV]}${url}`);
    domain.search = new URLSearchParams(params).toString();
    return fetch(domain).then((res) => res.json());
  };