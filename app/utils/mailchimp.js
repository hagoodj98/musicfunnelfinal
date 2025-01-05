import mailchimp from '@mailchimp/mailchimp_marketing';


console.log("Configuring Mailchimp with API Key:", process.env.MAILCHIMP_API_KEY, "and Server Prefix:", process.env.MAILCHIMP_SERVER_PREFIX);
mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  }); 



// Export the configured Mailchimp client
export const mailchimpClient = mailchimp;