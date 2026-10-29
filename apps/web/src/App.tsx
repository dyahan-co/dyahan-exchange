import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuessPage } from './features/guess/GuessPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/guess" element={<GuessPage />} />
        <Route path="*" element={<Navigate to="/guess" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
