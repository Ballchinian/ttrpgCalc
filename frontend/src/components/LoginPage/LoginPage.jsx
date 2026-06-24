import { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { BACKEND_BASE_URL } from '../../config.js';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { setToken } from '../../auth';
import SocialLogin from '../utility/SocialLogin.jsx';

const loginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required")
});

const pageStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" };
const cardStyle = { width: "100%", maxWidth: "380px" };
const titleStyle = { fontSize: "28px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "4px" };
const subtitleStyle = { fontSize: "13px", color: "var(--app-text)", opacity: 0.75, textAlign: "center", marginBottom: "22px" };
const labelStyle = { fontSize: "13px", color: "var(--app-text)", marginBottom: "4px" };
const rememberRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" };
const linkBtnStyle = { background: "none", border: "none", padding: 0, color: "#f0ad4e", fontSize: "13px", cursor: "pointer" };
const dividerRowStyle = { display: "flex", alignItems: "center", gap: "8px", margin: "18px 0" };
const dividerLineStyle = { flex: 1, borderColor: "#34506e" };

//Short pitch under the heading: tells a first-time visitor what the app does for them
const APP_TAGLINE = "Build characters, simulate tabletop RPG encounters turn by turn, and see exactly where every point of damage comes from.";

function LoginPage({ onLogin }) {
    const navigate = useNavigate();
    const [oauthError, setOauthError] = useState("");
    const [remember, setRemember] = useState(true);

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
        <div style={pageStyle}>
            <Card style={cardStyle}>
                <Card.Body className="p-4">
                    <h1 style={titleStyle}>TTRPG Calculator</h1>
                    <p style={subtitleStyle}>{APP_TAGLINE}</p>

                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={loginSchema}
                        onSubmit={handleLogin}
                    >
                        {({ handleSubmit, handleChange, values, touched, errors, isSubmitting }) => (
                            <Form noValidate onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label style={labelStyle}>Email</Form.Label>
                                    <Form.Control
                                        type="email" name="email" placeholder="Enter your email"
                                        value={values.email} onChange={handleChange}
                                        isInvalid={touched.email && !!errors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formPassword">
                                    <Form.Label style={labelStyle}>Password</Form.Label>
                                    <Form.Control
                                        type="password" name="password" placeholder="Enter your password"
                                        value={values.password} onChange={handleChange}
                                        isInvalid={touched.password && !!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                </Form.Group>

                                <div style={rememberRowStyle}>
                                    <Form.Check
                                        type="checkbox" id="rememberMe" label="Remember me"
                                        checked={remember} onChange={e => setRemember(e.target.checked)}
                                        style={{ fontSize: "13px" }}
                                    />
                                    <button type="button" style={linkBtnStyle} onClick={handlePasswordReset}>Forgot Password?</button>
                                </div>

                                <Button type="submit" variant="success" className="w-100" id="login_button" disabled={isSubmitting}>
                                    Sign In
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    <div style={dividerRowStyle}>
                        <hr style={dividerLineStyle} />
                        <span className="text-muted small">or</span>
                        <hr style={dividerLineStyle} />
                    </div>

                    <SocialLogin onLogin={onLogin} onError={setOauthError} />
                    {oauthError && <div className="text-danger small mt-1 text-center">{oauthError}</div>}

                    <div className="text-center mt-3">
                        <Link to="/register" style={{ fontSize: "13px", color: "var(--app-text)" }}>
                            New here? <span style={{ color: "#f0ad4e" }}>Create an account</span>
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default LoginPage;
