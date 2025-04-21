import React from 'react';

const LinkList = ({ links, loading, error }) => {

    if (loading) return <p>Loading links...</p>;
    if (error) return <p style={{ color: 'red' }}>Error loading links: {error}</p>;
    if (!links || links.length === 0) return <p>No links created yet.</p>;

    // Determine the base URL for the short links (where the Node server is running)
    // For production, use the actual domain. For local dev, it's likely localhost:PORT
    const serverBaseUrl = process.env.NODE_ENV === 'production'
        ? window.location.origin // Or your production server URL if different
        : 'http://localhost:5001'; // Match server PORT

    return (
        <div>
            <h2>Existing Dynamic Links</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {links.map((link) => (
                    <li key={link._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px' }}>
                        <strong>Short Link:</strong>{' '}
                        <a href={`${serverBaseUrl}/${link.shortCode}`} target="_blank" rel="noopener noreferrer">
                           {`${serverBaseUrl}/${link.shortCode}`}
                        </a>
                        <p style={{margin: '5px 0'}}><strong>Description:</strong> {link.description || 'N/A'}</p>
                        <p style={{margin: '5px 0'}}><strong>Web Fallback:</strong> {link.webFallbackUrl}</p>
                        {link.iosBundleId && <p style={{margin: '5px 0'}}><strong>iOS Target:</strong> {link.iosDeepLink || `App Store ID: ${link.iosAppStoreId}` || `Bundle: ${link.iosBundleId}`}</p>}
                        {link.androidPackageName && <p style={{margin: '5px 0'}}><strong>Android Target:</strong> {link.androidDeepLink || `Package: ${link.androidPackageName}`}</p>}
                        <small>Created: {new Date(link.createdAt).toLocaleString()}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LinkList;
