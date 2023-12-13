import React, { useEffect, useState } from 'react';
import QText from "./qtext";
import GetMetadata from "./getMetadata";
import axios from 'axios';
import { pageData } from './create-pages';
import CommentButton from './commentbutton';
import CommentDetails from './c-cont';
import { useAuth } from './AuthContext';
import EditA from './edit-a';

export default function AnswerDetails({ answers, guest, canEdit, onDeleteAnswer }) {
  console.log('answers', answers)
  const { state: {username, email, role} } = useAuth();
  const [answerModel, setAnswerModel] = useState([]);
  const answersPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [commentAnswerId, setCommentAnswerId] = useState(null); // Track answer id for comment form
  const [commentText, setCommentText] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // State variable to trigger component re-renders
  const [commentError, setCommentError] = useState('')
  const [editAnswer, setEditAnswer] = useState(null);
  console.log('username', username, 'role', role);

  useEffect(() => {
    let isMounted = true;

    axios.get('http://localhost:8000/getAnswers')
      .then((response) => {
        if (isMounted) {
          const sortTHEANSWERS = response.data.sort((a, b) => new Date(b.ans_date_time));
          setAnswerModel(sortTHEANSWERS);
        }
      })
      .catch((err) => console.log(err));

    // Cleanup function to cancel the request if the component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVote = async (answerId, voteType) => {
    try {
      const responseVotes = await axios.post(
        `http://localhost:8000/updateAVotes/${answerId}`,
        {
          voteType: voteType,
        }
      );

      const answerResponse = await axios.get(`http://localhost:8000/getAnswerFromId/${answerId}`);
      const answerOwnerId = answerResponse.data.asked_by_id;
      
      const userresponse = await axios.get(`http://localhost:8000/getUserInfo/${email}`);
      const userId = userresponse.data.userId;
      const rep = userresponse.data.rep;

      if (userId == answerOwnerId) {
        window.alert('You cannot vote on your own answer.');
        return;
      }
      
      if (rep < 50) {
        // console.error('Must have reputation of 50 or more to comment.')
        // setvoteError('Must have reputation of 50 or more to comment.');
        window.alert('Must have reputation of 50 or more to vote on an answer.');
        return;
      }
  
      console.log(responseVotes.data.message);

      // update user rep
      const responseRep = await axios.post(
        `http://localhost:8000/updateARep/${answerId}`,
        {
          voteType: voteType,
        }
      );
  
      console.log(responseRep.data.message);
  
      // Fetch updated answers after voting
      const updatedAnswers = await axios.get('http://localhost:8000/getAnswers');
      setAnswerModel(updatedAnswers.data);
  
    } catch (error) {
      console.error('Error updating votes and reputation:', error);
    }
  };

  const formatExisting = answers.map(ansId => ansId).filter(ansId => typeof ansId === 'string');
  const formatNew = answers.map(ans => ans._id).filter(ansId => ansId != null);
  const formattedAns = Array.from(new Set([...formatExisting, ...formatNew]));
  let allAns = answerModel.filter(answer => formattedAns.includes(answer._id));
  
  if (canEdit) {
    const userAnswers = allAns.filter(answer => answer.ans_by === username);
    const otherAnswers = allAns.filter(answer => answer.ans_by !== username);

    otherAnswers.sort((a, b) => new Date(b.ans_date_time) - new Date(a.ans_date_time));
    
    allAns = userAnswers.concat(otherAnswers);
  } else {
    allAns.sort((a, b) => new Date(b.ans_date_time) - new Date(a.ans_date_time));
  }

  const visibleAnswers = pageData(allAns, currentPage, answersPerPage);
  const totalPages = Math.ceil(allAns.length / answersPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handleCommentSubmit = async (answerId) => {
    try {
      if (commentText.trim() === '') {
        console.error('Comment text is required.');
        setCommentError('Comment text is required.');
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

      const newCom = {
        text: commentText,
        com_by: username,
        com_by_id: [userId],
        com_date_time: Date.now(),
        votes:0,
      };

      const commentResponse = await axios.post(
        `http://localhost:8000/addCommentToAnswer/${answerId}`,
        newCom
      );

      const commentId = commentResponse.data._id;

      // add comment to user
      await axios.post(`http://localhost:8000/addCommentToUser/${userId}`, {
        commentId: commentId,
      });

      setCommentAnswerId(null);
      setCommentText('');
      setCommentError('');

      const updatedAnswers = await axios.get('http://localhost:8000/getAnswers');
      setAnswerModel(updatedAnswers.data);
      
      setReloadKey(reloadKey + 1);
    } catch (error) {
      setCommentError('Error adding comment.');
      console.error('Error adding comment:', error);
    }
  };

  const handleEditAnswer = async () => {
    axios.get('http://localhost:8000/getAnswers')
      .then((response) => {
          setAnswerModel(response.data);
      })
      .catch((err) => console.log(err));
    setEditAnswer(null);
  }

  return (
    <div>
      {editAnswer ? (
        <EditA 
          answer={editAnswer}
          onEditAnswer={handleEditAnswer}
        />
      ) : (
        <div>
      {visibleAnswers && visibleAnswers.length > 0 ? (
        visibleAnswers.map((answer) => (
          <div key={answer._id}>
            <div className="answer-container">
              <div className="vote-buttons">
                {!guest && <button type='button' onClick={() => handleVote(answer._id, 'upvote')}>Upvote</button>}
                <div className="votes-wrapper">
                  <p id="voteCount">{answer.votes} {answer.votes === 1 ? "vote" : "votes"}</p>
                </div>
                {!guest && <button type='button' onClick={() => handleVote(answer._id, 'downvote')}>Downvote</button>}
              </div>
              <p className="answer-text" id="answer-text">
                <QText text={answer.text} />
              </p>
              <p id="ansByDate">
                <span className="ans-by">{answer.ans_by}</span><p className='space'></p>answered{" "}
                <GetMetadata date={new Date(answer.ans_date_time)} />
              </p>
            </div>
            {answer.comments && 
            answer.comments.length > 0 && 
              <CommentDetails 
                key={`CommentDetails-${reloadKey}`}
                comments={answer.comments}
                guest={guest}
              />}

            {!guest && (
              <CommentButton
                onClick={() => setCommentAnswerId(commentAnswerId === answer._id ? null : answer._id)}
              />
            )}
            {commentAnswerId === answer._id && (
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
                        handleCommentSubmit(answer._id);
                      }
                    }}
                  />
                  <p className="comment-error">{commentError}</p>
                </div>
            {/* <button type='button' className="submitcomment" onClick={() => handleCommentSubmit(answer._id)}>Add Comment</button> */}
              </form>
            )}
            {canEdit && (username === answer.ans_by || role === 'admin') && (
              <button type='button'
                onClick={() => setEditAnswer(answer)}
              >Edit</button>
            )}
            {canEdit && (username===answer.ans_by || role === 'admin') && (
              <button type='button'
                // onClick={() => handleDeleteAnswer(answer._id)}
                onClick={() => onDeleteAnswer(answer._id)}
              >Delete</button>
            )}
            {/* <hr className="dotted-divider" /> */}
          </div>
        ))
      ) : (
        <div id="loading-state">no answers found...</div>
      )}

      {allAns.length > 5 && (
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
      )}
    </div>
  );
}