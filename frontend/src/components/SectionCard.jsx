import React from 'react';

const SectionCard = ({ title, description, children }) => (
  <section className="card">
    <header className="card__header">
      <h2>{title}</h2>
      {description && <p className="card__description">{description}</p>}
    </header>
    <div className="card__content">{children}</div>
  </section>
);

export default SectionCard;
