import React, { useEffect, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://mui.com/">
                Your Website
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

const defaultTheme = createTheme();

export default function SignIn() {
    const navigate = useNavigate();

    // 일반 로그인 처리
    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const userId = data.get('userId');
        const password = data.get('password');
        postSignIn({ userId, password, navigate });
    };

    // 네이버 로그인 처리
    const handleNaverLogin = () => {
        console.log("네이버 로그인 실행");
        postNaverSignIn();
    };

    // 네이버 로그인 콜백 처리
    const handleNaverCallback = useCallback(() => {
        console.log("네이버 콜백 처리 중...");
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        console.log("받은 토큰:", token);  // 토큰을 확인하는 로그 추가

        if (token) {
            localStorage.setItem('token', token); // 토큰을 로컬 스토리지에 저장
            alert("네이버 로그인에 성공했습니다.");
            navigate('/main');  // 메인 페이지로 리디렉션
        } else {
            console.log("토큰을 찾을 수 없습니다.");  // 토큰이 없는 경우 로그 출력
            alert("로그인 실패: 토큰을 찾을 수 없습니다.");
            navigate('/signIn');  // 실패 시 로그인 페이지로 리디렉션
        }
    }, [navigate]);

    // 경로 확인 및 콜백 처리
    useEffect(() => {
        const path = window.location.pathname;
        console.log("현재 경로:", path);  // 경로 확인 로그 추가
        if (path === "/oauth2/callback/naver") {
            console.log("콜백 경로에 진입했습니다.");  // 콜백 경로에 진입했을 때 로그
            handleNaverCallback();
        }
    }, [handleNaverCallback]);

    // 카카오 로그인 처리
    const handleKakaoLogin = () => {
        console.log("카카오 로그인 실행");
        postKakaoSignIn();
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign in
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="userId"
                            label="로그인아이디"
                            name="userId"
                            autoComplete="userId"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="비밀번호"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                        />
                        <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 0, mb: 2 }}
                        >
                            로그인
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: -1, mb: 2 }}
                            onClick={handleNaverLogin}
                        >
                            Naver 계정으로 로그인
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: -1, mb: 2 }}
                            onClick={handleKakaoLogin}
                        >
                            Kakao 계정으로 로그인
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href="#" variant="body2">
                                    Forgot password?
                                </Link>
                            </Grid>
                            <Grid item>
                                <Link href="#" variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
                <Copyright sx={{ mt: 8, mb: 4 }} />
            </Container>
        </ThemeProvider>
    );
}

// 로그인 요청
function postSignIn(data) {
    axios({
        method: "POST",
        url: '/signIn',
        data: {
            userId: data.userId,
            password: data.password
        },
        headers: {'Content-type': 'application/json'}
    }).then((res) => {
        alert("로그인에 성공했습니다.");
        localStorage.setItem("token", res.data.token);
        data.navigate('/main');
    }).catch(error => {
        console.log("로그인 실패");
        console.log(error);
    });
}

// 네이버 로그인 요청
function postNaverSignIn() {
    axios({
        method: "GET",
        url: "/oauth/naver",
    })
        .then((response) => {
            console.log("Naver 로그인 리다이렉션 URL:", response.data.redirectUrl);  // 리다이렉션 URL 로그 추가
            window.location.href = response.data.redirectUrl;
        })
        .catch((error) => {
            console.error("네이버 로그인 실패", error);
        });
}

// 카카오 로그인 요청
function postKakaoSignIn() {
    axios({
        method: "GET",
        url: "/oauth/kakao",
    })
        .then((response) => {
            console.log("Kakao 로그인 리다이렉션 URL:", response.data.redirectUrl);  // 리다이렉션 URL 로그 추가
            window.location.href = response.data.redirectUrl;
        })
        .catch((error) => {
            console.error("카카오 로그인 실패", error);
        });
}