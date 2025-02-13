import crypto from 'crypto';
import { mailchimpClient } from './mailchimp';

/**
 * This is a helper function...
 * 
 * * Updates a Mailchimp subscriber's mailing address.
 * @param {string} email - The subscriber's email address.
 * @param {object} addressData - An object containing the mailing address (e.g., { addr1, addr2, city, state, zip, country }).
 * 
 */


export async function updateMailchimpAddress(email, addressData) {
     // Ensure that the Mailchimp list ID is set in your environment variables.
    const listId = process.env.MAILCHIMP_LIST_ID;
    if (!listId) {
        throw new Error("MAILCHIMP_LIST_ID is not configured in my environment.");
    }
     // Compute the subscriber hash (Mailchimp requires the MD5 hash of the lowercase email)
    const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

    try {
         // Update the list member. Note: if the member does not exist, I might may consider using setListMember instead for the future.
        const response = await mailchimpClient.lists.updateListMember(listId, subscriberHash, {
            merge_fields: {
                ADDRESS: addressData //// Ensure this key matches your Mailchimp merge field setup.
            }
        });
        console.log('Mailchimp address updated successfully:', response);
        
    } catch (error) {
        console.error('Error updating Mailchimp address:', error.response);
        // I can also re-throw the error or handle it further if necessary.
    }

}

