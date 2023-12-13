import React, { useState } from 'react';

export default function Header({ onSearch, onLogOut, guest, username, toUserProfile }) {
  const [searchQuery, setSearchQuery] = useState('');
  // const [selectedPage, setSelectedPage] = useState("questions");

  // const toUserProfile = () => {
  //   setSelectedPage('user-profile');
  // };
  // const [username, setUsername] = useState('')

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

//   useEffect(() => {
//     console.log('getting username')
//     axios.get('http://localhost:8000/getName')
//       .then(response => {
//         console.log("username: " + response.data.username);
//         setUsername(response.data.username);
//       })
//       .catch(error => {
//         console.log("username: " + error.response.data.username);
//         console.error('error getting username:', error);
//       });
//   }, []);
// console.log("username: " + username);

// useEffect(() => {
//   console.log("username updated:", username);
// }, [username]);


  return (
    <div className="header">
      {guest && <button className='welcome' onClick={onLogOut}>Welcome Page</button>}
      <h1>Fake Stack Overflow</h1>
      <input
        type="text"
        className="search"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchKeyPress}
      />
      <div className='user-info'>
        { guest ? (
          <p className='guest-name'>Guest</p>
        ) : (
          // <button className='user-name-link' type='button'>
          //   <p className='user-name'>Welcome, <a href={`/user/${username}`}>{username}</a></p>
          // </button>
          <p>Welcome, 
            <button id="user-name" onClick={toUserProfile}>{username}</button>
          </p>

        )}
      </div>
      {!guest && (
        <div>
          <button onClick={onLogOut}>Log Out</button>
        </div>
      )}
    </div>
  );
}