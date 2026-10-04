import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './lib/AuthContext';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Bookings from './pages/Bookings';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { CheckoutCancel, CheckoutSuccess } from './pages/Checkout';

function Protected({ children }: {children: React.ReactNode}) { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace/>; }
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/checkout/success" element={<Protected><CheckoutSuccess/></Protected>}/><Route path="/checkout/cancel" element={<Protected><CheckoutCancel/></Protected>}/><Route element={<Protected><Layout/></Protected>}><Route index element={<Dashboard/>}/><Route path="calendar" element={<Calendar/>}/><Route path="bookings" element={<Bookings/>}/><Route path="customers" element={<Customers/>}/><Route path="team" element={<Team/>}/><Route path="pricing" element={<Pricing/>}/><Route path="billing" element={<Billing/>}/><Route path="settings" element={<Settings/>}/></Route><Route path="*" element={<NotFound/>}/></Routes>}
