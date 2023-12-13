import React, { useEffect, useState} from 'react';
import axios from 'axios'
import Header from './header';
import HomePage from './homepage'
import QuestionForm from './QuestionForm';
import TagsPage from './tagspage';
import WelcomePage from './welcome-page';
import LoginPage from './login';
import UserProfile from './user-profile';
import {useAuth} from './AuthContext';

export default function FakeStackOverflow(){
  // tracking user status
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const [guest, setGuest] = useState(false);
  // const [logOutError, setLogOutError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedPage, setSelectedPage] = useState('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // State variable to trigger component re-renders

  const { state, dispatch } = useAuth();
  useEffect(() => {
    axios.get('http://localhost:8000/getQuestions')
    .then(questions => setQuestions(questions.data))
    .catch(err => console.log(err))
  }, []);

  const resetUserStates = () => {
    setUserLoggedIn(false);
    setUserRegistered(false);
    setGuest(false);
  };

  const handleLogOut = async () => {
    try{
      resetUserStates();
      dispatch({ type: 'LOGOUT' });

      await axios.post(`http://localhost:8000/logout`)
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // setLogOutError(null);
    } catch (error) {
      console.error("Logout failed:", error);
      window.alert('Logout failed. Please try again.')
    }
  };

  const handlePageChange = (page) => {
    setSearchResults(null);
    setSelectedPage(page);
    setReloadKey(prevReloadKey => prevReloadKey + 1);
  };
  
  const handleSearch = async (searchQuery) => {
    setSearchQuery(searchQuery);
    console.log(searchQuery);

    if (searchQuery === "") {
      // if the query is empty, clear the search input
      setSearchResults(null);
    } else {
      axios.get(`http://localhost:8000/search?q=${searchQuery}`)
        .then((response) => {
        setSearchResults(response.data);
        // setReloadKey(reloadKey + 1); // Increment the reload key to trigger component re-renders
      })
      .catch((error) => {
        console.log("Error searching for questions:", error);
      });
    }
  };

  useEffect(() => {
    console.log('getting username')
    axios.get('http://localhost:8000/getName')
      .then(response => {
        console.log("API Response:", response.data);
        dispatch({ type: 'LOGIN', payload: { username: response.data.username, email: response.data.email, role: response.data.role } });
      })
      .catch(error => {
        console.error('error getting username and email:', error);
      });
  }, [dispatch]);

  const { username, email } = state;


  const displayQuestions = searchResults || questions;
  
  if (!userRegistered && !userLoggedIn && !guest) {
    return (
      <div>
        <WelcomePage 
          onRegister={() => setUserRegistered(true)} 
          onLogin={() => setUserLoggedIn(true)}
          onGuest={() => setGuest(true)}
        />
      </div>
    );
  };

  if (userRegistered && !userLoggedIn) {
    return <LoginPage onLogin={() => setUserLoggedIn(true)}/>;
  };

  const toUserProfile = (username) => {
    handlePageChange("user-profile");
    console.log(`redirecting to ${username}'s profile`);
  };

  return(
    <div>
      <Header 
        key={`Header-${reloadKey}`} 
        onSearch={handleSearch}
        onLogOut={handleLogOut}
        username={username}
        email={email}
        toUserProfile={toUserProfile}
        guest={guest}
      /> 
      <div className='container'>
        <div className='sidebar'>
          <div className='sidebar-cont'>
            <button
              onClick={() => handlePageChange('questions')}
              id="questions"
              style={
                selectedPage === "questions"
                  ? { backgroundColor: "lightgray", fontWeight: "bold" }
                  : { fontWeight: "normal" }
              }>
              Questions
            </button>
            <button
              onClick={() => handlePageChange('tags')}
              id="tags"
              style={
                selectedPage === "tags"
                  ? { backgroundColor: "lightgray", fontWeight: "bold" }
                  : { fontWeight: "normal" }
              }>
              Tags
            </button>
          </div>
        </div>
        <div className='content'>
          {selectedPage === 'questions' && 
            <HomePage 
              key={`HomePage-${reloadKey}`} // Add a unique key to the HomePage component
              questions={displayQuestions} 
              onAskQuestionClick={() => handlePageChange("questionForm")}
              searchResults={searchResults}
              searchQuery={searchQuery}
              guest={guest}
            />
          }
          {selectedPage === "questionForm" && (
            <QuestionForm
              key={`QuestionForm-${reloadKey}`} // Add a unique key to the QuestionForm component
              questions={displayQuestions}
              onFormSubmit={() => handlePageChange('questions')}
            />
          )}
          {selectedPage === "tags" && (
            <TagsPage
              key={`TagsPage-${reloadKey}`} // Add a unique key to the TagsPage component
              questions={displayQuestions}
              onAskQuestionClick={() => handlePageChange("questionForm")}
              guest={guest}
              userTags={null}
            />
          )}
          {selectedPage === "user-profile" && (
            <UserProfile
              key={`UserProfile-${reloadKey}`}
              username={username}
              email={email}
              onAskQuestionClick={() => handlePageChange("questionForm")}
              questions={questions}
            />

          )}
        </div>
        {/* {logOutError && <p style={{ color: "red" }}>{logOutError}</p>} */}
      </div>
    </div>
  )
}