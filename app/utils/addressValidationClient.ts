import SmartySDK from "smartystreets-javascript-sdk";

const credentials = new SmartySDK.core.StaticCredentials(
  process.env.SMARTY_AUTH_ID as string,
  process.env.SMARTY_AUTH_TOKEN as string,
);
export const client = new SmartySDK.core.ClientBuilder(credentials)
  .withMaxRetries(10) // Retry up to 10 times for failed requests
  .withMaxTimeout(30000) // Set the maximum timeout for requests to 30 seconds
  .buildUsStreetApiClient(); // Create a new client for the US Street API with retry and timeout settings

export const lookup = new SmartySDK.usStreet.Lookup(); // Create a new lookup object for US Street API
