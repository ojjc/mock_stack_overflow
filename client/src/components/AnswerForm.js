import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

export default function AnswerForm({ question, onFormSubmit }) {
  const { state: { username, email } } = useAuth(); // get username
  const [text, setText] = useState('');
  // const [name, setName] = useState('');
  const [textError, setTextError] = useState('');
  // const [nameError, setNameError] = useState('');

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    let valid = true;

    if (text.trim() === '') {
      setTextError('Please enter a response.');
      valid = false;
    } else if (!validateTextHyperlinks(text)){
        setTextError("Invalid hyperlink format.")
        valid = false;
    } else {
      setTextError(''); // clear the error message
    }
    
    if (valid) {
      try {
        const response = await axios.get(`http://localhost:8000/getUserInfo/${email}`);
        const userId = response.data.userId;
  
        const newAns = {
          text,
          ans_by: username,
          ans_by_id: [userId],
          comments: [],
          ans_date_time: Date.now(),
          votes: 0,
        };
  
        const answerResponse = await axios.post(`http://localhost:8000/addAnswerToQuestion/${question._id}`, newAns);
        const answerId = answerResponse.data._id;

        await axios.post(`http://localhost:8000/addAnswerToUser/${userId}`, {
          answerId: answerId,
        });

        newAns._id = answerId;
        console.log('--------new ans:', newAns)
        console.log('--------new ans id:', newAns._id)

        onFormSubmit(newAns);
    
      } catch (error) {
        console.error('Error posting the answer:', error);
      }
    }
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  // const handleNameChange = (event) => {
  //   setName(event.target.value);
  // };

  const validateTextHyperlinks = (text) => {
    const regex = /\[([^[\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    const matches = Array.from(text.matchAll(regex));

    for (const match of matches) {
      const [, linkText, linkURL] = match;
      if (!linkText || !linkURL || (!linkURL.startsWith('http://') && !linkURL.startsWith('https://'))) {
        return false; // invalid hyperlink format
      }
    }
    return true; // all hyperlinks are valid
  };

  return (
    <section id="answer-form" className="page">
      <form id="new_a" method="POST" onSubmit={handleFormSubmit} noValidate>

        <label htmlFor="answer_text">Answer Text*</label>
        <p>Add details</p>
        <textarea id="answer_text" name="answer_text" value={text} onChange={handleTextChange} required/>
        <br /><br />
        <p id="a_text_error" className="error">
          {textError}
        </p>

        <button type="submit" value="Post Answer" id="post_answer">Post Answer</button>
        <p className="mand">* indicates mandatory fields</p>
      </form>
    </section>
  );
}