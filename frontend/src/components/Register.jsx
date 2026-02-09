import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/register/", formData);

      setSuccess("Registration successful! Redirecting to Login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      const data = err.response?.data;
      if (data?.password) {
        setError(data.password[0]);
      } else if (data?.username) {
        setError("Username is already taken.");
      } else if (data?.email) {
        setError("Account with this email already exists.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "500px" }}>
      <Card className="shadow p-4">
        <h2 className="text-center mb-4">Create Account</h2>

        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {!success && (
          <>
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password_confirm"
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Button variant="success" type="submit" className="w-100">
                Register
              </Button>
            </Form>
          </>
        )}

        <div className="mt-3 text-center">
          <small>
            Already have an account? <Link to="/login">Login here</Link>
          </small>
        </div>
      </Card>
    </Container>
  );
};

export default Register;
