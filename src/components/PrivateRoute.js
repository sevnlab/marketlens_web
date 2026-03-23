import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function PrivateRoute({ children }) {
    const [auth, setAuth] = useState(null); // null=확인중, true=인증, false=미인증

    useEffect(() => {
        axios.get('/api/queue/status', { withCredentials: true })
            .then(() => setAuth(true))
            .catch(err => {
                if (err.response?.status === 401) {
                    setAuth(false);
                } else {
                    setAuth(true); // 서버 오류 등 다른 에러는 통과
                }
            });
    }, []);

    if (auth === null) return null; // 확인 중엔 아무것도 안 보여줌
    if (auth === false) return <Navigate to="/signIn" replace />;
    return children;
}
