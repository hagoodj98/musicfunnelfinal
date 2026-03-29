import SmartySDK from "smartystreets-javascript-sdk";

const credentials = new SmartySDK.core.StaticCredentials(
  process.env.SMARTY_AUTH_ID as string,
  process.env.SMARTY_AUTH_TOKEN as string,
);
export const client = new SmartySDK.core.ClientBuilder(
  credentials,
).buildUsStreetApiClient();
