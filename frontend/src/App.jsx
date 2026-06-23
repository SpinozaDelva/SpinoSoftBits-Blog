// src/App.jsx - Main app with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ManagePosts from './pages/ManagePosts';
import ManageCategories from './pages/ManageCategories';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/edit/:slug" element={<Admin />} />
        <Route path="/manage" element={<ManagePosts />} />
        <Route path="/categories" element={<ManageCategories />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;