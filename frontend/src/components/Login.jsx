import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login/", {
        username: username,
        password: password,
      });

      const { token, user_id, username: returnedUsername } = res.data;

      if (!token || !user_id) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("username", returnedUsername);

      console.log("Login Successful:", returnedUsername);
      navigate("/");
    } catch (err) {
      console.error("Login Error:", err);
      setError("Invalid username or password");
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Card style={{ width: "400px" }} className="shadow">
        <Card.Body>
          <h2 className="text-center mb-4">Sign In</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleManualLogin}>
            <Form.Group id="username" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group id="password" className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button className="w-100" type="submit">
              Login
            </Button>
          </Form>

          <div className="w-100 text-center mt-3">
            <small>
              Don't have an account? <Link to="/register">Register here</Link>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
