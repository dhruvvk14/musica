import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Compare from "./pages/Compare";
import Login from "./pages/Login"
import Navbar from "./components/navbar";

export default function App() {
  return (
    <>
      {/* <nav style={{ marginBottom: 20 }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/upload">Upload</Link> |{" "}
        <Link to="/viewer">Viewer</Link> |{" "}
        <Link to="/login">Login</Link>
      </nav> */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}