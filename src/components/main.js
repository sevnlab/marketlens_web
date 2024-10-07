import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';


function Main() {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loginType, setLoginType] = useState(null);

    useEffect(() => {
        // localStorage에서 JWT 토큰 가져오기
        const token = localStorage.getItem('token');
        console.log("JWT 토큰 확인", token);

        if (token) {
            try {
                // 토큰을 디코딩하여 만료 시간과 사용자 ID 추출
                const decodedToken = jwtDecode(token);
                console.log("디코딩된 토큰:", decodedToken);  // 디코딩 결과 확인
                setUserId(decodedToken.sub);
                setLoginType(decodedToken.loginType);

                const expirationTime = decodedToken.exp * 1000;

                // 만료 시간을 10초로 설정
                // const expirationTime = Date.now() + 10 * 1000;  // 현재 시간에서 10초 뒤를 만료 시간으로 설정
                const currentTime = Date.now();
                const remainingTime = expirationTime - currentTime;

                setTimeLeft(remainingTime);

                // 남은 시간 업데이트 타이머 설정
                const timer = setInterval(() => {
                    const newTimeLeft = expirationTime - Date.now();
                    setTimeLeft(newTimeLeft);

                    // 시간이 만료되면 로그아웃 처리
                    if (newTimeLeft <= 0) {
                        clearInterval(timer);
                        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                        localStorage.removeItem('token');
                        navigate('/signIn');
                    }
                }, 1000);

                return () => clearInterval(timer);
            } catch (error) {
                console.error("JWT 디코딩 실패:", error);  // 디코딩 중 오류 발생 시 확인
                navigate('/signIn');  // 오류 발생 시 로그인 페이지로 리디렉션
            }
        } else {
            console.log("토큰이 없습니다. 로그인 페이지로 이동합니다.");
            navigate('/signIn');  // 토큰이 없을 때 로그인 페이지로 이동
        }
    }, [navigate]);

    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div>
            {userId ? (
                <>
                    {/* 로그인 타입에 따라 다른 메시지 표시 */}
                    <h1>
                        {/* 사용자명을 어떻게 보여줄건지 정의 필요 */}
                        {/*{loginType === "naver" ?  "네이버 로그인" : `${userId} 님, 환영합니다!`}*/}
                        {loginType === "naver" ?  "네이버 로그인" : "일반 로그인"}
                    </h1>
                    {timeLeft !== null && (
                        <p>남은 시간: {formatTime(timeLeft)}</p>
                    )}
                </>
            ) : (
                <h1>로그인이 필요합니다.</h1>
            )}
        </div>
    );
}

export default Main;