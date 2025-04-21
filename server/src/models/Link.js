const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: {
    // For the dashboard
    type: String,
    trim: true,
  },
  // iOS Specific Configuration
  iosBundleId: {
    // e.g., com.yourapp.ios
    type: String,
    trim: true,
  },
  iosAppStoreId: {
    // e.g., 123456789
    type: String,
    trim: true,
  },
  iosDeepLink: {
    // e.g., yourapp://path/to/content?id=123
    type: String,
    trim: true,
  },
  // Android Specific Configuration
  androidPackageName: {
    // e.g., com.yourapp.android
    type: String,
    trim: true,
  },
  androidDeepLink: {
    // e.g., yourapp://path/to/content?id=123 OR https://yourdomain.com/path (App Link)
    type: String,
    trim: true,
  },
  // Fallback URL for Desktop / Other
  webFallbackUrl: {
    type: String,
    trim: true,
    required: true,
  },

  socialTitle: {
    type: String,
    trim: true,
  },
  socialDescription: {
    type: String,
    trim: true,
  },
  socialImageUrl: {
    // URL to the preview image
    type: String,
    trim: true,
  },

  // Analytics / Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // You could add fields for Universal Links / App Links domains, etc.
});

linkSchema.index({ shortCode: 1 });

module.exports = mongoose.model("Link", linkSchema);
