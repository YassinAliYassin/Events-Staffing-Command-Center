# WhatsApp Test Number Setup Guide

## Context
ESCC uses a Meta WhatsApp Test Number (+1 555-650-0119, Phone ID: 1190600000792870) which can only send messages to verified Test Recipients. Error 131030 ("Recipient phone number not in allowed list") occurs when staff numbers are not added to the Test Recipients list.

## Permanent Fix Steps: Add Staff Numbers to Test Recipients
1. Log in to [Meta Business Console](https://business.facebook.com/) with your WABA admin account
2. Navigate to **WhatsApp Business Account** > Select the account linked to Phone ID `1190600000792870`
3. In the left sidebar, go to **WhatsApp** > **Test Recipients**
4. Click **Add Test Recipient**
5. Enter staff phone numbers in **E.164 format** (e.g., `+279****4321` for Alice Johnson, `+271****6789` for John Smith)
6. Click **Save** - the number will receive a 6-digit verification code via SMS
7. Enter the verification code to complete activation
8. Repeat for all staff numbers

## Verify Setup
Once numbers are added, trigger an event submission with "Send WhatsApp" enabled. Error 131030 will no longer appear for verified numbers.

## Staff Numbers to Add (Current)
| Name | Phone (E.164) |
|------|---------------|
| Alice Johnson | +279****4321 |
| John Smith | +271****6789 |

## Notes
- Test Recipients expire after 90 days, re-verify if messages stop sending
- This is a permanent configuration in Meta Business Console, no code changes required after adding numbers
