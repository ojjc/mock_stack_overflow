import React, {useState, useEffect} from 'react'
import axios from 'axios'

export default function UpdateQ( {qid, username, rep, user, onDeleteClick, onEdit} ) {
  console.log('qid',qid)
    const [question, setQuestion] = useState({});
    const [tagModel, setTagModel] = useState([]);
    const [formData, setFormData] = useState({
      title: '',
      summary: '',
      text: '',
      tags: [],
      asked_by: username,
      asked_by_id: [user],
    });
    
    const [errors, setErrors] = useState({
      title: '',
      summary: '',
      text: '',
      tags: '',
    });

    useEffect(() => {
      console.log('fetching question')
        const fetchQuestion = async () => {
          try {
            const response = await axios.get(`http://localhost:8000/FromId/${qid}`);
            setQuestion(response.data);

            // Fetch tag details for each tag in the array
            const tagsData = await Promise.all(
              response.data.tags.map(async (tagId) => {
                const tagResponse = await axios.get(`http://localhost:8000/getTagFromId/${tagId}`);
                return {
                  _id: tagId,
                  name: tagResponse.data.name,
                };
              })
            );
            console.log('tagsData:', tagsData)

            setFormData({
              title: response.data.title,
              summary: response.data.summary,
              text: response.data.text,
              tags: tagsData,
              asked_by: username,
              asked_by_id: [user],
            });
          } catch (error) {
            console.error('Error fetching question:', error);
          }
        };


        const fetchTagModel = async () => {
          try {
            const tags = await axios.get('http://localhost:8000/getTags');
            setTagModel(tags.data);
          } catch (error) {
            console.log('Error fetching tag model:', error);
          }
        };
    
        fetchQuestion();
        fetchTagModel();
      }, [qid]);


    const handleFormSubmit = async (event) => {
      event.preventDefault();

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

      const tagsArray = Array.from(new Set(formData.tags.map(tag => tag.name.toLowerCase().trim())));
      const invalidTags = tagsArray.filter((tag) => tag.length > 10);

      if (invalidTags.length > 0) {
        setErrors((prevErrors) => ({ ...prevErrors, tags: 'Please limit tag length to 10 characters or less for the following tag(s): ' + invalidTags.join(', ') }));
        valid = false;
      } else if (tagsArray.length > 5) {
        setErrors((prevErrors) => ({ ...prevErrors, tags: 'Please limit the number of tags to 5.' }));
        valid = false;
      } else if (tagsArray.includes('')) {
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

      if (valid) {
        // Create a new formData object with the updated tags array
        const updatedFormData = { ...formData, tags: tagsArray };
        console.log('is valid', updatedFormData)
        // formData.tags = tagsArray;
        try {
          const response = await axios.put(`http://localhost:8000/updateQuestion/${qid}`, updatedFormData);
          setQuestion(response.data)
          onEdit(question._id)
        } catch (error) {
          console.error('Error updating question:', error);
        }
      }
    };

    const handleInputChange = (event) => {
      const { name, value } = event.target;
      if (name === 'tags') {
        const tagsArray = value.split(/\s+/).map(tag => ({ name: tag }));
        setFormData((prevData) => ({ ...prevData, [name]: tagsArray }));
      } else {
        setFormData((prevData) => ({ ...prevData, [name]: value }));
      }
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
    
            <input 
              type="text" 
              id="q_tags" 
              name="tags" 
              value={formData.tags.map(tag => tag.name).join(' ')}
              onChange={handleInputChange} 
              required 
            /><br /><br />
            <p id="q_tags_error" className="error">{errors.tags}</p><br />
    
            <p className="mand">* indicates mandatory fields</p>
            <br /><br />
            <button type="submit" id="post_q">Update Question</button>
            <button type='button' id='delete_q' onClick={onDeleteClick}>Delete Question</button>
          </form>
        </section>
      );
}