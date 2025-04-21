const useragent = require('useragent');

function detectDeviceOS(userAgentString) {
  if (!userAgentString) {
    return 'unknown';
  }
  try {
    const agent = useragent.parse(userAgentString);
    const os = agent.os.family.toLowerCase();

    if (os.includes('android')) {
      return 'android';
    } else if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) {
      return 'ios';
    } else {
      // Consider macOS, Windows, Linux etc. as 'web' for fallback
      return 'web';
    }
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return 'unknown';
  }
}

module.exports = { detectDeviceOS };
