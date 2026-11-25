import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Facilities from './pages/Facilities'
import FacilityDetail from './pages/FacilityDetail'
import Inventory from './pages/Inventory'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import ProductForm from './pages/ProductForm'
import SDSManagement from './pages/SDSManagement'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="facilities/:id" element={<FacilityDetail />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="sds" element={<SDSManagement />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
