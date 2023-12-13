// import React from 'react';
// import axios from 'axios';

// export default class Questions extends React.Component{
//     constructor(props) {
//         super(props)
//         this.state = {
//             questions: []
//         }
//     }

//     componentDidMount() {
//         axios.get('http://localhost:8000/questions')
//         .then(res => {
//             this.setState({questions: res.data});
//         })
//     }

//     render() {
//         const items = this.state.questions.map(function(question) {
//             return (<li key={question.name}> </li>)
//         });
//     }
// }