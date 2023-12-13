import React from "react";
import GetMetadata from "./getMetadata";

export default function QuestionSummary({ question, onTitleClick }) {
  const date_time = question.date_time || question.ask_date_time; // Use ask_date_time if date_time is falsy

  return (
    <div className="question-summary">
      <div className="up-counts-wrapper">
        {/* <p id="viewCount">
          {question.views} {question.views === 1 ? "view" : "views"}
        </p> */}
        <p id="up-voteCount">
          {question.votes} {question.votes === 1 ? "vote" : "votes"}
        </p>
      </div>
      <div className="up-tt-wrapper">
        <button id="up-qtit" onClick={() => onTitleClick(question)} question={question}>
          <h3 id="up-questionTit">{question.title}</h3>
        </button>
      </div>
      <div className="up-asked-by-date-wrapper">
        {question.date_time && (
          <p id="up-askedByDate">
            asked <GetMetadata date={new Date(date_time)}/>
          </p>
        )}
      </div>
    </div>
  );
}
