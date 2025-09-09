import React, { useState } from 'react'
import { Save, Edit3, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useStockEdit } from '@/hooks/useStockEdit'

const EditableStockEntry = ({ 
  stockLog, 
  onEditSuccess 
}: { 
  stockLog: any, 
  onEditSuccess: () => void 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(stockLog.quantityRemaining.toString())
  const [editReason, setEditReason] = useState('')
  const { canEditStock, getTimeLeft, editStockEntry, loading } = useStockEdit()

  const canEdit = canEditStock(stockLog.createdAt)
  const timeLeft = Math.floor(getTimeLeft(stockLog.createdAt))

  const handleEdit = async () => {
    if (!editReason.trim()) {
      alert('กรุณาระบุเหตุผลการแก้ไข')
      return
    }

    const result = await editStockEntry(
      stockLog.id, 
      parseFloat(editValue), 
      editReason
    )

    if (result.success) {
      setIsEditing(false)
      setEditReason('')
      onEditSuccess()
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(stockLog.quantityRemaining.toString())
    setEditReason('')
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative">
      
      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{stockLog.product.name}</h3>
            
            {canEdit && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-amber-600">
                  <Clock className="w-3 h-3" />
                  <span>{timeLeft}m</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="แก้ไขข้อมูล"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="text-lg font-bold text-center">
            {stockLog.quantityRemaining} {stockLog.product.unit}
          </div>
          
          <div className="text-sm text-gray-500">
            บันทึกเมื่อ: {new Date(stockLog.createdAt).toLocaleString('th-TH')}
          </div>
          
          {stockLog.notes?.includes('[แก้ไข') && (
            <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              มีการแก้ไขข้อมูล
            </div>
          )}
        </div>
      ) : (
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{stockLog.product.name}</h3>
            <span className="text-xs text-amber-600">แก้ไขข้อมูล</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600">จำนวนใหม่:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg font-semibold"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600">เหตุผลการแก้ไข:</label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="เช่น นับผิด, พบของเพิ่มในตู้เย็น, ลูกค้าคืนสินค้า"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              rows={3}
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              disabled={loading || !editReason.trim()}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-semibold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-semibold"
            >
              <X className="w-4 h-4" />
              <span>ยกเลิก</span>
            </button>
          </div>
          
          <div className="text-center text-xs text-amber-600 flex items-center justify-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>เหลือเวลา {timeLeft} นาที</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditableStockEntry