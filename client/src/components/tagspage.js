import React, { useEffect, useState } from 'react';
import AskButton from './askbutton';
import QuestionContainer from './q-cont';
import axios from 'axios';
import QuestionDetailsPage from './qdetails';

export default function TagsPage({ username, onAskQuestionClick, guest, userTags, onTitleClick, handleSortChange, sortingMethod }) {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [tagToEdit, setTagToEdit] = useState(null);
  const [editedTagName, setEditedTagName] = useState('');

  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userTags) {
          const response = await axios.get('http://localhost:8000/getTags');
          setTags(response.data);
        } else {
          setTags(userTags);
        }

        const allQuestions = await axios.get('http://localhost:8000/getQuestions');
        setQuestions(allQuestions.data);
      } catch (error) {
        console.error('error fetching tags and questions', error);
      }
    };

    fetchData();
  }, [userTags]);


  const handleTagClick = async (tag) => {
    console.log('selected tag: ' + tag.name);
    setSelectedTag(tag);

    try {
      const response = await axios.get(`http://localhost:8000/getQuestionsByTag/${tag._id}`);
      setFilteredQuestions(response.data);

      const allQuestions = await axios.get('http://localhost:8000/getQuestions');
      setQuestions(allQuestions.data);
    } catch (error) {
      console.error('error updating tags and questions', error);
    }
  };

  const generateTagRows = (tags) => {
      const tagRows = [];
      for (let i = 0; i < tags.length; i += 3) {
        tagRows.push(tags.slice(i, i + 3));
      }
      return tagRows;
    };
  
  const handleDeleteTag = async (tag) => {
    try {
      const response = await axios.get(`http://localhost:8000/isTagInUse/${tag._id}`);
      const inUse = response.data.inUse; 
      if (inUse) {
        window.alert(`Cannot delete ${tag.name} because it is being used.`);
      } else {
        await axios.delete(`http://localhost:8000/deleteTag/${tag._id}`);
  
        setTags((prevTags) => prevTags.filter((t) => t._id !== tag._id));
      }
    } catch (error) {
      console.error(`Error deleting ${tag}:`, error);
    }
  }

  const handleEditTag = async (tag) => {
    try {
      const response = await axios.get(`http://localhost:8000/isTagInUse/${tag._id}`);
      const inUse = response.data.inUse; 

      if (inUse) {
        window.alert(`Cannot edit ${tag.name} because it is being used.`);
      } else {
        setEditedTagName(tag.name);
        setTagToEdit(tag);
      }
    } catch (error) {
      console.error(`Error editing ${tag}:`, error);
    }
  }

  const handleSaveEdit = () => {
    axios.put(`http://localhost:8000/editTag/${tagToEdit._id}`, { name: editedTagName })
      .then(response => {
        console.log('Tag updated successfully:', response.data);
        setTags(prevTags => prevTags.map(tag => (tag._id === tagToEdit._id ? { ...tag, name: editedTagName } : tag)));

        setTagToEdit(false);
      })
      .catch(error => {
        console.error('Error updating tag:', error);
      });
  };

  const handleCancelEdit = () => {
    setTagToEdit(null);
  };

  return (
    <div>
      {selectedQuestion ? (
      // go to QuestionDetails page when title is pressed
        <QuestionDetailsPage question={selectedQuestion} onAskQuestionClick={onAskQuestionClick} guest={guest} canEdit={false} />
      ) : (
        <section id="filteredTags" className="page">
        <div className="top_tags_page" id="top">
          {selectedTag && (
              <div id='ontagselect'>
                <h2 id="tq-top">Questions with [{selectedTag.name}] tag</h2>
                <p id="num_tag" className='num_tag'>
                  {questions.filter(q => q.tags.includes(selectedTag._id)).length}{" "}
                  {questions.filter(q => q.tags.includes(selectedTag._id)).length === 1 ? "Question" : "Questions"}
                </p>
              </div>
          )} 
          {!selectedTag && (
            <div id='ugh'>
              <h1 id='num_t'>{tags.length === 1 ? `${tags.length} Tag` : `${tags.length} Tags`}</h1>
              {!userTags && <p id="all_t">All Tags</p>}
              {userTags && <p id="all_t">{username}'s Created Tags</p>}
            </div>
          )}
          <div className="ask">
            {!guest && !userTags && <AskButton id="ask_q" onClick={() => onAskQuestionClick()} />}
          </div>
        </div>
        
        {selectedTag ? (
          <div id="filtered-tag-container">
            <QuestionContainer
              onTitleClick={setSelectedQuestion} // set the selected question when a title is clicked
              questions={filteredQuestions}
            />
          </div>
        ) : (
          <div id="tags-list-container" className="tags-list">
        {generateTagRows(tags).map((tagRow, rowIndex) => (
          <div className="tag-row" key={rowIndex}>
            {tagRow.map((tag) => (
              <div className='tag-box' key={tag.name}>
                <div className="tag">
                  {tagToEdit && tagToEdit._id === tag._id? (
                    <>
                      <input
                        type="text"
                        value={editedTagName}
                        onChange={(e) => setEditedTagName(e.target.value)}
                      />
                      <button type="button" onClick={handleSaveEdit}>Save</button>
                      <button type="button" onClick={handleCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button id='tagname' onClick={() => handleTagClick(tag)}>
                        <h3>{tag.name}</h3>
                      </button>
                      <p>
                        {questions.filter((q) => q.tags.includes(tag._id)).length}{' '}
                        {questions.filter((q) => q.tags.includes(tag._id)).length === 1
                          ? 'question'
                          : 'questions'}
                      </p>
                      {userTags && (
                        <div>
                          <button type='button' onClick={() => handleEditTag(tag)}>Edit</button>
                          <button type='button' onClick={() => handleDeleteTag(tag)}>Delete</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
        )}
        </section>
      )}
    </div>
  );
}