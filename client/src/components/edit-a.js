import React, { useState, useEffect } from 'react';
import axios from "axios";

export default function EditA({answer, onEditAnswer}){
    const [formData, setFormData] = useState({text: answer.text});
    const [errors, setErrors] = useState({text: ''});

    const handleInputChange = ({ target: { name, value } }) => {
        setFormData((prevData) => ({ ...prevData, [name]: value }));
      };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
  
        const valid = formData.text.length !== 0;

        setErrors((prevErrors) => ({ ...prevErrors, text: valid ? '' : 'Please enter a response.' }));  
  
        if (valid) {
          try {
            const response = await axios.put(`http://localhost:8000/updateAnswer/${answer._id}`, formData);
            console.log('Answer updated:', response.data);
          } catch (error) {
            console.error('Error updating question:', error);
          }
        }
        onEditAnswer();
      };

    return (
        <section id="form_page" className='page'>
          {/* <form className='page' onSubmit={onEditAnswer} noValidate> */}
            <label htmlFor="q_text">Answer Text*</label>
            <textarea id="q_text" name="text" value={formData.text} onChange={handleInputChange} required ></textarea><br /><br />
            <p id="q_text_error" className="error">{errors.text}</p><br />
    
            <p className="mand">* indicates mandatory fields</p>
            <br /><br />
            <button type="button" id="update_a" onClick={handleFormSubmit}>Save edits</button>
          {/* </form> */}
        </section>
      );
}
