import React, { useState, useEffect } from "react";
import QText from "./qtext";
import AnswerButton from "./answerbutton";
import AnswerForm from "./AnswerForm";
import AnswerDetails from "./a-cont";
import AskButton from "./askbutton";
import GetMetadata from "./getMetadata";
import axios from 'axios';
import CommentButton from "./commentbutton";
import CommentDetails from "./c-cont";
import { useAuth } from './AuthContext';

export default function QuestionDetailsPage({ question, onAskQuestionClick, guest, canEdit}) {
  const { state: { username, email } } = useAuth();

  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // State variable to trigger component re-renders
  const [q, setQ] = useState([]);
  const [currentQ, setCurrentQ] = useState(question);
  // const [tags, setTags] = useState([]);
  const [commentAnswerId, setCommentAnswerId] = useState(null); // Track answer id for comment form
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  // const [voteError, setvoteError] = useState('');

  // useEffect(() => {
  //   axios.get('http://localhost:8000/getTags')
  //     .then((response) => {
  //       setTags(response.data);
  //     })
  //     .catch((error) => {
  //       console.error('Error fetching tags:', error);
  //     });
  // }, []);

  useEffect(() => {
    let isMounted = true;

    axios.get('http://localhost:8000/getQuestions')
      .then((response) => {
        if (isMounted){
          setQ(response.data);
        }
      })
      .catch((error) => {
        console.error('Error fetching questions:', error);
      });

      return () => {
        isMounted = false;
      };
  }, [reloadKey]);

  const handleAnswerButtonClick = () => {
    setShowAnswerForm(true);
  };

  const handleFormSubmit = async (newAns) => {
    try {
      console.log('-------adding new ans:', newAns)
      // await axios.post(
      //   `http://localhost:8000/addAnswerToQuestion/${question._id}`,
      //   {
      //     text: newAns.text,
      //     ans_by: newAns.ans_by,
      //   }
      // );

      // Update the question state with the new answer
      const updatedQuestion = { ...currentQ };
      console.log('updated Question before pushing', updatedQuestion)
      updatedQuestion.answers.push(newAns);
      console.log('updated Question after pushing', updatedQuestion)

      console.log('----------before current q', currentQ)
      // setCurrentQ(updatedQuestion);\
      // setCurrentQ(prevQuestion => ({
      //   ...prevQuestion,
      //   answers: updatedQuestion.answers,
      // }));

      setCurrentQ(updatedQuestion)
      // setCurrentQ(prevQuestion => ({ ...prevQuestion, answers: updatedQuestion.answers }));
      console.log('----------updated current q', currentQ)
      
      console.log('q after new question', q)
      
      // Hide the AnswerForm
      setShowAnswerForm(false);

      // Increment the reload key if needed
      setReloadKey(reloadKey + 1);
    } catch (error) {
      console.error('Error adding answer:', error);
    }
  };

  const handleVote = async (questionId, voteType) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/updateQVotes/${questionId}`,
        {
          voteType: voteType,
        }
      );

      const userresponse = await axios.get(`http://localhost:8000/getUserInfo/${email}`);
      const userId = userresponse.data.userId;
      const rep = userresponse.data.rep;

      const questionResponse = await axios.get(`http://localhost:8000/FromId/${questionId}`);
      const questionOwnerId = questionResponse.data.asked_by_id;

      if (userId == questionOwnerId) {
        window.alert('You cannot vote on your own question.');
        return;
      }
      
      if (rep < 50) {
        // console.error('Must have reputation of 50 or more to comment.')
        // setvoteError('Must have reputation of 50 or more to comment.');
        window.alert('Must have reputation of 50 or more to vote a question.');
        return;
      }

      console.log(response.data.message); 

      // update user rep
      const responseRep = await axios.post(
        `http://localhost:8000/updateQRep/${questionId}`, // Update this to your actual user ID
        {
          voteType: voteType,
        }
      );
  
      console.log(responseRep.data.message);
      // const updatedQuestion = await axios.get(`http://localhost:8000/FromId/${questionId}`);
      // setCurrentQ(updatedQuestion.data);
      setCurrentQ(prevQuestion => ({ ...prevQuestion, ...questionResponse.data }));

      console.log('------updated q', questionResponse.data)
      // setReloadKey(reloadKey + 1);
    } catch (error) {
      console.error('error updating votes for question (C):', error);
    }
  };

  const handleCommentSubmit = async () => {
    try {
      if (commentText.trim() === '') {
        console.error('Comment text is required.');
        setCommentError('Comment text is required.');
        return;
      } else if (commentText.length > 140) {
        console.error('Limit comment to 140 characters..');
        setCommentError('Please limit comment to 140 characters.');
        return;
      }

      const response = await axios.get(`http://localhost:8000/getUserInfo/${email}`);
      const userId = response.data.userId;
      const rep = response.data.rep;
      
      if (rep < 50) {
        console.error('Must have reputation of 50 or more to comment.')
        setCommentError('Must have reputation of 50 or more to comment.');
        return;
      }

      // console.log("comment text: ", commentText);
      const newCom = {
        text: commentText,
        com_by: username,
        com_by_id: [userId],
        com_date_time: Date.now(),
        votes:0,
      };

      const commentResponse = await axios.post(
        `http://localhost:8000/addCommentToQuestion/${question._id}`,
        newCom
      );
      const commentId = commentResponse.data._id;
      newCom._id = commentId;
      console.log('new comment id', newCom.id);
      // add comment to user
      await axios.post(`http://localhost:8000/addCommentToUser/${userId}`, {
        commentId: commentId,
      });

      setCommentAnswerId(null);
      setCommentText('');
      setCommentError('');

      const updatedQuestion = await axios.get(`http://localhost:8000/FromId/${question._id}`);
      console.log('updated q after new comment', updatedQuestion.data)
      // setCurrentQ(updatedQuestion.data);
      // setCurrentQ(prevQuestion => ({ ...prevQuestion, ...updatedQuestion.data }));
      setCurrentQ(prevQuestion => ({
        ...prevQuestion,
        comments: updatedQuestion.data.comments,
      }));

      setQ(prevQuestions => prevQuestions.map(q => (q._id === question._id ? updatedQuestion.data : q)));

      setReloadKey(reloadKey + 1);

      // const updatedQuestion = await axios.get(`http://localhost:8000/getQuestionComment/${question._id}`);
      // setQ(updatedQuestion.data);
      
    } catch (error) {
      setCommentError('Error adding comment.');
      console.error('error adding comment:', error);
    }
  };


  const handleDeleteAnswer = async (deletedAnswerId) => {
    console.log('handling deleted answer------')
    console.log('Deleted answer ID:', deletedAnswerId);
    // Update the state with the reduced number of answers
    await axios.delete(`http://localhost:8000/deleteAnswer/${deletedAnswerId}`);
    setCurrentQ((prevQuestion) => {
      const updatedAnswers = prevQuestion.answers.filter((answer) => answer._id !== deletedAnswerId);
      
      // const updatedAnswers = prevQuestion.answers.filter((answer) => answer._id !== deletedAnswerId);
      console.log('Updated answers after deletion:', updatedAnswers);
  
      const updatedQuestion = {
        ...prevQuestion,
        answers: updatedAnswers,
      };
  
      console.log('Updated question with deleted answer:', updatedQuestion);
      return updatedQuestion;
    });
    setReloadKey(reloadKey + 1);
  };

  return (
    <div>
      {showAnswerForm ? (
        // render the AnswerForm when showAnswerForm is true
        <AnswerForm 
            key={`AnswerForm-${reloadKey}`}
            question={currentQ} 
            onFormSubmit={handleFormSubmit}
        />
      ) : (
        // render the question details if showAnswerForm is false
        <section id="qna" className="page">
          <form id="qna_page">
            <div id="qna" className="qna">

              <div id="qna-TOP" className="qna-TOP">
                <h3 id="questAndTit">{currentQ.title}</h3>
                <div className="ask">
                  {!guest && <AskButton onClick={() => onAskQuestionClick()} />}
                </div>
              </div>

              <div id="view-cont" className="view-cont-mid">
                <p id="view-amt" className="view-amt">
                  {currentQ.views} {currentQ.views === 1 ? "view" : "views"}
                </p>
                <p id="ans-amt" className="ans-amt">{currentQ.answers.length}{" "}
                  {currentQ.answers.length === 1 ? "answer" : "answers"}
                </p>
              </div>

              {/* <hr className="dotted-divider-qdetails" /> */}

              <div id="text-cont" className="qdetails-mid">
                <div className="vote-buttons">
                  {!guest && <button type='button' onClick={() => handleVote(currentQ._id, 'upvote')}>Upvote</button>}
                  <div className="votes-wrapper">
                    <p id="voteCount">{currentQ.votes} {currentQ.votes === 1 ? "vote" : "votes"}</p>
                  </div>
                  {!guest && <button type='button' onClick={() => handleVote(currentQ._id, 'downvote')}>Downvote</button>}
                </div>
                <div id="questcont" className="questcont">
                    <QText text={currentQ.text} />
                </div>
                <div id="askedByDate-a" className="askedByDate-a">
                  <p id="askedByDate">
                    <span className="asked-by">{question.asked_by}</span><p className='space'></p>asked{" "}
                    <GetMetadata date={new Date(question.ask_date_time)}/>
                  </p>
                </div>
              </div>

            {/* <hr className="dotted-divider" /> */}
            {currentQ.comments && currentQ.comments.length > 0 && (
              <CommentDetails
                key={`CommentDetails-${reloadKey}`}
                comments={currentQ.comments}
                guest={guest}
              />
            )}

            {!guest && (
              <CommentButton
                onClick={() => setCommentAnswerId(commentAnswerId === question._id ? null : question._id)}
              />
            )}
            {commentAnswerId === question._id && (
              <form onSubmit={(e => e.preventDefault())}>
                <div>
                  <label htmlFor="comment-textarea" className="c-label"></label>
                    <textarea
                      id="comment-textarea"
                      name="comment-textareaname"
                      className="c-textarea"
                      placeholder="Add your comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(question._id);
                        }
                      }}
                    />
                  <p className="comment-error">{commentError}</p>
                </div>
              {/* <button type='button' className="submitcomment" onClick={handleCommentSubmit}>Add Comment</button> */}
              </form>
            )}

              <hr className="dotted-divider" />
              <h3>{currentQ.answers.length}{" "}
                  {currentQ.answers.length === 1 ? "answer" : "answers"}</h3>
              <AnswerDetails 
                key={`AnswerDetails-${reloadKey}`}
                answers={currentQ.answers}
                guest={guest}
                canEdit={canEdit}
                onDeleteAnswer={handleDeleteAnswer}
              />

              <div className="answer">
                {!guest && <AnswerButton id="answer_q" onClick={handleAnswerButtonClick}/>}
              </div>

            </div>
          </form>
        </section>
      )}
    </div>
  );
}
