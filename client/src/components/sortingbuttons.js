import React, { useState } from "react";

function SortingOptions({ onSortChange }) {
  const [sortingMethod, setSortingMethod] = useState('');

  const handleSortingChange = (method) => {
    setSortingMethod(method);
    onSortChange(method);
  };

  return (
    <div className="sorting-options" id="sorting-options">
      <button onClick={() => handleSortingChange('newest')}>Newest</button>
      <button onClick={() => handleSortingChange('active')}>Active</button>
      <button onClick={() => handleSortingChange('unanswered')}>Unanswered</button>
    </div>
  );
}

export default SortingOptions;