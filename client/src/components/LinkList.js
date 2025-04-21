import React from "react";

// Add onEditRequest prop
const LinkList = ({ links, loading, error, onEditRequest }) => {
  // <-- Added onEditRequest

  if (loading) return <p>Loading links...</p>;
  if (error)
    return <p style={{ color: "red" }}>Error loading links: {error}</p>;
  if (!links || links.length === 0) return <p>No links created yet.</p>;

  const serverBaseUrl =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

  return (
    <div>
      <h2>Existing Dynamic Links</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {links.map((link) => (
          <li
            key={link._id}
            style={{
              border: "1px solid #eee",
              padding: "15px",
              marginBottom: "10px",
              position: "relative",
            }}
          >
            <strong>Short Link:</strong>{" "}
            <a
              href={`${serverBaseUrl}/${link.shortCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${serverBaseUrl}/${link.shortCode}`}
            </a>
            <p style={{ margin: "5px 0" }}>
              <strong>Description:</strong> {link.description || "N/A"}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>Web Fallback:</strong> {link.webFallbackUrl}
            </p>
            {link.iosBundleId && (
              <p style={{ margin: "5px 0" }}>
                <strong>iOS Target:</strong>{" "}
                {link.iosDeepLink ||
                  `App Store ID: ${link.iosAppStoreId}` ||
                  `Bundle: ${link.iosBundleId}`}
              </p>
            )}
            {link.androidPackageName && (
              <p style={{ margin: "5px 0" }}>
                <strong>Android Target:</strong>{" "}
                {link.androidDeepLink || `Package: ${link.androidPackageName}`}
              </p>
            )}
            {/* Add social preview details if they exist */}
            {(link.socialTitle ||
              link.socialDescription ||
              link.socialImageUrl) && (
              <div
                style={{
                  marginTop: "5px",
                  paddingTop: "5px",
                  borderTop: "1px dashed #ddd",
                }}
              >
                <small>
                  <strong>Social Preview:</strong>
                </small>
                <br />
                {link.socialTitle && (
                  <small>
                    Title: {link.socialTitle}
                    <br />
                  </small>
                )}
                {link.socialDescription && (
                  <small>
                    Desc: {link.socialDescription}
                    <br />
                  </small>
                )}
                {link.socialImageUrl && (
                  <small>
                    Image:{" "}
                    <a
                      href={link.socialImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Link
                    </a>
                  </small>
                )}
              </div>
            )}
            <small>Created: {new Date(link.createdAt).toLocaleString()}</small>
            {/* --- NEW: Edit Button --- */}
            <button
              onClick={() => onEditRequest(link)} // Pass the whole link object up
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                padding: "5px 8px",
                cursor: "pointer",
              }}
              aria-label={`Edit link ${link.shortCode}`}
            >
              Edit
            </button>
            {/* --- End NEW --- */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinkList;
