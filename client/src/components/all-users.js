import React, { useState, useEffect} from 'react';
import axios from 'axios';
import GetMetadata from './getMetadata';

export default function AllUsers({ onSelectUser }){
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const fetchUserModel = async () => {
          try {
            const response = await axios.get('http://localhost:8000/getUsers');
            setUsers(response.data);
          } catch (error) {
            console.error('Error fetching userModel:', error);
          }
        };
      
        fetchUserModel();
      }, []);

    const handleDeleteUser = async ({user}) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the user ${user.username}?`);

        if (!confirmDelete) {
            return; 
        }
        try {
            await axios.delete(`http://localhost:8000/deleteUser/${user._id}`);
            const response = await axios.get('http://localhost:8000/getUsers');
            setUsers(response.data);
        } catch (error) {
            console.error(`error deleting user ${user.username}:`, error)
        }
    }

    return(
        <div>
            <h3>All Users</h3>
            {users && users.length > 0 ? (
                <div className='user-list-container'>
                {users.map((user) => (
                <div className='user-summary' key={user._id}>
                    <div className='user-email'>
                        <button id="up-username" onClick={() => onSelectUser({user})}>
                            <h3>{user.username}</h3>
                        </button>
                        <h3 id="up-email">{user.email}</h3>
                        <div className="up-counts-wrapper">
                            <p id="up-repcount">
                                {user.rep} {user.rep === 1 ? "rep" : "reps"}
                            </p>
                        </div>
                    </div>

                    {/* <div className="up-createdAt">
                        <p id="up-createdAt-date">
                        User since <GetMetadata date={new Date(date_time)} />
                        </p>
                    </div> */}
                    {user.role !== 'admin' && (
                        <button id='delete-user' onClick={() => handleDeleteUser({ user })}>
                            Delete User
                        </button>
                    )}
                </div>
                ))}
                </div>
            ) : (
            <p>No users available.</p>
            )}
        </div>
    );
}
