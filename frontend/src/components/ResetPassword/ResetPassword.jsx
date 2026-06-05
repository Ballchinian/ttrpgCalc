import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form } from 'react-bootstrap';
import { BACKEND_BASE_URL } from '../../config.js';
import { Formik } from 'formik';
import * as Yup from 'yup';

const resetLoginSchema = Yup.object().shape({
    password: Yup.string().min(8, "Minimum 8 characters").max(128, "Maximum 128 characters").required("Password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], "Passwords must match")
        .required("Please confirm your password")
});

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    const handleSubmit = async (values, { setSubmitting }) => {
        const { password } = values;
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/auth/confirm-reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await response.json();
            if (data.success) {
                setMessage('Password successfully reset! Redirecting...');
                setTimeout(() => navigate('/'), 3000);
            } else {
                setMessage('Failed to reset password. Please try again.');
            }
        } catch (err) {
            setMessage('Server error, try again later');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh', maxWidth: '400px', margin: '0 auto' }}>
            <Card>
                <h2>Reset Your Password</h2>
                {message && <p style={{ color: 'green' }}>{message}</p>}

                <Formik
                    initialValues={{ password: '', confirmPassword: '' }}
                    validationSchema={resetLoginSchema}
                    onSubmit={handleSubmit}
                >
                    {({ handleSubmit, handleChange, values, touched, errors, isSubmitting }) => (
                        <Form style={{ gap: '10px', display: 'flex', flexDirection: 'column' }} onSubmit={handleSubmit}>
                            <Form.Group>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="New password"
                                    value={values.password}
                                    onChange={handleChange}
                                    isInvalid={touched.password && !!errors.password}
                                />
                                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm new password"
                                    value={values.confirmPassword}
                                    onChange={handleChange}
                                    isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                                />
                                <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                            </Form.Group>

                            <Button type="submit" disabled={isSubmitting}>Reset Password</Button>
                        </Form>
                    )}
                </Formik>
            </Card>
        </div>
    );
}

export default ResetPassword;
