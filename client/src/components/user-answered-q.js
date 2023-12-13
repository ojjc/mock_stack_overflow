import React, { useEffect, useState } from "react";
import axios from 'axios'
import AskButton from "./askbutton";
import QuestionContainer from "./q-cont";
import QuestionSummary from "./q-summary";
import QuestionDetailsPage from "./qdetails";
import SortingOptions from "./sortingbuttons";
import { useAuth } from './AuthContext';
import { pageData } from "./create-pages";

export default function UserAnsweredQuestion({ username, onTitleClick,onAskQuestionClick, guest, answerDetails }) {
//   const { state: { username } } = useAuth(); // get username
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [sortedQuestions, setSortedQuestions] = useState([]);
  // const [sortingMethod, setSortingMethod] = useState("newest");
  const [answeredQ, setAnsweredQ] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    sorting("newest");
  }, []);

  const handleTitleClick = async (question) => {
    try {
      await axios.post(`http://localhost:8000/updateViews/${question._id}`, {
        views: question.views + 1,
      });
    } catch (error) {
      console.error('error adding views:', error);
    }

    setSelectedQuestion({
      ...question,
      views: question.views + 1, // Update the views count in the local state
    });
  };

  const sorting = (method) => {
    console.log(method);
    axios.get(`http://localhost:8000/sortedQuestions?sort=${method}`)
      .then((response) => {
        setSortedQuestions(response.data);
      })
      .catch((error) => {
        console.error('Error sorting questions: ', error);
      });
  };

  const visibleAnsQ = pageData(answerDetails, currentPage, 5);
  const totalPages = Math.ceil(answerDetails.length / 5);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <section id="user_answered_page" className="page">
      <div className="top">
        {selectedQuestion ? null : (
          <h2 id="answered_q" className="answered_q">
            {username}'s Answered Questions
          </h2>
        )}
      </div>
      {selectedQuestion ? (
        <QuestionDetailsPage
          question={selectedQuestion}
          onAskQuestionClick={() => onAskQuestionClick()}
          guest={guest}
          canEdit={false}
        />
      ) : answerDetails.length === 0 ? (
        <div id="no-answered-qs-msg">No Answered Questions</div>
      ) : answeredQ !== null ? (
        <QuestionDetailsPage
          question={answeredQ}
          onAskQuestionClick={onAskQuestionClick}
          guest={false}
          canEdit={true}
        />
      ) : (
        <div>
          <div className="mid">
            <div className="num_q">
              {answerDetails.length} {answerDetails.length === 1 ? "question" : "questions"}
            </div>
            {/* <div className="sorting-options" id="sorting-options">
            <SortingOptions onSortChange={sorting} />
            </div> */}
          </div>
            {visibleAnsQ && visibleAnsQ.length > 0 ? (
            visibleAnsQ.map((detail, index) => (
                <QuestionSummary
                key={index}
                question={detail}
                onTitleClick={() => setAnsweredQ(detail)}
                />
            ))
            ) : (
            <p>No answered questions.</p>
            )}
            {answerDetails.length > 5 && (
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
    </section>
  );
}
