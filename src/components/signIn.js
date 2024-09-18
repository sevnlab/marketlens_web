import * as React from 'react';
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

import {useNavigate} from "react-router-dom";
import axios from "axios";
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

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function SignIn() {

    // 페이지 이동을 위한 navigate 함수
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        console.log({
            email: data.get('email'),
            password: data.get('password'),
        });

        const userId = data.get('userId');
        const password = data.get('password');

        // navigate 를 postSignIn 에 전달
        postSignIn({ userId, password, navigate });
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
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
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
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
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

function postSignIn(data){
    // ●●●●●●  axios 간단 설명
    // method : axios 통신 방식 설정
    // POST : 데이터를 보낼 때 주로 사용
    // GET : 데이터를 받아올 때 주로 사용
    // 이 외에 PUT / DELETE 존재(이번 포스팅에서는 다루지 않습니다)
    // url : 통신할 URL 설정
    // data : axios 통신 시, 함께 보낼 데이터 기입
    // params : axios 통신 시, url 뒤의 파라미터 설정
    // headers : 데이터 형식 정의
    //     .then((res)=>{ ... } : 성공 시 작동하는 코드
    //     .catch(error)=>{ ... } : 실패 시 작동하는 코드

    axios({
        method: "POST",
        url: '/signIn',
        data: {
            userId: data.userId,
            password: data.password
        },
        // header에서 JSON 타입의 데이터라는 것을 명시
        headers: {'Content-type': 'application/json'}
    }).then((res)=>{
        alert("로그인에 성공했습니다.");

        // API로 부터 받은 데이터 출력
        console.log(res.data);

        data.navigate('/');

    }).catch(error=>{
        console.log("로그인 실패");
        console.log(error);
    });
}