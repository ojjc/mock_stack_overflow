import React, { useEffect, useState } from "react";
import axios from 'axios'
import AskButton from "./askbutton";
import QuestionContainer from "./q-cont";
import QuestionDetailsPage from "./qdetails";
import SortingOptions from "./sortingbuttons";
import { useAuth } from './AuthContext';

export default function Homepage({ questions, onAskQuestionClick, searchResults, searchQuery, guest }){
  const { state: { username } } = useAuth(); // get username
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [sortedQuestions, setSortedQuestions] = useState([]);
  const [sortingMethod, setSortingMethod] = useState("newest");

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

  return (
    <section id="home_page" className="page">
      <div className="top">
        {selectedQuestion ? null : (
          <h2 id="all_q" className="all_q">
            {searchResults !== null && (searchResults.length > 0 || searchQuery === "") ? "Search Results" : "All Questions"}
          </h2>
        )}
        {!guest && selectedQuestion ? null : (
          <div className="ask">
            {!guest && <AskButton id="ask_q" onClick={() => onAskQuestionClick()} />}
          </div>
        )}
      </div>
      {searchResults === 'invalid' ? (
        <div id="no-qs-msg">No Results Found</div>
      ) : selectedQuestion ? null : (
        <div className="mid">
          <div className="num_q">
            {searchResults ? searchResults.length : sortedQuestions.length} {sortedQuestions.length === 1 ? "question" : "questions"}
          </div>
          <div className="sorting-options" id="sorting-options">
            <SortingOptions onSortChange={sorting} />
          </div>
        </div>
      )}
      <div>
        {selectedQuestion ? (
          <QuestionDetailsPage
            question={selectedQuestion}
            onAskQuestionClick={() => onAskQuestionClick()}
            guest={guest}
            canEdit={false}
          />
        ) : sortedQuestions.length === 0 ? (
          <div id="no-qs-msg">No Results Found</div>
        ) : sortingMethod === "active" || sortingMethod === "unanswered" ? (
          <QuestionContainer
            onTitleClick={handleTitleClick}
            questions={sortedQuestions}
          />
        ) : searchResults !== 'invalid' ? (
          <QuestionContainer
            onTitleClick={handleTitleClick}
            questions={searchResults || sortedQuestions}
          />
        ) : (
          <></>
        )}
      </div>
    </section>
  );
}