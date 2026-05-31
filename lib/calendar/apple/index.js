import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Mask secrets in logs
function maskEmail(email) {
  if (!email) return '***';
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.substring(0, 3)}***@${domain}`;
}

function maskPassword(pwd) {
  return pwd ? '****' : 'NOT_SET';
}

export async function testConnection() {
  const email = process.env.ICLOUD_EMAIL;
  const appPassword = process.env.ICLOUD_APP_PASSWORD;

  console.log(`[Apple Calendar] Testing connection for ${maskEmail(email)} (password: ${maskPassword(appPassword)})`);

  if (!email || !appPassword) {
    return {
      connected: false,
      error: 'Missing ICLOUD_EMAIL or ICLOUD_APP_PASSWORD environment variables',
      calendars: []
    };
  }

  try {
    // Step 1: Get current-user-principal
    const principalResp = await axios({
      method: 'PROPFIND',
      url: 'https://caldav.icloud.com',
      auth: { username: email, password: appPassword },
      headers: {
        'Depth': '0',
        'Content-Type': 'application/xml'
      },
      data: `<?xml version="1.0"?>
        <propfind xmlns="DAV:">
          <prop>
            <current-user-principal/>
          </prop>
        </propfind>`
    });

    const principalXml = await parseStringPromise(principalResp.data);
    const principalHref = principalXml?.['D:multistatus']?.['D:response']?.[0]?.['D:propstat']?.[0]?.['D:prop']?.[0]?.['D:current-user-principal']?.[0]?.['D:href']?.[0];

    if (!principalHref) {
      throw new Error('Could not find principal URL');
    }

    console.log(`[Apple Calendar] Principal URL: ${principalHref}`);

    // Step 2: Get calendar home set
    const homeResp = await axios({
      method: 'PROPFIND',
      url: `https://caldav.icloud.com${principalHref}`,
      auth: { username: email, password: appPassword },
      headers: {
        'Depth': '0',
        'Content-Type': 'application/xml'
      },
      data: `<?xml version="1.0"?>
        <propfind xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <prop>
            <C:calendar-home-set/>
          </prop>
        </propfind>`
    });

    const homeXml = await parseStringPromise(homeResp.data);
    const calendarHome = homeXml?.['D:multistatus']?.['D:response']?.[0]?.['D:propstat']?.[0]?.['D:prop']?.[0]?.['C:calendar-home-set']?.[0]?.['D:href']?.[0];

    if (!calendarHome) {
      throw new Error('Could not find calendar home URL');
    }

    console.log(`[Apple Calendar] Calendar home: ${calendarHome}`);

    // Step 3: List calendars
    const calendarsResp = await axios({
      method: 'PROPFIND',
      url: `https://caldav.icloud.com${calendarHome}`,
      auth: { username: email, password: appPassword },
      headers: {
        'Depth': '1',
        'Content-Type': 'application/xml'
      },
      data: `<?xml version="1.0"?>
        <propfind xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:I="http://apple.com/ns/ical/">
          <prop>
            <D:displayname/>
            <C:calendar-description/>
            <C:calendar-timezone/>
          </prop>
        </propfind>`
    });

    const calendarsXml = await parseStringPromise(calendarsResp.data);
    const responses = calendarsXml?.['D:multistatus']?.['D:response'] || [];

    const calendars = responses
      .filter(resp => {
        const resourcetype = resp?.['D:propstat']?.[0]?.['D:prop']?.[0]?.['D:resourcetype']?.[0];
        return resourcetype?.['C:calendar'] !== undefined;
      })
      .map(resp => {
        const href = resp?.['D:href']?.[0] || '';
        const propstat = resp?.['D:propstat']?.[0];
        const prop = propstat?.['D:prop']?.[0] || {};
        return {
          id: href,
          name: prop?.['D:displayname']?.[0] || 'Unnamed Calendar',
          description: prop?.['C:calendar-description']?.[0] || '',
          timezone: prop?.['C:calendar-timezone']?.[0] || 'UTC'
        };
      });

    console.log(`[Apple Calendar] Found ${calendars.length} calendars for ${maskEmail(email)}`);

    return {
      connected: true,
      user: maskEmail(email),
      calendars
    };
  } catch (error) {
    console.error(`[Apple Calendar] Connection failed for ${maskEmail(email)}: ${error.message}`);
    return {
      connected: false,
      error: error.message,
      calendars: []
    };
  }
}