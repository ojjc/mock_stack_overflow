import React from 'react';

function ValidateText({ text = '' }) {
  const parseText = (text) => {
    const regex = /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g;
    const parsed = text.replace(regex, (match, linkText, linkURL) => {
      return `<a href="${linkURL}" target="_blank">${linkText}</a>`;
    });

    return { __html: parsed };
  };

  const validateHyperlinks = (text) => {
    const regex = /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g;
    let valid = true;

    text.replace(regex, (match, linkText, linkURL) => {
      if (!linkText || !linkURL || (!linkURL.startsWith('http://') && !linkURL.startsWith('https://'))) {
        valid = false;
      }
    });

    return valid;
  };

  const isValid = validateHyperlinks(text);
  const parsedText = parseText(text);

  return (
    <div>
      {isValid ? (
        <div dangerouslySetInnerHTML={parsedText} />
      ) : (
        <p>Invalid hyperlink format. Hyperlinks must be enclosed in [text](https://example.com).</p>
      )}
    </div>
  );
}

export default ValidateText;
