import React, { useState } from "react";

const LinkForm = ({ onLinkCreated }) => {
  const [formData, setFormData] = useState({
    description: "",
    iosBundleId: "",
    iosAppStoreId: "",
    iosDeepLink: "",
    androidPackageName: "",
    androidDeepLink: "",
    webFallbackUrl: "",
    socialTitle: "",
    socialDescription: "",
    socialImageUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.webFallbackUrl) {
      setError("Web Fallback URL is required.");
      setLoading(false);
      return;
    }

    try {
      // Uses proxy configured in package.json (for CRA)
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const newLink = await response.json();
      onLinkCreated(newLink); // Callback to update parent state
      // Clear form
      setFormData({
        description: "",
        iosBundleId: "",
        iosAppStoreId: "",
        iosDeepLink: "",
        androidPackageName: "",
        androidDeepLink: "",
        webFallbackUrl: "",
        socialTitle: "",
        socialDescription: "",
        socialImageUrl: "",
      });
    } catch (err) {
      console.error("Failed to create link:", err);
      setError(err.message || "Failed to create link.");
    } finally {
      setLoading(false);
    }
  };

  // Basic form styling (add CSS classes as needed)
  const inputStyle = {
    display: "block",
    margin: "5px 0 10px",
    padding: "8px",
    width: "95%",
  };
  const labelStyle = {
    fontWeight: "bold",
    marginBottom: "3px",
    display: "block",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h2>Create New Dynamic Link</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <label style={labelStyle} htmlFor="description">
        Description (Optional)
      </label>
      <input
        type="text"
        name="description"
        id="description"
        value={formData.description}
        onChange={handleChange}
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="webFallbackUrl">
        Web Fallback URL*
      </label>
      <input
        type="url"
        name="webFallbackUrl"
        id="webFallbackUrl"
        value={formData.webFallbackUrl}
        onChange={handleChange}
        style={inputStyle}
        required
      />

      <hr style={{ margin: "15px 0" }} />
      <h4>iOS Config (Optional)</h4>
      <label style={labelStyle} htmlFor="iosBundleId">
        Bundle ID
      </label>
      <input
        type="text"
        name="iosBundleId"
        id="iosBundleId"
        placeholder="com.example.iosapp"
        value={formData.iosBundleId}
        onChange={handleChange}
        style={inputStyle}
      />
      <label style={labelStyle} htmlFor="iosAppStoreId">
        App Store ID
      </label>
      <input
        type="text"
        name="iosAppStoreId"
        id="iosAppStoreId"
        placeholder="123456789"
        value={formData.iosAppStoreId}
        onChange={handleChange}
        style={inputStyle}
      />
      <label style={labelStyle} htmlFor="iosDeepLink">
        Deep Link URL
      </label>
      <input
        type="text"
        name="iosDeepLink"
        id="iosDeepLink"
        placeholder="yourapp://path/to/content"
        value={formData.iosDeepLink}
        onChange={handleChange}
        style={inputStyle}
      />

      <hr style={{ margin: "15px 0" }} />
      <h4>Android Config (Optional)</h4>
      <label style={labelStyle} htmlFor="androidPackageName">
        Package Name
      </label>
      <input
        type="text"
        name="androidPackageName"
        id="androidPackageName"
        placeholder="com.example.androidapp"
        value={formData.androidPackageName}
        onChange={handleChange}
        style={inputStyle}
      />
      <label style={labelStyle} htmlFor="androidDeepLink">
        Deep Link URL / App Link
      </label>
      <input
        type="text"
        name="androidDeepLink"
        id="androidDeepLink"
        placeholder="yourapp://path OR https://domain.com/path"
        value={formData.androidDeepLink}
        onChange={handleChange}
        style={inputStyle}
      />

      <hr style={{ margin: "15px 0" }} />
      <h4>Social Media Preview (Optional)</h4>

      <label style={labelStyle} htmlFor="socialTitle">
        Preview Title
      </label>
      <input
        type="text"
        name="socialTitle"
        id="socialTitle"
        value={formData.socialTitle}
        onChange={handleChange}
        style={inputStyle}
        maxLength={70}
      />

      <label style={labelStyle} htmlFor="socialDescription">
        Preview Description
      </label>
      <input
        type="text"
        name="socialDescription"
        id="socialDescription"
        value={formData.socialDescription}
        onChange={handleChange}
        style={inputStyle}
        maxLength={200}
      />

      <label style={labelStyle} htmlFor="socialImageUrl">
        Preview Image URL
      </label>
      <input
        type="url"
        name="socialImageUrl"
        id="socialImageUrl"
        value={formData.socialImageUrl}
        onChange={handleChange}
        style={inputStyle}
      />

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "10px 20px", marginTop: "10px" }}
      >
        {loading ? "Creating..." : "Create Link"}
      </button>
    </form>
  );
};

export default LinkForm;
