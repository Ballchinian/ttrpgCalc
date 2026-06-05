import { Button, Card, Form } from 'react-bootstrap';
import { BACKEND_BASE_URL } from '../../config.js';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { setToken } from '../../auth';

const loginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required")
});

function LoginPage({ onLogin }) {
    const navigate = useNavigate();

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
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="m-3" controlId="formPassword">
                                    <Form.Control
                                        type="password" name="password" placeholder="Password"
                                        value={values.password} onChange={handleChange}
                                        isInvalid={touched.password && !!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                </Form.Group>

                                <Button className="m-1 mt-3" type="submit" id="login_button" disabled={isSubmitting}>
                                    Login
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    <Button className="m-1" type="button" variant="outline-primary" onClick={handlePasswordReset}>
                        Password Reset
                    </Button>

                    <div className="mt-4" id="new_account">
                        <Link to="/register">
                            <Button type="button" variant="outline-success">
                                Create a new account
                            </Button>
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default LoginPage;
