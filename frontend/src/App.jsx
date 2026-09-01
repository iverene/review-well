import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Reviewer from './pages/Reviewer'
import Create from './pages/Create'
import Review from './pages/Review'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reviewer/:id" element={<Reviewer />} />
          <Route path="/create" element={<Create />} />
          <Route path="/review/:id" element={<Review />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
