import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import Documents from './pages/Documents';
import UploadDocument from './pages/UploadDocument';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/upload" element={<UploadDocument />} />
                    <Route path="/documents/:id" element={<DocumentDetail />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;