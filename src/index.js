import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from "./App";
import './index.css';

// 화면 추가시 반드시 아래 추가하고 Route 추가해야함
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Main from "./components/Main";
import PrivateRoute from "./components/PrivateRoute";
import Secret from "./components/Secret";

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
    <Router>
        <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="signIn" element={<SignIn />} />
            <Route path="signUp" element={<SignUp />} />
            <Route path="main" element={<PrivateRoute><Main /></PrivateRoute>} />
            <Route path="/secret" element={<PrivateRoute><Secret /></PrivateRoute>} />
            <Route path="/oauth2/callback/naver" element={<SignIn />} /> {/* 콜백 경로가 SignIn 컴포넌트로 연결 */}
        </Routes>
    </Router>
);