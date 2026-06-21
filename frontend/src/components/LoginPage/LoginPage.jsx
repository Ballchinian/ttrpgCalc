import { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { BACKEND_BASE_URL } from '../../config.js';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { setToken } from '../../auth';
import GoogleAuthButton from '../utility/GoogleAuthButton.jsx';

const loginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required")
});

//Dark field + light text to match the app theme (default form-control renders dark text)
const inputStyle = { background: "#222", color: "white", border: "1px solid #555" };

function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const [oauthError, setOauthError] = useState("");

    const handleLogin = async (values, { setSubmitting, setErrors }) => {
        const { email, password } = values;
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                setToken(data.accessToken);
                onLogin?.();
                navigate('/home');
            } else {
                setErrors({ email: 'Incorrect email or password' });
            }
        } catch (err) {
            console.error('Request failed:', err);
            setErrors({ email: 'Server error, try again later' });
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordReset = async () => {
        const email = prompt("Enter your email to receive a reset link:");
        if (!email) return;
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/auth/request-reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Password reset email has been sent.');
            } else {
                alert(data.message || 'Failed to send reset email.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            alert('Server error. Please try again later.');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card className="d-flex justify-content-center align-items-center">
                <Card.Body>
                    <Card.Header className="m-2">Pathfinder Calculator Login</Card.Header>

                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={loginSchema}
                        onSubmit={handleLogin}
                    >
                        {({ handleSubmit, handleChange, values, touched, errors, isSubmitting }) => (
                            <Form noValidate onSubmit={handleSubmit}>
                                <Form.Group className="m-3" controlId="formEmail">
                                    <Form.Control
                                        type="email" name="email" placeholder="Email"
                                        value={values.email} onChange={handleChange}
                                        isInvalid={touched.email && !!errors.email}
                                        style={inputStyle}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="m-3" controlId="formPassword">
                                    <Form.Control
                                        type="password" name="password" placeholder="Password"
                                        value={values.password} onChange={handleChange}
                                        isInvalid={touched.password && !!errors.password}
                                        style={inputStyle}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                </Form.Group>

                                <Button className="m-1 mt-3" type="submit" variant="success" id="login_button" disabled={isSubmitting}>
                                    Login
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    <div className="d-flex align-items-center my-3 px-3" style={{ gap: "8px" }}>
                        <hr style={{ flex: 1, borderColor: "#555" }} />
                        <span className="text-muted small">or</span>
                        <hr style={{ flex: 1, borderColor: "#555" }} />
                    </div>

                    <div className="d-flex justify-content-center">
                        <GoogleAuthButton onLogin={onLogin} onError={setOauthError} />
                    </div>
                    {oauthError && <div className="text-danger small mt-2">{oauthError}</div>}

                    <Button className="m-1 mt-3" type="button" variant="outline-secondary" onClick={handlePasswordReset}>
                        Password Reset
                    </Button>

                    <div className="mt-4" id="new_account">
                        <Link to="/register">
                            <Button type="button" variant="secondary">
                                ↪ Create a new account
                            </Button>
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default LoginPage;
