import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GetMetadata from './getMetadata';
import QuestionSummary from './q-summary';
import UpdateQ from './updateQ';
import TagsPage from './tagspage';
import AllUsers from './all-users';
import UserAnsweredQuestion from './user-answered-q';
import { pageData } from './create-pages';

export default function UserProfile({ username, email, onAskQuestionClick, questions }) {
  const [user, setUser] = useState();
  const [selectedUser, setSelectedUser] = useState(null);
  const [questionDetails, setQuestionDetails] = useState([]);
  const [selectedQid, setSelectedQid] = useState (null);
  const [answerDetails, setAnswerDetails] = useState([]);
  // const [answeredQ, setAnsweredQ] = useState(null);
  const [tagDetails, setTagDetails] = useState([]);
  const [bio, setBio] = useState('');
  const [editBio, setEditBio] = useState(false);
  const [answerModel, setAnswerModel] = useState([])
  const [reloadKey, setReloadKey] = useState(0); // State variable to trigger component re-renders
  // const [allUsers, setAllUsers] = useState([]);
  const [showAnsweredQuestions, setShowAnsweredQuestions] = useState(false);
  const [showTagsPage, setShowTagsPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // useEffect(() => {
  //   const fetchAllUsers = async () => {
  //     try {
  //       const response = await axios.get('http://localhost:8000/getAllUsers');
  //       setAllUsers(response.data);
  //     } catch (error) {
  //       console.error('Error fetching all users:', error);
  //     }
  //   };

  //   fetchAllUsers();
  // }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {

        const response = await axios.get(`http://localhost:8000/getUserProfile/${email}`);
        console.log('API Response:', response.data);
        setUser(response.data);
        setBio(response.data.bio);

        // fetch question details
        if (response.data && response.data.questions) {
          const details = await Promise.all(
            response.data.questions.map(async (questionId) => {
              try{
                const questionResponse = await axios.get(`http://localhost:8000/FromId/${questionId}`);
                if (questionResponse.data) {
                  return {
                    title: questionResponse.data.title,
                    votes: questionResponse.data.votes,
                    views: questionResponse.data.views,
                    date_time: questionResponse.data.date_time,
                    id: questionId,
                  };
                } else {
                  console.error(`Error: Question with ID ${questionId} not found`);
                  return null;
                }
              } catch (questionError) {
                console.error('Error fetching question:', questionError);
                return null;
              }
            }) 
          );
          const validDetails = details.filter((detail) => detail !== null)
          .sort((a,b) => new Date(b.date_time) - new Date(a.date_time));
          setQuestionDetails(validDetails);
          // setQuestionDetails(details);
        }

        // fetch answer details
        if (response.data && response.data.answers) {
          const details = await Promise.all(
            response.data.answers.map(async (answerId) => {
              try {
                const answerResponse = await axios.get(`http://localhost:8000/getAnswerFromId/${answerId}`);
                if (answerResponse.data) {
                  return {
                    title: answerResponse.data.title,
                    text: answerResponse.data.text,
                    answers: answerResponse.data.answers,
                    comments: answerResponse.data.comments,
                    votes: answerResponse.data.votes,
                    views: answerResponse.data.views,
                    asked_by: answerResponse.data.asked_by,
                    ask_date_time: answerResponse.data.date_time,
                    _id: answerResponse.data._id,
                  };
                } else {
                  console.error(`Error: Answer with ID ${answerId} not found`);
                  return null;
                }
              } catch (answerError) {
                console.error('Error fetching answer:', answerError);
                return null;
              }
            })
          );

          let validAnswerDetails = details.filter((detail) => detail !== null);
          validAnswerDetails = validAnswerDetails.filter((detail, index, self) =>
            index === self.findIndex((t) => t._id === detail._id)
          );
          setAnswerDetails(validAnswerDetails);
          // setAnswerDetails(details);
        }

        // fetch tag details
        if (response.data && response.data._id) {
          const tagResponse = await axios.get(`http://localhost:8000/getTagsFromUser/${response.data._id}`);
          // setTagDetails(tagResponse.data);
          const validTagDetails = tagResponse.data.filter((tagDetail) => tagDetail !== null);
          setTagDetails(validTagDetails);
        }


      } catch (error) {
        console.error('error getting user data:', error);
      }
    };

    fetchUserData();
  }, [email]);

  const handleBioSubmit = async (e) => {
    try {
      e.preventDefault();
      await axios.put(`http://localhost:8000/edit_bio/${user._id}`, { bio });
      console.log('editing bio');
  
      const updatedUserProfile = await axios.get(`http://localhost:8000/getUserProfile/${email}`);
  
      setUser(updatedUserProfile.data);
      setBio(updatedUserProfile.data.bio); 
      setEditBio(false);
    } catch (error) {
      console.error('error updating bio:', error);
    }
  };
  
  

  if (!user) {
    return <div></div>;
  }

  const handleDeleteQuestion = async (qid) => {
    console.log('deleting', qid)
    try {
      console.log('question details BEFORE deleting:', questionDetails)

      await axios.delete(`http://localhost:8000/deleteQuestion/${qid}`);
      console.log('deleted')
      // setQuestionDetails((prevDetails) => prevDetails.filter((detail) => detail.id !== qid));
      setQuestionDetails((prevDetails) => [
        ...prevDetails.filter((detail) => detail.id !== qid)
      ]);

      const answers = await axios.get('http://localhost:8000/getAnswers');
      setAnswerModel(answers)

      if (Array.isArray(answerModel)) {
        setAnswerDetails((prevDetails) => [
          ...prevDetails.filter((detail) => !answerModel.includes(detail.id)),
        ]);
      } else {
        console.error('answerModel is not an array:', answerModel);
      }

      setSelectedQid(null);

    } catch (error) {
      console.error('Error deleting question:', error);
    }
    setReloadKey(reloadKey + 1);
  };

  const handleUpdateQuestion = async (qid) => {
    try {
      // Fetch the updated question data
      const updatedQuestionResponse = await axios.get(`http://localhost:8000/FromId/${qid}`);
      
      if (updatedQuestionResponse.data) {
        // Update the question in the question details state
        setQuestionDetails((prevDetails) => [
          ...prevDetails.map((detail) => (detail.id === qid ? updatedQuestionResponse.data : detail)),
        ]);     
        window.alert('Question updated successfully!');   
      } else {
        console.error(`Error: Question with ID ${qid} not found`);
      }
      // setSelectedQid(null)
  
    } catch (error) {
      console.error('Error updating question:', error);
    }
    // setReloadKey(reloadKey + 1);

  };

  const handleSelectUser = async ({user}) => {
    setSelectedUser(user);
  }

  const handleNavigateToAnsweredQuestions = () => {
    setShowAnsweredQuestions(true);
  }

  const handleNavigateToTags = () => {
    setShowTagsPage(true);
  }

  const visibleQuestions = pageData(questionDetails, currentPage, 5);
  const totalPages = Math.ceil(questionDetails.length / 5);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };
  return (
    <div>
      {showAnsweredQuestions ? (
        <UserAnsweredQuestion 
          answerDetails={answerDetails} 
          username={user.username} 
          onAskQuestionClick={onAskQuestionClick}
          // onTitleClick={() => setAnsweredQ(answerDetails)}
        />
      ) : showTagsPage ? (
        <TagsPage
          questions={questions}
          userTags={tagDetails}
          guest={false}
          onAskQuestionClick={onAskQuestionClick}
          username={user.username} 
        />
      ) : selectedQid !== null ? (
        <UpdateQ
          key={`UpdateQ-${reloadKey}`}
          qid={selectedQid}
          username={user.username}
          rep={user.rep}
          user={user._id}
          onDeleteClick={() => handleDeleteQuestion(selectedQid)}
          onEdit={() => handleUpdateQuestion(selectedQid)}        
        />
      ) 
      // : answeredQ !== null ? (
      //   <QuestionDetailsPage
      //     question={answeredQ}
      //     onAskQuestionClick={onAskQuestionClick}
      //     guest={false}
      //     canEdit={true}
      //   />
      // ) 
      : selectedUser !== null ? (
        <UserProfile
          key={`UserProfile-${reloadKey}`}
          username={selectedUser.username}
          email={selectedUser.email}
          onAskQuestionClick={onAskQuestionClick}
          questions={questions}
        />
      ) : (
        <section id='user-profile' className='page'>
        <div className='top'>
          <h2>{user.username}'s Profile</h2>
          <p>Reputation: {user.rep}</p>
          <p>User since: <GetMetadata date={new Date(user.createdAt)} /></p>
        </div>
        <div className='user-mid'>
          <div className='user-bio'>
            <p>Bio: {user.bio}</p>
          </div>
        <div className='edit-bio'>
          <button type='button' id='edit-bio-button' onClick={() => setEditBio((prevEditBio) => !prevEditBio)}>
            {editBio ? 'Close Bio Form' : 'Edit Bio'}
          </button>
          {editBio === true && (
            <form onSubmit={handleBioSubmit}>
              <textarea className='bio-textarea' value={bio} onChange={(e) => setBio(e.target.value)} />
              <button type='submit' id='submit-bio'>
                Save Bio
              </button>
            </form>
            // <form onSubmit={(e => e.preventDefault())}>
            //   <textarea className='bio-textarea' value={bio} onChange={(e) => setBio(e.target.value)} />
            //   <button type='button' id='submit-bio' onClick={handleBioSubmit}>
            //     Save Bio
            //   </button>
            // </form>
          )}
        </div>
      </div>
      
      {user.role === 'admin' && (
        <div id='allUsers'>
          <AllUsers onSelectUser={handleSelectUser}/>
        </div>
      )}
  
        <div id="question-list" className="question-list">
          <h3>Questions Asked</h3>
          {visibleQuestions && visibleQuestions.length > 0 ? (
            <div className="up-question-list-container">
              {visibleQuestions.map((detail, index) => (
                <QuestionSummary
                  key={index}
                  question={detail}
                  onTitleClick={() => setSelectedQid(detail.id)}
                />
              ))}
              {questionDetails.length > 5 && (
                <div className="page-buttons">
                  <button type='button' onClick={handlePreviousPage} disabled={currentPage === 1}>
                    prev
                  </button>
                  <span>{`Page ${currentPage} of ${totalPages}`}</span>
                  <button type='button' onClick={handleNextPage} disabled={currentPage === totalPages}>
                    next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p>No questions asked.</p>
          )}
        </div>
  
        <div className="answer-list-container">
          <h3>Answered Questions</h3>
          <button type="button" onClick={handleNavigateToAnsweredQuestions}>
            View Answered Questions
          </button>
          {/* {answerDetails.length > 0 ? (
            answerDetails.map((detail, index) => (
              <QuestionSummary
                key={index}
                question={detail}
                onTitleClick={() => setAnsweredQ(detail)}
              />
            ))
          ) : (
            <p>No answered questions.</p>
          )} */}
        </div>
  
        <div className="tag-list-container">
        <h3>Tags</h3>
        <button type="button" onClick={handleNavigateToTags}>
          View Created Tags
        </button>
        </div>
      </section>
      )}
    </div>
  )};