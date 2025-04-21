import React, { useState, useEffect } from "react";

const initialObject = {
  // Initial empty state
  description: "",
  iosBundleId: "LA38X245GF.com.bitsmedia.muslimpro",
  iosAppStoreId: "388389451",
  iosDeepLink: "",
  androidPackageName: "com.bitsmedia.android.muslimpro",
  androidDeepLink: "",
  webFallbackUrl: "",
  socialTitle: "",
  socialDescription: "",
  socialImageUrl: "",
};

// Renamed prop for clarity, accepting linkToEdit (null if creating)
const LinkForm = ({ onSave, linkToEdit = null }) => {
  // Determine mode based on whether linkToEdit prop is provided
  const isEditMode = Boolean(linkToEdit);

  const [formData, setFormData] = useState(initialObject);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Effect to populate form when linkToEdit changes (for editing)
  // or clear it if linkToEdit becomes null (switching from edit to create)
  useEffect(() => {
    if (isEditMode && linkToEdit) {
      // Populate form with existing link data - ensure all fields exist
      setFormData({
        description: linkToEdit.description || "",
        iosBundleId: linkToEdit.iosBundleId || "",
        iosAppStoreId: linkToEdit.iosAppStoreId || "",
        iosDeepLink: linkToEdit.iosDeepLink || "",
        androidPackageName: linkToEdit.androidPackageName || "",
        androidDeepLink: linkToEdit.androidDeepLink || "",
        webFallbackUrl: linkToEdit.webFallbackUrl || "",
        socialTitle: linkToEdit.socialTitle || "",
        socialDescription: linkToEdit.socialDescription || "",
        socialImageUrl: linkToEdit.socialImageUrl || "",
      });
    } else {
      // Clear form if not in edit mode or linkToEdit is cleared
      setFormData(initialObject);
    }
    // Reset error when mode changes
    setError("");
  }, [linkToEdit, isEditMode]); // Rerun effect if linkToEdit changes

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

    // --- Logic depends on mode ---
    const method = isEditMode ? "PUT" : "POST"; // Or PATCH for partial updates
    // Target specific link ID for updates, base endpoint for creates
    const apiUrl = isEditMode
      ? `/api/links/${linkToEdit._id}` // Assumes backend route uses _id
      : "/api/links";

    try {
      const response = await fetch(apiUrl, {
        method: method, // Use dynamic method
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorData = { message: `HTTP error! status: ${response.status}` };
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Handle case where response is not valid JSON
          console.error("Failed to parse error response JSON:", jsonError);
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const savedLink = await response.json(); // Contains new or updated link

      // Call the generalized save handler passed from parent
      onSave(savedLink, isEditMode);

      // Clear form only if creating a new link
      if (!isEditMode) {
        setFormData(initialObject);
      }
      // If editing, typically the parent component would handle closing the form/modal
      // or indicating success, so we don't clear the form here.
    } catch (err) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} link:`, err);
      setError(
        err.message || `Failed to ${isEditMode ? "update" : "create"} link.`,
      );
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
      {/* Dynamically change title based on mode */}
      <h2>{isEditMode ? "Edit Dynamic Link" : "Create New Dynamic Link"}</h2>
      {isEditMode && linkToEdit && (
        <p>
          <small>Editing link with short code: {linkToEdit.shortCode}</small>
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* All the input fields remain the same structure */}
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
        {/* Dynamically change button text based on mode */}
        {loading
          ? isEditMode
            ? "Updating..."
            : "Creating..."
          : isEditMode
            ? "Update Link"
            : "Create Link"}
      </button>
      {/* Optionally add a Cancel button for edit mode */}
      {/* {isEditMode && <button type="button" onClick={onCancelEdit} style={{ marginLeft: '10px'}}>Cancel</button>} */}
    </form>
  );
};

export default LinkForm;
