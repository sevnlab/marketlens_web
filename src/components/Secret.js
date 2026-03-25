import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckIcon from '@mui/icons-material/Check';

const TOTAL_SECONDS = 10 * 60; // 10분 (초 단위)
const EXPIRY_KEY = 'secretExpiry'; // localStorage 키 — 만료 시각(epoch ms) 저장

/**
 * 남은 시간(초) 계산
 * localStorage에 저장된 만료 시각 기준으로 계산 → 새로고침해도 유지됨
 */
function getInitialTimeLeft() {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return TOTAL_SECONDS; // 첫 진입 시 기본값
    const remaining = Math.floor((Number(expiry) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0; // 이미 만료됐으면 0
}

export default function Secret() {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);
    const [purchased, setPurchased] = useState(false);

    const handleLeave = async () => {
        localStorage.removeItem('entryToken');
        localStorage.removeItem(EXPIRY_KEY); // 타이머 초기화
        try { await axios.post('/api/queue/leave', {}, { withCredentials: true }); } catch (e) {}
        navigate('/main');
    };

    useEffect(() => {
        if (!localStorage.getItem('entryToken')) {
            navigate('/main');
            return;
        }
        // 첫 진입 시에만 만료 시각 저장 — 새로고침해도 덮어쓰지 않음
        if (!localStorage.getItem(EXPIRY_KEY)) {
            localStorage.setItem(EXPIRY_KEY, String(Date.now() + TOTAL_SECONDS * 1000));
        }
    }, [navigate]);

    useEffect(() => {
        const handleUnload = () => {
            localStorage.removeItem('entryToken');
            localStorage.removeItem('secretExpiry');
            navigator.sendBeacon('/api/queue/leave');
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    useEffect(() => {
        if (purchased) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [purchased]);

    useEffect(() => {
        if (timeLeft === 0 && !purchased) handleLeave();
    }, [timeLeft, purchased]); // eslint-disable-line

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handlePurchase = async () => {
        setPurchased(true);
        localStorage.removeItem('entryToken');
        localStorage.removeItem(EXPIRY_KEY); // 타이머 초기화
        try { await axios.post('/api/queue/leave', {}, { withCredentials: true }); } catch (e) {}
    };

    if (purchased) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Box sx={{
                    width: 80, height: 80, borderRadius: '50%',
                    bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <CheckIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" color="#1a1a1a">구매 완료!</Typography>
                <Typography variant="body2" color="#888" textAlign="center">
                    iPad (10세대) 구매를 축하드립니다.<br />배송 안내는 이메일로 발송됩니다.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/main')} sx={{ mt: 1, bgcolor: '#1976d2', borderRadius: 3 }}>
                    메인으로
                </Button>
            </Box>
        );
    }

    const urgency = timeLeft < 60;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9ff' }}>

            {/* 타이머 상단 바 */}
            <Box sx={{
                bgcolor: urgency ? '#d32f2f' : '#1565c0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                py: 1,
                transition: 'background-color 0.5s',
            }}>
                <BoltIcon sx={{ fontSize: 16, color: '#fff' }} />
                <Typography variant="caption" color="#fff" fontWeight="bold" letterSpacing={0.5}>
                    선착순 특가 · 제한 시간
                </Typography>
                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1.5,
                    px: 1.5, py: 0.2,
                    display: 'flex', alignItems: 'center', gap: 0.5,
                }}>
                    <TimerIcon sx={{ fontSize: 13, color: '#fff' }} />
                    <Typography variant="caption" color="#fff" fontWeight="bold" sx={{ fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>
                        {formatTime(timeLeft)}
                    </Typography>
                </Box>
            </Box>

            {/* 뒤로가기 */}
            <Box sx={{ px: 2, pt: 1.5 }}>
                <IconButton onClick={handleLeave} size="small" sx={{ color: '#666' }}>
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ maxWidth: 480, mx: 'auto', px: 3, pb: 6 }}>

                {/* 뱃지 */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                        label="오픈 이벤트 특가"
                        size="small"
                        icon={<LocalOfferIcon style={{ fontSize: 12, color: '#e65100' }} />}
                        sx={{ bgcolor: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', fontWeight: 'bold', fontSize: 11 }}
                    />
                    <Chip
                        label="오늘만"
                        size="small"
                        sx={{ bgcolor: '#fce4ec', color: '#c62828', border: '1px solid #f48fb1', fontWeight: 'bold', fontSize: 11 }}
                    />
                </Box>

                {/* 이미지 */}
                <Box sx={{
                    width: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: '#eef2ff',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(21,101,192,0.12)',
                }}>
                    <Box
                        component="img"
                        src="/ipad.jpg"
                        alt="iPad (10세대)"
                        sx={{ width: '100%', display: 'block', objectFit: 'cover' }}
                    />
                </Box>

                {/* 제품명 */}
                <Typography variant="h5" fontWeight="bold" color="#1a1a1a" mb={0.5}>
                    Apple iPad (10세대)
                </Typography>
                <Typography variant="body2" color="#888" mb={2.5}>
                    64GB · Wi-Fi · 실버 / 10.9인치 Liquid Retina
                </Typography>

                {/* 가격 */}
                <Box sx={{
                    bgcolor: '#fff',
                    border: '1px solid #e8eaf6',
                    borderRadius: 3,
                    p: 2.5,
                    mb: 2.5,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    <Typography variant="body2" color="#bbb" sx={{ textDecoration: 'line-through', mb: 0.3 }}>
                        정가 649,000원
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h4" fontWeight="bold" color="#1565c0">
                            100,000원
                        </Typography>
                        <Chip label="-85%" size="small" sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 'bold', height: 24, fontSize: 13 }} />
                    </Box>
                    <Typography variant="caption" color="#aaa">* 제한 · 1인 1대</Typography>
                </Box>

                {/* 스펙 */}
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: 3, p: 2, mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    {[
                        ['칩', 'Apple A14 Bionic'],
                        ['디스플레이', '10.9" Liquid Retina'],
                        ['저장용량', '64GB'],
                        ['배터리', '최대 10시간'],
                        ['연결', 'USB-C · Wi-Fi 6'],
                    ].map(([label, value]) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.7, borderBottom: '1px solid #f5f5f5', '&:last-child': { borderBottom: 'none' } }}>
                            <Typography variant="caption" color="#aaa">{label}</Typography>
                            <Typography variant="caption" color="#333" fontWeight="medium">{value}</Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* 구매 버튼 */}
                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handlePurchase}
                    sx={{
                        bgcolor: '#1565c0',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 16,
                        py: 1.8,
                        borderRadius: 3,
                        boxShadow: '0 4px 16px rgba(21,101,192,0.35)',
                        '&:hover': { bgcolor: '#0d47a1' },
                    }}
                >
                    지금 구매하기 · 100,000원
                </Button>

                <Typography variant="caption" color="#bbb" display="block" textAlign="center" mt={1.5}>
                    제한 시간 내 구매하지 않으면 페이지가 만료됩니다
                </Typography>
            </Box>
        </Box>
    );
}