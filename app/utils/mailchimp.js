import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  }); 


// Export the configured Mailchimp client
export const mailchimpClient = mailchimp;