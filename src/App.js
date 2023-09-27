import React from 'react';
import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from "react-router-dom";
import './App.css';
import Login from './components/login';
import SignUp from './components/signUp';


function App() {
  return (
      <div>
          <h1>MainPage</h1>
          <nav>
              {/*Link 태그의 to 속성은 index.js에서 설정해둔 url의 component가 보여지게 한다.*/}
              {/*to 속성에 index.js에서 설정한 path값을 넣어주면 됨*/}
              <Link to="/login">login</Link> |{" "}
              <Link to="/signUp">signUp</Link>
          </nav>
      </div>
  );
}

export default App;
