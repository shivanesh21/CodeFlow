import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (

        <div style={{padding:"40px"}}>

            <h1>Dashboard</h1>

            <h2>Welcome {user?.name}</h2>

            <p>{user?.email}</p>

            <button onClick={handleLogout}>
                Logout
            </button>

        </div>

    );

}

export default Dashboard;