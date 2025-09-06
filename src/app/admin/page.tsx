'use client';

import React from 'react';
import LogoutButton from '../../components/LogoutButton';

// Types
interface DashboardStats {
  overview: {
    totalOrders: number;
    todayOrders: number;
    totalRevenue: number;
    todayRevenue: number;
  };
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    category: string;
    totalSold: number;
  }>;
  recentOrders: Array<{
    id: string;
    number: number;
    status: string;
    total: number;
    createdAt: string;
    beeperId: number;
    cashier: { username: string };
  }>;
}

interface Order {
  id: string;
  number: number;
  businessDate: string;
  status: 'IN_KITCHEN' | 'READY' | 'DELIVERED' | 'CANCELLED';
  beeperId: number;
  total: number;
  createdAt: string;
  deliveredAt: string | null;
  notes: string | null;
  cashier: { username: string; name: string };
  chef: { username: string; name: string } | null;
  items: Array<{
    id: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    customName: string | null;
    notes: string | null;
    product: { name: string; category: string } | null;
  }>;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
}

interface Category {
  name: string;
  count: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'CASHIER' | 'CHEF';
  isActive: boolean;
  createdAt: string;
  totalOrders: number;
  cashierOrders: number;
  chefOrders: number;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

const STATUS_LABELS: Record<string, string> = {
  'IN_KITCHEN': 'En Cocina',
  'READY': 'Listo',
  'DELIVERED': 'Entregado',
  'CANCELLED': 'Cancelado'
};

const STATUS_COLORS: Record<string, string> = {
  'IN_KITCHEN': 'bg-yellow-500/20 text-yellow-700',
  'READY': 'bg-blue-500/20 text-blue-700',
  'DELIVERED': 'bg-green-500/20 text-green-700',
  'CANCELLED': 'bg-red-500/20 text-red-700'
};

const ROLE_LABELS: Record<string, string> = {
  'ADMIN': 'Administrador',
  'CASHIER': 'Cajero',
  'CHEF': 'Chef'
};

const ROLE_COLORS: Record<string, string> = {
  'ADMIN': 'bg-purple-500/20 text-purple-700',
  'CASHIER': 'bg-blue-500/20 text-blue-700',
  'CHEF': 'bg-orange-500/20 text-orange-700'
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'orders' | 'products' | 'users' | 'credits'>('dashboard');
  
  // Dashboard state
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = React.useState(true);
  const [dashboardError, setDashboardError] = React.useState<string | null>(null);

  // Orders state  
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [orderFilters, setOrderFilters] = React.useState({
    status: 'all',
    date: new Date().toISOString().split('T')[0]
  });

  // Products state
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productsError, setProductsError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [productForm, setProductForm] = React.useState({
    name: '',
    category: '',
    price: ''
  });
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [showMoveProductModal, setShowMoveProductModal] = React.useState(false);
  const [productToMove, setProductToMove] = React.useState<Product | null>(null);
  const [targetCategory, setTargetCategory] = React.useState('');
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [productToToggle, setProductToToggle] = React.useState<Product | null>(null);
  const [showProductCreatedModal, setShowProductCreatedModal] = React.useState(false);
  const [createdProductName, setCreatedProductName] = React.useState('');
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = React.useState('');
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  // Users state
  const [users, setUsers] = React.useState<User[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [usersError, setUsersError] = React.useState<string | null>(null);
  const [showUserForm, setShowUserForm] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userForm, setUserForm] = React.useState({
    username: '',
    name: '',
    password: '',
    role: 'CASHIER'
  });

  // Fetch functions
  const loadStats = React.useCallback(async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: DashboardStats = await response.json();
      setStats(data);
      setDashboardError(null);
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Error cargando estadísticas');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const fetchOrders = React.useCallback(async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams();
      if (orderFilters.status !== 'all') params.append('status', orderFilters.status);
      if (orderFilters.date) params.append('date', orderFilters.date);
      
      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) throw new Error('Error al obtener pedidos');
      
      const data = await response.json();
      setOrders(data.orders);
      setOrdersError(null);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setOrdersLoading(false);
    }
  }, [orderFilters]);

  const fetchProducts = React.useCallback(async () => {
    try {
      setProductsLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error('Error al obtener productos');
      
      const data = await response.json();
      setProducts(data);
      setProductsError(null);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setProductsLoading(false);
    }
  }, [selectedCategory]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('Error al obtener categorías');
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchUsers = React.useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Error al obtener usuarios');
      
      const data = await response.json();
      setUsers(data);
      setUsersError(null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Product functions
  const handleSaveProduct = async () => {
    try {
      const { name, category, price } = productForm;
      if (!name.trim() || !category.trim() || !price) {
        alert('Todos los campos son requeridos');
        return;
      }

      const priceNum = parseFloat(price);
      if (priceNum <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
      }

      const method = editingProduct ? 'PATCH' : 'POST';
      const body = editingProduct 
        ? { productId: editingProduct.id, name: name.trim(), category: category.trim(), price: priceNum }
        : { name: name.trim(), category: category.trim(), price: priceNum };

      const response = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar producto');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      
      // Si estamos creando un producto nuevo, mostrar el modal especial
      if (!editingProduct) {
        setCreatedProductName(name.trim());
        setShowProductCreatedModal(true);
        // Auto-cerrar después de 4 segundos
        setTimeout(() => {
          setShowProductCreatedModal(false);
          setCreatedProductName('');
        }, 4000);
      } else {
        // Si estamos editando, mostrar mensaje normal
        showSuccessMessage(`Producto "${name.trim()}" actualizado exitosamente`);
      }
      
      setProductForm({ name: '', category: '', price: '' });
      fetchProducts();
      fetchCategories(); // Actualizar categorías también
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const showSuccessMessage = (message: string, error: boolean = false) => {
    setSuccessMessage(message);
    setIsError(error);
    setShowSuccessModal(true);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      setShowSuccessModal(false);
      setSuccessMessage('');
      setIsError(false);
    }, 3000);
  };

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        alert('El nombre de la categoría es requerido');
        return;
      }

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear categoría');
      }

      showSuccessMessage(`Categoría "${newCategoryName.trim()}" creada exitosamente`);
      setShowCategoryForm(false);
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      showSuccessMessage(err instanceof Error ? err.message : 'Error desconocido', true);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setShowCategoryForm(true);
  };

  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory || !newCategoryName.trim()) {
        alert('Nombre de categoría requerido');
        return;
      }

      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldName: editingCategory.name, 
          newName: newCategoryName.trim() 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar categoría');
      }

      showSuccessMessage('Categoría actualizada exitosamente');
      setShowCategoryForm(false);
      setEditingCategory(null);
      setNewCategoryName('');
      fetchCategories();
      
      // Si estamos viendo productos de esta categoría, actualizar la vista
      if (selectedCategory === editingCategory.name) {
        setSelectedCategory(newCategoryName.trim());
      }
    } catch (err) {
      showSuccessMessage(err instanceof Error ? err.message : 'Error desconocido', true);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
    setDeleteTargetCategory('');
    setShowDeleteCategoryModal(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      if (categoryToDelete.count > 0 && !deleteTargetCategory) {
        // Si hay productos y no se seleccionó categoría destino, no proceder
        return;
      }

      if (categoryToDelete.count > 0 && deleteTargetCategory) {
        // Primero mover todos los productos a la categoría destino
        const moveResponse = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'moveAll',
            fromCategory: categoryToDelete.name,
            toCategory: deleteTargetCategory
          })
        });

        if (!moveResponse.ok) {
          throw new Error('Error al mover productos');
        }
      }

      // Eliminar la categoría
      const response = await fetch(`/api/admin/categories?name=${encodeURIComponent(categoryToDelete.name)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar categoría');
      }

      showSuccessMessage('Categoría eliminada exitosamente');
      fetchCategories();
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      setDeleteTargetCategory('');
      
      // Si estábamos viendo productos de la categoría eliminada, volver a categorías
      if (selectedCategory === categoryToDelete.name) {
        setSelectedCategory(null);
      }
    } catch (err) {
      showSuccessMessage(err instanceof Error ? err.message : 'Error desconocido', true);
    }
  };

  const handleMoveProduct = (product: Product) => {
    setProductToMove(product);
    setTargetCategory('');
    setShowMoveProductModal(true);
  };

  const handleConfirmMoveProduct = async () => {
    try {
      if (!productToMove || !targetCategory) {
        alert('Selecciona una categoría destino');
        return;
      }

      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productToMove.id,
          category: targetCategory
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al mover producto');
      }

      showSuccessMessage(`Producto "${productToMove.name}" movido a "${targetCategory}" exitosamente`);
      setShowMoveProductModal(false);
      setProductToMove(null);
      setTargetCategory('');
      fetchProducts();
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteProductModal(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/admin/products?id=${productToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar producto');
      }

      showSuccessMessage(`Producto "${productToDelete.name}" eliminado exitosamente`);
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showSuccessMessage(err instanceof Error ? err.message : 'Error desconocido', true);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toString()
    });
    setShowProductForm(true);
  };

  const handleToggleProduct = (product: Product) => {
    setProductToToggle(product);
    setShowConfirmModal(true);
  };

  const handleConfirmToggleProduct = async () => {
    if (!productToToggle) return;

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productToToggle.id,
          isActive: !productToToggle.isActive
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar producto');
      }

      fetchProducts();
      fetchCategories(); // Actualizar categorías también
      setShowConfirmModal(false);
      setProductToToggle(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
      setShowConfirmModal(false);
      setProductToToggle(null);
    }
  };

  // User functions
  const handleSaveUser = async () => {
    try {
      const { username, name, password, role } = userForm;
      if (!username.trim() || !name.trim() || (!editingUser && !password) || !role) {
        alert('Todos los campos son requeridos');
        return;
      }

      if (!editingUser && password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser 
        ? { 
            userId: editingUser.id, 
            username: username.trim(), 
            name: name.trim(), 
            role,
            ...(password ? { password } : {})
          }
        : { username: username.trim(), name: name.trim(), password, role };

      const response = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar usuario');
      }

      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ username: '', name: '', password: '', role: 'CASHIER' });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleToggleUser = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isActive: !user.isActive
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar usuario');
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar pedido');
      }

      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Effects
  React.useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  React.useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  React.useEffect(() => {
    if (activeTab === 'products') {
      fetchCategories();
      if (selectedCategory) {
        fetchProducts();
      }
    }
  }, [activeTab, fetchCategories, fetchProducts, selectedCategory]);

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Separate effects for filter changes
  React.useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]); // This will refetch when filters change

  React.useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]); // This will refetch when filter changes

  // Bloquear scroll cuando hay modales abiertos
  React.useEffect(() => {
    const hasModalOpen = showProductForm || showCategoryForm || showMoveProductModal || showUserForm || showConfirmModal || showDeleteCategoryModal || showSuccessModal || showDeleteProductModal || showProductCreatedModal;
    
    if (hasModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProductForm, showCategoryForm, showMoveProductModal, showUserForm, showConfirmModal, showDeleteCategoryModal, showSuccessModal, showDeleteProductModal, showProductCreatedModal]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-PA', {
      timeZone: 'America/Panama',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (dashboardLoading && activeTab === 'dashboard') {
    return (
      <main className="min-h-[100svh] bg-[#1D263B] text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">👑 Panel Admin</h1>
            <LogoutButton />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/10 p-6 animate-pulse h-32" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#1D263B] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">👑 Panel Admin</h1>
          <div className="flex items-center gap-4">
            {activeTab === 'dashboard' && (
              <button 
                onClick={loadStats}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                🔄 Actualizar
              </button>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'orders', label: '📦 Pedidos' },
            { id: 'products', label: '🍔 Productos' },
            { id: 'users', label: '👥 Usuarios' },
            { id: 'credits', label: '💳 Créditos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-[#8DFF50] text-[#1D263B]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {dashboardError && (
              <div className="rounded-2xl bg-red-500/20 border border-red-500/50 p-6 text-center">
                <div className="text-red-400 font-semibold">Error: {dashboardError}</div>
                <button 
                  onClick={loadStats}
                  className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Reintentar
                </button>
              </div>
            )}

            {stats && (
              <>
                {/* Overview Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">📊</div>
                      <div className="text-white/80">Total Pedidos</div>
                    </div>
                    <div className="text-3xl font-bold text-[#8DFF50]">{stats.overview.totalOrders}</div>
                    <div className="text-sm text-white/60 mt-1">Hoy: {stats.overview.todayOrders}</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">💰</div>
                      <div className="text-white/80">Ingresos Totales</div>
                    </div>
                    <div className="text-3xl font-bold text-[#8DFF50]">{fmt(stats.overview.totalRevenue)}</div>
                    <div className="text-sm text-white/60 mt-1">Hoy: {fmt(stats.overview.todayRevenue)}</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">🍳</div>
                      <div className="text-white/80">En Cocina</div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {stats.ordersByStatus.find(s => s.status === 'IN_KITCHEN')?.count || 0}
                    </div>
                    <div className="text-sm text-white/60 mt-1">Activos</div>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl">✅</div>
                      <div className="text-white/80">Listos</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">
                      {stats.ordersByStatus.find(s => s.status === 'READY')?.count || 0}
                    </div>
                    <div className="text-sm text-white/60 mt-1">Para entregar</div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Top Products */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      🏆 Productos Más Vendidos (7 días)
                    </h3>
                    <div className="space-y-3">
                      {stats.topProducts.map((product, index) => (
                        <div key={product.productId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-[#8DFF50]">#{index + 1}</div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-white/60">{product.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{product.totalSold}</div>
                            <div className="text-sm text-white/60">vendidos</div>
                          </div>
                        </div>
                      ))}
                      {stats.topProducts.length === 0 && (
                        <div className="text-center py-4 text-white/60">
                          No hay datos de ventas aún
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      🕐 Pedidos Recientes
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {stats.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-[#8DFF50]">#{order.number}</div>
                            <div>
                              <div className="font-medium">Beeper {order.beeperId}</div>
                              <div className="text-sm text-white/60">Por: {order.cashier.username}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{fmt(order.total)}</div>
                            <div className={`text-xs px-2 py-1 rounded-lg ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="rounded-2xl bg-white/10 p-4 border border-white/20">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estado:</label>
                  <select
                    value={orderFilters.status}
                    onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-[#2A3441] border border-white/20 text-white focus:border-blue-500 focus:outline-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="all" className="bg-[#2A3441] text-white">Todos</option>
                    <option value="IN_KITCHEN" className="bg-[#2A3441] text-white">En Cocina</option>
                    <option value="READY" className="bg-[#2A3441] text-white">Listo</option>
                    <option value="DELIVERED" className="bg-[#2A3441] text-white">Entregado</option>
                    <option value="CANCELLED" className="bg-[#2A3441] text-white">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={orderFilters.date}
                    onChange={(e) => setOrderFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
              </div>
            </div>

            {ordersLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8DFF50] mx-auto"></div>
              </div>
            )}

            {ordersError && (
              <div className="rounded-2xl bg-red-500/20 border border-red-500/50 p-4 text-red-200">
                {ordersError}
              </div>
            )}

            {!ordersLoading && !ordersError && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-white/10 p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#8DFF50]">Pedido #{order.number}</h3>
                        <p className="text-white/60">Beeper {order.beeperId} • {formatDate(order.createdAt)}</p>
                        <p className="text-white/60">Cajero: {order.cashier.name} • {order.chef ? `Chef: ${order.chef.name}` : 'Sin chef asignado'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fmt(order.total)}</div>
                        <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between bg-white/5 p-2 rounded">
                            <span>{item.qty}x {item.product?.name || item.customName}</span>
                            <span>{fmt(item.lineTotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <div className="flex gap-2">
                        {order.status === 'IN_KITCHEN' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Marcar Listo
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                          >
                            Marcar Entregado
                          </button>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {order.deliveredAt && (
                      <p className="text-white/60 text-sm mt-2">
                        Entregado: {formatDate(order.deliveredAt)}
                      </p>
                    )}
                  </div>
                ))}

                {orders.length === 0 && !ordersLoading && (
                  <div className="text-center py-8 text-white/60">
                    No se encontraron pedidos
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {!selectedCategory ? (
              /* Categories View */
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h2 className="text-3xl font-bold">Categorías de Productos</h2>
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => setShowCategoryForm(true)}
                      className="px-6 py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 transition-colors min-h-[60px]"
                    >
                      ➕ Crear Categoría
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({ name: '', category: '', price: '' });
                        setShowProductForm(true);
                      }}
                      className="px-6 py-4 rounded-2xl bg-[#8DFF50] text-[#1D263B] font-bold text-lg hover:bg-[#7DE040] transition-colors min-h-[60px]"
                    >
                      ➕ Agregar Producto
                    </button>
                  </div>
                </div>

                {productsError && (
                  <div className="rounded-3xl bg-red-500/20 border border-red-500/50 p-6 text-red-200 mb-8 text-lg">
                    {productsError}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div 
                      key={category.name} 
                      className="rounded-3xl bg-white/10 p-8 border border-white/20 hover:bg-white/15 transition-colors"
                    >
                      <div className="text-center mb-6">
                        <div className="text-6xl mb-4">
                          {category.name === 'Hamburguesas' && '🍔'}
                          {category.name === 'Papas' && '🍟'}
                          {category.name === 'Bebidas' && '🥤'}
                          {category.name === 'Extras' && '🍽️'}
                          {!['Hamburguesas', 'Papas', 'Bebidas', 'Extras'].includes(category.name) && '📦'}
                        </div>
                        <h3 className="font-bold text-2xl mb-3">{category.name}</h3>
                        <p className="text-white/60 text-lg">{category.count} productos</p>
                      </div>
                      
                      <div className="space-y-4">
                        <button
                          onClick={() => setSelectedCategory(category.name)}
                          className="w-full px-6 py-4 rounded-2xl bg-[#8DFF50] text-[#1D263B] font-bold text-lg hover:bg-[#7DE040] transition-colors"
                        >
                          📦 Ver Productos
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category);
                            }}
                            className="px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium transition-colors"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {categories.length === 0 && (
                    <div className="col-span-full text-center py-20 text-white/60">
                      <div className="text-8xl mb-6">📦</div>
                      <p className="text-2xl mb-4 font-medium">No hay categorías aún</p>
                      <p className="text-lg mb-8">Crea tu primera categoría para organizar tus productos</p>
                      <button
                        onClick={() => setShowCategoryForm(true)}
                        className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 transition-colors"
                      >
                        Crear primera categoría
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Products in Category View */
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-6 py-3 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-3 font-medium text-lg min-h-[56px]"
                    >
                      ← Volver a Categorías
                    </button>
                    <h2 className="text-3xl font-bold">{selectedCategory}</h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', category: selectedCategory, price: '' });
                      setShowProductForm(true);
                    }}
                    className="px-6 py-4 rounded-2xl bg-[#8DFF50] text-[#1D263B] font-bold text-lg hover:bg-[#7DE040] transition-colors min-h-[60px] w-full sm:w-auto"
                  >
                    ➕ Agregar Producto
                  </button>
                </div>

                {productsLoading && (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#8DFF50] mx-auto"></div>
                    <p className="text-xl text-white/60 mt-6">Cargando productos...</p>
                  </div>
                )}

                {productsError && (
                  <div className="rounded-3xl bg-red-500/20 border border-red-500/50 p-6 text-red-200 text-lg">
                    {productsError}
                  </div>
                )}

                {!productsLoading && !productsError && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                      <div key={product.id} className="rounded-3xl bg-white/10 p-8 border border-white/20">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-bold text-xl mb-2 truncate">{product.name}</h3>
                            <p className="text-white/60 text-lg">{product.category}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-xl text-sm font-bold whitespace-nowrap ${
                            product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <div className="text-3xl font-bold text-[#8DFF50] mb-2">{fmt(product.price)}</div>
                          <div className="text-lg text-white/60">{product.orderCount} vendidos</div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-4 py-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 font-medium text-lg transition-colors"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleMoveProduct(product)}
                              className="px-4 py-4 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-medium text-lg transition-colors"
                            >
                              📁 Mover
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleToggleProduct(product)}
                              className={`px-4 py-4 rounded-xl text-white font-medium text-lg transition-colors ${
                                product.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {product.isActive ? '❌ Desactivar' : '✅ Activar'}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="px-4 py-4 rounded-xl bg-red-700 text-white hover:bg-red-800 font-medium text-lg transition-colors border-2 border-red-500"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {products.length === 0 && !productsLoading && (
                      <div className="col-span-full text-center py-16 text-white/60">
                        <div className="text-8xl mb-6">📦</div>
                        <p className="text-2xl mb-4 font-medium">No hay productos en esta categoría</p>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({ name: '', category: selectedCategory, price: '' });
                            setShowProductForm(true);
                          }}
                          className="mt-6 px-8 py-4 rounded-2xl bg-[#8DFF50] text-[#1D263B] font-bold text-lg hover:bg-[#7DE040] transition-colors"
                        >
                          Agregar primer producto
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header with add button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ username: '', name: '', password: '', role: 'CASHIER' });
                  setShowUserForm(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#8DFF50] text-[#1D263B] font-medium hover:bg-[#7DE040]"
              >
                ➕ Agregar Usuario
              </button>
            </div>

            {usersLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8DFF50] mx-auto"></div>
              </div>
            )}

            {usersError && (
              <div className="rounded-2xl bg-red-500/20 border border-red-500/50 p-4 text-red-200">
                {usersError}
              </div>
            )}

            {!usersLoading && !usersError && (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="rounded-2xl bg-white/10 p-6 border border-white/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{user.name}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                            {ROLE_LABELS[user.role]}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                        
                        <p className="text-white/60 mb-2">@{user.username}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Total pedidos:</span>
                            <div className="font-bold">{user.totalOrders}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Como cajero:</span>
                            <div className="font-bold">{user.cashierOrders}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Como chef:</span>
                            <div className="font-bold">{user.chefOrders}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleToggleUser(user)}
                          className={`px-3 py-2 rounded-lg text-white text-sm ${
                            user.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {user.isActive ? '❌ Desactivar' : '✅ Activar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {users.length === 0 && !usersLoading && (
                  <div className="text-center py-8 text-white/60">
                    No se encontraron usuarios
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="rounded-2xl bg-white/10 backdrop-blur p-12 border border-white/20 text-center">
            <div className="text-6xl mb-4">💳</div>
            <div className="text-2xl font-bold mb-2">Sistema de Créditos</div>
            <div className="text-white/60">
              Esta sección estará disponible próximamente.
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showProductForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductForm(false);
                setNewCategoryName('');
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-white/20 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium mb-3">Nombre:</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg"
                    placeholder="Ej: Hamburguesa Doble"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-3">Categoría:</label>
                  <div className="space-y-4">
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-4 rounded-2xl bg-[#2A3441] border border-white/20 text-white text-lg focus:border-blue-500 focus:outline-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                      size={1}
                    >
                      <option value="" className="bg-[#2A3441] text-white">Seleccionar...</option>
                      {categories.map(cat => (
                        <option key={cat.name} value={cat.name} className="bg-[#2A3441] text-white py-2">{cat.name}</option>
                      ))}
                    </select>
                    
                    <div className="flex gap-2 items-center">
                      <div className="text-lg text-white/60">O crear nueva:</div>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Nueva categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            setProductForm(prev => ({ ...prev, category: newCategoryName.trim() }));
                            setNewCategoryName('');
                          }
                        }}
                        disabled={!newCategoryName.trim()}
                        className="px-6 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-3">Precio:</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowProductForm(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={!productForm.name || !productForm.category || !productForm.price}
                  className="flex-1 px-6 py-4 rounded-2xl bg-[#8DFF50] text-[#1D263B] font-bold text-lg hover:bg-[#7DE040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCategoryForm(false);
                setEditingCategory(null);
                setNewCategoryName('');
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">
                {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium mb-3">Nombre de la categoría:</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg"
                    placeholder="Ej: Postres, Ensaladas, etc."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (editingCategory) {
                          handleUpdateCategory();
                        } else {
                          handleCreateCategory();
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="text-lg text-white/60 bg-white/5 p-4 rounded-2xl">
                  {editingCategory 
                    ? '💡 Esto actualizará el nombre en todos los productos de esta categoría'
                    : '💡 La categoría se creará y estará disponible para asignar a productos'
                  }
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingCategory ? 'Actualizar' : 'Crear Categoría'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move Product Modal */}
        {showMoveProductModal && productToMove && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowMoveProductModal(false);
                setProductToMove(null);
                setTargetCategory('');
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">Mover Producto</h3>
              
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-lg text-white/60 mb-2">Producto:</div>
                  <div className="font-bold text-xl mb-3">{productToMove.name}</div>
                  <div className="text-lg text-white/60">Categoría actual: <span className="text-white font-medium">{productToMove.category}</span></div>
                </div>
                
                <div>
                  <label className="block text-lg font-medium mb-3">Nueva categoría:</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-[#2A3441] border border-white/20 text-white text-lg focus:border-blue-500 focus:outline-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                    size={1}
                  >
                    <option value="" className="bg-[#2A3441] text-white">Seleccionar categoría destino...</option>
                    {categories
                      .filter(cat => cat.name !== productToMove.category)
                      .map(cat => (
                        <option key={cat.name} value={cat.name} className="bg-[#2A3441] text-white py-2">
                          {cat.name} ({cat.count} productos)
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="text-lg text-white/60 bg-white/5 p-4 rounded-2xl">
                  💡 El producto se moverá a la categoría seleccionada
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowMoveProductModal(false);
                    setProductToMove(null);
                    setTargetCategory('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMoveProduct}
                  disabled={!targetCategory}
                  className="flex-1 px-6 py-4 rounded-2xl bg-purple-500 text-white font-bold text-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mover Producto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUserForm(false);
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-2xl p-6 w-full max-w-md border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre de usuario:</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="usuario123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre completo:</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contraseña {editingUser && '(dejar vacío para no cambiar):'}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Rol:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#2A3441] border border-white/20 text-white focus:border-blue-500 focus:outline-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                    size={1}
                  >
                    <option value="CASHIER" className="bg-[#2A3441] text-white py-2">Cajero</option>
                    <option value="CHEF" className="bg-[#2A3441] text-white py-2">Chef</option>
                    <option value="ADMIN" className="bg-[#2A3441] text-white py-2">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUserForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#8DFF50] text-[#1D263B] font-medium hover:bg-[#7DE040]"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && productToToggle && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowConfirmModal(false);
                setProductToToggle(null);
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6">
                {productToToggle.isActive ? 'Desactivar Producto' : 'Activar Producto'}
              </h3>
              
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-lg text-white/60 mb-2">Producto:</div>
                  <div className="font-bold text-xl mb-3">{productToToggle.name}</div>
                  <div className="text-lg text-white/60">
                    Categoría: <span className="text-white font-medium">{productToToggle.category}</span>
                  </div>
                  <div className="text-lg text-white/60">
                    Precio: <span className="text-[#8DFF50] font-bold">{fmt(productToToggle.price)}</span>
                  </div>
                </div>
                
                <div className="text-lg text-white/60 bg-white/5 p-4 rounded-2xl">
                  {productToToggle.isActive ? (
                    <>
                      ⚠️ <strong>¿Estás seguro de desactivar este producto?</strong>
                      <br />
                      <span className="text-red-400">El producto no aparecerá en el menú para los clientes.</span>
                    </>
                  ) : (
                    <>
                      ✅ <strong>¿Estás seguro de activar este producto?</strong>
                      <br />
                      <span className="text-green-400">El producto aparecerá disponible en el menú para los clientes.</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setProductToToggle(null);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmToggleProduct}
                  className={`flex-1 px-6 py-4 rounded-2xl font-bold text-lg transition-colors ${
                    productToToggle.isActive 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {productToToggle.isActive ? '❌ Desactivar' : '✅ Activar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Modal */}
        {showDeleteCategoryModal && categoryToDelete && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteCategoryModal(false);
                setCategoryToDelete(null);
                setDeleteTargetCategory('');
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6 text-center">
                🗑️ Eliminar Categoría
              </h3>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-2xl">
                  <div className="text-lg text-white/60 mb-2">Categoría a eliminar:</div>
                  <div className="font-bold text-xl mb-3">{categoryToDelete.name}</div>
                  {categoryToDelete.count > 0 && (
                    <div className="text-lg text-white/60">
                      Esta categoría tiene <span className="text-white font-medium">{categoryToDelete.count} productos</span>
                    </div>
                  )}
                </div>
                
                {categoryToDelete.count > 0 ? (
                  <>
                    <div>
                      <label className="block text-lg font-medium mb-3">
                        Mover productos a la categoría:
                      </label>
                      <select
                        value={deleteTargetCategory}
                        onChange={(e) => setDeleteTargetCategory(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl bg-[#2A3441] border border-white/20 text-white text-lg focus:border-blue-500 focus:outline-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                        size={1}
                      >
                        <option value="" className="bg-[#2A3441] text-white py-2">
                          Seleccionar categoría destino...
                        </option>
                        {categories
                          .filter(cat => cat.name !== categoryToDelete.name)
                          .map(cat => (
                            <option key={cat.name} value={cat.name} className="bg-[#2A3441] text-white py-2">
                              {cat.name} ({cat.count} productos)
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div className="text-lg text-white/60 bg-white/5 p-4 rounded-2xl">
                      ⚠️ Los productos se moverán automáticamente a la categoría seleccionada antes de eliminar esta categoría
                    </div>
                  </>
                ) : (
                  <div className="text-lg text-white/60 bg-white/5 p-4 rounded-2xl">
                    ✅ Esta categoría está vacía y puede eliminarse directamente
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowDeleteCategoryModal(false);
                    setCategoryToDelete(null);
                    setDeleteTargetCategory('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteCategory}
                  disabled={categoryToDelete.count > 0 && !deleteTargetCategory}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {categoryToDelete.count > 0 ? 'Mover y Eliminar' : 'Eliminar Categoría'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-md border border-white/20 transform transition-all duration-300 ease-in-out"
              style={{
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{isError ? '❌' : '✅'}</div>
                <h3 className={`text-2xl font-bold mb-4 ${isError ? 'text-red-400' : 'text-green-400'}`}>
                  {isError ? '¡Error!' : '¡Éxito!'}
                </h3>
                <p className="text-lg text-white/80">
                  {successMessage}
                </p>
                <div className="mt-6">
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{
                        width: '100%',
                        animation: 'progressBarShrink 3s linear forwards'
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    Este mensaje se cerrará automáticamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Product Modal */}
        {showDeleteProductModal && productToDelete && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteProductModal(false);
                setProductToDelete(null);
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-red-500/50"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6 text-center text-red-400">
                🚨 ACCIÓN CRÍTICA
              </h3>
              
              <div className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-lg text-white/90 mb-4 font-medium">
                      Estás a punto de eliminar permanentemente este producto:
                    </p>
                    <div className="font-bold text-xl mb-2 text-red-300">{productToDelete.name}</div>
                    <div className="text-white/60">Categoría: {productToDelete.category}</div>
                    <div className="text-white/60">Precio: {fmt(productToDelete.price)}</div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🛑</div>
                    <div>
                      <p className="text-yellow-300 font-bold">¡ADVERTENCIA!</p>
                      <p className="text-white/80 text-sm">
                        Esta acción no se puede deshacer. El producto será eliminado permanentemente del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl">
                  <p className="text-center text-white/70">
                    ¿Estás completamente seguro de que deseas eliminar este producto?
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowDeleteProductModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium text-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteProduct}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-colors border-2 border-red-500"
                >
                  SÍ, ELIMINAR PERMANENTEMENTE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Created Success Modal */}
        {showProductCreatedModal && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductCreatedModal(false);
                setCreatedProductName('');
              }
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'hidden'
            }}
          >
            <div 
              className="bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-md border-2 border-green-400/50 rounded-3xl p-8 w-full max-w-lg transform animate-bounce-in shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}
            >
              {/* Confetti Effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="text-center relative z-10">
                {/* Animated checkmark */}
                <div className="mb-6 relative">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center transform animate-pulse">
                    <svg 
                      className="w-12 h-12 text-white animate-check-draw" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{
                        strokeDasharray: '50',
                        strokeDashoffset: '50',
                        animation: 'checkDraw 0.8s ease-in-out 0.3s forwards'
                      }}
                    >
                      <path strokeLinecap="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  {/* Sparkle effects */}
                  <div className="absolute -top-2 -right-2 text-yellow-400 text-xl animate-spin">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-pink-400 text-lg animate-bounce">🎉</div>
                </div>

                <h3 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 animate-pulse">
                  ¡Producto Creado!
                </h3>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
                  <p className="text-lg text-white/90 mb-2">
                    Se ha agregado exitosamente:
                  </p>
                  <div className="text-2xl font-bold text-green-300 mb-4 animate-pulse">
                    &ldquo;{createdProductName}&rdquo;
                  </div>
                  <div className="flex justify-center gap-2 text-sm text-white/70">
                    <span>🍽️ Disponible en el menú</span>
                    <span>•</span>
                    <span>📱 Visible para clientes</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-green-200/80">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>Producto agregado al inventario</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span>Disponible para órdenes</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    <span>Sincronizado con el sistema</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProductCreatedModal(false);
                    setCreatedProductName('');
                  }}
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  ¡Genial! 🚀
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
