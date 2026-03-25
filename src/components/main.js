import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import PeopleIcon from '@mui/icons-material/People';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:7777';

const DUMMY_PRODUCTS = [
    { id: 1, name: '테스트 상품1', price: '10,000원', location: '서울 강남구', time: '1분 전' },
    { id: 2, name: '테스트 상품2', price: '25,000원', location: '서울 마포구', time: '5분 전' },
    { id: 3, name: '테스트 상품3', price: '5,000원', location: '경기 성남시', time: '10분 전' },
    { id: 4, name: '테스트 상품4', price: '150,000원', location: '서울 송파구', time: '30분 전' },
    { id: 5, name: '테스트 상품5', price: '3,000원', location: '인천 부평구', time: '1시간 전' },
    { id: 6, name: '테스트 상품6', price: '80,000원', location: '서울 강서구', time: '2시간 전' },
];

/**
 * 예상 대기시간 계산
 *
 * 정원제 기반: 스케줄러가 3초마다 실행되고 빈 자리 1개씩 채움
 * → 내 앞에 rank-1 명이 먼저 들어가야 하므로 rank * 3초
 * (실제로는 현재 입장자들이 언제 나가느냐에 따라 달라지나, 근사치로 표시)
 */
function calcEstimatedWait(rank) {
    const totalSec = rank * 3; // 스케줄러 주기 3초 × 내 순번
    if (totalSec < 60) return `약 ${totalSec}초`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec > 0 ? `약 ${min}분 ${sec}초` : `약 ${min}분`;
}

function calcProgress(rank, total) {
    if (!total || total === 0) return 0;
    return Math.max(0, Math.min(100, Math.floor(((total - rank) / total) * 100)));
}

export default function Main() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [queueStatus, setQueueStatus] = useState(null); // null | { rank, total } | 'admitted'
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [popupOpen, setPopupOpen] = useState(false);
    const eventSourceRef = useRef(null);

    const connectSse = useCallback(() => {
        if (eventSourceRef.current) eventSourceRef.current.close();

        const es = new EventSource(`${API_BASE}/api/queue/stream`, { withCredentials: true });
        eventSourceRef.current = es;

        es.addEventListener('rank', (e) => {
            try {
                const data = JSON.parse(e.data);
                setQueueStatus({ rank: data.rank, total: data.total });
            } catch (err) {
                console.warn('[SSE] rank 파싱 실패:', e.data);
            }
        });

        es.addEventListener('admitted', (e) => {
            const data = JSON.parse(e.data);
            es.close();
            eventSourceRef.current = null;
            if (data.entryToken) localStorage.setItem('entryToken', data.entryToken);
            setQueueStatus('admitted');
            setPopupOpen(false);
            navigate('/secret');
        });

        es.onerror = () => {
            // EventSource 오류 시 닫지 않고 브라우저 자동 재연결에 맡김
            // (close() 호출하면 재연결이 차단돼서 이후 rank 업데이트를 못 받음)
            console.warn('[SSE] 연결 오류 - 브라우저 자동 재연결 대기 중');
        };
    }, [navigate]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            localStorage.removeItem('entryToken');
            localStorage.removeItem('secretExpiry');
            navigator.sendBeacon('/api/queue/exit');
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        setName(localStorage.getItem('name') || '');

        // 이미 입장 토큰이 있으면 바로 Secret 페이지로
        if (localStorage.getItem('entryToken')) {
            navigate('/secret');
            return;
        }

        // 새로고침 시 기존 대기 상태 복구
        axios.get('/api/queue/status', { withCredentials: true })
            .then(res => {
                if (res.data?.data) {
                    const { rank, total } = res.data.data;
                    setQueueStatus({ rank, total });
                    setPopupOpen(true);
                    connectSse();
                }
            })
            .catch(err => {
                if (err.response?.status === 401) navigate('/signIn');
            });

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, [navigate, connectSse]);

    const handleEnterQueue = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/queue/enter', {}, { withCredentials: true });
            const { rank, total } = res.data.data;
            setQueueStatus({ rank, total });
            setPopupOpen(true);
            connectSse();
        } catch (err) {
            if (err.response?.status === 401) navigate('/signIn');
            else alert('대기열 진입에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelQueue = async () => {
        try {
            await axios.delete('/api/queue/cancel', { withCredentials: true });
            if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
            setQueueStatus(null);
            setPopupOpen(false);
        } catch {
            alert('취소 처리 중 오류가 발생했습니다.');
        }
    };

    const handleLogout = async () => {
        if (eventSourceRef.current) eventSourceRef.current.close();
        await axios.post('/logout', {}, { withCredentials: true });
        localStorage.removeItem('name');
        localStorage.removeItem('entryToken');
        navigate('/signIn');
    };

    const isWaiting = queueStatus && queueStatus !== 'admitted';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>

            {/* ───── 대기열 팝업 ───── */}
            <Dialog
                open={popupOpen && isWaiting}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: '#fff',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                    }
                }}
            >
                {/* 상단 컬러 바 */}
                <Box sx={{ height: 5, background: 'linear-gradient(90deg, #1565c0, #42a5f5)' }} />

                <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>

                        {/* 헤더 */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
                                <HourglassTopIcon sx={{ color: '#1565c0', fontSize: 18 }} />
                                <Typography variant="body1" color="#1565c0" fontWeight="bold">
                                    접속 대기 중
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="#aaa">
                                차례가 되면 자동으로 입장됩니다
                            </Typography>
                        </Box>

                        {/* 순번 카드 */}
                        <Box sx={{
                            bgcolor: '#f0f4ff',
                            borderRadius: 3,
                            px: 5, py: 3,
                            textAlign: 'center',
                            width: '100%',
                        }}>
                            <Typography variant="caption" color="#888" display="block" mb={0.5}>
                                내 대기 순번
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" color="#1565c0" sx={{ letterSpacing: -1 }}>
                                {isWaiting ? queueStatus.rank?.toLocaleString() : '-'}
                                <Typography component="span" variant="h6" color="#aaa" fontWeight="normal"> 번</Typography>
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                                <PeopleIcon sx={{ fontSize: 13, color: '#bbb' }} />
                                <Typography variant="caption" color="#aaa">
                                    전체 {isWaiting ? queueStatus.total?.toLocaleString() : '-'}명 대기
                                </Typography>
                            </Box>
                        </Box>

                        {/* 진행 바 */}
                        {isWaiting && (
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                                    <Typography variant="caption" color="#aaa">진행률</Typography>
                                    <Typography variant="caption" color="#1565c0" fontWeight="bold">
                                        {calcProgress(queueStatus.rank, queueStatus.total)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={calcProgress(queueStatus.rank, queueStatus.total)}
                                    sx={{
                                        height: 6, borderRadius: 3,
                                        bgcolor: '#e3eafc',
                                        '& .MuiLinearProgress-bar': {
                                            background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
                                            borderRadius: 3,
                                        }
                                    }}
                                />
                            </Box>
                        )}

                        {/* 예상 대기시간 */}
                        {isWaiting && (
                            <Box sx={{ textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2, px: 3, py: 1.2, width: '100%' }}>
                                <Typography variant="caption" color="#aaa" display="block" mb={0.2}>
                                    예상 대기시간
                                </Typography>
                                <Typography variant="body1" color="#1a1a1a" fontWeight="bold">
                                    {calcEstimatedWait(queueStatus.rank)}
                                </Typography>
                            </Box>
                        )}

                        <CircularProgress size={22} thickness={3} sx={{ color: '#c5d8f5' }} />

                        <Button
                            size="small"
                            onClick={handleCancelQueue}
                            sx={{ color: '#ccc', fontSize: 12, '&:hover': { color: '#f44336' } }}
                        >
                            대기 취소
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* ───── 헤더 ───── */}
            <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: '#fff' }}>
                <Container maxWidth="sm" disableGutters>
                    <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img src="/marketlens_favicon.svg" alt="마켓렌즈 로고" style={{ height: 32 }} />
                            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                마켓렌즈
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title={isWaiting ? `대기 중 (${queueStatus.rank}번)` : '대기열테스트'}>
                                <span>
                                    <IconButton
                                        onClick={isWaiting ? () => setPopupOpen(true) : handleEnterQueue}
                                        size="small"
                                        disabled={loading}
                                        color={isWaiting ? 'warning' : 'default'}
                                    >
                                        {loading
                                            ? <CircularProgress size={18} />
                                            : <MeetingRoomIcon fontSize="small" />
                                        }
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="로그아웃">
                                <IconButton onClick={handleLogout} size="small">
                                    <LogoutIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Toolbar>

                    {/* 검색바 */}
                    <Box sx={{ px: 2, pb: 1.5 }}>
                        <Paper
                            component="form"
                            onSubmit={(e) => { e.preventDefault(); }}
                            sx={{ display: 'flex', alignItems: 'center', borderRadius: 2, px: 1.5, bgcolor: '#f0f0f0', boxShadow: 'none' }}
                        >
                            <InputBase
                                placeholder="검색어를 입력하세요"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ flex: 1, fontSize: 14 }}
                            />
                            <IconButton type="submit" size="small">
                                <SearchIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    </Box>
                </Container>
            </AppBar>

            {/* ───── 본문 ───── */}
            <Container maxWidth="sm" disableGutters>

                {/* 대기 중 얇은 배너 */}
                {isWaiting && (
                    <Box
                        onClick={() => setPopupOpen(true)}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 0.5, py: 0.8, bgcolor: '#1a237e', cursor: 'pointer',
                            '&:hover': { bgcolor: '#283593' },
                        }}
                    >
                        <HourglassTopIcon sx={{ fontSize: 13, color: '#90caf9' }} />
                        <Typography variant="caption" color="#90caf9">
                            대기 중 · {queueStatus.rank}번째 · 탭하여 확인
                        </Typography>
                    </Box>
                )}

                {/* 섹션 타이틀 */}
                <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">추천 상품</Typography>
                </Box>

                {/* 상품 그리드 */}
                <Box sx={{ px: 2 }}>
                    <Grid container spacing={1.5}>
                        {DUMMY_PRODUCTS.map((product) => (
                            <Grid item xs={6} key={product.id}>
                                <Card elevation={0} sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' } }}>
                                    <Box sx={{
                                        width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography variant="caption" color="text.disabled">이미지 없음</Typography>
                                    </Box>
                                    <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="body2" noWrap>{product.name}</Typography>
                                        <Typography variant="body2" fontWeight="bold">{product.price}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {product.location} · {product.time}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

            </Container>
        </Box>
    );
}