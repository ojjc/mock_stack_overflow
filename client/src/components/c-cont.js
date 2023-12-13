import React, { useEffect, useState } from 'react';
import QText from "./qtext";
import GetMetadata from "./getMetadata";
import axios from 'axios';
import { pageData } from './create-pages';
import { useAuth } from './AuthContext';

export default function CommentDetails({ comments, guest }) {
  const { state: { username, email } } = useAuth();
  const [commentModel, setCommentModel] = useState([]);
  const commentsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

// console.log('comments:', comments)
  useEffect(() => {
    let isMounted = true;

    axios.get('http://localhost:8000/getComments')
      .then((response) => {
        if (isMounted) {
          setCommentModel(response.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false); // Set loading to false in case of an error
      });

    return () => {
      isMounted = false;
    };
  }, [comments]);

  const handleVote = async (commentId, voteType) => {
    console.log('comment id', commentId)
    try {
      const response = await axios.post(
        `http://localhost:8000/updateCVotes/${commentId}`,
        {
          voteType: voteType,
        }
      );

      console.log(response.data.message);

      const commentResponse = await axios.get(`http://localhost:8000/getCommentFromId/${commentId}`);
      const commentOwnerId = commentResponse.data.com_by_id;

      const userresponse = await axios.get(`http://localhost:8000/getUserInfo/${email}`);
      const userId = userresponse.data.userId;
      const rep = userresponse.data.rep;

      if (userId == commentOwnerId) {
        window.alert('You cannot vote on your own comment.');
        return;
      }
      
      if (rep < 50) {
        // console.error('Must have reputation of 50 or more to comment.')
        // setvoteError('Must have reputation of 50 or more to comment.');
        window.alert('Must have reputation of 50 or more to vote on a comment.');
        return;
      }

      const updatedComments = await axios.get('http://localhost:8000/getComments');
      setCommentModel(updatedComments.data);
      console.log('updated comments', commentModel)
    } catch (error) {
      console.error('error updating votes for comments (C):', error);
    }
  };

  // const filterComment = commentModel.filter(comment => comments.includes(comment._id));

  const formatExisting = comments.map(commentId => commentId).filter(commentId => typeof commentId === 'string');
  const formatNew = comments.map(comment => comment._id).filter(commentId => commentId != null);
  const formattedComments = Array.from(new Set([...formatExisting, ...formatNew]));
  
  const filterComment = commentModel ? commentModel.filter(comment => formattedComments.includes(comment._id)) : [];
  const allComs = filterComment.concat(comments.filter(comment => comment.text != null));
  const sortedComments = allComs.sort((a, b) => new Date(b.com_date_time) - new Date(a.com_date_time));
  const visibleComments = pageData(sortedComments, currentPage, commentsPerPage);
  const totalPages = Math.ceil(sortedComments.length / commentsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <div className='comment-container2'>
      {loading ? (
      <div id="loading-state">Loading comments...</div>
    ) : (
      <>
      {visibleComments && visibleComments.length > 0 ? (
        visibleComments.map((comment, index) => (
          <div key={`${comment._id}-${index}`}>
            <div className="comment-container">
                <div className="vote-buttons">
                {!guest && <button type='button' onClick={() => handleVote(comment._id, 'upvote')}>Upvote</button>}
                <div className="votes-wrapper">
                  <p id="voteCount">{comment.votes} {comment.votes === 1 ? "vote" : "votes"}</p>
                </div>
              </div>
              <p className="comment-text" id="comment-text">
                <QText text={comment.text} />
              </p>
              <p id="comsByDate">
                <span className="coms-by">{comment.com_by}</span> commented{" "}
                <GetMetadata date={new Date(comment.com_date_time)} />
              </p>

            </div>
            {/* <hr className="dotted-divider" /> */}
          </div>
        ))
      ) : (
        <div id="loading-state"></div>
      )}
      {allComs.length > 3 && (
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
            </>
      )}
    </div>
  );
}

