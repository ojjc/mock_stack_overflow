import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function QuestionForm({ onFormSubmit }) {
  const { state: { email, username } } = useAuth();
  const [tagModel, setTagModel] = useState([]);
  const [rep, setRep] = useState(null);

  const initialForm = {
    title: '',
    summary: '',
    text: '',
    tags: '',
  };

  const [formData, setFormData] = useState(initialForm);
  // const [tagModel, setTagModel] = useState([]);
  const [errors, setErrors] = useState(initialForm);

  useEffect(() => {
    axios.get('http://localhost:8000/getTags')
      .then(tags => {
        setTagModel(tags.data);
      })
      .catch(err => console.log(err));
  }, []); 

  // get user rep
  useEffect(() => {
    axios.get(`http://localhost:8000/getUserInfo/${email}`)
      .then(response => {
        setRep(response.data.rep);
      })
      .catch(err => console.log(err));
  }, []); 

  const handleFormSubmit = (event) => {
    event.preventDefault();

    // Validation logic
    let valid = true;

    if (formData.title.length === 0) {
      setErrors((prevErrors) => ({ ...prevErrors, title: 'Please enter a question title.' }));
      valid = false;
    } else if (formData.title.length > 50) {
      setErrors((prevErrors) => ({ ...prevErrors, title: 'Question Title must be 50 characters or less.' }));
      valid = false;
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, title: '' }));
    }

    if (formData.summary.length === 0) {
      setErrors((prevErrors) => ({ ...prevErrors, summary: 'Please enter a question summary.' }));
      valid = false;
    } else if (formData.summary.length > 140) {
      setErrors((prevErrors) => ({ ...prevErrors, summary: 'Question summary must be 140 characters or less.' }));
      valid = false;
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, summary: '' }));
    }

    if (formData.text.length === 0) {
      setErrors((prevErrors) => ({ ...prevErrors, text: 'Please enter a response.' }));
      valid = false;
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, text: '' }));
    }

    // convert from array to set back to array to elim duplicate tags
    const tagsArray = Array.from(new Set(formData.tags.toLowerCase().trim().split(/\s+/)));
    const invalidTags = tagsArray.filter((tag) => tag.length > 10);

    if (invalidTags.length > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, tags: 'Please limit tag length to 10 characters or less for the following tag(s): ' + invalidTags.join(', ') }));
      valid = false;
    } else if (tagsArray.length > 5) {
      setErrors((prevErrors) => ({ ...prevErrors, tags: 'Please limit the number of tags to 5.' }));
      valid = false;
    } else if (formData.tags.length === 0) {
      setErrors((prevErrors) => ({ ...prevErrors, tags: 'Please enter at least one tag.' }));
      valid = false;
    } else if (rep < 50) {
      tagsArray.forEach(formTag => {
        const tagExists = tagModel.some((existingTag) => existingTag.name.toLowerCase() === formTag.toLowerCase());
        if (!tagExists) {
          setErrors((prevErrors) => ({ ...prevErrors, tags: 'Must have at least 50 points to add new tag. Please choose from exisiting tags.' }))
          valid = false;
        }
      })
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, tags: '' }));
    }

    
    // posting question
    if (valid) {
      // get objectid from username
      axios.get(`http://localhost:8000/getUserInfo/${email}`)
        .then((response) => {
          const userId = response.data.userId;
  
          const newQues = {
            title: formData.title,
            summary: formData.summary,
            text: formData.text,
            tags: tagsArray,
            asked_by: username,
            asked_by_id: [userId]
          };
  
          axios.post('http://localhost:8000/addQuestion', newQues)
            .then((response) => {
              console.log("new question: " + response.data);
  
              // add question to user
              axios.post(`http://localhost:8000/addQuestionToUser/${userId}`, {
                questionId: response.data._id,
              })
                .then(() => {
                  console.log('question added to user');
                })
                .catch((error) => {
                  console.error('error adding question to user:', error);
                });

              // add tag to user
              axios.post(`http://localhost:8000/addTagToUser/${userId}`, {
                tagId: response.data._id,
              })
                .then(() => {
                  console.log('question added to user');
                })
                .catch((error) => {
                  console.error('error adding question to user:', error);
                });
  
              setFormData(initialForm);
              onFormSubmit(response.data);
              console.log('new q res',response.data)
            })
            .catch((error) => {
              console.error('error posting the question:', error);
            });
        })
        .catch((error) => {
          console.error('error getting user ID:', error);
        });
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  return (
    <section id="form_page" className='page'>
      <form className='page' onSubmit={handleFormSubmit} noValidate>
        <label htmlFor="q_title">Question Title*</label>
        <input type="text" id="q_title" name="title" value={formData.title} onChange={handleInputChange} required /><br /><br />
        <p id="q_title_error" className="error">{errors.title}</p><br />

        <label htmlFor="q_summary">Question Summary*</label>
        <textarea type="text" id="q_summary" name="summary" value={formData.summary} onChange={handleInputChange} required /><br /><br />
        <p id="q_summary_error" className="error">{errors.summary}</p><br />

        <label htmlFor="q_text">Question Text*</label>
        <textarea id="q_text" name="text" value={formData.text} onChange={handleInputChange} required ></textarea><br /><br />
        <p id="q_text_error" className="error">{errors.text}</p><br />

        <label htmlFor="q_tags">Tags*</label>

        <div className="existing-tags">
          <h3>Existing Tags</h3>
          <div className="tag-list">
            {tagModel.map(tag => (
              <span key={tag._id} className="tags-qform">{tag.name}</span>
            ))}
          </div>
        </div>  

        <input type="text" id="q_tags" name="tags" value={formData.tags} onChange={handleInputChange} required /><br /><br />
        <p id="q_tags_error" className="error">{errors.tags}</p><br />

        <button type="submit" id="post_q">Post Question</button>
        <p className="mand">* indicates mandatory fields</p>
      </form>
    </section>
  );
}