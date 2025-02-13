import crypto from 'crypto';
import { mailchimpClient } from './mailchimp';
import { HttpError } from './sessionHelpers';

/**
 * Updates a Mailchimp subscriber's mailing address.
 * @param {string} email - The subscriber's email address.
 * @param {object} addressData - An object containing the mailing address (e.g., { addr1, addr2, city, state, zip, country }).
 * @returns {Promise<Object>} The response from Mailchimp.
 * @throws Will throw an error if the update fails.
 */
export async function updateMailchimpAddress(email, addressData) {
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!listId) {
    throw new HttpError("MAILCHIMP_LIST_ID is not configured in your environment.", 500);
  }
  // Mailchimp requires the MD5 hash of the lowercase email
  const subscriberHash = crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

  try {
    const response = await mailchimpClient.lists.updateListMember(listId, subscriberHash, {
      merge_fields: {
        ADDRESS: addressData
      }
    });
    console.log("Mailchimp address updated successfully:", response);
    return response;
  } catch (error) {
    console.error("Error updating Mailchimp address:", error);
    throw new HttpError("Failed to update Mailchimp address", 500);
  }
}

  /**
 * Updates a Mailchimp subscriber's tags.
 * @param {string} email - The subscriber's email address.
 * @param {string} tagName - The tag I want to update (e.g., "Fan Purchaser").
 * @param {string} status - "active" to add the tag or "inactive" to remove it. Accordin to Mailchimp API docs
 */

export async function updateMailchimpTag(email, tagName, status = 'active' ) {

    const listId= process.env.MAILCHIMP_LIST_ID;
    if (!listId) {
        throw new HttpError("MAILCHIMP_LIST_ID is not configured in my environment.", 500);
    }
    // Mailchimp requires an MD5 hash of the lowercase email address.
    const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    try {
        //Update the tags for the member
        //According to mailchimp API docs, post/lists/{list_id}/members/{subscriber_hash}/tags is the appropriate call to add or remove tags
        const response = await mailchimpClient.lists.updateListMemberTags(listId, subscriberHash, {
            tags:   [
                {
                    name: tagName,
                    status: status, // 'active' to add, 'inactive' to remove
                },
            ],
        });
        console.log(`Successfully updated tag "${tagName}" for ${email}:`, response);
    } catch (error) {
        console.error('Error updating Mailchimp tag:', error);
        throw new HttpError("Failed to update Mailchimp address", 500);
    }
}