import { useEffect, useState } from 'react';

import api from '../services/api';

function DatabasePage() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    api
      .get('/dashboard/collections')
      .then((response) => setCollections(response.data));
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>MongoDB Collections</h2>
          <p className="muted">
            Live collection summary for the Visitor Pass Management database.
          </p>
        </div>
        <span className="database-badge">MongoDB Connected</span>
      </div>
      <div className="database-grid">
        {collections.map((collection) => (
          <article className="collection-card" key={collection.name}>
            <span className="collection-icon">{'{ }'}</span>
            <div>
              <b>{collection.name}</b>
              <p>{collection.documents} documents</p>
              <small>{collection.database}</small>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default DatabasePage;
