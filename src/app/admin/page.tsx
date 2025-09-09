'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Link from 'next/link';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../hooks/useAuth';

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
  email?: string; // Campo opcional para email
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
  const { currentUser, broadcastSessionCheck } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'orders' | 'products' | 'users' | 'credits' | 'analytics'>('dashboard');
  
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
    date: ''
  });
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);
  
  // Pagination state for orders
  const [currentOrdersPage, setCurrentOrdersPage] = React.useState(1);
  const ordersPerPage = 6;

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [usersPerPage] = React.useState(10);
  const [showUserForm, setShowUserForm] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [showToggleUserModal, setShowToggleUserModal] = React.useState(false);
  const [userToToggle, setUserToToggle] = React.useState<User | null>(null);
  const [userForm, setUserForm] = React.useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'CASHIER'
  });

  // Modal system state
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [showSuccessMessageModal, setShowSuccessMessageModal] = React.useState(false);
  const [modalMessage, setModalMessage] = React.useState('');

  // Calendar navigation state
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = React.useState(() => new Date().getFullYear());
  const [availableDates, setAvailableDates] = React.useState<string[]>([]);
  const [calendarLoading, setCalendarLoading] = React.useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null);
  const [analyticsDateRange, setAnalyticsDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    end: new Date().toISOString().split('T')[0] // hoy
  });

  // Utility functions for modal management
  const showError = (message: string) => {
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const showSuccess = (message: string) => {
    setModalMessage(message);
    setShowSuccessMessageModal(true);
  };

  // Fetch functions optimizadas para máxima velocidad
  const loadStats = React.useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      
      // Fetch con configuración optimizada para velocidad
      const response = await fetch('/api/admin/stats', { 
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: DashboardStats = await response.json();
      
      // Actualización inmediata sin delay
      setStats(data);
      
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Error cargando estadísticas');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Función silenciosa para polling automático SIN mostrar loading - ultra optimizada
  const loadStatsSilent = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', { 
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: DashboardStats = await response.json();
      
      // Actualización silenciosa instantánea
      setStats(data);
      setDashboardError(null);
      
    } catch (err) {
      // En polling silencioso no mostramos errores para no interrumpir
      console.error('Error en polling automático de stats:', err);
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

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      const params = new URLSearchParams();
      params.append('start', analyticsDateRange.start);
      params.append('end', analyticsDateRange.end);
      
      const response = await fetch(`/api/admin/analytics?${params}`);
      if (!response.ok) throw new Error('Error al obtener analítica');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Error cargando analítica');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDateRange]);

  const fetchProducts = React.useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/admin/products?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener productos');
      
      const data = await response.json();
      setProducts(data);
      
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setProductsLoading(false);
    }
  }, [selectedCategory]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener categorías');
      
      const data = await response.json();
      setCategories(data);
      
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Función para forzar recarga de categorías (simplificada)
  const refreshCategories = React.useCallback(fetchCategories, [fetchCategories]);

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
        showError('Todos los campos son requeridos');
        return;
      }

      const priceNum = parseFloat(price);
      if (priceNum <= 0) {
        showError('El precio debe ser mayor a 0');
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
      refreshCategories(); // Actualizar categorías también
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
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
        showError('El nombre de la categoría es requerido');
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
      refreshCategories();
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
        showError('Nombre de categoría requerido');
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
      refreshCategories();
      
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
      refreshCategories();
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
        showError('Selecciona una categoría destino');
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
      showError(err instanceof Error ? err.message : 'Error desconocido');
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
      refreshCategories();
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
      showError(err instanceof Error ? err.message : 'Error desconocido');
      setShowConfirmModal(false);
      setProductToToggle(null);
    }
  };

  // User functions
  const handleSaveUser = async () => {
    try {
      const { username, name, email, password, role } = userForm;
      
      // Validaciones básicas
      if (!username?.trim()) {
        showError('El nombre de usuario es requerido');
        return;
      }

      // Validar que el username no tenga espacios
      if (username.includes(' ')) {
        showError('El nombre de usuario no puede contener espacios');
        return;
      }

      // Validar que el username solo tenga caracteres válidos
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        showError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos');
        return;
      }

      // Validar email si se proporciona y es admin
      if (email && email.trim()) {
        if (role !== 'ADMIN') {
          showError('Solo los administradores pueden tener email');
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          showError('El formato del email no es válido');
          return;
        }
      }

      if (!editingUser && !password) {
        showError('La contraseña es requerida para usuarios nuevos');
        return;
      }

      if (!editingUser && password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (password && password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser 
        ? { 
            userId: editingUser.id, 
            username: username.trim(), 
            name: name?.trim() || null,
            email: email?.trim() || null,
            role,
            ...(password ? { password } : {})
          }
        : { 
            username: username.trim(), 
            name: name?.trim() || null,
            email: email?.trim() || null,
            password, 
            role 
          };

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
      setUserForm({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
      fetchUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleToggleUser = (user: User) => {
    setUserToToggle(user);
    setShowToggleUserModal(true);
  };

  const confirmToggleUser = async () => {
    if (!userToToggle) return;

    try {
      const requestBody = {
        userId: userToToggle.id,
        isActive: !userToToggle.isActive
      };
      
      console.log('Enviando request:', requestBody);
      
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error del servidor:', error);
        throw new Error(error.error || 'Error al actualizar usuario');
      }

      setShowToggleUserModal(false);
      setUserToToggle(null);
      fetchUsers();

      // CRÍTICO: Forzar verificación inmediata de sesiones
      broadcastSessionCheck();
      
      // Mostrar mensaje de éxito
      const action = userToToggle.isActive ? 'desactivado' : 'activado';
      showSuccess(`Usuario "${userToToggle.name || userToToggle.username}" ${action} exitosamente. ${userToToggle.isActive ? 'Su acceso ha sido revocado inmediatamente.' : 'Ahora puede acceder al sistema.'}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
      setShowToggleUserModal(false);
      setUserToToggle(null);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      setShowDeleteUserModal(false);
      setUserToDelete(null);
      fetchUsers();
      
      // CRÍTICO: Forzar verificación inmediata de sesiones
      broadcastSessionCheck();
      
      // Ajustar página si es necesario
      const newTotalPages = Math.ceil((users.length - 1) / usersPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      showSuccess(`Usuario "${userToDelete.name || userToDelete.username}" eliminado correctamente. Su acceso ha sido revocado inmediatamente y sus registros históricos se mantienen.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Calendar and pagination functions
  const navigateMonth = (direction: number) => {
    setCalendarMonth(prevMonth => {
      const newMonth = prevMonth + direction;
      if (newMonth < 0) {
        setCalendarYear(prevYear => prevYear - 1);
        return 11;
      } else if (newMonth > 11) {
        setCalendarYear(prevYear => prevYear + 1);
        return 0;
      }
      return newMonth;
    });
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const isActive = current.getMonth() === calendarMonth;
      const hasOrders = availableDates.includes(dateStr);
      
      days.push({
        day: current.getDate(),
        date: dateStr,
        isActive,
        hasOrders
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const handleDateSelect = (date: string) => {
    setOrderFilters(prev => ({ ...prev, date: date }));
  };

  // Pagination functions
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (orderFilters.status !== 'all' && order.status !== orderFilters.status) {
        return false;
      }
      if (orderFilters.date) {
        // Convertir la fecha del pedido a formato YYYY-MM-DD para comparar
        const orderDate = new Date(order.businessDate).toISOString().split('T')[0];
        if (orderDate !== orderFilters.date) {
          return false;
        }
      }
      return true;
    });
  };

  const getCurrentPageOrders = () => {
    const filtered = getFilteredOrders();
    const startIndex = (currentOrdersPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredOrders().length / ordersPerPage);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentOrdersPage(1);
  }, [orderFilters]);

  // Load available dates for calendar
  const fetchAvailableDates = React.useCallback(async () => {
    try {
      setCalendarLoading(true);
      const response = await fetch('/api/admin/orders/dates');
      if (!response.ok) {
        throw new Error('Error al cargar fechas disponibles');
      }
      const data = await response.json();
      setAvailableDates(data.dates || []);
    } catch (error) {
      console.error('Error loading available dates:', error);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  // Load available dates when calendar changes
  React.useEffect(() => {
    fetchAvailableDates();
  }, [calendarMonth, calendarYear, fetchAvailableDates]);

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
      showError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Effects
  React.useEffect(() => {
    loadStats(); // Carga inicial CON loading
    // Polling automático cada 30 segundos SIN mostrar loading
    const interval = setInterval(loadStatsSilent, 30000);
    return () => clearInterval(interval);
  }, [loadStats, loadStatsSilent]);



  React.useEffect(() => {
    if (activeTab === 'products') {
      // Cargar categorías solo una vez al entrar
      fetchCategories();
    }
  }, [activeTab, fetchCategories]);

  // Cargar pedidos cuando se activa el tab de orders
  React.useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders().catch(console.error);
    }
  }, [activeTab, fetchOrders]);

  // Efecto separado para productos cuando cambia la categoría seleccionada
  React.useEffect(() => {
    if (activeTab === 'products' && selectedCategory) {
      fetchProducts();
    }
  }, [activeTab, selectedCategory, fetchProducts]);

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Cargar analítica cuando se activa el tab de analytics
  React.useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  // Limpiar email cuando el rol no es ADMIN
  React.useEffect(() => {
    if (userForm.role !== 'ADMIN' && userForm.email) {
      setUserForm(prev => ({ ...prev, email: '' }));
    }
  }, [userForm.role, userForm.email]);

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

  // Polling optimizado - menos frecuente para mejor rendimiento
  React.useEffect(() => {
    if (activeTab !== 'dashboard') return;

    const interval = setInterval(() => {
      loadStatsSilent();
    }, 60000); // Actualizar cada 60 segundos - más eficiente

    return () => clearInterval(interval);
  }, [activeTab, loadStatsSilent]);

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

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-[#0A0E1A] via-[#1D263B] to-[#2A3441] text-white relative overflow-hidden">
      {/* Header Ultra Moderno */}
      <header className="relative z-10 bg-gradient-to-r from-black/40 via-black/20 to-black/40 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8DFF50]/5 via-transparent to-[#8DFF50]/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo y título espectacular */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#8DFF50] to-[#7DE040] rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform">
                  <span className="text-3xl">👑</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-white via-[#8DFF50] to-white bg-clip-text text-transparent leading-tight">
                  Panel Admin
                </h1>
              </div>
            </div>

            {/* Controles premium */}
            <div className="flex items-center gap-3">
              {/* Botón regresar al menú principal */}
              <Link 
                href="/"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="font-bold text-base">
                    Menú Principal
                  </span>
                </div>
              </Link>

              {/* Botón Documentación */}
              <Link 
                href="/help"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-bold text-base">
                    📚 Manual
                  </span>
                </div>
              </Link>

              {/* Botón actualizar optimizado */}
              {activeTab === 'dashboard' && (
                <button 
                  onClick={loadStats}
                  disabled={dashboardLoading}
                  className={`px-6 py-3 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 backdrop-blur-xl ${dashboardLoading ? 'from-[var(--brand)]/30 to-[var(--brand)]/20 border-[var(--brand)]/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 ${dashboardLoading ? 'animate-spin text-[var(--brand)]' : ''}`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span className={`font-bold text-base ${dashboardLoading ? 'text-[var(--brand)]' : ''}`}>
                      {dashboardLoading ? 'Actualizando...' : 'Actualizar'}
                    </span>
                  </div>
                </button>
              )}
              
              {/* Perfil de usuario optimizado */}
              {currentUser && (
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-white/15 to-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl blur-sm"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center text-[#1D263B] font-black text-lg shadow-lg">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-base text-white">@{currentUser.username}</div>
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold ${ROLE_COLORS[currentUser.role]} shadow-lg`}>
                      <span className="text-sm">
                        {currentUser.role === 'ADMIN' ? '👑' : currentUser.role === 'CHEF' ? '👨‍🍳' : '💳'}
                      </span>
                      {ROLE_LABELS[currentUser.role]}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Botón salir optimizado */}
              <div className="relative">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Ultra Premium */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl blur-xl"></div>
          
          <div className="relative flex gap-2 p-2 bg-gradient-to-r from-black/30 via-black/20 to-black/30 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊', gradient: 'from-blue-500 to-blue-600' },
              { id: 'orders', label: 'Pedidos', icon: '📦', gradient: 'from-orange-500 to-orange-600' },
              { id: 'products', label: 'Productos', icon: '🍔', gradient: 'from-yellow-500 to-yellow-600' },
              { id: 'users', label: 'Usuarios', icon: '👥', gradient: 'from-purple-500 to-purple-600' },
              { id: 'credits', label: 'Créditos', icon: '💳', gradient: 'from-green-500 to-green-600' },
              { id: 'analytics', label: 'Analítica', icon: '📈', gradient: 'from-pink-500 to-pink-600' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 rounded-xl font-bold text-base whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] shadow-lg' 
                    : 'bg-gradient-to-r from-white/10 to-white/5 text-white hover:from-white/20 hover:to-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline font-black tracking-wide">
                    {tab.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-6">
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

            {/* Loading state optimizado y simple */}
            {dashboardLoading && !stats && (
              <div className="space-y-6">
                {/* Overview Cards Loading */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/10 p-6 border border-white/20">
                      <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
                      <div className="h-8 bg-white/20 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-20"></div>
                    </div>
                  ))}
                </div>

                {/* Charts Loading */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-6 border border-white/20">
                    <div className="h-6 bg-white/20 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-white/10 rounded"></div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-6 border border-white/20">
                    <div className="h-6 bg-white/20 rounded w-40 mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-white/10 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido real cuando hay datos */}
            {stats && (
              <div className="relative">
                {/* Indicador simple de actualización */}
                {dashboardLoading && (
                  <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-[#8DFF50]/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-[#8DFF50] rounded-full animate-pulse"></div>
                      <span className="text-[#8DFF50] font-medium">Actualizando</span>
                    </div>
                  </div>
                )}

                {/* Overview Cards */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {/* Total Pedidos - Hoy en grande */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 hover:border-[#8DFF50]/30 transition-all duration-300 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center text-2xl border border-blue-500/30">
                        📊
                      </div>
                      <div className="text-lg font-semibold text-white/90">Pedidos de Hoy</div>
                    </div>
                    <div className="text-4xl font-black text-[#8DFF50] mb-3">{stats.overview.todayOrders}</div>
                    <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-xl">
                      Total: {stats.overview.totalOrders}
                    </div>
                  </div>

                  {/* Ingresos Totales - Hoy en grande */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 hover:border-[#8DFF50]/30 transition-all duration-300 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center text-2xl border border-green-500/30">
                        💰
                      </div>
                      <div className="text-lg font-semibold text-white/90">Ingresos de Hoy</div>
                    </div>
                    <div className="text-4xl font-black text-[#8DFF50] mb-3">{fmt(stats.overview.todayRevenue)}</div>
                    <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-xl">
                      Total: {fmt(stats.overview.totalRevenue)}
                    </div>
                  </div>

                  {/* En Cocina */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 hover:border-yellow-400/30 transition-all duration-300 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-2xl border border-yellow-500/30">
                        🍳
                      </div>
                      <div className="text-lg font-semibold text-white/90">En Cocina</div>
                    </div>
                    <div className="text-4xl font-black text-yellow-400 mb-3">
                      {stats.ordersByStatus.find(s => s.status === 'IN_KITCHEN')?.count || 0}
                    </div>
                    <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-xl">
                      Activos ahora
                    </div>
                  </div>

                  {/* Listos */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 hover:border-blue-400/30 transition-all duration-300 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-2xl border border-blue-500/30">
                        ✅
                      </div>
                      <div className="text-lg font-semibold text-white/90">Listos</div>
                    </div>
                    <div className="text-4xl font-black text-blue-400 mb-3">
                      {stats.ordersByStatus.find(s => s.status === 'READY')?.count || 0}
                    </div>
                    <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-xl">
                      Para entregar
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-8 lg:grid-cols-2 mt-8">
                  {/* Top Products */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-2xl border border-orange-500/30">
                        🏆
                      </div>
                      <h3 className="text-2xl font-bold text-white/90">
                        Productos Más Vendidos
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {stats.topProducts.map((product, index) => (
                        <div key={product.productId} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center text-[#1D263B] font-black text-lg">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-lg">{product.name}</div>
                              <div className="text-sm text-white/60">{product.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#8DFF50] text-xl">{product.totalSold}</div>
                            <div className="text-sm text-white/60">vendidos</div>
                          </div>
                        </div>
                      ))}
                      {stats.topProducts.length === 0 && (
                        <div className="text-center py-8 text-white/60">
                          <div className="text-4xl mb-4">📈</div>
                          <div className="text-lg">No hay datos de ventas aún</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl border border-purple-500/30">
                        🕐
                      </div>
                      <h3 className="text-2xl font-bold text-white/90">
                        Pedidos Recientes
                      </h3>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {stats.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center text-[#1D263B] font-black text-sm">
                              #{order.number}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-lg">Beeper {order.beeperId}</div>
                              <div className="text-sm text-white/60">Por: {order.cashier.username}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#8DFF50] text-xl mb-1">{fmt(order.total)}</div>
                            <div className={`text-xs px-3 py-1 rounded-xl font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </div>
                          </div>
                        </div>
                      ))}
                      {stats.recentOrders.length === 0 && (
                        <div className="text-center py-8 text-white/60">
                          <div className="text-4xl mb-4">📋</div>
                          <div className="text-lg">No hay pedidos recientes</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar de Filtros - Responsivo */}
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              <div className="lg:sticky lg:top-0 space-y-6">
                {/* Filtros Principales */}
                <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-4 lg:p-6 border border-white/20">
                  <h3 className="text-lg lg:text-xl font-bold mb-4 text-white">🔍 Filtros</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">Estado:</label>
                      <select
                        value={orderFilters.status}
                        onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-2xl bg-white/10 border border-white/20 text-white focus:border-[#8DFF50] focus:outline-none transition-colors text-sm lg:text-base"
                      >
                        <option value="all" className="bg-[#2A3441] text-white">🌟 Todos</option>
                        <option value="IN_KITCHEN" className="bg-[#2A3441] text-white">🍳 En Cocina</option>
                        <option value="READY" className="bg-[#2A3441] text-white">✅ Listo</option>
                        <option value="DELIVERED" className="bg-[#2A3441] text-white">🚚 Entregado</option>
                        <option value="CANCELLED" className="bg-[#2A3441] text-white">❌ Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">📅 Fecha:</label>
                      <input
                        type="date"
                        value={orderFilters.date}
                        onChange={(e) => setOrderFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-2xl bg-white/10 border border-white/20 text-white focus:border-[#8DFF50] focus:outline-none transition-colors [color-scheme:dark] text-sm lg:text-base"
                      />
                    </div>
                    <button
                      onClick={() => setOrderFilters(prev => ({ ...prev, status: 'all', date: '' }))}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-colors text-sm lg:text-base"
                    >
                      🧹 Limpiar
                    </button>
                  </div>
                </div>

                {/* Calendario - Mejorado y Responsivo */}
                <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-4 lg:p-6 border border-white/20">
                  <h4 className="text-lg font-bold mb-4 text-white">📅 Navegación de Fechas</h4>
                  
                  {/* Navegación del mes */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                      aria-label="Mes anterior"
                    >
                      ←
                    </button>
                    <span className="text-white font-medium text-center min-w-0 flex-1 px-2">
                      {new Date(calendarYear, calendarMonth).toLocaleDateString('es-ES', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                      aria-label="Mes siguiente"
                    >
                      →
                    </button>
                  </div>

                  {/* Encabezados de días */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                      <div key={index} className="text-center text-white/60 text-xs font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del calendario */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (day.isActive && day.hasOrders) {
                            handleDateSelect(day.date);
                          }
                        }}
                        disabled={!day.isActive || !day.hasOrders}
                        className={`
                          aspect-square text-xs rounded-lg transition-all duration-200 relative
                          ${!day.isActive 
                            ? 'text-white/30 cursor-not-allowed' 
                            : day.hasOrders 
                              ? orderFilters.date === day.date
                                ? 'bg-[#8DFF50] text-[#1D263B] font-bold border-2 border-[#8DFF50]'
                                : 'bg-[#8DFF50]/20 text-[#8DFF50] hover:bg-[#8DFF50]/30 cursor-pointer font-semibold border border-[#8DFF50]/30'
                              : 'text-white/50 hover:bg-white/10 cursor-default'
                          }
                        `}
                        title={day.hasOrders ? `${day.date} - Hay pedidos este día` : `${day.date} - Sin pedidos`}
                      >
                        {day.day}
                        {day.hasOrders && day.isActive && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-[#8DFF50] rounded-full transform translate-x-1 -translate-y-1"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Leyenda del calendario y estadísticas del día */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    {/* Estadísticas del día seleccionado */}
                    {orderFilters.date && (
                      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-[#8DFF50]/10 to-[#7DE040]/10 border border-[#8DFF50]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📅</span>
                          <span className="text-white font-semibold text-sm">
                            {new Date(orderFilters.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white/5 rounded-xl p-2">
                            <div className="text-white/70">Pedidos:</div>
                            <div className="text-[#8DFF50] font-bold">{getFilteredOrders().length}</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-2">
                            <div className="text-white/70">Ingresos:</div>
                            <div className="text-[#8DFF50] font-bold">
                              {fmt(getFilteredOrders().reduce((sum, order) => sum + order.total, 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Leyenda del calendario */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#8DFF50]/20 border border-[#8DFF50]/30 rounded"></div>
                        <span className="text-white/70">Días con pedidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#8DFF50] rounded"></div>
                        <span className="text-white/70">Fecha seleccionada</span>
                      </div>
                    </div>
                  </div>

                  {calendarLoading && (
                    <div className="mt-4 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <div className="w-4 h-4 border-2 border-[#8DFF50]/30 border-t-[#8DFF50] rounded-full animate-spin"></div>
                        Cargando fechas...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Principal de Pedidos */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Resumen del día seleccionado */}
              {orderFilters.date && !ordersLoading && !ordersError && (
                <div className="mb-6 p-4 lg:p-6 rounded-3xl bg-gradient-to-r from-[#8DFF50]/10 via-[#7DE040]/10 to-[#8DFF50]/10 border border-[#8DFF50]/30">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-1">
                        📅 {new Date(orderFilters.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <p className="text-white/70 text-sm">Resumen de ventas del día</p>
                    </div>
                    <div className="flex gap-4 lg:gap-6">
                      <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-[#8DFF50]">
                          {getFilteredOrders().length}
                        </div>
                        <div className="text-white/70 text-sm">Pedidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-[#8DFF50]">
                          {fmt(getFilteredOrders().reduce((sum, order) => sum + order.total, 0))}
                        </div>
                        <div className="text-white/70 text-sm">Ingresos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl lg:text-3xl font-bold text-[#8DFF50]">
                          {getFilteredOrders().reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0)}
                        </div>
                        <div className="text-white/70 text-sm">Productos</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOrderFilters(prev => ({ ...prev, date: '' }))}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                  >
                    <span>✕</span> Ver todos los días
                  </button>
                </div>
              )}

              {ordersLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8DFF50]/30 border-t-[#8DFF50] mb-4"></div>
                  <p className="text-white/60 text-lg">Cargando pedidos...</p>
                </div>
              )}

              {ordersError && (
                <div className="rounded-3xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 p-6 text-red-200 flex items-center gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="font-bold mb-1">Error al cargar pedidos</h3>
                    <p>{ordersError}</p>
                  </div>
                </div>
              )}

              {!ordersLoading && !ordersError && (
                <>
                  {/* Lista de Pedidos */}
                  <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">
                    {getCurrentPageOrders().map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="group rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-[#8DFF50]/50 transition-all duration-300 overflow-hidden">
                          {/* Header del pedido (siempre visible) */}
                          <div 
                            className="p-4 lg:p-6 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          >
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                              <div className="flex items-center gap-4 flex-1 w-full">
                                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[#1D263B] font-bold text-base lg:text-lg">#{order.number}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-1">
                                    <h3 className="text-lg lg:text-xl font-bold text-white">Pedido #{order.number}</h3>
                                    <div className={`px-2 lg:px-3 py-1 rounded-xl text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                      {STATUS_LABELS[order.status] || order.status}
                                    </div>
                                  </div>
                                  <p className="text-white/60 text-sm">📟 Beeper {order.beeperId} • ⏰ {formatDate(order.createdAt)}</p>
                                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-2 text-sm">
                                    <span className="text-white/60">💳 {order.cashier.name}</span>
                                    <span className="text-white/60">👨‍🍳 {order.chef ? order.chef.name : 'Sin asignar'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                  <div className="text-xl lg:text-2xl font-bold text-[#8DFF50]">{fmt(order.total)}</div>
                                  <div className="text-white/60 text-sm">{order.items.length} productos</div>
                                </div>
                                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contenido expandible */}
                          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                            <div className="px-4 lg:px-6 pb-4 lg:pb-6 border-t border-white/10">
                              {/* Items del pedido */}
                              <div className="mt-6 mb-6">
                                <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                                  <span>🛒</span> Productos del Pedido
                                </h4>
                                <div className="grid gap-3">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 lg:p-4 rounded-2xl border border-white/10">
                                      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#8DFF50]/20 flex items-center justify-center text-[#8DFF50] font-bold text-sm lg:text-base flex-shrink-0">
                                          {item.qty}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-white text-sm lg:text-base truncate">{item.product?.name || item.customName}</div>
                                          <div className="text-white/60 text-xs lg:text-sm">{fmt(item.unitPrice)} c/u</div>
                                        </div>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="font-bold text-base lg:text-lg text-white">{fmt(item.lineTotal)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Información adicional */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/10">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg lg:text-xl">💳</span>
                                    <div>
                                      <div className="text-sm text-white/60">Cajero</div>
                                      <div className="font-semibold text-white text-sm lg:text-base">{order.cashier.name}</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/10">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg lg:text-xl">👨‍🍳</span>
                                    <div>
                                      <div className="text-sm text-white/60">Chef</div>
                                      <div className="font-semibold text-white text-sm lg:text-base">{order.chef ? order.chef.name : 'Sin asignar'}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Acciones del pedido */}
                              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                <div className="flex flex-wrap gap-2 lg:gap-3 mb-4">
                                  {order.status === 'IN_KITCHEN' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateOrderStatus(order.id, 'READY');
                                      }}
                                      className="px-4 lg:px-6 py-2 lg:py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg text-sm lg:text-base"
                                    >
                                      <span>✅</span> Marcar Listo
                                    </button>
                                  )}
                                  {order.status === 'READY' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateOrderStatus(order.id, 'DELIVERED');
                                      }}
                                      className="px-4 lg:px-6 py-2 lg:py-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg text-sm lg:text-base"
                                    >
                                      <span>🚚</span> Marcar Entregado
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOrderStatus(order.id, 'CANCELLED');
                                    }}
                                    className="px-4 lg:px-6 py-2 lg:py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg text-sm lg:text-base"
                                  >
                                    <span>❌</span> Cancelar
                                  </button>
                                </div>
                              )}

                              {/* Información de entrega */}
                              {order.deliveredAt && (
                                <div className="p-3 lg:p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
                                  <p className="text-green-200 flex items-center gap-2 text-sm lg:text-base">
                                    <span>🚚</span> Entregado: {formatDate(order.deliveredAt)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {getCurrentPageOrders().length === 0 && !ordersLoading && (
                      <div className="text-center py-16">
                        <div className="text-6xl lg:text-8xl mb-4">📋</div>
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">No hay pedidos</h3>
                        <p className="text-white/60">No se encontraron pedidos con los filtros seleccionados</p>
                      </div>
                    )}
                  </div>

                  {/* Paginación */}
                  {getFilteredOrders().length > 0 && (
                    <div className="mt-6 pt-4 lg:pt-6 border-t border-white/20">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-white/60 text-sm order-2 sm:order-1">
                          Mostrando {((currentOrdersPage - 1) * ordersPerPage) + 1} - {Math.min(currentOrdersPage * ordersPerPage, getFilteredOrders().length)} de {getFilteredOrders().length} pedidos
                        </div>
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                          <button
                            onClick={() => setCurrentOrdersPage(prev => Math.max(1, prev - 1))}
                            disabled={currentOrdersPage === 1}
                            className="px-3 lg:px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                          >
                            ← Anterior
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCurrentOrdersPage(page)}
                                className={`px-2 lg:px-3 py-2 rounded-xl transition-colors text-sm lg:text-base ${
                                  page === currentOrdersPage 
                                    ? 'bg-[#8DFF50] text-[#1D263B] font-bold' 
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setCurrentOrdersPage(prev => Math.min(getTotalPages(), prev + 1))}
                            disabled={currentOrdersPage === getTotalPages()}
                            className="px-3 lg:px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                          >
                            Siguiente →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/categories', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'cleanup_temp' }),
                          });
                          const result = await response.json();
                          if (response.ok) {
                            showSuccessMessage(result.message);
                            refreshCategories();
                            fetchProducts();
                          } else {
                            showSuccessMessage(result.error || 'Error en limpieza', true);
                          }
                        } catch {
                          showSuccessMessage('Error en limpieza', true);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm hover:bg-gray-700 transition-colors"
                      title="Limpiar productos temporales"
                    >
                      🧹 Limpiar
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
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-[#8DFF50] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg text-white/60 mt-3">Cargando productos...</p>
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
          <div className="space-y-8">
            {/* Header with stats and add button */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] bg-clip-text text-transparent">
                  👥 Gestión de Usuarios
                </h2>
                <p className="text-white/60 text-lg">
                  Administra usuarios, roles y permisos del sistema
                </p>
              </div>
              <div className="flex items-center gap-4">
                {!usersLoading && (
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#8DFF50]">{users.length}</div>
                      <div className="text-white/60">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive).length}</div>
                      <div className="text-white/60">Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{users.filter(u => !u.isActive).length}</div>
                      <div className="text-white/60">Inactivos</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
                    setShowUserForm(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] font-bold hover:from-[#7DE040] hover:to-[#6DD030] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <span className="text-xl">👤</span>
                  Agregar Usuario
                </button>
              </div>
            </div>

            {usersLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8DFF50]/30 border-t-[#8DFF50] mb-4"></div>
                <p className="text-white/60 text-lg">Cargando usuarios...</p>
              </div>
            )}

            {usersError && (
              <div className="rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 p-6 text-red-200 flex items-center gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold mb-1">Error al cargar usuarios</h3>
                  <p>{usersError}</p>
                </div>
              </div>
            )}

            {!usersLoading && !usersError && (
              <>
                <div className="grid gap-6">
                  {users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((user) => (
                    <div key={user.id} className="group rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-8 border border-white/20 hover:border-[#8DFF50]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#8DFF50]/10 hover:scale-[1.02]">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        {/* User Info */}
                        <div className="flex-1 space-y-4">
                          {/* Header with name and badges */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center text-[#1D263B] font-bold text-xl">
                                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-white">{user.name || 'Sin nombre'}</h3>
                                <p className="text-white/60">@{user.username}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${ROLE_COLORS[user.role]} shadow-lg`}>
                                {user.role === 'ADMIN' ? '👑' : user.role === 'CHEF' ? '👨‍🍳' : '💳'} {ROLE_LABELS[user.role]}
                              </div>
                              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${
                                user.isActive 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Stats - Solo para no-admins */}
                          {user.role !== 'ADMIN' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-blue-400">📋</span>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-white">{user.totalOrders}</div>
                                    <div className="text-white/60 text-sm">Total pedidos</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-emerald-400">💳</span>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-white">{user.cashierOrders}</div>
                                    <div className="text-white/60 text-sm">Como cajero</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <span className="text-orange-400">👨‍🍳</span>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-white">{user.chefOrders}</div>
                                    <div className="text-white/60 text-sm">Como chef</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mensaje para admins en lugar de stats */}
                          {user.role === 'ADMIN' && (
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">👑</span>
                                <div>
                                  <div className="font-semibold text-purple-200">Usuario Administrador</div>
                                  <div className="text-purple-300/80 text-sm">Gestiona la aplicación y usuarios del sistema</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 min-w-fit">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                          >
                            <span>✏️</span>
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleUser(user)}
                            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 ${
                              user.isActive 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            }`}
                          >
                            <span>{user.isActive ? '⏸️' : '✅'}</span>
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                          >
                            <span>🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {users.length > usersPerPage && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                    >
                      <span>←</span>
                      Anterior
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-full font-medium transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-[#8DFF50] text-[#1D263B]'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(users.length / usersPerPage)))}
                      disabled={currentPage === Math.ceil(users.length / usersPerPage)}
                      className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                    >
                      Siguiente
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* Información de paginación */}
                {users.length > 0 && (
                  <div className="text-center text-white/60 text-sm">
                    Mostrando {((currentPage - 1) * usersPerPage) + 1} - {Math.min(currentPage * usersPerPage, users.length)} de {users.length} usuarios
                  </div>
                )}

                {/* Estado vacío */}
                {users.length === 0 && !usersLoading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">👤</div>
                    <h3 className="text-2xl font-bold text-white mb-3">No hay usuarios registrados</h3>
                    <p className="text-white/60 text-lg mb-8">Comienza agregando tu primer usuario al sistema</p>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setUserForm({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
                        setShowUserForm(true);
                      }}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] font-bold hover:from-[#7DE040] hover:to-[#6DD030] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      👤 Agregar Primer Usuario
                    </button>
                  </div>
                )}
              </>
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Header con controles de fecha */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">📈 Analítica Avanzada</h2>
                  <p className="text-white/70">Análisis profundo del rendimiento del negocio</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-white/70 text-sm">Desde:</label>
                    <input
                      type="date"
                      value={analyticsDateRange.start}
                      onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-white/70 text-sm">Hasta:</label>
                    <input
                      type="date"
                      value={analyticsDateRange.end}
                      onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    disabled={analyticsLoading}
                    className="px-4 py-2 bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/80 text-black font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {analyticsLoading ? '⏳' : '🔄'} Actualizar
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {analyticsLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--brand)]/30 border-t-[var(--brand)] mx-auto mb-4"></div>
                  <p className="text-white/70">Calculando analítica avanzada...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {analyticsError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="font-bold mb-1">Error en Analítica</h3>
                <p className="text-red-300">{analyticsError}</p>
                <button
                  onClick={fetchAnalytics}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Analytics Content */}
            {analyticsData && !analyticsLoading && (
              <div className="space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="text-blue-400 text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-white">{analyticsData.summary.totalOrders.toLocaleString()}</div>
                    <div className="text-blue-300 text-sm">Total Órdenes</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                    <div className="text-green-400 text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-white">${analyticsData.summary.totalRevenue.toLocaleString()}</div>
                    <div className="text-green-300 text-sm">Ingresos Totales</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="text-purple-400 text-3xl mb-2">🧾</div>
                    <div className="text-2xl font-bold text-white">${analyticsData.summary.avgOrderValue}</div>
                    <div className="text-purple-300 text-sm">Ticket Promedio</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
                    <div className="text-orange-400 text-3xl mb-2">⏱️</div>
                    <div className="text-2xl font-bold text-white">{analyticsData.summary.avgPrepTime} min</div>
                    <div className="text-orange-300 text-sm">Tiempo Promedio</div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Sales Trend */}
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      📈 Tendencia de Ventas
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsData.salesTrend.slice(-10).map((day: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="text-white/90">{new Date(day.date).toLocaleDateString()}</div>
                          <div className="text-right">
                            <div className="text-white font-semibold">${day.revenue.toLocaleString()}</div>
                            <div className="text-white/60 text-sm">{day.orders} órdenes</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      🏆 Productos Top
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analyticsData.topProducts.slice(0, 8).map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <div className="text-white font-medium">{product.productName}</div>
                            <div className="text-white/60 text-sm">{product.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[var(--brand)] font-semibold">${product._sum.lineTotal?.toLocaleString()}</div>
                            <div className="text-white/60 text-sm">{product._sum.qty} vendidos</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Category Analysis */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    🏷️ Análisis por Categorías
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.categoryAnalysis.map((category: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <div className="text-white font-semibold mb-2">{category.category}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Ingresos:</span>
                            <span className="text-[var(--brand)]">${category.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Cantidad:</span>
                            <span className="text-white">{category.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Promedio:</span>
                            <span className="text-white">${category.avgOrderValue}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Performance */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    👥 Rendimiento por Usuario
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left text-white/70 p-3">Usuario</th>
                          <th className="text-right text-white/70 p-3">Órdenes</th>
                          <th className="text-right text-white/70 p-3">Ingresos</th>
                          <th className="text-right text-white/70 p-3">Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.userPerformance.map((user: any, index: number) => (
                          <tr key={index} className="border-b border-white/10">
                            <td className="p-3">
                              <div className="text-white font-medium">{user.name || user.username}</div>
                              <div className="text-white/60 text-sm">{user.role}</div>
                            </td>
                            <td className="text-right text-white p-3">{user._count.id}</td>
                            <td className="text-right text-[var(--brand)] p-3">${user._sum.total?.toLocaleString()}</td>
                            <td className="text-right text-white p-3">${user.avgOrderValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Hourly Analysis */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    🕐 Análisis por Hora
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {analyticsData.hourlyAnalysis.map((hour: any) => (
                      <div key={hour.hour} className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-white/70 text-xs">{hour.hour}:00</div>
                        <div className="text-[var(--brand)] text-sm font-semibold">{hour.orders}</div>
                        <div className="text-white/60 text-xs">${hour.revenue.toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Analysis */}
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    📅 Análisis Semanal
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {analyticsData.weekdayAnalysis.map((day: any) => (
                      <div key={day.day} className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-white font-medium mb-2">{day.dayName}</div>
                        <div className="text-[var(--brand)] text-lg font-bold">{day.orders}</div>
                        <div className="text-white/70 text-sm">${day.revenue.toLocaleString()}</div>
                        <div className="text-white/50 text-xs">Prom: ${day.avgOrderValue}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Product Form Modal */}
        {showProductForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductForm(false);
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
                    onChange={(e) => {
                      // Remover espacios automáticamente y solo permitir caracteres válidos
                      const value = e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z0-9_-]/g, '');
                      setUserForm(prev => ({ ...prev, username: value }));
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="usuario123"
                  />
                  <div className="text-xs text-white/60 mt-1">
                    Solo letras, números, guiones y guiones bajos. Sin espacios.
                  </div>
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
                  <label className="block text-sm font-medium mb-1">Email (solo para administradores):</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-white ${
                      userForm.role === 'ADMIN' 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-gray-600 border-gray-500 cursor-not-allowed'
                    }`}
                    placeholder={userForm.role === 'ADMIN' ? "admin@ejemplo.com" : "Solo disponible para administradores"}
                    disabled={userForm.role !== 'ADMIN'}
                  />
                  <div className="text-xs text-white/60 mt-1">
                    {userForm.role === 'ADMIN' 
                      ? 'Necesario para recuperación de contraseña por email' 
                      : 'Solo los administradores pueden tener email para recuperar contraseña'
                    }
                  </div>
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

        {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && userToDelete && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteUserModal(false);
                setUserToDelete(null);
              }
            }}
          >
            <div 
              className="bg-[#1D263B] rounded-3xl p-8 w-full max-w-lg border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold mb-4 text-red-400">¿Eliminar Usuario?</h3>
                
                <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8DFF50] to-[#7DE040] flex items-center justify-center text-[#1D263B] font-bold text-2xl">
                      {(userToDelete.name || userToDelete.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-xl text-white">{userToDelete.name || 'Sin nombre'}</h4>
                      <p className="text-white/60">@{userToDelete.username}</p>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${ROLE_COLORS[userToDelete.role]}`}>
                        {userToDelete.role === 'ADMIN' ? '👑' : userToDelete.role === 'CHEF' ? '👨‍🍳' : '💳'} {ROLE_LABELS[userToDelete.role]}
                      </div>
                    </div>
                  </div>
                  
                  {userToDelete.role !== 'ADMIN' && (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="font-bold text-lg">{userToDelete.totalOrders}</div>
                        <div className="text-white/60">Total pedidos</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="font-bold text-lg">{userToDelete.cashierOrders}</div>
                        <div className="text-white/60">Como cajero</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="font-bold text-lg">{userToDelete.chefOrders}</div>
                        <div className="text-white/60">Como chef</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💾</span>
                    <div className="text-left">
                      <h4 className="font-bold text-amber-200 mb-2">Registros Históricos</h4>
                      <p className="text-amber-300/80 text-sm">
                        Los pedidos y registros asociados a este usuario se mantendrán para auditoría. 
                        Solo se eliminará el acceso al sistema.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-white/60 mb-6">
                  Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-2xl bg-gray-600 text-white hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🗑️ Eliminar Usuario
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

        {/* Modal de Confirmación - Activar/Desactivar Usuario */}
        {showToggleUserModal && userToToggle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userToToggle.isActive ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {userToToggle.isActive ? (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${
                  userToToggle.isActive ? 'text-red-800' : 'text-green-800'
                }`}>
                  {userToToggle.isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  ¿Estás seguro que deseas {userToToggle.isActive ? 'desactivar' : 'activar'} al usuario:
                </p>
                <p className="font-semibold text-gray-900">
                  {userToToggle.name || userToToggle.username}
                </p>
                {userToToggle.isActive && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ El usuario perderá acceso inmediatamente al sistema
                  </p>
                )}
                {!userToToggle.isActive && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ El usuario podrá acceder nuevamente al sistema
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowToggleUserModal(false);
                    setUserToToggle(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmToggleUser}
                  className={`flex-1 text-white py-2 px-4 rounded-xl transition-colors ${
                    userToToggle.isActive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {userToToggle.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Error */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
              </div>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-xl hover:bg-red-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Éxito */}
        {showSuccessMessageModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800">Éxito</h3>
              </div>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowSuccessMessageModal(false)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
