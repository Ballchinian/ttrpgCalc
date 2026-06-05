import { Button, Card, Form } from 'react-bootstrap';
import { BACKEND_BASE_URL } from '../../config.js';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

const registerSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().min(8, "Minimum 8 characters").max(128, "Maximum 128 characters").required("Password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], "Passwords must match")
        .required("Please confirm your password")
});

function RegisterPage() {
    const navigate = useNavigate();

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        const { name, email, password } = values;
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (data.success) {
                navigate('/');
            } else {
                const isEmailError = data.message?.toLowerCase().includes("email");
                setErrors({ [isEmailError ? "email" : "name"]: data.message || "Registration failed" });
            }
        } catch (err) {
            console.error('Request failed:', err);
            setErrors({ name: 'Server error, try again later' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <Card>
                <Card.Body>
                    <Card.Header className="mb-4">Create an Account</Card.Header>

                    <Formik
                        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
                        validationSchema={registerSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ handleSubmit, handleChange, values, touched, errors }) => (
                            <Form noValidate onSubmit={handleSubmit} style={{ gap: '20px', display: 'flex', flexDirection: 'column' }}>
                                <Form.Group>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder="Name"
                                        value={values.name}
                                        onChange={handleChange}
                                        isInvalid={touched.name && !!errors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group controlId="formEmail">
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={values.email}
                                        onChange={handleChange}
                                        isInvalid={touched.email && !!errors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group controlId="formPassword">
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={values.password}
                                        onChange={handleChange}
                                        isInvalid={touched.password && !!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group controlId="formConfirmPassword">
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        value={values.confirmPassword}
                                        onChange={handleChange}
                                        isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                                </Form.Group>

                                <Button className="mt-4" type="submit">Register</Button>
                            </Form>
                        )}
                    </Formik>
                </Card.Body>
            </Card>
        </div>
    );
}

export default RegisterPage;
