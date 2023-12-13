import React from 'react';

function CommentButton({ onClick }) {
  return <button type='button' className="comment" onClick={onClick}>Add Comment</button>;
}

export default CommentButton;
