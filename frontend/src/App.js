import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import UserPage from "./components/UserPage";
import RegisterPage from "./components/RegisterPage";

function App() {

    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<LandingPage />} />
                <Route path="/user-sign-in" element={<LoginPage />} />
                <Route path="/user-page" element={<UserPage />} />
                <Route path="/user-registration" element={<RegisterPage />} />
            </Routes>
        </Router>
    );
}

export default App;
