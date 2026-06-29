import type { Request, Response } from 'express'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { User } from '../models/User'
import type { OrderStatus } from '../types'
import { sendOrderStatusUpdate } from '../services/email'
import { createShipmentForOrder } from '../modules/shipping/shipping.service'

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    salesToday,
    pendingOrders,
    totalUsers,
    lowStockCount,
    totalProducts,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments(),
    Product.countDocuments({ stock: { $gt: 0, $lt: 5 } }),
    Product.countDocuments(),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
  ])

  res.json({
    salesToday: {
      total: salesToday[0]?.total ?? 0,
      count: salesToday[0]?.count ?? 0,
    },
    pendingOrders,
    totalUsers,
    lowStockCount,
    totalProducts,
    recentOrders,
  })
}

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20' } = req.query

  const filter: Record<string, unknown> = {}
  if (status) filter.status = status

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(50, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const [data, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ])

  res.json({
    data,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    limit: limitNum,
  })
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: OrderStatus }

  const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: 'Status inválido' })
    return
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado' })
    return
  }

  const prevStatus = order.status
  order.status = status
  await order.save()

  // Solo crear envío si: pasa a 'processing' Y todavía no tiene etiqueta creada
  if (prevStatus !== status && status === 'processing' && !order.trackingNumber && !order.shipmentId) {
    createShipmentForOrder(order._id.toString()).catch(() => {})
  }

  if (prevStatus !== status) {
    try {
      const user = await User.findById(order.user)
      if (user) {
        const trackingUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/pedidos/${order._id}`
        await sendOrderStatusUpdate(user.email, user.name, order._id.toString(), status, trackingUrl)
      }
    } catch (err) {
      console.error('[ORDER] Email de estado falló:', err instanceof Error ? err.message : err)
    }
  }

  res.json(order)
}
