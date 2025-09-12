"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingDown,
  Calendar,
  Clock,
  User,
  LogOut,
  RefreshCw,
  Bell,
  BarChart3,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import ShoppingListModal from "../../components/ShoppingListModal";
import ProductModal from "../../components/ProductModal";

interface DashboardData {
  lastUpdateDate: string;
  lastUpdateTime: string;
  updatedBy: string;
  summary: {
    total: number;
    ok: number;
    lowStock: number;
    outOfStock: number;
  };
  lowStockProducts: Array<{
    id: number;
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
    status: string;
    category?: string;
  }>;
  todayUsage: Array<{
    name: string;
    used: string;
    unit: string;
  }>;
}

const OwnerDashboard = () => {
  const [user] = useState({
    name: "เจ้าของร้าน",
    role: "OWNER",
  });

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalFilter, setProductModalFilter] = useState<'all' | 'ok' | 'lowStock' | 'outOfStock'>('all');
  const [productModalTitle, setProductModalTitle] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", {
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=60'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Fallback data if API fails
        setDashboardData({
          lastUpdateDate: new Date().toISOString().split("T")[0],
          lastUpdateTime: new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          updatedBy: "ระบบ",
          summary: {
            total: 0,
            ok: 0,
            lowStock: 0,
            outOfStock: 0,
          },
          lowStockProducts: [],
          todayUsage: [],
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData({
        lastUpdateDate: new Date().toISOString().split("T")[0],
        lastUpdateTime: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        updatedBy: "ระบบ",
        summary: {
          total: 0,
          ok: 0,
          lowStock: 0,
          outOfStock: 0,
        },
        lowStockProducts: [],
        todayUsage: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await new Promise((resolve) => setTimeout(resolve, 500)); // Add slight delay for UX
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  }, []);

  const openProductModal = useCallback((filter: 'all' | 'ok' | 'lowStock' | 'outOfStock', title: string) => {
    setProductModalFilter(filter);
    setProductModalTitle(title);
    setShowProductModal(true);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return "bg-red-600 border border-gray-600";
      case "LOW_STOCK":
        return "bg-yellow-300 border border-gray-600";
      default:
        return "bg-white";
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return "หมดแล้ว";
      case "LOW_STOCK":
        return "ใกล้หมด";
      default:
        return "ปกติ";
    }
  }, []);

  const getBadgeColor = useCallback((status: string) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return "bg-red-600 text-white border border-gray-600";
      case "LOW_STOCK":
        return "bg-yellow-300 text-black border border-gray-600";
      default:
        return "bg-white text-white border border-gray-300";
    }
  }, []);

  // Memoize the expensive computed values
  const memoizedData = useMemo(() => {
    if (!dashboardData) return null;
    
    return {
      formattedDate: new Date(dashboardData.lastUpdateDate).toLocaleDateString("th-TH"),
      summaryStats: dashboardData.summary,
      hasLowStockProducts: dashboardData.lowStockProducts && dashboardData.lowStockProducts.length > 0,
      hasTodayUsage: dashboardData.todayUsage && dashboardData.todayUsage.length > 0,
    };
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/ns.logowhite.png"
                  alt="NS Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">NS Dashboard</h1>
                  <p className="text-sm text-white font-medium">ภาพรวมสต็อก</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-white">
                <User className="w-3 h-3" />
                <span>{user.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowShoppingList(true)}
                  className="flex items-center space-x-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span className="text-sm font-semibold">อัพเดท</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-100 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 text-black ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span className="text-sm font-semibold text-black">รีเฟรช</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/ns.logowhite.png"
                alt="NS Logo"
                width={90}
                height={90}
                className="object-contain"
              />
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  NS Coffee Dashboard
                </h1>
                <p className="text-lg text-white font-medium">ภาพรวมสต็อกของในร้าน</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowShoppingList(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="font-semibold">รายการอัพเดท</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 text-black ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-black font-semibold">รีเฟรช</span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-white">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <button
            onClick={() => openProductModal('all', 'สินค้าทั้งหมด')}
            className="bg-white rounded-xl p-3 sm:p-6 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base text-gray-800 font-medium">สินค้าทั้งหมด</p>
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-black">
                  {memoizedData?.summaryStats.total || 0}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => openProductModal('ok', 'สินค้าสถานะปกติ')}
            className="bg-white rounded-xl p-3 sm:p-6 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base text-gray-800 font-medium">สถานะปกติ</p>
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-black">
                  {memoizedData?.summaryStats.ok || 0}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => openProductModal('lowStock', 'สินค้าใกล้หมด')}
            className="bg-white rounded-xl p-3 sm:p-6 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base text-gray-800 font-medium">ใกล้หมด</p>
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-black">
                  {memoizedData?.summaryStats.lowStock || 0}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => openProductModal('outOfStock', 'สินค้าหมดแล้ว')}
            className="bg-white rounded-xl p-3 sm:p-6 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base text-gray-800 font-medium">หมดแล้ว</p>
                <p className="text-xl sm:text-3xl font-extrabold tracking-tight text-black">
                  {memoizedData?.summaryStats.outOfStock || 0}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Last Update Info */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-300 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-base text-gray-800 font-medium">อัปเดตล่าสุด</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 tracking-wide">
                  {memoizedData?.formattedDate || new Date().toLocaleDateString("th-TH")}{" "}
                  เวลา {dashboardData?.lastUpdateTime || "--:--"} น.
                </p>
                <p className="text-sm sm:text-base text-gray-800 font-medium">
                  บันทึกโดย {dashboardData?.updatedBy || "ระบบ"}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-black text-white text-sm sm:text-base font-semibold">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                ข้อมูลล่าสุด
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    รายการแจ้งเตือนสินค้า
                  </h2>
                  <span className="bg-gray-300 text-black text-sm px-3 py-1 rounded-full font-bold">
                    {dashboardData?.lowStockProducts?.length || 0}
                  </span>
                </div>
                
                {dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
                  <button
                    onClick={() => (window.location.href = "/stock-alerts")}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm rounded-lg transition-colors font-medium"
                  >
                    <span>ดูทั้งหมด</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {!dashboardData?.lowStockProducts ||
              dashboardData.lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                  <p>ไม่มีสินค้าที่ใกล้จะหมด</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 pr-2">
                  {dashboardData.lowStockProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 rounded-lg border border-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(
                              product.status
                            )}`}
                          ></div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 text-base sm:text-lg tracking-wide truncate">
                              {product.name}
                            </p>
                            <p className="text-sm sm:text-base text-gray-800 font-medium">
                              คงเหลือ: {product.currentStock} {product.unit} | 
                              ขั้นต่ำ: {product.minStock} {product.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getBadgeColor(
                          product.status
                        )}`}
                      >
                        {getStatusText(product.status)}
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.lowStockProducts.length > 10 && (
                    <div className="text-center pt-4 border-t border-gray-700">
                      <p className="text-base text-gray-800 font-medium mb-3">
                        สินค้าทั้งหมด {dashboardData.lowStockProducts.length} รายการ
                      </p>
                      <button
                        onClick={() => (window.location.href = "/stock-alerts")}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors font-medium"
                      >
                        <span>ดูรายการทั้งหมด</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today's Usage */}
          <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    การใช้งานวันนี้
                  </h2>
                  <span className="bg-gray-300 text-black text-sm px-3 py-1 rounded-full font-bold">
                    {dashboardData?.todayUsage?.length || 0}
                  </span>
                </div>
                
                {dashboardData?.todayUsage && dashboardData.todayUsage.length > 0 && (
                  <button
                    onClick={() => (window.location.href = "/daily-usage")}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm rounded-lg transition-colors font-medium"
                  >
                    <span>ดูทั้งหมด</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {!dashboardData?.todayUsage ||
              dashboardData.todayUsage.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                  <p>ยังไม่มีการใช้งานวันนี้</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 pr-2">
                  {dashboardData.todayUsage.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 rounded-lg border border-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-base sm:text-lg tracking-wide truncate">{item.name}</p>
                          <p className="text-sm sm:text-base text-gray-800 font-medium">การใช้งานวันนี้</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-extrabold text-gray-900 text-base sm:text-lg tracking-wide">
                          {item.used} {item.unit}
                        </p>
                        <p className="text-base text-gray-800 font-medium">ใช้ไปแล้ว</p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.todayUsage.length > 10 && (
                    <div className="text-center pt-4 border-t border-gray-700">
                      <p className="text-base text-gray-800 font-medium mb-3">
                        รายการทั้งหมด {dashboardData.todayUsage.length} รายการ
                      </p>
                      <button
                        onClick={() => (window.location.href = "/daily-usage")}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors font-medium"
                      >
                        <span>ดูรายการทั้งหมด</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-300 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-4 sm:mb-6">
            Management Panel
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <button
              onClick={() => (window.location.href = "/products")}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-600"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span className="text-base sm:text-lg font-semibold text-black">ดู / จัดการสินค้า</span>
            </button>

            <button
              onClick={() => (window.location.href = "/staff")}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-600"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span className="text-base sm:text-lg font-semibold text-black">อัปเดตสต็อก</span>
            </button>

            <button
              onClick={() => (window.location.href = "/stock-history")}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-600"
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-base sm:text-lg font-semibold text-blue-600">ประวัติ & แก้ไขสต็อก</span>
            </button>

            <button
              onClick={() => (window.location.href = "/weekly-report")}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-600"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span className="text-base sm:text-lg font-semibold text-black">รายงานประจำสัปดาห์</span>
            </button>

            <button
              onClick={() => (window.location.href = "/user-management")}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-600"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span className="text-base sm:text-lg font-semibold text-black">จัดการพนักงาน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shopping List Modal */}
      <ShoppingListModal
        isOpen={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        onStockUpdated={fetchDashboardData}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        filterType={productModalFilter}
        title={productModalTitle}
      />
    </div>
  );
};

export default OwnerDashboard;
