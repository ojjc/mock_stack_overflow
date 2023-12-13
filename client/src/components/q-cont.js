import GetMetadata from "./getMetadata";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { pageData } from './create-pages';

export default function QuestionContainer({questions, onTitleClick}){
  // console.log(questions);
  const [tags, setTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios.get('http://localhost:8000/getTags')
      .then((response) => {
        setTags(response.data);
      })
      .catch((error) => {
        console.error('Error fetching tags:', error);
      });
  }, []);

  // const getUsername = async (username) => {
  //   try {
  //     const response = await axios.get(`http://localhost:8000/getUserInfo/${username}`);
  //     return response.data.username;
  //   } catch (error) {
  //     console.error('Error getting user information:', error);
  //     throw error;
  //   }
  // };

  // page numbers
  const questionsPerPage = 5;

  const visibleQuestions = pageData(questions, currentPage, questionsPerPage);
  const totalQuestions = questions ? questions.length : 0;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <div id="question-list" className="question-list">
      {visibleQuestions ? (
        visibleQuestions.map((question) => (
          <div key={question._id} className="question-list-container">
            <div className="counts-wrapper">
              <p id="ansCount">
                {question.answers.length}{" "}
                {question.answers.length === 1 ? "answer" : "answers"}
              </p>
              <p id="viewCount">
                {question.views} {question.views === 1 ? "view" : "views"}
              </p>
              <p id="voteCount">
                {question.votes} {question.votes === 1 ? "votes" : "votes"}
              </p>
            </div>
            {/* <div className="votes-wrapper">
              <p id="voteCount">{question.votes} {question.votes === 1 ? "vote" : "votes"}</p>
            </div> */}
            <div className='tt-wrapper'>
              <button id='qtit' onClick={() => onTitleClick(question)} question={question}>
                <h3 id="questionTit">{question.title}</h3>
              </button>
              <p className="qsum">{question.summary}</p>
              <div className="tags-wrapper">
                {question.tags.map((tagId, index) => {
                  const tag = tags.find((t) => t._id === tagId);
                  return tag ? (
                    <div key={index} className="tags-qcont">
                      {tag.name}
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="asked-by-date-wrapper">
              <p id="askedByDate">
                <span className="asked-by">{question.asked_by}</span><p className='space'></p>asked{" "}
                <GetMetadata date={new Date(question.ask_date_time)}/>
              </p>
            </div>

        </div>
        ))
      ) : (
        <div id="loading-state"> Loading... </div>
      )}

      {totalQuestions > 0 && (
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
  );
  
}

