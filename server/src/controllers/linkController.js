const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const Redis = require("ioredis");
const Link = require("../models/Link");
const { detectDeviceOS } = require("../utils/userAgentParser");
const useragent = require("useragent");

// Configure Redis Client (reuse connection)
const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600;

redis.on("error", (err) => console.error("Redis Client Error", err));
redis.on("connect", () => console.log("Connected to Redis"));

// --- Controller Functions ---

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 1. Create Link (from Dashboard)
exports.createLink = async (req, res) => {
  try {
    const {
      description,
      iosBundleId,
      iosAppStoreId,
      iosDeepLink,
      androidPackageName,
      androidDeepLink,
      webFallbackUrl,
      socialTitle,
      socialDescription,
      socialImageUrl,
    } = req.body;

    // Basic validation
    if (!webFallbackUrl) {
      return res.status(400).json({ message: "Web fallback URL is required." });
    }

    const shortCode = nanoid(7); // Generate a 7-character unique ID

    const newLink = new Link({
      shortCode,
      description,
      iosBundleId,
      iosAppStoreId,
      iosDeepLink,
      androidPackageName,
      androidDeepLink,
      webFallbackUrl,
      socialTitle,
      socialDescription,
      socialImageUrl,
    });

    // Step 2a: Store Config in MongoDB
    const savedLink = await newLink.save();

    // Step 2b: Update Cache (Optional: Warm cache on creation)
    try {
      await redis.set(
        `link:${shortCode}`,
        JSON.stringify(savedLink),
        "EX",
        CACHE_TTL,
      );
      console.log(`[Cache SET] Link ${shortCode} added to cache.`);
    } catch (cacheError) {
      console.error(
        `[Cache Error] Failed to cache link ${shortCode}:`,
        cacheError,
      );
      // Continue even if caching fails
    }

    res.status(201).json(savedLink);
  } catch (error) {
    console.error("Error creating link:", error);
    if (error.code === 11000) {
      // Duplicate key error (rare with nanoid)
      return res
        .status(409)
        .json({ message: "Short code collision, please try again." });
    }
    res.status(500).json({ message: "Server error creating link." });
  }
};

// Update Link Controller Method ---
exports.updateLink = async (req, res) => {
  const { id } = req.params; // Get the MongoDB _id from the URL parameter
  const cacheKeyPrefix = "link:"; // Define prefix for consistency

  // Validate if the provided ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Link ID format." });
  }

  try {
    // Find the existing link by its MongoDB _id
    const linkToUpdate = await Link.findById(id);

    if (!linkToUpdate) {
      return res.status(404).json({ message: "Link not found." });
    }

    // --- Cache Key: Get shortCode BEFORE updating ---
    // We need the shortCode to update/invalidate the correct cache entry
    const shortCode = linkToUpdate.shortCode;
    const cacheKey = `${cacheKeyPrefix}${shortCode}`;

    // Destructure updated data from the request body
    const {
      description,
      iosBundleId,
      iosAppStoreId,
      iosDeepLink,
      androidPackageName,
      androidDeepLink,
      webFallbackUrl,
      socialTitle,
      socialDescription,
      socialImageUrl,
    } = req.body;

    // Basic validation (ensure required fields are still present)
    if (!webFallbackUrl) {
      return res.status(400).json({ message: "Web fallback URL is required." });
    }

    // --- Update the document's fields ---
    // Note: We generally don't allow changing the shortCode after creation
    linkToUpdate.description = description;
    linkToUpdate.iosBundleId = iosBundleId;
    linkToUpdate.iosAppStoreId = iosAppStoreId;
    linkToUpdate.iosDeepLink = iosDeepLink;
    linkToUpdate.androidPackageName = androidPackageName;
    linkToUpdate.androidDeepLink = androidDeepLink;
    linkToUpdate.webFallbackUrl = webFallbackUrl;
    linkToUpdate.socialTitle = socialTitle;
    linkToUpdate.socialDescription = socialDescription;
    linkToUpdate.socialImageUrl = socialImageUrl;
    // Mongoose default timestamps will update `updatedAt` automatically if enabled in schema

    // Save the updated document to MongoDB (runs validations)
    const updatedLink = await linkToUpdate.save();

    // --- IMPORTANT: Update Redis Cache ---
    // Update the cache with the new data or delete the old entry
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(updatedLink), // Store the newly updated link data
        "EX",
        CACHE_TTL,
      );
      console.log(`[Cache UPDATE] Link ${shortCode} updated in cache.`);
    } catch (cacheError) {
      console.error(
        `[Cache Error] Failed to update cache for link ${shortCode}:`,
        cacheError,
      );
      // Decide if failure to update cache should be a critical error or just logged
    }

    // Send back the updated link object
    res.status(200).json(updatedLink);
  } catch (error) {
    console.error(`Error updating link ${id}:`, error);
    // Handle potential validation errors from Mongoose save()
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res.status(500).json({ message: "Server error updating link." });
  }
};

// Get all links (for Dashboard)
exports.getLinks = async (req, res) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 });
    res.status(200).json(links);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ message: "Server error fetching links." });
  }
};

// 3. Resolve Link (User Clicks)
exports.resolveLink = async (req, res) => {
  const { shortCode } = req.params;
  const userAgentString = req.headers["user-agent"];
  const cacheKey = `link:${shortCode}`;

  try {
    // Step 4a: Check Cache
    let linkConfig = null;
    const cachedLink = await redis.get(cacheKey);

    if (cachedLink) {
      console.log(`[Cache HIT] Found link ${shortCode} in cache.`);
      linkConfig = JSON.parse(cachedLink);
      // Optional: Extend cache TTL on access (sliding expiration)
      // await redis.expire(cacheKey, CACHE_TTL);
    } else {
      console.log(`[Cache MISS] Link ${shortCode} not in cache.`);
      // Step 4b: DB Fallback
      linkConfig = await Link.findOne({ shortCode });

      if (linkConfig) {
        console.log(`[DB Success] Found link ${shortCode} in MongoDB.`);
        // Store in cache for next time
        try {
          await redis.set(
            cacheKey,
            JSON.stringify(linkConfig),
            "EX",
            CACHE_TTL,
          );
          console.log(
            `[Cache SET] Link ${shortCode} added to cache after DB fetch.`,
          );
        } catch (cacheError) {
          console.error(
            `[Cache Error] Failed to cache link ${shortCode} after DB fetch:`,
            cacheError,
          );
        }
      } else {
        console.log(`[Not Found] Link ${shortCode} not found in DB.`);
        return res.status(404).send("Link not found");
      }
    }

    // Step 7: Log Analytics Event (Simple Console Log)
    console.log(
      `[Analytics] Link Click: ${shortCode}, User-Agent: ${userAgentString}`,
    );

    const agent = useragent.parse(userAgentString);
    // Basic bot detection (can be made more robust by checking specific bot names)
    const isBot =
      agent.isBot ||
      /bot|crawl|slurp|spider|mediapartners|facebookexternalhit|pinterest|whatsapp|slackbot|twitterbot/i.test(
        userAgentString,
      );

    if (isBot) {
      console.log(
        `[Crawler Detect] Bot detected (${agent.source}), serving meta tags for ${shortCode}.`,
      );

      // Use configured social tags, fall back to web URL if needed
      const title = escapeHtml(linkConfig.socialTitle || "Link"); // Basic default title
      const description = escapeHtml(
        linkConfig.socialDescription || "Click the link for more information.",
      ); // Basic default desc
      const imageUrl = escapeHtml(linkConfig.socialImageUrl || ""); // Default to empty if no image
      const pageUrl = `${req.protocol}://${req.get("host")}/${shortCode}`; // URL of the short link itself

      // Construct HTML with Open Graph and Twitter Card meta tags
      let html = `<!DOCTYPE html><html><head><title>${title}</title>`;
      html += `<meta name="description" content="${description}">`;
      // Open Graph Tags
      html += `<meta property="og:title" content="${title}">`;
      html += `<meta property="og:description" content="${description}">`;
      html += `<meta property="og:url" content="${pageUrl}">`; // Use the short URL itself
      if (imageUrl) {
        html += `<meta property="og:image" content="${imageUrl}">`;
      }
      html += `<meta property="og:type" content="website">`; // Or "article" etc.
      // Twitter Card Tags
      html += `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">`; // Use large image card if image exists
      html += `<meta name="twitter:title" content="${title}">`;
      html += `<meta name="twitter:description" content="${description}">`;
      if (imageUrl) {
        html += `<meta name="twitter:image" content="${imageUrl}">`;
      }
      // Optional: Add a fallback redirect via JavaScript for users who somehow land here
      // html += `<script>window.location.href = "${escapeHtml(linkConfig.webFallbackUrl)}";</script>`;
      html += `</head><body></body></html>`; // Empty body is fine for crawlers

      res.set("Content-Type", "text/html");
      return res.send(html); // Send the HTML and STOP processing
    }

    // Step 5: Route based on Device OS
    const deviceOS = detectDeviceOS(userAgentString);
    console.log(`[Routing] Detected OS: ${deviceOS} for ${shortCode}`);

    return sendUniversalInterstitial(res, linkConfig, deviceOS);
  } catch (error) {
    console.error(`Error resolving link ${shortCode}:`, error);
    res.status(500).send("Error resolving link");
  }
};

// 6a/6b: Placeholder for Deferred Deep Linking Check
// A real implementation would involve storing click data (fingerprint/IP) temporarily,
// associating it with a device ID when the app calls this endpoint, and returning the deep link.
exports.checkDeferredLink = async (req, res) => {
  const { deviceId } = req.params; // Assuming app passes a unique device ID
  console.log(`[Deferred Check] Received request for deviceId: ${deviceId}`);

  // --- Complex Logic Placeholder ---
  // 1. Look up temporary click data associated with this device
  //    (e.g., from Redis, matched via fingerprinting/IP during initial redirect)
  // 2. If match found, retrieve the original deep link intended for this user.
  // 3. Clear the temporary data.
  // 4. Return the deep link info or an empty object/error if no match.
  // ---------------------------------

  // Example response (no match found)
  res.status(200).json({
    message: "Deferred link check placeholder.",
    deepLinkData: null, // Or: { targetUrl: 'yourapp://some/path?id=abc' }
  });
};

// Universal interstitial that handles both Android and iOS
function sendUniversalInterstitial(res, linkConfig, deviceOS) {
  // Set up all the links we might need
  const webFallback = linkConfig.webFallbackUrl;

  let deepLink = null;
  let appStoreUrl = null;
  let packageName = null;

  // Determine which platform-specific links to use
  if (deviceOS === "ios") {
    deepLink = linkConfig.iosDeepLink || null;
    // Use iTunes URL format for better reliability
    appStoreUrl = linkConfig.iosAppStoreId
      ? `https://apps.apple.com/app/id${linkConfig.iosAppStoreId}`
      : webFallback;
  } else if (deviceOS === "android") {
    deepLink = linkConfig.androidDeepLink || null;
    packageName = linkConfig.androidPackageName || null;
    appStoreUrl = packageName
      ? `https://play.google.com/store/apps/details?id=${packageName}`
      : webFallback;
  } else {
    // For desktop or unknown devices, just redirect to web fallback
    return res.redirect(302, webFallback);
  }

  // Construct intent URL for Android if we have the necessary info
  let intentUrl = null;
  if (deviceOS === "android" && deepLink && packageName) {
    try {
      // Try to parse as URL to extract components
      let scheme, host, path;

      if (deepLink.includes("://")) {
        const urlParts = deepLink.split("://");
        scheme = urlParts[0];
        const remainingParts = urlParts[1].split("/");
        host = remainingParts[0];
        path = "/" + remainingParts.slice(1).join("/");

        intentUrl = `intent://${host}${path}#Intent;scheme=${scheme};package=${packageName};S.browser_fallback_url=${encodeURIComponent(appStoreUrl)};end`;
      }
    } catch (e) {
      console.error("Failed to create intent URL:", e);
      // Fall back to regular deeplink
    }
  }

  // Build the HTML response with improved deep linking script
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Opening App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${
    deviceOS === "ios" && linkConfig.iosAppStoreId
      ? `<meta name="apple-itunes-app" content="app-id=${linkConfig.iosAppStoreId}${linkConfig.iosDeepLink ? ", app-argument=" + encodeURIComponent(linkConfig.iosDeepLink) : ""}">`
      : ""
  }
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 40px 20px;
      margin: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 10px;
      font-size: 24px;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-radius: 50%;
      border-top: 5px solid #3498db;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 30px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .fallback-btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    .fallback-btn:hover {
      background-color: #2980b9;
    }
    #countdown {
      font-weight: bold;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Opening Application</h1>
    <div class="loader"></div>
    <p id="redirect-message">Redirecting you to the app...</p>
    <p id="timeout-message" class="hidden">
      If the app doesn't open in <span id="countdown">3</span> seconds,
      you'll be redirected to ${deviceOS === "ios" ? "the App Store" : "Google Play"}.
    </p>
    <a id="manual-button" href="${appStoreUrl}" class="fallback-btn">
      Open ${deviceOS === "ios" ? "App Store" : "Google Play"} Now
    </a>
  </div>

  <script>
    (function() {
      // Keep track of whether we've tried to open the app
      var attemptedToOpenApp = false;
      var hasRedirected = false;

      // This will be set to true if the app appears to have opened
      var appOpened = false;

      // Set up event listeners to detect if the app opened
      function setupAppOpenDetection() {
        // Listen for page visibility changes (app opened)
        document.addEventListener('visibilitychange', function() {
          if (document.hidden && attemptedToOpenApp) {
            console.log('App appears to have opened (visibility changed)');
            appOpened = true;

            // Clear any pending timeouts to prevent store redirect
            if (window.appOpenTimeoutId) {
              clearTimeout(window.appOpenTimeoutId);
            }
          }
        });

        // Also listen for page blur events as backup detection
        window.addEventListener('blur', function() {
          if (attemptedToOpenApp) {
            console.log('App appears to have opened (window blur)');
            appOpened = true;

            // Clear any pending timeouts to prevent store redirect
            if (window.appOpenTimeoutId) {
              clearTimeout(window.appOpenTimeoutId);
            }
          }
        });
      }

      // Function to redirect to app store
      function redirectToStore() {
        if (!hasRedirected && !appOpened) {
          console.log('Redirecting to store');
          hasRedirected = true;
          window.location.href = "${appStoreUrl}";
        }
      }

      // Function to try opening the app
      function openApp() {
        // Mark that we've attempted to open the app
        attemptedToOpenApp = true;

        // Show the countdown
        document.getElementById('timeout-message').classList.remove('hidden');

        // Start the countdown timer
        var countdown = 3;
        document.getElementById('countdown').textContent = countdown;

        var countdownInterval = setInterval(function() {
          countdown--;
          if (countdown <= 0) {
            clearInterval(countdownInterval);
          } else {
            document.getElementById('countdown').textContent = countdown;
          }
        }, 1000);

        // For Android: Use Intent URL if available (this handles its own fallback)
        if ("${deviceOS}" === "android" && "${intentUrl}" && !navigator.userAgent.includes('Firefox')) {
          console.log('Trying Android Intent URL');
          window.location.href = "${intentUrl}";
          // Intent URL handles fallbacks internally, so no need for timeout
          return;
        }

        // For iOS: Try the iframe approach first (more reliable on iOS)
        if ("${deviceOS}" === "ios" && "${deepLink}") {
          try {
            console.log('Trying iOS iframe approach');
            var appLaunchIframe = document.createElement('iframe');
            appLaunchIframe.style.border = 'none';
            appLaunchIframe.style.width = '1px';
            appLaunchIframe.style.height = '1px';
            appLaunchIframe.style.position = 'absolute';
            appLaunchIframe.style.top = '-100px';
            appLaunchIframe.src = "${deepLink}";
            document.body.appendChild(appLaunchIframe);

            // Remove the iframe after a moment
            setTimeout(function() {
              if (appLaunchIframe && appLaunchIframe.parentNode) {
                document.body.removeChild(appLaunchIframe);
              }
            }, 100);
          } catch (e) {
            console.error('Error with iframe approach:', e);
          }
        }

        // For all devices: Also try direct deep link as backup
        if ("${deepLink}") {
          console.log('Trying direct deep link:', "${deepLink}");
          try {
            window.location.href = "${deepLink}";
          } catch (e) {
            console.error('Error opening deep link:', e);
            // Redirect immediately if direct link causes error
            redirectToStore();
            return;
          }
        } else {
          // No deep link available, go directly to store
          console.log('No deep link available, going to store directly');
          redirectToStore();
          return;
        }

        // Set different timeout for iOS vs Android
        var redirectDelay = "${deviceOS}" === "ios" ? 2000 : 3000;

        // Set a timeout for the store fallback
        // This won't execute if the app opens due to the visibility/blur event handlers
        window.appOpenTimeoutId = setTimeout(function() {
          if (!appOpened) {
            console.log('App did not open, redirecting to store');
            redirectToStore();
          }
        }, redirectDelay);
      }

      // Initialize deep linking process
      function init() {
        setupAppOpenDetection();

        // Add click handler to manual button
        document.getElementById('manual-button').addEventListener('click', function(e) {
          // Allow default behavior here so the link works normally
        });

        // Start the deep linking process after a short delay
        setTimeout(openApp, 500);
      }

      // Start when page is loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;

  res.set("Content-Type", "text/html");
  res.send(html);
}
