import { Route, Routes } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Explore from "./pages/Explore"
import Profile from "./pages/Profile"
import Favourite from "./pages/Favourite"

function App() {
  return (
    <>
      <Navbar />
      <Routes >
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/favorite" element={<Favourite />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

    </>
  )
}

export default App
