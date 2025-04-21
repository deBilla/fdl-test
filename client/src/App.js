import React, { useState, useEffect, useCallback } from "react";
import LinkForm from "./components/LinkForm";
import LinkList from "./components/LinkList";

function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // --- NEW: State to hold the link object being edited ---
  const [editingLink, setEditingLink] = useState(null);
  // --- End NEW ---

  const fetchLinks = useCallback(async () => {
    // console.log("Fetching links..."); // Debug log
    setLoading(true);
    setError("");
    // Use environment variable if configured, otherwise default for proxy
    const apiUrl = `/api/links`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLinks(data);
    } catch (err) {
      console.error("Failed to fetch links:", err);
      setError(err.message || "Failed to fetch links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // --- NEW: Function called by LinkList when Edit button is clicked ---
  const handleEditRequest = (linkToEdit) => {
    console.log("Editing requested for:", linkToEdit); // Debug log
    setEditingLink(linkToEdit);
    // Optional: Scroll to the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // --- End NEW ---

  // --- NEW: Function called by LinkForm when Create or Update succeeds ---
  // Renamed from handleLinkCreated
  const handleSave = (savedLink, wasEditing) => {
    if (wasEditing) {
      // Find the link in the list and replace it with the updated one
      setLinks((prevLinks) =>
        prevLinks.map((l) => (l._id === savedLink._id ? savedLink : l)),
      );
      console.log("Link updated:", savedLink); // Debug log
    } else {
      // Add the newly created link to the top of the list
      setLinks((prevLinks) => [savedLink, ...prevLinks]);
      console.log("Link created:", savedLink); // Debug log
    }
    // IMPORTANT: Clear the editing state to switch form back to "Create" mode
    setEditingLink(null);
  };
  // --- End NEW ---

  // --- Optional: Function to cancel editing ---
  const handleCancelEdit = () => {
    setEditingLink(null);
  };
  // --- End Optional ---

  return (
    <div
      className="App"
      style={{
        maxWidth: "800px",
        margin: "20px auto",
        fontFamily: "sans-serif",
      }}
    >
      <header className="App-header">
        <h1>Dynamic Links Dashboard</h1>
        <p>High-Level Overview: Create and manage dynamic links.</p>
      </header>
      <main>
        {/* Pass editingLink state and onSave handler to LinkForm */}
        <LinkForm
          linkToEdit={editingLink}
          onSave={handleSave}
          // Optional: Pass cancel handler
          // onCancelEdit={handleCancelEdit}
        />
        {/* Pass handler to LinkList */}
        <LinkList
          links={links}
          loading={loading}
          error={error}
          onEditRequest={handleEditRequest} // <-- Pass handler down
        />
      </main>
    </div>
  );
}

export default App;
