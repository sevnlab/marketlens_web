import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

export default function Welcome() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [queueStatus, setQueueStatus] = useState(null); // { rank, total } or 'admitted'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // httpOnly 쿠키는 JS에서 못 읽으므로 서버에 인증 확인 요청
        // /api/queue/status 는 쿠키 없으면 401 반환
        axios.get('/api/queue/status', { withCredentials: true })
            .catch(err => {
                if (err.response?.status === 401) {
                    navigate('/signIn');
                }
            });

        setName(localStorage.getItem('name') || '');
    }, [navigate]);

    // 대기열 진입 + SSE 연결
    const handleEnterQueue = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/queue/enter', {}, { withCredentials: true });
            const { rank, total } = res.data.data;
            setQueueStatus({ rank, total });

            // SSE 연결 — 서버가 순번/입장 이벤트를 push해줌
            const eventSource = new EventSource('http://localhost:8080/api/queue/stream', {
                withCredentials: true
            });

            eventSource.addEventListener('rank', (e) => {
                const data = JSON.parse(e.data);
                setQueueStatus({ rank: data.rank, total: data.total });
            });

            eventSource.addEventListener('admitted', (e) => {
                eventSource.close();
                setQueueStatus('admitted');
            });

            eventSource.onerror = () => {
                eventSource.close();
            };

        } catch (err) {
            alert('대기열 진입 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await axios.post('/logout', {}, { withCredentials: true });
        localStorage.removeItem('name');
        navigate('/signIn');
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {name ? `${name}님 환영합니다` : '환영합니다!'}
                </Typography>

                {/* 대기열 상태 표시 */}
                {queueStatus === null && (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleEnterQueue}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : '접속하기'}
                    </Button>
                )}

                {queueStatus && queueStatus !== 'admitted' && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6">대기 중...</Typography>
                        <Typography variant="body1" color="text.secondary">
                            내 순번: {queueStatus.rank}번 / 전체 대기: {queueStatus.total}명
                        </Typography>
                    </Box>
                )}

                {queueStatus === 'admitted' && (
                    <Typography variant="h5" color="primary" fontWeight="bold">
                        입장이 허용되었습니다!
                    </Typography>
                )}

                <Button variant="outlined" onClick={handleLogout}>
                    로그아웃
                </Button>
            </Box>
        </Container>
    );
}