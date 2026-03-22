import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import axios from 'axios';

const DUMMY_PRODUCTS = [
    { id: 1, name: '테스트 상품1', price: '10,000원', location: '서울 강남구', time: '1분 전' },
    { id: 2, name: '테스트 상품2', price: '25,000원', location: '서울 마포구', time: '5분 전' },
    { id: 3, name: '테스트 상품3', price: '5,000원', location: '경기 성남시', time: '10분 전' },
    { id: 4, name: '테스트 상품4', price: '150,000원', location: '서울 송파구', time: '30분 전' },
    { id: 5, name: '테스트 상품5', price: '3,000원', location: '인천 부평구', time: '1시간 전' },
    { id: 6, name: '테스트 상품6', price: '80,000원', location: '서울 강서구', time: '2시간 전' },
];

export default function Main() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [queueStatus, setQueueStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        axios.get('/api/queue/status', { withCredentials: true })
            .catch(err => {
                if (err.response?.status === 401) {
                    navigate('/signIn');
                }
            });
        setName(localStorage.getItem('name') || '');
    }, [navigate]);

    const handleEnterQueue = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/queue/enter', {}, { withCredentials: true });
            const { rank, total } = res.data.data;
            setQueueStatus({ rank, total });

            const eventSource = new EventSource('http://localhost:8080/api/queue/stream', {
                withCredentials: true
            });

            eventSource.addEventListener('rank', (e) => {
                const data = JSON.parse(e.data);
                setQueueStatus({ rank: data.rank, total: data.total });
            });

            eventSource.addEventListener('admitted', () => {
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

    const handleSearch = (e) => {
        e.preventDefault();
        // 검색 로직 추가 예정
        console.log('검색어:', searchQuery);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* 헤더 */}
            <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: '#fff' }}>
                <Container maxWidth="sm" disableGutters>
                <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                    {/* 로고 + 타이틀 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="/marketlens_favicon.svg" alt="마켓렌즈 로고" style={{ height: 32 }} />
                        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ letterSpacing: -0.5 }}>
                            마켓렌즈
                        </Typography>
                    </Box>

                    {/* 우측 아이콘들 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={queueStatus === null ? '접속하기' : queueStatus === 'admitted' ? '입장됨' : '대기 중'}>
                            <span>
                                <IconButton
                                    onClick={queueStatus === null ? handleEnterQueue : undefined}
                                    size="small"
                                    disabled={loading || (queueStatus !== null && queueStatus !== 'admitted')}
                                    color={queueStatus === 'admitted' ? 'primary' : 'default'}
                                >
                                    {loading ? <CircularProgress size={18} /> : <LoginIcon fontSize="small" />}
                                </IconButton>
                            </span>
                        </Tooltip>
                        <IconButton onClick={handleLogout} size="small">
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Toolbar>

                {/* 검색바 */}
                <Box sx={{ px: 2, pb: 1.5 }}>
                    <Paper
                        component="form"
                        onSubmit={handleSearch}
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

            {/* 본문 */}
            <Container maxWidth="sm" disableGutters>

                {/* 대기 중 배너 */}
                {queueStatus && queueStatus !== 'admitted' && (
                    <Box sx={{ textAlign: 'center', py: 1, bgcolor: '#fff3e0' }}>
                        <Typography variant="body2" color="warning.main">
                            대기 중 · 내 순번 {queueStatus.rank}번 / 전체 {queueStatus.total}명
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
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#f9f9f9' }
                                }}
                            >
                                {/* 빈 이미지 영역 */}
                                <Box
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '1 / 1',
                                        bgcolor: '#e0e0e0',
                                        borderRadius: '8px 8px 0 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
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
